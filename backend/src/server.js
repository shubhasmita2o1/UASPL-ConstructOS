const env = require("./config/env");
const connectDB = require("./config/db");
const app = require("./app");

async function start() {
  await connectDB();
  app.listen(env.PORT, () => {
    console.log(`[server] UASPL ConstructOS API listening on port ${env.PORT}`);
  });
}

start().catch((err) => {
  console.error("[server] failed to start", err);
  process.exit(1);
});
