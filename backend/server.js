
import "dotenv/config";
import express from "express";
import cors from "cors";
import productsRouter from "./src/routes/products.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/", (req, res) => {
  res.json({
    name: "CartPilot AI",
    status: "running",
    message: "Backend is ready",
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/products", productsRouter);

// Centralized error handler
app.use((error, req, res, next) => {
  console.error("API error:", error.message);

  if (res.headersSent) {
    return next(error);
  }

  res.status(502).json({
    success: false,
    error: "The product research request failed.",
    details:
      process.env.NODE_ENV === "development"
        ? error.message
        : undefined,
  });
});

app.listen(PORT, () => {
  console.log(`CartPilot backend running at http://localhost:${PORT}`);
});
