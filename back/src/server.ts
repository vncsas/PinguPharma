import { buildApp } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./shared/logger.js";

async function main() {
  const app = await buildApp();
  try {
    const shutdown = async (signal: string) => {
      logger.info(`${signal} recebido, encerrando`);
      await app.close();
      process.exit(0);
    };
    process.on("SIGINT", () => void shutdown("SIGINT"));
    process.on("SIGTERM", () => void shutdown("SIGTERM"));
    await app.listen({ port: env.PORT, host: env.HOST });
    logger.info(`PinguPharma API listening at http://${env.HOST}:${env.PORT}`);
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
}

main();
