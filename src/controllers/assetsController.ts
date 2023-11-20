import { Request, Response } from "express";
import market from "../market";

export default function getAssets(req: Request, res: Response) {
  try {
    const assets = market.assets;
    res.status(200).json(assets);
  } catch (err) {
    res.status(400).json({ success: false });
  }
}
