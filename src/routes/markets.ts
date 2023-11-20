import express from "express";
const router = express.Router();
import {
  extractMarketSpecs,
  extractMarketState,
  getAllMarkets,
} from "../controllers/marketsController";

router.get("/", getAllMarkets);
router.get("/specs", extractMarketSpecs);
router.get("/state", extractMarketState);

export default router;
