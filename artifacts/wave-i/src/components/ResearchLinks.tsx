import { BLUE_LINKS, GREEN_LINKS, CATEGORY_COLORS, type ResearchLink } from "@/lib/research-links";
import { ExternalLink } from "lucide-react";

function LinkChip({ link }: { link: ResearchLink }) {
  const cls = CATEGORY_COLORS[link.category];
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium ${cls} hover:opacity-80 transition-opacity`}
    >
      {link.label}
      <ExternalLink size={10} />
    </a>
  );
}

function LinkGroup({ title, links, accentClass }: { title: string; links: ResearchLink[]; accentClass: string }) {
  const categories = [...new Set(links.map((l) => l.category))];

  return (
    <div>
      <div className={`text-xs font-bold uppercase tracking-widest mb-2 ${accentClass}`}>{title}</div>
      {categories.map((cat) => (
        <div key={cat} className="mb-2">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{cat}</div>
          <div className="flex flex-wrap gap-1.5">
            {links
              .filter((l) => l.category === cat)
              .map((l) => (
                <LinkChip key={l.label} link={l} />
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ResearchLinks() {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h2 className="text-sm font-semibold text-foreground mb-4">Research Links</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <LinkGroup title="Blue · ARCC" links={BLUE_LINKS} accentClass="text-blue" />
        <LinkGroup title="Green · AGNC" links={GREEN_LINKS} accentClass="text-green" />
      </div>
    </div>
  );
}
