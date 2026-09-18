import type {Server, Socket} from "socket.io";

export function registerRoomSocket(
  io: Server,
  socket: Socket
) {
  socket.on(
    "join-room",
    (roomCode: string) => {
      const code =
        roomCode.toUpperCase();

      socket.join(code);

      console.log(
        `Socket ${socket.id} joined room ${code}`
      );

      socket.to(code).emit(
        "member-connected",
        {
          message:
            "A member connected",
        }
      );
    }
  );

  socket.on(
    "new-round",
    (roomCode: string) => {
      const code =
        roomCode.toUpperCase();

      io.to(code).emit(
        "new-round-started"
      );

      console.log(
        `New round requested in room ${code}`
      );
    }
  );

  socket.on(
    "disconnect",
    () => {
      console.log(
        `Socket ${socket.id} disconnected`
      );
    }
  );
}