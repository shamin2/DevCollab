import { pool } from "../db.js";
import { POKER_VALUES } from "../constants/planningPoker.js";
export async function submitVote(req, res) {
    try {
        const roundId = Number(req.params.roundId);
        const { memberId, pokerValue, optionId, confidence, reason, } = req.body;
        // Validate round ID
        if (!Number.isInteger(roundId)) {
            return res.status(400).json({
                message: "Invalid round ID",
            });
        }
        // Validate member ID
        if (!Number.isInteger(memberId)) {
            return res.status(400).json({
                message: "Invalid member ID",
            });
        }
        // Find the round and its room mode
        const roundResult = await pool.query(`SELECT rounds.id,
              rounds.room_id,
              rounds.status,
              rooms.mode,
              rooms.code
       FROM rounds
       JOIN rooms ON rounds.room_id = rooms.id
       WHERE rounds.id = $1`, [roundId]);
        if (roundResult.rows.length === 0) {
            return res.status(404).json({
                message: "Round not found",
            });
        }
        const round = roundResult.rows[0];
        // Make sure voting is still open
        if (round.status !== "voting") {
            return res.status(400).json({
                message: "Voting is closed for this round",
            });
        }
        // Make sure member belongs to this room
        const memberResult = await pool.query(`SELECT id
       FROM members
       WHERE id = $1
         AND room_id = $2`, [memberId, round.room_id]);
        if (memberResult.rows.length === 0) {
            return res.status(400).json({
                message: "Member does not belong to this room",
            });
        }
        // -------------------------
        // PLANNING POKER
        // -------------------------
        if (round.mode === "planning_poker") {
            const normalizedPokerValue = String(pokerValue);
            if (!POKER_VALUES.includes(normalizedPokerValue)) {
                return res.status(400).json({
                    message: "Invalid poker value",
                });
            }
            const voteResult = await pool.query(`INSERT INTO votes
           (round_id, member_id, poker_value)
         VALUES ($1, $2, $3)

         ON CONFLICT (round_id, member_id)
         DO UPDATE SET
           poker_value = EXCLUDED.poker_value,
           option_id = NULL,
           confidence = NULL,
           reason = NULL

         RETURNING *`, [
                roundId,
                memberId,
                normalizedPokerValue,
            ]);
            // Count how many unique members voted
            const countResult = await pool.query(`SELECT COUNT(*)::int AS voted_count
         FROM votes
         WHERE round_id = $1`, [roundId]);
            const votedCount = countResult.rows[0].voted_count;
            // Broadcast updated progress to everyone
            const io = req.app.get("io");
            io.to(round.code).emit("vote-submitted", {
                roundId,
                votedCount,
            });
            return res.status(200).json({
                message: "Vote submitted",
                vote: voteResult.rows[0],
            });
        }
        // -------------------------
        // DECISION ROOM
        // -------------------------
        if (round.mode === "decision") {
            if (!Number.isInteger(optionId)) {
                return res.status(400).json({
                    message: "Invalid option ID",
                });
            }
            // Make sure option belongs to this round
            const optionResult = await pool.query(`SELECT id
         FROM options
         WHERE id = $1
           AND round_id = $2`, [optionId, roundId]);
            if (optionResult.rows.length === 0) {
                return res.status(400).json({
                    message: "Option does not belong to this round",
                });
            }
            // Confidence is optional but must be 1-10
            if (confidence !== undefined &&
                (!Number.isInteger(confidence) ||
                    confidence < 1 ||
                    confidence > 10)) {
                return res.status(400).json({
                    message: "Confidence must be between 1 and 10",
                });
            }
            // Reason is optional but must be text
            if (reason !== undefined &&
                typeof reason !== "string") {
                return res.status(400).json({
                    message: "Reason must be text",
                });
            }
            const voteResult = await pool.query(`INSERT INTO votes
           (
             round_id,
             member_id,
             option_id,
             confidence,
             reason
           )
         VALUES ($1, $2, $3, $4, $5)

         ON CONFLICT (round_id, member_id)
         DO UPDATE SET
           option_id = EXCLUDED.option_id,
           confidence = EXCLUDED.confidence,
           reason = EXCLUDED.reason,
           poker_value = NULL

         RETURNING *`, [
                roundId,
                memberId,
                optionId,
                confidence ?? null,
                reason?.trim() || null,
            ]);
            // Count how many unique members voted
            const countResult = await pool.query(`SELECT COUNT(*)::int AS voted_count
         FROM votes
         WHERE round_id = $1`, [roundId]);
            const votedCount = countResult.rows[0].voted_count;
            // Broadcast updated progress to everyone
            const io = req.app.get("io");
            io.to(round.code).emit("vote-submitted", {
                roundId,
                votedCount,
            });
            return res.status(200).json({
                message: "Vote submitted",
                vote: voteResult.rows[0],
            });
        }
        return res.status(400).json({
            message: "Unsupported room mode",
        });
    }
    catch (error) {
        console.error("Error submitting vote:", error);
        return res.status(500).json({
            message: "Failed to submit vote",
        });
    }
}
//# sourceMappingURL=voteController.js.map