import { Response, Request } from "express";
import { z } from "zod";
import marketState from "../market";

const extractSchemaOptional = z.object({
  query: z.object({
    fields: z.string().optional(),
  }),
});

const extractSchema = z.object({
  query: z.object({
    fields: z.string(),
  }),
});

export const getAllMarkets = (req: Request, res: Response) => {
  const parsed = extractSchema.safeParse(req);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ success: false, message: "please provide correct query params" });
  }
  const fields = parsed.data.query.fields?.split(",");
  if (fields.length > 3) {
    return res
      .status(400)
      .json({ success: false, message: "can only fetch up to three fields" });
  }
  const markets = { ...marketState.markets };
  const filteredMarkets: { [key: string]: any } = {};
  const keys = Object.keys(markets);
  for (const key of keys) {
    const target = markets[key];
    filteredMarkets[key] = getObjectSubset(fields, target);
  }
  console.log(filteredMarkets);
  return res.json();
};

function getObjectSubset(fields: string[], object: { [key: string]: any }) {
  const filteredMarket: { [key: string]: any } = {};
  for (const field of fields) {
    if (!Object.keys(object).includes(field)) continue;
    const value = object[field as keyof typeof object];
    filteredMarket[field] = value;
  }
  return filteredMarket;
}

export const extractMarketState = (req: Request, res: Response) => {
  const markets = { ...marketState.markets };
  for (let entry in markets) {
    const {
      status,
      base,
      quote,
      pricePrecision,
      minOrderInBaseAsset,
      minOrderInQuoteAsset,
      maxOrderInBaseAsset,
      maxOrderInQuoteAsset,
      orderTypes,
      ...rest
    } = markets[entry];
    markets[entry] = rest;
  }
  res.status(200).json(markets);
};

export const extractMarketSpecs = (req: Request, res: Response) => {
  const markets = { ...marketState.markets };
  for (let entry in markets) {
    const {
      volume,
      price,
      bestBid,
      bestAsk,
      spread,
      euroBidDepth,
      euroAskDepth,
      ...rest
    } = markets[entry];
    markets[entry] = rest;
  }
  res.status(200).json(markets);
};

const specificMarketSchemaReq = z.object({
  params: z.object({
    PAIR: z.string().max(10).regex(new RegExp("^[A-Z]+-[A-Z]+$")),
  }),
});

export const getSpecificMarket = (req: Request, res: Response) => {
  try {
    specificMarketSchemaReq.parse(req);
    const param = req.params.PAIR;
    const market = marketState.markets[param];
    if (market) {
      res.status(200).json(market);
    } else {
      res
        .status(404)
        .json({ success: false, message: "could not find requested market" });
    }
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "provide correct params. Format: XXX-YYY",
    });
  }
};
