import { io } from "socket.io-client";

export function createSocket(token) {
  const url = import.meta.env.VITE_SOCKET_URL;
  return io(url, {
    transports: ["websocket"],
    auth: { token }
  });
}
