type Ticker24hEntry = {
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

export type Ticker24h = Ticker24hEntry[];

export type OrderBook = {
  market: string;
  nonce: number;
  bids: string[][];
  asks: string[][];
};

type TickerBookEntry = {
  market: string;
  bid: string;
  bidSize: string;
  ask: string;
  askSize: string;
};
export type TickerBooks = TickerBookEntry[];

type TickerPrice = {
  market: string;
  price: string;
};
export type TickerPrices = TickerPrice[];

type Market = {
  market: string;
  status: "trading" | "halted" | "auction";
  base: string;
  quote: string;
  pricePrecision: string;
  minOrderInQuoteAsset: string;
  minOrderInBaseAsset: string;
  orderTypes: string[];
};
export type Markets = Market[];

type asset = {
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
type assets = asset[];
