export type LinkClass = "live_quote" | "chart" | "issuer_site" | "filings" | "dividend_info" | "payout_history" | "research" | "fallback_search";

export interface LinkEntry {
  instrument_id: string;
  link_class: LinkClass;
  source_name: string;
  priority: 0 | 1 | 2;
  url: string;
  health_state: "healthy" | "degraded" | "down";
  last_checked_at: string;
  fail_count: number;
  manual_override: boolean;
  replacement_notes?: string;
}

export function getInstrumentLinks(ticker: string): LinkEntry[] {
  const now = new Date().toISOString();
  const t = ticker.toUpperCase();
  return [
    ["live_quote","Yahoo Finance",0,`https://finance.yahoo.com/quote/${t}`],
    ["live_quote","Google Finance",1,`https://www.google.com/finance/quote/${t}:NYSE`],
    ["chart","Yahoo Chart",0,`https://finance.yahoo.com/chart/${t}`],
    ["issuer_site","Investor Relations",0,`https://duckduckgo.com/?q=${t}+investor+relations`],
    ["filings","SEC EDGAR",0,`https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${t}&owner=include&count=10`],
    ["dividend_info","Macrotrends",0,`https://www.macrotrends.net/stocks/charts/${t}/${t.toLowerCase()}/dividend-history`],
    ["payout_history","Yahoo History",0,`https://finance.yahoo.com/quote/${t}/history?p=${t}`],
    ["research","Seeking Alpha",0,`https://seekingalpha.com/symbol/${t}`],
    ["fallback_search","DuckDuckGo",0,`https://duckduckgo.com/?q=${t}+stock`]
  ].map(([link_class,source_name,priority,url]) => ({
    instrument_id: t,
    link_class: link_class as LinkClass,
    source_name: source_name as string,
    priority: priority as 0 | 1 | 2,
    url: url as string,
    health_state: "healthy" as const,
    last_checked_at: now,
    fail_count: 0,
    manual_override: false
  }));
}
