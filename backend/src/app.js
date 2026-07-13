const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const env = require("./config/env");
const sanitize = require("./middleware/sanitize");
const { generalApiLimiter } = require("./middleware/rateLimiters");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");
const routes = require("./routes");

const app = express();

app.set("trust proxy", 1);

app.use(helmet());
// In development, reflect whatever origin the browser sent (localhost, LAN IP, etc.)
// so the app is reachable from any host on your network; production stays locked to CLIENT_URL.
app.use(cors({ origin: env.NODE_ENV === "production" ? env.CLIENT_URL : true, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(sanitize);

if (env.NODE_ENV === "development") app.use(morgan("dev"));

app.use("/api", generalApiLimiter, routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
