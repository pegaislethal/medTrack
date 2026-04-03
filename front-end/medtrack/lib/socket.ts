import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

const getSocketBaseUrl = (): string =>
  (() => {
    const localSocketBaseUrl = "http://localhost:5000";
    const isLocalFrontend =
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1");

    const apiBase =
      process.env.NEXT_PUBLIC_API_URL ||
      "https://medtrack-2t04.onrender.com/api";

    const prodSocketBaseUrl = apiBase.replace(/\/api$/, "");
    return isLocalFrontend ? localSocketBaseUrl : prodSocketBaseUrl;
  })();

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(getSocketBaseUrl(), {
      transports: ["websocket", "polling"],
    });
  }

  return socket;
};
