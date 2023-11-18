import {
  Asset,
  Market,
  TickerPrice,
  TickerBook,
  OrderBook,
  Ticker24h,
  Candle,
} from "./types/BitvavoResponseTypes";
import fetchWithTimeout from "./utils/fetchWithTimeout";
import stringToNum from "./utils/stringToNum";

class BitvavoMarket {
  public assets: { [key: string]: Partial<Asset> & { updatedAt: number } };
  public markets: {
    [key: string]: Partial<Market & { volume: number }> & { updatedAt: number };
  };
  public remainingLimit: number | null;
  private initialized: boolean;
  private pruneTimeout: NodeJS.Timeout | null;
  private updateTimeout: NodeJS.Timeout | null;
  public fetchTimeout: number;
  constructor() {
    this.fetchTimeout = 5000;
    this.pruneTimeout = null;
    this.updateTimeout = null;
    this.assets = {};
    this.markets = {};
    this.remainingLimit = null;
    this.initialized = false;
    this.init();
    this.prune();
  }

  private async init() {
    try {
      const resolved = await Promise.all([
        this.updateMarkets(),
        this.updateAssets(),
      ]);
      this.initialized = true;
      this.update();
    } catch (err) {
      console.error("Something went wrong while updating markets");
      setTimeout(this.init, 1000 * 30);
    }
  }

  public async update() {
    // await this.updateVolumeOnAllMarkets(1000 * 60 * 6);
    this.updateTimeout = setTimeout(this.update, 1000 * 60 * 60);
  }

  public async extractFromOrderBook(market: string, depth: number) {
    const book = await this.fetchOrderBook(market);
    if (!book) return null;
    const { bids, asks } = book;
    const bestBid = stringToNum(bids[0][0]);
    const bestAsk = stringToNum(asks[0][0]);
    const price = bestBid;
    const spread = bestBid / bestAsk;
    let euroBidDepth = 0;
    for (let bid of bids) {
      const bidValue = bid[0];
      const bidAmount = bid[1];
    }
    return {
      [market]: {
        price,
        bestBid,
        bestAsk,
        spread,
      },
    };
  }

  public async updateMarkets(): Promise<{ success: boolean }> {
    try {
      const markets = await this.fetchMarkets();
      if (!markets) return { success: false };
      for (let entry of markets) {
        const { market, ...rest } = entry;
        if (entry.status !== "trading") continue;
        this.markets[market] = { ...rest, updatedAt: Date.now() };
      }
      return { success: true };
    } catch (err) {
      console.error(err);
      return { success: false };
    }
  }

  public async updateAssets(): Promise<{ success: boolean }> {
    try {
      const assets = await this.fetchAssets();
      if (!assets) return { success: false };
      for (let entry of assets) {
        const { symbol, ...rest } = entry;
        this.assets[symbol] = { ...rest, updatedAt: Date.now() };
      }
      return { success: true };
    } catch (err) {
      console.error(err);
      return { success: false };
    }
  }

  public async updateVolumeOnAllMarkets(period: number) {
    const promiseArray: Promise<{ market: string; promise: number }>[] = [];
    for (let entry in this.markets) {
      promiseArray.push(
        (async (): Promise<{ market: string; promise: number }> => {
          const promise = await this.getAverageVolumeByMarket(entry, period);
          if (promise === null) throw new Error("something went wrong");
          return { market: entry, promise };
        })()
      );
    }
    const settledPromises = await Promise.allSettled(promiseArray);
    for (let entry of settledPromises) {
      console.log(entry);
      if (entry.status !== "fulfilled") return;
      const { market, promise } = entry.value;
      if (this.markets[market]) {
        this.markets[market].volume = promise;
      }
    }
    return;
  }

  public async getAverageVolumeByMarket(
    market: string,
    period: number
  ): Promise<number | null> {
    try {
      const candles = await this.fetchCandles(market, period);
      if (!candles) return null;
      let totalCandleVolume = 0;
      for (const candle of candles) {
        const volumeStr = candle[candle.length - 1];
        const volume = Number(volumeStr);
        if (!isNaN(volume)) {
          totalCandleVolume += volume;
        }
      }
      return totalCandleVolume / (period / (1000 * 60));
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  private prune() {
    if (!this.initialized) {
      console.error("not initialized");
      this.pruneTimeout = setTimeout(() => this.prune(), 1000 * 60 * 5);
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
    this.pruneTimeout = setTimeout(() => this.prune(), 1000 * 60 * 5);
  }

  public async fetchMarkets(): Promise<Market[] | null> {
    const response = await fetchWithTimeout(
      "https://api.bitvavo.com/v2/markets",
      { timer: this.fetchTimeout }
    );
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    this.updateLimitRemaining(response);
    const markets: Market[] = await response.json();
    return markets;
  }

  public async fetchAssets(): Promise<Asset[] | null> {
    const response = await fetchWithTimeout(
      "https://api.bitvavo.com/v2/assets",
      { timer: this.fetchTimeout }
    );
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    this.updateLimitRemaining(response);
    const assets: Asset[] = await response.json();
    return assets;
  }

  public async fetchTickersData(): Promise<Ticker24h[] | null> {
    const response = await fetchWithTimeout(
      "https://api.bitvavo.com/v2/ticker/24h",
      { timer: this.fetchTimeout }
    );
    this.updateLimitRemaining(response);
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    const tickers: Ticker24h[] = await response.json();
    return tickers;
  }

  public async fetchTickerBooks(): Promise<TickerBook[] | null> {
    const response = await fetchWithTimeout(
      "https://api.bitvavo.com/v2/ticker/book",
      { timer: this.fetchTimeout }
    );
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    this.updateLimitRemaining(response);
    const tickerBooks: TickerBook[] = await response.json();
    return tickerBooks;
  }

  public async fetchOrderBook(market: string): Promise<OrderBook | null> {
    const response = await fetchWithTimeout(
      `https://api.bitvavo.com/v2/${market}/book`,
      { timer: this.fetchTimeout }
    );
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    this.updateLimitRemaining(response);
    const book: OrderBook = await response.json();
    return book;
  }

  public async fetchTickerPrices(): Promise<TickerPrice[] | null> {
    const response = await fetchWithTimeout(
      "https://api.bitvavo.com/v2/ticker/price",
      { timer: this.fetchTimeout }
    );
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    this.updateLimitRemaining(response);
    const tickers: TickerPrice[] = await response.json();
    return tickers;
  }

  public async fetchCandles(
    market: string,
    period: number = 360000
  ): Promise<Candle[]> {
    const now = Date.now();
    const response = await fetchWithTimeout(
      `https://api.bitvavo.com/v2/${market}/candles?interval=1m&start=${
        now - period
      }`,
      { timer: this.fetchTimeout }
    );
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    const tickers: Candle[] = await response.json();
    return tickers;
  }

  private extractLimitFromHeaders(response: Response): number | null {
    const _rateLimitRemaining = response.headers.get(
      "bitvavo-ratelimit-remaining"
    );
    if (!_rateLimitRemaining) return null;
    const rateLimitRemaining = parseInt(_rateLimitRemaining);
    if (isNaN(rateLimitRemaining)) return null;
    return rateLimitRemaining;
  }

  public updateLimitRemaining(response: Response): void {
    const rateLimitRemaining = this.extractLimitFromHeaders(response);
    if (rateLimitRemaining) this.remainingLimit = rateLimitRemaining;
    else
      console.error(
        "Error: did not manage to update remaining rate limit, please make sure headers on provided response contain 'bitvavo-ratelimit-remaining'"
      );
  }

  public sufficientRemainingLimit(cost: number): boolean {
    const limit = this.remainingLimit;
    if (limit && limit < cost + 10) return false;
    else return true;
  }
}
const myObj = new BitvavoMarket();
export default myObj;
