import {
  Asset,
  Market,
  TickerPrice,
  TickerBook,
  OrderBook,
  Ticker24h,
  Candle,
} from "./types/BitvavoResponseTypes";

class BitvavoMarket {
  public assets: { [key: string]: Asset };
  public markets: { [key: string]: Partial<Market> & { updatedAt: number } };
  protected initialized: boolean;
  constructor() {
    this.assets = {};
    this.markets = {};
    this.initialized = false;
    this.init();
    this.prune();
  }

  private async init() {
    const success = (await this.updateMarkets()).success;
    if (!success) {
      console.error("Something went wrong while updating markets");
      setTimeout(this.init, 1000 * 30);
    }
    this.initialized = true;
  }

  public async updateMarkets(): Promise<{ success: boolean }> {
    const markets = await this.fetchMarkets();
    if (!markets) return { success: false };
    for (let entry of markets) {
      const { market, ...rest } = entry;
      if (entry.status !== "trading") continue;
      this.markets[market] = { ...rest, updatedAt: Date.now() };
    }
    return { success: true };
  }

  public getOrderBookDepth(pair: string, depth: number) {
    return pair;
  }

  private prune() {
    if (!this.initialized) {
      console.error("not initialized");
      setTimeout(() => this.prune(), 1000 * 60 * 5);
      return;
    }
    const now = Date.now();
    for (let entry in this.markets) {
      const marketData = this.markets[entry];
      if (typeof marketData === undefined) continue;
      if (now - marketData.updatedAt > 1000 * 60 * 5) {
        console.log("deleting: " + entry);
        delete this.markets[entry];
      }
    }
    setTimeout(() => this.prune(), 1000 * 60 * 5);
  }

  public async fetchMarkets(): Promise<Market[] | null> {
    try {
      const response = await fetch("https://api.bitvavo.com/v2/markets");
      const markets: Market[] = await response.json();
      return markets;
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  public async fetchAssets(): Promise<Asset[] | null> {
    try {
      const response = await fetch("https://api.bitvavo.com/v2/assets");
      const assets: Asset[] = await response.json();
      return assets;
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  public async tickersData(): Promise<Ticker24h[] | null> {
    try {
      const response = await fetch("https://api.bitvavo.com/v2/ticker/24h");
      const tickers: Ticker24h[] = await response.json();
      return tickers;
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  public async fetchTickerBooks(): Promise<TickerBook[] | null> {
    try {
      const response = await fetch("https://api.bitvavo.com/v2/ticker/book");
      const tickerBooks: TickerBook[] = await response.json();
      return tickerBooks;
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  public async fetchOrderBook(market: string): Promise<OrderBook | null> {
    try {
      const response = await fetch(`https://api.bitvavo.com/v2/${market}/book`);
      const book: OrderBook = await response.json();
      return book;
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  public async fetchTickerPrices(): Promise<TickerPrice[] | null> {
    try {
      const response = await fetch("https://api.bitvavo.com/v2/ticker/price");
      const tickers: TickerPrice[] = await response.json();
      return tickers;
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  public async fetchCandles(
    market: string,
    period: number = 360000
  ): Promise<Candle[] | null> {
    const now = Date.now();
    try {
      const response = await fetch(
        `https://api.bitvavo.com/v2/${market}/candles?interval=1m&start=${
          now - period
        }`
      );
      const tickers: Candle[] = await response.json();
      return tickers;
    } catch (err) {
      console.error(err);
      return null;
    }
  }
}
const myObj = new BitvavoMarket();
export default myObj;
