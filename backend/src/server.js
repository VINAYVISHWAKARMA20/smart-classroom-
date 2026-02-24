import http from "http";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";
import { initSockets } from "./sockets/index.js";

async function bootstrap() {
  await connectDB();

  const server = http.createServer(app);
  initSockets(server);

  server.listen(env.PORT, () => console.log(`ðŸš€ Backend running on http://localhost:${env.PORT}`));
}

bootstrap().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
