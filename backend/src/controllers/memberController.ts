import type { Request, Response } from "express";
import { pool } from "../db.js";

export async function joinRoom(req: Request, res: Response) {
  try {
    const code = req.params.code;
    const { name } = req.body;

    if (typeof code !== "string") {
      return res.status(400).json({
        message: "Room code is required",
      });
    }

    // Make sure a name is provided
    if (
      !name ||
      typeof name !== "string" ||
      !name.trim()
    ) {
      return res.status(400).json({
        message: "Name is required",
      });
    }

    // Find the room using the room code
    const roomResult = await pool.query(
      `SELECT id, code, mode
       FROM rooms
       WHERE code = $1`,
      [code.toUpperCase()]
    );

    // Room doesn't exist
    if (roomResult.rows.length === 0) {
      return res.status(404).json({
        message: "Room not found",
      });
    }

    const room = roomResult.rows[0];

    // Add member to the room
    const memberResult = await pool.query(
      `INSERT INTO members (room_id, name)
       VALUES ($1, $2)
       RETURNING *`,
      [room.id, name.trim()]
    );

    const member = memberResult.rows[0];

    // Tell everyone already connected to this room
    // that a new member joined
    const io = req.app.get("io");

    io.to(room.code).emit("member-joined", {
      member,
    });

    return res.status(201).json({
      room,
      member,
    });
  } catch (error) {
    console.error(
      "Error joining room:",
      error
    );

    return res.status(500).json({
      message: "Failed to join room",
    });
  }
}