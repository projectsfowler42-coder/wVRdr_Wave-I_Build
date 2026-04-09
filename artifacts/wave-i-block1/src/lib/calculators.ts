export function incomeFromShares(shares: number, dividendPerShare: number, periodsPerYear: number) {
  const annual = shares * dividendPerShare * periodsPerYear;
  return { annual, monthly: annual / 12 };
}

export function sharesFromCash(cash: number, price: number) {
  return price > 0 ? cash / price : 0;
}

export function costFromShares(shares: number, price: number) {
  return shares * price;
}

export function sharesNeededForIncome(targetAnnualIncome: number, dividendPerShare: number, periodsPerYear: number) {
  const denominator = dividendPerShare * periodsPerYear;
  return denominator > 0 ? targetAnnualIncome / denominator : 0;
}

export function dripProjection(currentShares: number, dividendPerShare: number, periods: number) {
  let shares = currentShares;
  let reinvested = 0;
  for (let i = 0; i < periods; i++) {
    const dividends = shares * dividendPerShare;
    reinvested += dividends;
    if (dividendPerShare > 0) shares += dividends / dividendPerShare;
  }
  return { finalShares: shares, reinvested };
}

export function averageCostAfterAdd(currentShares: number, currentCostBasis: number, addShares: number, addPrice: number) {
  const newCostBasis = currentCostBasis + addShares * addPrice;
  const newTotalShares = currentShares + addShares;
  return {
    newCostBasis,
    newTotalShares,
    averagePrice: newTotalShares > 0 ? newCostBasis / newTotalShares : 0
  };
}

export function walletDeploymentGap(deployableAmount: number, targetAmount: number) {
  const delta = deployableAmount - targetAmount;
  return { gap: Math.abs(delta), surplus: delta >= 0 };
}
