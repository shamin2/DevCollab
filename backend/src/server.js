import express from "express";
import cors from "cors";
import { pool } from "./db.js";
import roomRoutes from "./routes/roomRoutes.js";
import memberRoutes from "./routes/memberRoutes.js";
import roundRoutes from "./routes/roundRoutes.js";
import voteRoutes from "./routes/voteRoutes.js";
import { createServer } from "http";
import { Server } from "socket.io";
import { registerRoomSocket } from "./sockets/roomSocket.js";
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST", "PATCH"],
    },
});
app.set("io", io);
io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);
    registerRoomSocket(io, socket);
});
const PORT = 5001;
app.use(cors());
app.use(express.json());
app.use("/api/rooms", roomRoutes);
app.use("/api/rooms", memberRoutes);
app.use("/api/rounds", roundRoutes);
app.use("/api/rounds", voteRoutes);
app.get("/api/health", (req, res) => {
    res.json({
        message: "DevCollab API is running!",
    });
});
app.get("/api/db-test", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");
        res.json({
            message: "Database connected!",
            time: result.rows[0].now,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Database connection failed",
        });
    }
});
httpServer.listen(PORT, () => {
    console.log(`DevCollab server running on port ${PORT}`);
});
//# sourceMappingURL=server.js.map