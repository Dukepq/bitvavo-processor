import express from "express";
import { Request, Response } from "express";
const app = express();
import "dotenv/config";
const PORT = process.env.PORT || 5100;
import { limiter } from "./config/rateLimitOptions";
import marketsRouter from "./routes/markets";

app.use(limiter);
app.use("/api/v1/markets", marketsRouter);

app.get("/ping", (req: Request, res: Response) => {
  res.json({ succes: true, message: "pong" });
});

app.all("*", (req: Request, res: Response) => {
  res.status(404).json({ success: false, message: "resource not found" });
});

app.listen(PORT, () => {
  console.log("listening on port: " + PORT);
});
