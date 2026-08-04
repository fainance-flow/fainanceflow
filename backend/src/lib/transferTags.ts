/** Tag on both legs of an internal wallet-to-wallet transfer — excluded from income/expense KPIs. */
export const INTERNAL_TRANSFER_TAG = "__ff_xfer__";

export function transferPairTag(pairId: string): string {
  return `ff-pair:${pairId}`;
}
