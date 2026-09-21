export function registerRoomSocket(io, socket) {
    socket.on("join-room", (roomCode) => {
        const code = roomCode.toUpperCase();
        socket.join(code);
        console.log(`Socket ${socket.id} joined room ${code}`);
        socket.to(code).emit("member-connected", {
            message: "A member connected",
        });
    });
    socket.on("new-round", (roomCode) => {
        const code = roomCode.toUpperCase();
        io.to(code).emit("new-round-started");
        console.log(`New round requested in room ${code}`);
    });
    socket.on("disconnect", () => {
        console.log(`Socket ${socket.id} disconnected`);
    });
}
//# sourceMappingURL=roomSocket.js.map