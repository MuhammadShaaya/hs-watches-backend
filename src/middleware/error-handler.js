const { ZodError } = require("zod");

function notFoundHandler(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

function errorHandler(err, req, res, next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Validation failed",
      details: err.errors.map((e) => ({ path: e.path.join("."), message: e.message })),
    });
  }

  if (err.code === "P2002") {
    return res.status(409).json({ error: "A record with this value already exists", meta: err.meta });
  }
  if (err.code === "P2025") {
    return res.status(404).json({ error: "Record not found" });
  }

  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
}

module.exports = { notFoundHandler, errorHandler };
