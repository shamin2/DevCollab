import { Router } from "express";
import { revealRound, getRoundResults } from "../controllers/roundController.js";
const router = Router();
router.patch("/:roundId/reveal", revealRound);
router.get("/:roundId/results", getRoundResults);
export default router;
//# sourceMappingURL=roundRoutes.js.map