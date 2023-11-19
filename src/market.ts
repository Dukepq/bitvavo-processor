import {
  Asset,
  Market,
  TickerPrice,
  TickerBook,
  OrderBook,
  Ticker24h,
  Candle,
} from "./types/BitvavoResponseTypes";
import addAsks, { addBids } from "./utils/addValueArrayToLimit";
import fetchWithTimeout from "./utils/fetchWithTimeout";
import stringToNum from "./utils/stringToNum";

type OrderBookExtract = {
  market: string;
  price: number;
  bestBid: number;
  bestAsk: number;
  spread: number;
  euroBidDepth: number | null;
  euroAskDepth: number | null;
} | null;

class BitvavoMarket {
  public assets: { [key: string]: Partial<Asset> & { updatedAt: number } };
  public markets: {
    [key: string]: Partial<Market & { volume: number }> & {
      updatedAt: number;
    } & Partial<OrderBookExtract>;
  };
  public remainingLimit: number | null;
  private initialized: boolean;
  private pruneTimeout: NodeJS.Timeout | null;
  private updateTimeout: NodeJS.Timeout | null;
  public fetchTimeout: number;
  constructor() {
    this.fetchTimeout = 10000;
    this.pruneTimeout = null;
    this.updateTimeout = null;
    this.assets = {};
    this.markets = {};
    this.remainingLimit = null;
    this.initialized = false;
    this.init();
    // this.prune();
  }

  async init() {
    try {
      await Promise.all([this.updateMarkets(), this.updateAssets()]);
      this.initialized = true;
      this.update();
    } catch (err) {
      console.error(
        "Something went wrong while trying to updating markets: " + err
      );
      console.log("retrying initiation in 30s");
      setTimeout(this.init.bind(this), 1000 * 30);
    }
  }

  async update() {
    await this.updateVolumeOnAllMarkets(1000 * 60 * 6);
    console.log("finished updating volume...");
    await this.updateAllOrderBookDerivedValues();
    console.log("finished updating order book derived values...");
    for (const pair in this.markets) {
      console.log(this.markets[pair]);
    }
    console.log("setting timeout for next update...");
    this.updateTimeout = setTimeout(this.update.bind(this), 1000 * 60);
  }

  async updateAllOrderBookDerivedValues() {
    /* ---------WORKS--------- */
    for (let entry in this.markets) {
      const promise = await this.extractFromOrderBook(entry, 0.05);
      if (!promise) continue;
      const { market, ...rest } = promise;
      Object.assign(this.markets[entry], rest);
      console.log(entry);
    }
    /* ---------WORKS--------- */

    /* ---
    While occasionaly succeeding in fetching the requested data below method usually
    runs into errors (Timeout Error) fails to retreive all pairs from Bitvavo, potentially because
    too much data is requested in too short a timeframe (full order book information of over 200 assets ~20Mb)
    --- */
    // const promiseArray: Promise<OrderBookExtract>[] = [];
    // for (const entry in this.markets) {
    //   const promise = this.extractFromOrderBook(entry, 0.05);
    //   promiseArray.push(promise);
    // }
    // const settledPromises = await Promise.allSettled(promiseArray);
    // for (let entry of settledPromises) {
    //   if (entry.status !== "fulfilled" || !entry.value) return;
    //   const { market, ...rest } = entry.value;
    //   console.log(market, !!this.markets[market]);
    //   Object.assign(this.markets[market], rest);
    // }
    /* --------- */
    return;
  }

  async extractFromOrderBook(
    market: string,
    depth: number
  ): Promise<OrderBookExtract> {
    try {
      const book = await this.fetchOrderBook(market);
      if (!book) return null;
      const { bids, asks } = book;
      const bestBid = stringToNum(bids[0][0]);
      const bestAsk = stringToNum(asks[0][0]);
      const price = bestBid;
      const spread = bestBid / bestAsk;
      const euroBidDepth = addBids(bids, depth);
      const euroAskDepth = addAsks(asks, depth);
      return {
        market,
        price,
        bestBid,
        bestAsk,
        spread,
        euroBidDepth,
        euroAskDepth,
      };
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  async updateMarkets(): Promise<{ success: boolean }> {
    const markets = await this.fetchMarkets();
    if (!markets) return { success: false };
    for (let entry of markets) {
      const { market, ...rest } = entry;
      if (entry.status !== "trading") continue;
      this.markets[market] = { ...rest, updatedAt: Date.now() };
    }
    return { success: true };
  }

  async updateAssets(): Promise<{ success: boolean }> {
    const assets = await this.fetchAssets();
    if (!assets) return { success: false };
    for (let entry of assets) {
      const { symbol, ...rest } = entry;
      this.assets[symbol] = { ...rest, updatedAt: Date.now() };
    }
    return { success: true };
  }

  async updateVolumeOnAllMarkets(period: number) {
    const promiseArray: Promise<{ market: string; promise: number | null }>[] =
      [];
    for (let entry in this.markets) {
      promiseArray.push(
        (async (): Promise<{ market: string; promise: number | null }> => {
          const promise = await this.getAverageVolumeByMarket(entry, period);
          return { market: entry, promise };
        })()
      );
    }
    const settledPromises = await Promise.allSettled(promiseArray);
    for (let entry of settledPromises) {
      if (
        entry.status !== "fulfilled" ||
        typeof entry.value.promise !== "number"
      )
        continue;
      const { market, promise } = entry.value;
      if (this.markets[market]) {
        this.markets[market].volume = promise;
      }
    }
    return;
  }

  async getAverageVolumeByMarket(
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

  async fetchMarkets(): Promise<Market[] | null> {
    const response = await fetch("https://api.bitvavo.com/v2/markets");
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    this.updateLimitRemaining(response);
    const markets: Market[] = await response.json();
    return markets;
  }

  async fetchAssets(): Promise<Asset[] | null> {
    const response = await fetch("https://api.bitvavo.com/v2/assets");
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    this.updateLimitRemaining(response);
    const assets: Asset[] = await response.json();
    return assets;
  }

  async fetchTickersData(): Promise<Ticker24h[] | null> {
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

  async fetchTickerBooks(): Promise<TickerBook[] | null> {
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

  async fetchOrderBook(market: string): Promise<OrderBook | null> {
    const response = await fetchWithTimeout(
      `https://api.bitvavo.com/v2/${market}/book`,
      { timer: 500 }
    );
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    this.updateLimitRemaining(response);
    const book: OrderBook = await response.json();
    return book;
  }

  async fetchTickerPrices(): Promise<TickerPrice[] | null> {
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

  async fetchCandles(
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

  updateLimitRemaining(response: Response): void {
    const rateLimitRemaining = this.extractLimitFromHeaders(response);
    if (rateLimitRemaining) this.remainingLimit = rateLimitRemaining;
    else
      console.error(
        "Error: did not manage to update remaining rate limit, please make sure headers on provided response contain 'bitvavo-ratelimit-remaining'"
      );
  }

  private sufficientRemainingLimit(cost: number): boolean {
    const limit = this.remainingLimit;
    if (limit && limit < cost + 10) return false;
    else return true;
  }
}
const myObj = new BitvavoMarket();
export default myObj;
