import { Router } from "express";
import { createRoom, getRoom } from "../controllers/roomController.js";
import { createRound } from "../controllers/roundController.js";

const router = Router();

router.post("/", createRoom);
router.get("/:code", getRoom);
router.post("/:code/rounds", createRound);

export default router;