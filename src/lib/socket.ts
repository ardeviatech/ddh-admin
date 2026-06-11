import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

export const initSocket = (url?: string) => {
  if (socket) return socket;
  const base =
    url ||
    (import.meta.env.VITE_API_URL as string) ||
    window.location.origin.replace(/:\d+$/, ":5000");
  socket = io(base, { withCredentials: true });
  socket.on("connect", () => {
    console.debug("socket connected", socket?.id);
  });
  socket.on("connect_error", (err) => {
    console.warn("socket connect_error", err);
  });
  return socket;
};

export const getSocket = () => {
  if (!socket)
    throw new Error(
      "Socket has not been initialized. Call initSocket() first.",
    );
  return socket;
};
