/** Integer team size for modeling (whole people). */
export function validateTeamSizeString(raw: string): string | null {
  const s = raw.trim();
  if (s === "") {
    return "Team size is required.";
  }
  if (!/^\d+$/.test(s)) {
    return "Use a whole number (no decimals).";
  }
  const n = Number.parseInt(s, 10);
  if (n < 1 || n > 50_000) {
    return "Enter a team size between 1 and 50,000.";
  }
  return null;
}

/** Seat / quantity count per subscription line. */
export function validateSeatsString(raw: string): string | null {
  const s = raw.trim();
  if (s === "") {
    return "Quantity is required.";
  }
  if (!/^\d+$/.test(s)) {
    return "Use a whole number (no decimals).";
  }
  const n = Number.parseInt(s, 10);
  if (n < 1 || n > 10_000) {
    return "Quantity must be between 1 and 10,000.";
  }
  return null;
}
