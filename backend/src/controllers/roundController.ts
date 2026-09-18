import type { Request, Response } from "express";
import { pool } from "../db.js";

export async function createRound(req: Request, res: Response) {
  const client = await pool.connect();

  try {
    const code = req.params.code;
    const { prompt, options } = req.body;

    if (typeof code !== "string") {
      return res.status(400).json({
        message: "Room code is required",
      });
    }

    if (
      !prompt ||
      typeof prompt !== "string" ||
      !prompt.trim()
    ) {
      return res.status(400).json({
        message: "Prompt is required",
      });
    }

    const roomResult = await client.query(
      `SELECT id, code, mode
       FROM rooms
       WHERE code = $1`,
      [code.toUpperCase()]
    );

    if (roomResult.rows.length === 0) {
      return res.status(404).json({
        message: "Room not found",
      });
    }

    const room = roomResult.rows[0];

    // Decision rooms must have at least 2 options
    if (room.mode === "decision") {
      if (
        !Array.isArray(options) ||
        options.length < 2 || options.length > 6
      ) {
        return res.status(400).json({
          message:
            "Decision rounds require at least 2 options",
        });
      }
    }

    await client.query("BEGIN");

    const roundResult = await client.query(
      `INSERT INTO rounds (room_id, prompt)
       VALUES ($1, $2)
       RETURNING *`,
      [room.id, prompt.trim()]
    );

    const round = roundResult.rows[0];

    const createdOptions = [];

    if (room.mode === "decision") {
      for (const option of options) {
        if (
          typeof option !== "string" ||
          !option.trim()
        ) {
          await client.query("ROLLBACK");

          return res.status(400).json({
            message:
              "All options must be valid text",
          });
        }

        const optionResult =
          await client.query(
            `INSERT INTO options (round_id, label)
             VALUES ($1, $2)
             RETURNING *`,
            [round.id, option.trim()]
          );

        createdOptions.push(
          optionResult.rows[0]
        );
      }
    }

    await client.query("COMMIT");

    // Tell everyone in the room that a new round started
    const io = req.app.get("io");

    io.to(room.code).emit("round-created", {
      roundId: round.id,
    });

    return res.status(201).json({
      room,
      round,
      options: createdOptions,
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error(
      "Error creating round:",
      error
    );

    return res.status(500).json({
      message: "Failed to create round",
    });
  } finally {
    client.release();
  }
}

export async function revealRound(
  req: Request,
  res: Response
) {
  try {
    const roundId = Number(
      req.params.roundId
    );

    const { memberId } = req.body;

    if (!Number.isInteger(roundId)) {
      return res.status(400).json({
        message: "Invalid round ID",
      });
    }

    if (!Number.isInteger(memberId)) {
      return res.status(400).json({
        message: "Invalid member ID",
      });
    }

    // Find the round so we know which room it belongs to
    const roundResult = await pool.query(
      `SELECT rounds.id,
              rounds.room_id,
              rounds.status,
              rooms.code
       FROM rounds
       JOIN rooms
         ON rounds.room_id = rooms.id
       WHERE rounds.id = $1`,
      [roundId]
    );

    if (roundResult.rows.length === 0) {
      return res.status(404).json({
        message: "Round not found",
      });
    }

    const round = roundResult.rows[0];

    // Check that this member is the host of this room
    const hostResult = await pool.query(
      `SELECT id
       FROM members
       WHERE id = $1
         AND room_id = $2
         AND is_host = TRUE`,
      [memberId, round.room_id]
    );

    if (hostResult.rows.length === 0) {
      return res.status(403).json({
        message:
          "Only the host can reveal the round",
      });
    }

    // Reveal the round
    const result = await pool.query(
      `UPDATE rounds
       SET status = 'revealed'
       WHERE id = $1
       RETURNING *`,
      [roundId]
    );

    // Tell everyone that the round was revealed
    const io = req.app.get("io");

    io.to(round.code).emit(
      "round-revealed",
      {
        roundId,
      }
    );

    return res.status(200).json({
      message: "Round revealed",
      round: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Error revealing round:",
      error
    );

    return res.status(500).json({
      message: "Failed to reveal round",
    });
  }
}

export async function getRoundResults(
  req: Request,
  res: Response
) {
  try {
    const roundId = Number(
      req.params.roundId
    );

    if (!Number.isInteger(roundId)) {
      return res.status(400).json({
        message: "Invalid round ID",
      });
    }

    // Get the round and determine its room mode
    const roundResult = await pool.query(
      `SELECT rounds.id,
              rounds.room_id,
              rounds.prompt,
              rounds.status,
              rooms.mode
       FROM rounds
       JOIN rooms
         ON rounds.room_id = rooms.id
       WHERE rounds.id = $1`,
      [roundId]
    );

    if (roundResult.rows.length === 0) {
      return res.status(404).json({
        message: "Round not found",
      });
    }

    const round = roundResult.rows[0];

    // Votes stay private until the host reveals them
    if (round.status !== "revealed") {
      return res.status(400).json({
        message:
          "Round has not been revealed yet",
      });
    }

    // -------------------------
    // PLANNING POKER RESULTS
    // -------------------------

    if (
      round.mode === "planning_poker"
    ) {
      const votesResult =
        await pool.query(
          `SELECT members.id AS member_id,
                  members.name,
                  votes.poker_value
           FROM votes
           JOIN members
             ON votes.member_id = members.id
           WHERE votes.round_id = $1
           ORDER BY members.name`,
          [roundId]
        );

      const votes = votesResult.rows;

      const numericVotes = votes
        .map((vote) =>
          Number(vote.poker_value)
        )
        .filter(
          (value) =>
            !Number.isNaN(value)
        );

      const average =
        numericVotes.length > 0
          ? numericVotes.reduce(
              (sum, value) =>
                sum + value,
              0
            ) /
            numericVotes.length
          : null;

      return res.status(200).json({
        round,
        votes,
        average,
      });
    }

    // -------------------------
    // DECISION ROOM RESULTS
    // -------------------------

    if (round.mode === "decision") {
      const optionsResult =
        await pool.query(
          `SELECT options.id,
                  options.label,
                  COUNT(votes.id)::int AS vote_count
           FROM options
           LEFT JOIN votes
             ON votes.option_id = options.id
           WHERE options.round_id = $1
           GROUP BY options.id, options.label
           ORDER BY options.id`,
          [roundId]
        );

      const votesResult =
        await pool.query(
          `SELECT members.id AS member_id,
                  members.name,
                  options.id AS option_id,
                  options.label AS option,
                  votes.confidence,
                  votes.reason
           FROM votes
           JOIN members
             ON votes.member_id = members.id
           JOIN options
             ON votes.option_id = options.id
           WHERE votes.round_id = $1
           ORDER BY members.name`,
          [roundId]
        );

      const totalVotes =
        votesResult.rows.length;

      const results =
        optionsResult.rows.map(
          (option) => ({
            ...option,
            percentage:
              totalVotes > 0
                ? Math.round(
                    (
                      option.vote_count /
                      totalVotes
                    ) * 100
                  )
                : 0,
          })
        );

      return res.status(200).json({
        round,
        totalVotes,
        results,
        votes: votesResult.rows,
      });
    }

    return res.status(400).json({
      message: "Unsupported room mode",
    });
  } catch (error) {
    console.error(
      "Error getting round results:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to get round results",
    });
  }
}