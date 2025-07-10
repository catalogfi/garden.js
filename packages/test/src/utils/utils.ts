import BigNumber from "bignumber.js";
import { Assets } from "../store/assetInfoStore";
import { Swap } from "@gardenfi/orderbook";


export const getAssetFromSwap = (swap: Swap, assets: Assets | null) => {
  return assets && assets[`${swap.chain}_${swap.asset.toLowerCase()}`];
};

export const getDayDifference = (date: string) => {
  const now = new Date();
  const differenceInMs = now.getTime() - new Date(date).getTime();
  const dayDifference = Math.floor(differenceInMs / (1000 * 3600 * 24));
  const hourDifference = Math.floor(differenceInMs / (1000 * 3600));
  const minuteDifference = Math.floor(differenceInMs / (1000 * 60));

  if (dayDifference > 3) return `on ${new Date(date).toLocaleDateString()}`;
  if (dayDifference > 0)
    return `${dayDifference} day${dayDifference > 1 ? "s" : ""} ago`;
  if (hourDifference > 0)
    return `${hourDifference} hour${hourDifference > 1 ? "s" : ""} ago`;
  if (minuteDifference > 0)
    return `${minuteDifference} minute${minuteDifference > 1 ? "s" : ""} ago`;
  return "Just now";
};

export const formatAmount = (
  amount: string | number,
  decimals: number,
  toFixed = 8
) => {
  const bigAmount = new BigNumber(amount);
  const temp = bigAmount
    .dividedBy(10 ** decimals)
    .toFixed(toFixed, BigNumber.ROUND_DOWN);
  return Number(temp);
};

export const isCurrentRoute = (route: string) =>
  window.location.pathname === route;
