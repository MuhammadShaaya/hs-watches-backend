const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const passport = require("./config/passport");
const apiRoutes = require("./routes");
const { notFoundHandler, errorHandler } = require("./middleware/error-handler");
const { apiLimiter } = require("./middleware/rate-limit");

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(compression());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());
app.use("/api", apiLimiter, apiRoutes);

app.get("/", (req, res) => {
  res.json({ name: "H&S Watches API", status: "running", docs: "/api/health" });
});

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
