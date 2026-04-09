import { useState } from "react";
import { type Quote } from "@/lib/market";
import { fmtDollar, fmtPct, fmt } from "@/lib/utils";

interface CalcProps {
  blueQuote?: Quote;
  greenQuote?: Quote;
}

function numInput(value: string, onChange: (v: string) => void, placeholder: string) {
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-muted border border-border rounded px-2.5 py-1.5 text-sm num text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
    />
  );
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs num font-semibold text-foreground">{value}</span>
    </div>
  );
}

function YieldCalc({ blueQuote, greenQuote }: CalcProps) {
  const [shares, setShares] = useState("");
  const [divBlue, setDivBlue] = useState("0.48");
  const [divGreen, setDivGreen] = useState("0.12");

  const sharesN = parseFloat(shares) || 0;
  const divBlueN = parseFloat(divBlue) || 0;
  const divGreenN = parseFloat(divGreen) || 0;

  const blueAnn = sharesN * divBlueN * 4;
  const greenAnn = sharesN * divGreenN * 12;
  const totalAnn = blueAnn + greenAnn;

  const blueCostBasis = blueQuote?.price != null ? sharesN * blueQuote.price : null;
  const greenCostBasis = greenQuote?.price != null ? sharesN * greenQuote.price : null;

  const blueYield = blueCostBasis && blueCostBasis > 0 ? (blueAnn / blueCostBasis) * 100 : null;
  const greenYield = greenCostBasis && greenCostBasis > 0 ? (greenAnn / greenCostBasis) * 100 : null;

  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground mb-3">Yield Calculator</h3>
      <div className="grid grid-cols-1 gap-2 mb-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Shares (same qty for both)</label>
          {numInput(shares, setShares, "e.g. 100")}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-blue mb-1 block">BLUE quarterly div $</label>
            {numInput(divBlue, setDivBlue, "0.48")}
          </div>
          <div>
            <label className="text-xs text-green mb-1 block">GREEN monthly div $</label>
            {numInput(divGreen, setDivGreen, "0.12")}
          </div>
        </div>
      </div>
      {sharesN > 0 && (
        <div className="rounded bg-muted/40 border border-border/40 p-3 space-y-0">
          <ResultRow label="BLUE annual income" value={fmtDollar(blueAnn)} />
          <ResultRow label="BLUE yield on price" value={blueYield != null ? fmtPct(blueYield) : "—"} />
          <ResultRow label="GREEN annual income" value={fmtDollar(greenAnn)} />
          <ResultRow label="GREEN yield on price" value={greenYield != null ? fmtPct(greenYield) : "—"} />
          <ResultRow label="Combined annual" value={fmtDollar(totalAnn)} />
          <ResultRow label="Monthly avg" value={fmtDollar(totalAnn / 12)} />
        </div>
      )}
    </div>
  );
}

function DipCalc({ blueQuote, greenQuote }: CalcProps) {
  const [targetPct, setTargetPct] = useState("10");
  const [budget, setBudget] = useState("");

  const bluePrice = blueQuote?.price;
  const greenPrice = greenQuote?.price;
  const pct = parseFloat(targetPct) || 0;
  const budgetN = parseFloat(budget) || 0;

  const blueDip = bluePrice != null ? bluePrice * (1 - pct / 100) : null;
  const greenDip = greenPrice != null ? greenPrice * (1 - pct / 100) : null;

  const blueShares = blueDip && budgetN ? Math.floor(budgetN / blueDip) : null;
  const greenShares = greenDip && budgetN ? Math.floor(budgetN / greenDip) : null;

  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground mb-3">Dip Target Calculator</h3>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Dip % from current</label>
          {numInput(targetPct, setTargetPct, "10")}
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Buy budget $</label>
          {numInput(budget, setBudget, "1000")}
        </div>
      </div>
      <div className="rounded bg-muted/40 border border-border/40 p-3 space-y-0">
        <ResultRow label="BLUE current" value={fmtDollar(bluePrice)} />
        <ResultRow label="BLUE at -{targetPct}%" value={fmtDollar(blueDip)} />
        {blueShares != null && budgetN > 0 && <ResultRow label="BLUE shares for budget" value={fmt(blueShares, 0)} />}
        <ResultRow label="GREEN current" value={fmtDollar(greenPrice)} />
        <ResultRow label="GREEN at -{targetPct}%" value={fmtDollar(greenDip)} />
        {greenShares != null && budgetN > 0 && <ResultRow label="GREEN shares for budget" value={fmt(greenShares, 0)} />}
      </div>
    </div>
  );
}

function DRiPCalc({ blueQuote, greenQuote }: CalcProps) {
  const [blueShares, setBlueShares] = useState("");
  const [greenShares, setGreenShares] = useState("");
  const [divBlue, setDivBlue] = useState("0.48");
  const [divGreen, setDivGreen] = useState("0.12");
  const [months, setMonths] = useState("12");

  const bShares = parseFloat(blueShares) || 0;
  const gShares = parseFloat(greenShares) || 0;
  const divB = parseFloat(divBlue) || 0;
  const divG = parseFloat(divGreen) || 0;
  const mths = parseInt(months) || 12;

  const blueP = blueQuote?.price ?? 0;
  const greenP = greenQuote?.price ?? 0;

  let totalBlueShares = bShares;
  let totalGreenShares = gShares;
  let blueRein = 0;
  let greenRein = 0;

  for (let m = 0; m < mths; m++) {
    if (m % 3 === 2 && blueP > 0) {
      const div = totalBlueShares * divB;
      const newShares = div / blueP;
      totalBlueShares += newShares;
      blueRein += div;
    }
    if (greenP > 0) {
      const div = totalGreenShares * divG;
      const newShares = div / greenP;
      totalGreenShares += newShares;
      greenRein += div;
    }
  }

  const blueGain = totalBlueShares - bShares;
  const greenGain = totalGreenShares - gShares;

  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground mb-3">DRiP Reinvestment Projector</h3>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div>
          <label className="text-xs text-blue mb-1 block">BLUE shares</label>
          {numInput(blueShares, setBlueShares, "100")}
        </div>
        <div>
          <label className="text-xs text-green mb-1 block">GREEN shares</label>
          {numInput(greenShares, setGreenShares, "100")}
        </div>
        <div>
          <label className="text-xs text-blue mb-1 block">BLUE div/qtr $</label>
          {numInput(divBlue, setDivBlue, "0.48")}
        </div>
        <div>
          <label className="text-xs text-green mb-1 block">GREEN div/mo $</label>
          {numInput(divGreen, setDivGreen, "0.12")}
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Months</label>
          {numInput(months, setMonths, "12")}
        </div>
      </div>
      {(bShares > 0 || gShares > 0) && (
        <div className="rounded bg-muted/40 border border-border/40 p-3 space-y-0">
          <ResultRow label="BLUE shares gained" value={fmt(blueGain, 4)} />
          <ResultRow label="BLUE div reinvested" value={fmtDollar(blueRein)} />
          <ResultRow label="GREEN shares gained" value={fmt(greenGain, 4)} />
          <ResultRow label="GREEN div reinvested" value={fmtDollar(greenRein)} />
          <ResultRow label="Total div reinvested" value={fmtDollar(blueRein + greenRein)} />
        </div>
      )}
    </div>
  );
}

type CalcTab = "yield" | "dip" | "drip";

export default function Calculators({ blueQuote, greenQuote }: CalcProps) {
  const [tab, setTab] = useState<CalcTab>("yield");

  const tabs: { id: CalcTab; label: string }[] = [
    { id: "yield", label: "Yield" },
    { id: "dip", label: "Dip Target" },
    { id: "drip", label: "DRiP" },
  ];

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex gap-1 mb-4 border-b border-border pb-3">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              tab === t.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === "yield" && <YieldCalc blueQuote={blueQuote} greenQuote={greenQuote} />}
      {tab === "dip" && <DipCalc blueQuote={blueQuote} greenQuote={greenQuote} />}
      {tab === "drip" && <DRiPCalc blueQuote={blueQuote} greenQuote={greenQuote} />}
    </div>
  );
}
