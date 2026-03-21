import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

const getSocketBaseUrl = (): string =>
  (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(
    /\/api$/,
    ""
  );

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(getSocketBaseUrl(), {
      transports: ["websocket", "polling"],
    });
  }

  return socket;
};
