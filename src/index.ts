import "./types/BitvavoResponseTypes";
import express from "express";
import { Request, Response } from "express";
const app = express();
import cors from "cors";
import "dotenv/config";
import { Markets } from "./types/BitvavoResponseTypes";
const PORT = process.env.PORT || 5100;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/ping", (req: Request, res: Response) => {
  res.json({ succes: true, message: "pong" });
});

app.listen(PORT, () => {
  console.log("listening on port: " + PORT);
  console.log(process.env.PORT);
});

type asset = {};
type assets = asset[];

type pair = {};
type pairs = pair[];

class Market {
  public pairs: string[];
  constructor() {
    this.pairs = [];
  }
  public async getPairs() {
    const marketsData = await fetch("https://api.bitvavo.com/v2/markets");
    const markets: Markets = await marketsData.json();
  }

  private update() {
    // attempts to update all market data
  }
}