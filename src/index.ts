import express from "express";
import { Request, Response } from "express";
const app = express();
import cors from "cors";
import "dotenv/config";
const PORT = process.env.PORT || 5100;
import myObj from "./market";

myObj;

// setInterval(() => {
//   console.log(myObj.markets);
// }, 5000);

app.get("/ping", (req: Request, res: Response) => {
  res.json({ succes: true, message: "pong" });
});

app.listen(PORT, () => {
  console.log("listening on port: " + PORT);
  console.log(process.env.PORT);
});
