/** Extract first USD amount from cells like "$20", "$1,200/yr", "Custom". */
export function parseFirstUsd(value: string): number | null {
  if (value.toLowerCase().includes("custom") || value === "N/A") {
    return null;
  }
  const m = value.match(/\$([\d,]+)/);
  if (!m) {
    return null;
  }
  return Number.parseInt(m[1].replace(/,/g, ""), 10);
}

/** "Plus ($20/mo)" → 20 */
export function parseUsdFromCheapestPaidCell(value: string): number | null {
  const paren = value.match(/\(\$([\d,]+)\/mo\)/);
  if (paren) {
    return Number.parseInt(paren[1].replace(/,/g, ""), 10);
  }
  return parseFirstUsd(value);
}

/** Indices of columns that win for finance-friendly rows (lower $ or free tier). */
export function getWinningColumnIndices(rowLabel: string, values: string[]): Set<number> | null {
  if (values.length === 0) {
    return null;
  }

  if (rowLabel === "Free Plan") {
    const wins = new Set<number>();
    values.forEach((v, i) => {
      if (v === "Yes") {
        wins.add(i);
      }
    });
    return wins.size ? wins : null;
  }

  if (rowLabel === "Monthly Cost" || rowLabel === "Annual Cost") {
    const nums = values.map((v) => parseFirstUsd(v));
    const valid = nums.filter((n): n is number => n !== null);
    if (valid.length === 0) {
      return null;
    }
    const best = Math.min(...valid);
    const wins = new Set<number>();
    nums.forEach((n, i) => {
      if (n === best) {
        wins.add(i);
      }
    });
    return wins;
  }

  if (rowLabel === "Cheapest Paid Plan") {
    const nums = values.map((v) => parseUsdFromCheapestPaidCell(v));
    const valid = nums.filter((n): n is number => n !== null);
    if (valid.length === 0) {
      return null;
    }
    const best = Math.min(...valid);
    const wins = new Set<number>();
    nums.forEach((n, i) => {
      if (n === best) {
        wins.add(i);
      }
    });
    return wins;
  }

  return null;
}
