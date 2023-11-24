import stringToNum from "./stringToNum";
export function addBids(bids: [string, string][], depth: number): number {
  const price = stringToNum(bids[0][0]);
  let euroBidDepth = 0;
  for (let bid of bids) {
    const bidValue = stringToNum(bid[0]);
    const bidAmount = stringToNum(bid[1]);
    const euroValue = bidValue * bidAmount;
    if (bidValue < (1 - depth) * price) {
      return euroBidDepth;
    } else {
      euroBidDepth += euroValue;
    }
  }
  return euroBidDepth;
}

export default function addAsks(
  asks: [string, string][],
  depth: number
): number {
  const price = stringToNum(asks[0][0]);
  let euroAskDepth = 0;
  for (let ask of asks) {
    const askValue = stringToNum(ask[0]);
    const askAmount = stringToNum(ask[1]);
    const euroValue = askValue * askAmount;
    if (askValue > (1 + depth) * price) {
      return euroAskDepth;
    } else {
      euroAskDepth += euroValue;
    }
  }
  return euroAskDepth;
}
