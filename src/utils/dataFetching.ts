import {
  Asset,
  Market,
  TickerPrice,
  TickerBook,
  OrderBook,
  Ticker24h,
} from "../types/BitvavoResponseTypes";

export async function fetchMarkets(): Promise<Market[]> {
  const response = await fetch("https://api.bitvavo.com/v2/markets");
  const markets: Market[] = await response.json();
  return markets;
}

export async function fetchAssets(): Promise<Asset[]> {
  const response = await fetch("https://api.bitvavo.com/v2/assets");
  const assets: Asset[] = await response.json();
  return assets;
}

export async function fetchTickerPrices(): Promise<TickerPrice[]> {
  const response = await fetch("https://api.bitvavo.com/v2/ticker/price");
  const tickers: TickerPrice[] = await response.json();
  return tickers;
}

export async function fetchTickerBooks(): Promise<TickerBook[]> {
  const response = await fetch("https://api.bitvavo.com/v2/ticker/book");
  const tickerBooks: TickerBook[] = await response.json();
  return tickerBooks;
}

export async function fetchOrderBook(pair: string): Promise<OrderBook> {
  const response = await fetch(`https://api.bitvavo.com/v2/${pair}/book`);
  const book: OrderBook = await response.json();
  return book;
}

export async function TickersData(): Promise<Ticker24h[]> {
  const response = await fetch("https://api.bitvavo.com/v2/ticker/24h");
  const tickers: Ticker24h[] = await response.json();
  return tickers;
}
