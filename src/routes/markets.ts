import express from "express";
const router = express.Router();
import {
  extractMarketSpecs,
  extractMarketState,
  getAllMarkets,
  getSpecificMarket,
} from "../controllers/marketsController";

router.get("/", getAllMarkets);
router.get("/specs", extractMarketSpecs);
router.get("/state", extractMarketState);
router.get("/:PAIR", getSpecificMarket);

export default router;
