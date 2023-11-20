/* --------------------------------------- */
// market endpoints:
/* --------------------------------------- */

export type Ticker24h = {
  market: string;
  open: string;
  high: string;
  low: string;
  last: string;
  volume: string;
  volumeQuote: string;
  bid: string;
  bidSize: string;
  ask: string;
  askSize: string;
  timestamp: number;
};

export type Ticker24hArray = Ticker24h[];

export type OrderBook = {
  market: string;
  nonce: number;
  bids: [string, string][];
  asks: [string, string][];
};

export type TickerBook = {
  market: string;
  bid: string;
  bidSize: string;
  ask: string;
  askSize: string;
};
export type TickerBooks = TickerBook[];

export type TickerPrice = {
  market: string;
  price: string;
};
export type TickerPrices = TickerPrice[];

export type Candle = [string, string, string, string, string, string];

/* --------------------------------------- */
// synchronization endpoints:
/* --------------------------------------- */

export type Market = {
  market: string;
  status: "trading" | "halted" | "auction";
  base: string;
  quote: string;
  pricePrecision: string;
  minOrderInQuoteAsset: string;
  minOrderInBaseAsset: string;
  maxOrderInQuoteAsset: string;
  maxOrderInBaseAsset: string;
  orderTypes: string[];
};
export type Markets = Market[];

export type Asset = {
  symbol: string;
  name: string;
  decimals: number;
  depositFee: string;
  depositConfirmations: number;
  depositStatus: "OK" | "MAINTENANCE" | "DELISTED";
  withdrawalFee: string;
  withdrawalMinAmount: string;
  withdrawalStatus: "OK" | "MAINTENANCE" | "DELISTED";
  networks: string[];
  message: string;
};
export type Assets = Asset[];
