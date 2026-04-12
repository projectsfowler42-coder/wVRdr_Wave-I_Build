import { useState, useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { fetchQuote, type Quote } from "@/lib/market";
import {
  type Holding,
  type ActiveContainerClass,
  deleteHolding,
  updateHolding,
  calcCostBasis,
  calcCurrentValue,
  calcUnrealizedGL,
  calcUnrealizedGLPct,
  placementFromContainer,
} from "@/lib/portfolio";
import { getInstrumentRecord, getBucketScopedInstruments } from "@/lib/loadInstruments";
import { ACTIVE_CONTAINERS, containerLabel, containerParentLabel, containerAccent } from "@/lib/containerModel";
import { fmtDollar, fmtPct, fmt, signClass } from "@/lib/utils";
import { Pencil, Trash2, Check, X, ChevronUp, ChevronDown } from "lucide-react";

interface PortfolioTableProps {
  holdings: Holding[];
  onHoldingsChange: (h: Holding[]) => void;
}

type SortKey =
  | "ticker" | "container" | "shares" | "entryPrice" | "entryDate"
  | "currentPrice" | "currentValue" | "costBasis" | "gl"
  | "dividendCollected" | "latestDipDate" | "dripAmount" | "expectedIncome" | "notes";

type ContainerFilter = "ALL" | ActiveContainerClass;

const inputCls =
  "bg-muted border border-border rounded px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring w-full";
const selectCls =
  "bg-muted border border-border rounded px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring";

function SortHeader({
  label,
  sortKey,
  current,
  dir,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  dir: "asc" | "desc";
  onSort: (k: SortKey) => void;
}) {
  const active = current === sortKey;
  return (
    <th
      className="px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap cursor-pointer hover:text-foreground select-none"
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center gap-0.5">
        {label}
        {active ? (dir === "asc" ? <ChevronUp size={10} /> : <ChevronDown size={10} />) : <ChevronDown size={10} className="opacity-20" />}
      </span>
    </th>
  );
}

interface EditRowProps {
  holding: Holding;
  onSave: (patch: Partial<Omit<Holding, "id">>) => void;
  onCancel: () => void;
}

function EditRow({ holding, onSave, onCancel }: EditRowProps) {
  const [form, setForm] = useState({
    container: holding.container,
    ticker: holding.ticker,
    shares: String(holding.shares),
    entryDate: holding.entryDate,
    entryPrice: String(holding.entryPrice),
    dividendCollected: String(holding.dividendCollected),
    latestDipDate: holding.latestDipDate,
    dripAmount: String(holding.dripAmount),
    expectedIncome: String(holding.expectedIncome),
    notes: holding.notes,
  });

  function set(key: keyof typeof form, value: string) {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "container") {
        next.ticker = getBucketScopedInstruments(value as ActiveContainerClass)[0]?.ticker ?? "";
      }
      return next;
    });
  }

  function handleSave() {
    const placement = placementFromContainer(form.container as ActiveContainerClass);
    onSave({
      container: form.container as ActiveContainerClass,
      bucket: placement.bucket,
      wallet: placement.wallet,
      ticker: form.ticker,
      shares: parseFloat(form.shares) || 0,
      entryDate: form.entryDate,
      entryPrice: parseFloat(form.entryPrice) || 0,
      dividendCollected: parseFloat(form.dividendCollected) || 0,
      latestDipDate: form.latestDipDate,
      dripAmount: parseFloat(form.dripAmount) || 0,
      expectedIncome: parseFloat(form.expectedIncome) || 0,
      notes: form.notes,
    });
  }

  const scopedInstruments = getBucketScopedInstruments(form.container as ActiveContainerClass);

  return (
    <tr className="border-b border-border/30 bg-accent/20">
      <td className="px-2 py-2">
        <select value={form.container} onChange={(event) => set("container", event.target.value)} className={selectCls}>
          {ACTIVE_CONTAINERS.map((container) => (
            <option key={container} value={container}>{containerLabel(container)}</option>
          ))}
        </select>
      </td>
      <td className="px-2 py-2 text-muted-foreground text-xs">{containerParentLabel(form.container as ActiveContainerClass)}</td>
      <td className="px-2 py-2">
        <select value={form.ticker} onChange={(event) => set("ticker", event.target.value)} className={selectCls}>
          {scopedInstruments.map((instrument) => (
            <option key={instrument.ticker} value={instrument.ticker}>{instrument.ticker}</option>
          ))}
        </select>
      </td>
      <td className="px-2 py-2"><input type="number" value={form.shares} onChange={(event) => set("shares", event.target.value)} className={inputCls} /></td>
      <td className="px-2 py-2"><input type="date" value={form.entryDate} onChange={(event) => set("entryDate", event.target.value)} className={inputCls} /></td>
      <td className="px-2 py-2"><input type="number" value={form.entryPrice} onChange={(event) => set("entryPrice", event.target.value)} step="0.01" className={inputCls} /></td>
      <td className="px-2 py-2 text-muted-foreground text-xs italic">live</td>
      <td className="px-2 py-2 text-muted-foreground text-xs italic">auto</td>
      <td className="px-2 py-2 text-muted-foreground text-xs italic">auto</td>
      <td className="px-2 py-2 text-muted-foreground text-xs italic">auto</td>
      <td className="px-2 py-2"><input type="number" value={form.dividendCollected} onChange={(event) => set("dividendCollected", event.target.value)} step="0.01" className={inputCls} /></td>
      <td className="px-2 py-2"><input type="date" value={form.latestDipDate} onChange={(event) => set("latestDipDate", event.target.value)} className={inputCls} /></td>
      <td className="px-2 py-2"><input type="number" value={form.dripAmount} onChange={(event) => set("dripAmount", event.target.value)} step="0.01" className={inputCls} /></td>
      <td className="px-2 py-2"><input type="number" value={form.expectedIncome} onChange={(event) => set("expectedIncome", event.target.value)} step="0.01" className={inputCls} /></td>
      <td className="px-2 py-2"><input type="text" value={form.notes} onChange={(event) => set("notes", event.target.value)} className={inputCls} /></td>
      <td className="px-2 py-2">
        <div className="flex gap-1">
          <button onClick={handleSave} className="p-1 rounded text-up hover:bg-up/10 transition-colors" title="Save"><Check size={13} /></button>
          <button onClick={onCancel} className="p-1 rounded text-muted-foreground hover:bg-muted transition-colors" title="Cancel"><X size={13} /></button>
        </div>
      </td>
    </tr>
  );
}

interface HoldingRowProps {
  holding: Holding;
  quote: Quote | undefined;
  quoteLoading: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

function HoldingRow({ holding, quote, quoteLoading, onEdit, onDelete }: HoldingRowProps) {
  const instrument = getInstrumentRecord(holding.ticker);
  const accent = containerAccent(holding.container);
  const costBasis = calcCostBasis(holding);
  const currentValue = calcCurrentValue(holding, quote?.price);
  const gl = calcUnrealizedGL(holding, quote?.price);
  const glPct = calcUnrealizedGLPct(holding, quote?.price);

  return (
    <tr className="border-b border-border/20 hover:bg-muted/10 transition-colors">
      <td className="px-2 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${accent.dim}`} />
          <span className={`font-semibold text-[10px] uppercase ${accent.text}`}>{containerLabel(holding.container)}</span>
        </div>
      </td>
      <td className="px-2 py-2.5 text-[10px] font-semibold text-muted-foreground">{containerParentLabel(holding.container)}</td>
      <td className="px-2 py-2.5">
        <div className="font-bold text-foreground">{holding.ticker}</div>
        {instrument && <div className="text-[10px] text-muted-foreground truncate max-w-[120px]">{instrument.name}</div>}
      </td>
      <td className="px-2 py-2.5 num text-foreground">{fmt(holding.shares, 4)}</td>
      <td className="px-2 py-2.5 num text-muted-foreground whitespace-nowrap">{holding.entryDate || "—"}</td>
      <td className="px-2 py-2.5 num text-foreground">{fmtDollar(holding.entryPrice)}</td>
      <td className="px-2 py-2.5 num">
        {quoteLoading ? <span className="text-muted-foreground animate-pulse text-[10px]">loading</span> : quote?.price == null ? <span className="text-muted-foreground">—</span> : <span className="text-foreground">{fmtDollar(quote.price)}</span>}
      </td>
      <td className="px-2 py-2.5 num text-foreground">{currentValue != null ? fmtDollar(currentValue) : "—"}</td>
      <td className="px-2 py-2.5 num text-muted-foreground">{fmtDollar(costBasis)}</td>
      <td className="px-2 py-2.5 num">
        {gl != null ? (
          <div>
            <div className={`font-semibold ${signClass(gl)}`}>{fmtDollar(gl)}</div>
            <div className={`text-[10px] ${signClass(glPct)}`}>{fmtPct(glPct)}</div>
          </div>
        ) : <span className="text-muted-foreground">—</span>}
      </td>
      <td className="px-2 py-2.5 num text-foreground">{fmtDollar(holding.dividendCollected)}</td>
      <td className="px-2 py-2.5 num text-muted-foreground whitespace-nowrap">{holding.latestDipDate || "—"}</td>
      <td className="px-2 py-2.5 num text-foreground">{fmtDollar(holding.dripAmount)}</td>
      <td className="px-2 py-2.5 num text-foreground">{fmtDollar(holding.expectedIncome)}</td>
      <td className="px-2 py-2.5 max-w-[120px]">
        <span className="text-muted-foreground text-[11px] truncate block" title={holding.notes}>{holding.notes || "—"}</span>
      </td>
      <td className="px-2 py-2.5">
        <div className="flex gap-1">
          <button onClick={onEdit} className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors" title="Edit"><Pencil size={12} /></button>
          <button onClick={onDelete} className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" title="Delete"><Trash2 size={12} /></button>
        </div>
      </td>
    </tr>
  );
}

export default function PortfolioTable({ holdings, onHoldingsChange }: PortfolioTableProps) {
  const [containerFilter, setContainerFilter] = useState<ContainerFilter>("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("entryDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [editingId, setEditingId] = useState<string | null>(null);

  const allTickers = useMemo(() => [...new Set(holdings.map((holding) => holding.ticker))], [holdings]);

  const quoteResults = useQueries({
    queries: allTickers.map((ticker) => ({
      queryKey: ["quote", ticker],
      queryFn: () => fetchQuote(ticker),
      refetchInterval: 90_000,
      staleTime: 60_000,
      retry: 2,
    })),
  });

  const quotesMap = useMemo(() => {
    const map = new Map<string, { quote: Quote | undefined; loading: boolean }>();
    allTickers.forEach((ticker, index) => {
      map.set(ticker, {
        quote: quoteResults[index]?.data as Quote | undefined,
        loading: quoteResults[index]?.isLoading ?? false,
      });
    });
    return map;
  }, [allTickers, quoteResults]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function handleDelete(id: string) {
    if (window.confirm("Remove this holding?")) {
      onHoldingsChange(deleteHolding(holdings, id));
    }
  }

  function handleSaveEdit(id: string, patch: Partial<Omit<Holding, "id">>) {
    onHoldingsChange(updateHolding(holdings, id, patch));
    setEditingId(null);
  }

  const filtered = useMemo(
    () => holdings.filter((holding) => containerFilter === "ALL" || holding.container === containerFilter),
    [holdings, containerFilter],
  );

  const sorted = useMemo(() => {
    const nullAsc = Number.MAX_VALUE;
    const nullDesc = -Number.MAX_VALUE;

    return [...filtered].sort((left, right) => {
      const leftQuote = quotesMap.get(left.ticker)?.quote;
      const rightQuote = quotesMap.get(right.ticker)?.quote;

      let leftValue: number | string = 0;
      let rightValue: number | string = 0;

      switch (sortKey) {
        case "ticker":
          leftValue = left.ticker;
          rightValue = right.ticker;
          break;
        case "container":
          leftValue = left.container;
          rightValue = right.container;
          break;
        case "shares":
          leftValue = left.shares;
          rightValue = right.shares;
          break;
        case "entryDate":
          leftValue = left.entryDate || "";
          rightValue = right.entryDate || "";
          break;
        case "entryPrice":
          leftValue = left.entryPrice;
          rightValue = right.entryPrice;
          break;
        case "costBasis":
          leftValue = calcCostBasis(left);
          rightValue = calcCostBasis(right);
          break;
        case "dividendCollected":
          leftValue = left.dividendCollected;
          rightValue = right.dividendCollected;
          break;
        case "latestDipDate":
          leftValue = left.latestDipDate || "";
          rightValue = right.latestDipDate || "";
          break;
        case "dripAmount":
          leftValue = left.dripAmount;
          rightValue = right.dripAmount;
          break;
        case "expectedIncome":
          leftValue = left.expectedIncome;
          rightValue = right.expectedIncome;
          break;
        case "notes":
          leftValue = left.notes || "";
          rightValue = right.notes || "";
          break;
        case "currentPrice": {
          const sentinel = sortDir === "asc" ? nullAsc : nullDesc;
          leftValue = leftQuote?.price ?? sentinel;
          rightValue = rightQuote?.price ?? sentinel;
          break;
        }
        case "currentValue": {
          const sentinel = sortDir === "asc" ? nullAsc : nullDesc;
          leftValue = calcCurrentValue(left, leftQuote?.price) ?? sentinel;
          rightValue = calcCurrentValue(right, rightQuote?.price) ?? sentinel;
          break;
        }
        case "gl": {
          const sentinel = sortDir === "asc" ? nullAsc : nullDesc;
          leftValue = calcUnrealizedGL(left, leftQuote?.price) ?? sentinel;
          rightValue = calcUnrealizedGL(right, rightQuote?.price) ?? sentinel;
          break;
        }
      }

      if (typeof leftValue === "string" && typeof rightValue === "string") {
        return sortDir === "asc"
          ? leftValue.localeCompare(rightValue)
          : rightValue.localeCompare(leftValue);
      }

      return sortDir === "asc"
        ? Number(leftValue) - Number(rightValue)
        : Number(rightValue) - Number(leftValue);
    });
  }, [filtered, quotesMap, sortDir, sortKey]);

  const totalCostBasis = filtered.reduce((acc, holding) => acc + calcCostBasis(holding), 0);
  const totalDivCollected = filtered.reduce((acc, holding) => acc + holding.dividendCollected, 0);
  const totalExpIncome = filtered.reduce((acc, holding) => acc + holding.expectedIncome, 0);

  if (holdings.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center">
        <div className="text-muted-foreground text-sm">No holdings yet. Add your first position above.</div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border flex-wrap gap-y-2">
        <span className="text-xs font-semibold text-foreground mr-1">Container:</span>
        {(["ALL", ...ACTIVE_CONTAINERS] as ContainerFilter[]).map((container) => (
          <button
            key={container}
            onClick={() => setContainerFilter(container)}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              containerFilter === container
                ? container === "ALL"
                  ? "bg-primary text-primary-foreground"
                  : `${containerAccent(container).dim} ${containerAccent(container).text} border ${containerAccent(container).border}`
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            {container === "ALL" ? "ALL" : containerLabel(container)}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-4 text-[10px] text-muted-foreground num">
          <span>{filtered.length} position{filtered.length !== 1 ? "s" : ""}</span>
          <span>Cost basis: <span className="text-foreground">{fmtDollar(totalCostBasis)}</span></span>
          <span>Div collected: <span className="text-foreground">{fmtDollar(totalDivCollected)}</span></span>
          <span>Exp. income/yr: <span className="text-foreground">{fmtDollar(totalExpIncome)}</span></span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[1180px]">
          <thead>
            <tr className="border-b border-border/60 bg-muted/20">
              <SortHeader label="Container" sortKey="container" current={sortKey} dir={sortDir} onSort={handleSort} />
              <th className="px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">Parent</th>
              <SortHeader label="Ticker" sortKey="ticker" current={sortKey} dir={sortDir} onSort={handleSort} />
              <SortHeader label="Shares" sortKey="shares" current={sortKey} dir={sortDir} onSort={handleSort} />
              <SortHeader label="Entry Date" sortKey="entryDate" current={sortKey} dir={sortDir} onSort={handleSort} />
              <SortHeader label="Entry $" sortKey="entryPrice" current={sortKey} dir={sortDir} onSort={handleSort} />
              <SortHeader label="Current $" sortKey="currentPrice" current={sortKey} dir={sortDir} onSort={handleSort} />
              <SortHeader label="Value" sortKey="currentValue" current={sortKey} dir={sortDir} onSort={handleSort} />
              <SortHeader label="Cost Basis" sortKey="costBasis" current={sortKey} dir={sortDir} onSort={handleSort} />
              <SortHeader label="Unreal. G/L" sortKey="gl" current={sortKey} dir={sortDir} onSort={handleSort} />
              <SortHeader label="Div Collected" sortKey="dividendCollected" current={sortKey} dir={sortDir} onSort={handleSort} />
              <SortHeader label="Dip Date" sortKey="latestDipDate" current={sortKey} dir={sortDir} onSort={handleSort} />
              <SortHeader label="DRiP $" sortKey="dripAmount" current={sortKey} dir={sortDir} onSort={handleSort} />
              <SortHeader label="Exp. Income" sortKey="expectedIncome" current={sortKey} dir={sortDir} onSort={handleSort} />
              <SortHeader label="Notes" sortKey="notes" current={sortKey} dir={sortDir} onSort={handleSort} />
              <th className="px-2 py-2 w-14" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((holding) => {
              const quoteEntry = quotesMap.get(holding.ticker);
              return editingId === holding.id ? (
                <EditRow
                  key={holding.id}
                  holding={holding}
                  onSave={(patch) => handleSaveEdit(holding.id, patch)}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <HoldingRow
                  key={holding.id}
                  holding={holding}
                  quote={quoteEntry?.quote}
                  quoteLoading={quoteEntry?.loading ?? false}
                  onEdit={() => setEditingId(holding.id)}
                  onDelete={() => handleDelete(holding.id)}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
