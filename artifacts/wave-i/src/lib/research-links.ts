export interface ResearchLink {
  label: string;
  url: string;
  category: "filing" | "analysis" | "news" | "data" | "dividend";
}

export const BLUE_LINKS: ResearchLink[] = [
  { label: "SEC Filings", url: "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=ARCC&type=10-K&dateb=&owner=include&count=10", category: "filing" },
  { label: "10-K Annual", url: "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=ARCC&type=10-K&dateb=&owner=include&count=5", category: "filing" },
  { label: "10-Q Quarterly", url: "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=ARCC&type=10-Q&dateb=&owner=include&count=10", category: "filing" },
  { label: "Yahoo Finance", url: "https://finance.yahoo.com/quote/ARCC", category: "data" },
  { label: "Seeking Alpha", url: "https://seekingalpha.com/symbol/ARCC", category: "analysis" },
  { label: "Macrotrends", url: "https://www.macrotrends.net/stocks/charts/ARCC/ares-capital/dividend", category: "dividend" },
  { label: "Ares Capital IR", url: "https://www.arescapitalcorp.com/investor-relations", category: "data" },
  { label: "Dividend History", url: "https://finance.yahoo.com/quote/ARCC/history/", category: "dividend" },
  { label: "Finviz", url: "https://finviz.com/quote.ashx?t=ARCC", category: "analysis" },
  { label: "BDC Reporter", url: "https://www.bdcreporter.com/p/ares-capital-arcc", category: "analysis" },
];

export const GREEN_LINKS: ResearchLink[] = [
  { label: "SEC Filings", url: "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=AGNC&type=10-K&dateb=&owner=include&count=10", category: "filing" },
  { label: "10-K Annual", url: "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=AGNC&type=10-K&dateb=&owner=include&count=5", category: "filing" },
  { label: "10-Q Quarterly", url: "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=AGNC&type=10-Q&dateb=&owner=include&count=10", category: "filing" },
  { label: "Yahoo Finance", url: "https://finance.yahoo.com/quote/AGNC", category: "data" },
  { label: "Seeking Alpha", url: "https://seekingalpha.com/symbol/AGNC", category: "analysis" },
  { label: "Macrotrends", url: "https://www.macrotrends.net/stocks/charts/AGNC/agnc-investment/dividend", category: "dividend" },
  { label: "AGNC IR", url: "https://ir.agnc.com/", category: "data" },
  { label: "Dividend History", url: "https://finance.yahoo.com/quote/AGNC/history/", category: "dividend" },
  { label: "Finviz", url: "https://finviz.com/quote.ashx?t=AGNC", category: "analysis" },
  { label: "mREIT Dashboard", url: "https://seekingalpha.com/analysis/all/mREIT", category: "analysis" },
];

export const CATEGORY_COLORS: Record<ResearchLink["category"], string> = {
  filing: "text-amber-400 bg-amber-400/10",
  analysis: "text-purple-400 bg-purple-400/10",
  news: "text-sky-400 bg-sky-400/10",
  data: "text-slate-300 bg-slate-300/10",
  dividend: "text-emerald-400 bg-emerald-400/10",
};
