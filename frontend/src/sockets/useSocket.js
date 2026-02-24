import { useEffect, useState } from "react";
import { createSocket } from "./socket.js";

export function useSocket(token) {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!token) return;
    const s = createSocket(token);
    setSocket(s);
    return () => s.disconnect();
  }, [token]);

  return socket;
}
