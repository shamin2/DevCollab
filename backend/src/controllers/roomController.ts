import type { Request, Response } from "express";
import { pool } from "../db.js";
import { generateRoomCode } from "../utils/generateRoomCode.js";

export async function createRoom(
  req: Request,
  res: Response
) {
  const client = await pool.connect();

  try {
    const { mode, name } = req.body;

    if (
      mode !== "planning_poker" &&
      mode !== "decision"
    ) {
      return res.status(400).json({
        message: "Invalid room mode",
      });
    }

    if (
      !name ||
      typeof name !== "string" ||
      !name.trim()
    ) {
      return res.status(400).json({
        message: "Name is required",
      });
    }

    const code = generateRoomCode();

    await client.query("BEGIN");

    const roomResult = await client.query(
      `INSERT INTO rooms (code, mode)
       VALUES ($1, $2)
       RETURNING *`,
      [code, mode]
    );

    const room = roomResult.rows[0];

    const memberResult = await client.query(
      `INSERT INTO members (room_id, name, is_host)
       VALUES ($1, $2, TRUE)
       RETURNING *`,
      [room.id, name.trim()]
    );

    await client.query("COMMIT");

    return res.status(201).json({
      room,
      member: memberResult.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error(
      "Error creating room:",
      error
    );

    return res.status(500).json({
      message: "Failed to create room",
    });
  } finally {
    client.release();
  }
}

export async function getRoom(
  req: Request,
  res: Response
) {
  try {
    const code = req.params.code;

    if (typeof code !== "string") {
      return res.status(400).json({
        message: "Room code is required",
      });
    }

    const roomResult = await pool.query(
      `SELECT id, code, mode, created_at
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

    const membersResult = await pool.query(
      `SELECT id,
              room_id,
              name,
              is_host,
              joined_at
       FROM members
       WHERE room_id = $1
       ORDER BY joined_at`,
      [room.id]
    );

    const roundResult = await pool.query(
      `SELECT id,
              room_id,
              prompt,
              status,
              created_at
       FROM rounds
       WHERE room_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [room.id]
    );

    const currentRound =
      roundResult.rows[0] ?? null;

    let options = [];
    let votedCount = 0;

    // If a round exists, count how many
    // members have already voted.
    if (currentRound) {
      const voteCountResult =
        await pool.query(
          `SELECT COUNT(*)::int AS voted_count
           FROM votes
           WHERE round_id = $1`,
          [currentRound.id]
        );

      votedCount =
        voteCountResult.rows[0].voted_count;
    }

    // Decision Rooms also need their
    // available voting options.
    if (
      room.mode === "decision" &&
      currentRound
    ) {
      const optionsResult =
        await pool.query(
          `SELECT id,
                  round_id,
                  label
           FROM options
           WHERE round_id = $1
           ORDER BY id`,
          [currentRound.id]
        );

      options = optionsResult.rows;
    }

    return res.status(200).json({
      room,
      members: membersResult.rows,
      currentRound,
      options,
      votedCount,
    });
  } catch (error) {
    console.error(
      "Error getting room:",
      error
    );

    return res.status(500).json({
      message: "Failed to get room",
    });
  }
}