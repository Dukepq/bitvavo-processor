import express from "express";
import getAssets from "../controllers/assetsController";
const router = express.Router();

router.get("/", getAssets);

export default router;
