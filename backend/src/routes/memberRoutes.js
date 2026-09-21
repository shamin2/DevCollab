import { Router } from "express";
import { joinRoom } from "../controllers/memberController.js";
const router = Router();
router.post("/:code/members", joinRoom);
export default router;
//# sourceMappingURL=memberRoutes.js.map