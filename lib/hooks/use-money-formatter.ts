"use client";

import { useCallback, useEffect, useState } from "react";
import { formatUsdModel } from "@/lib/format-money";

export function useMoneyFormatter(): { locale: string; usd: (amount: number) => string } {
  const [locale, setLocale] = useState("en-US");

  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.language) {
      setLocale(navigator.language);
    }
  }, []);

  const usd = useCallback((amount: number) => formatUsdModel(amount, locale), [locale]);

  return { locale, usd };
}
