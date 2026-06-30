type V = "teal"|"gold"|"silver"|"purple"|"cyan"|"red"|"gray";
const styles: Record<V, React.CSSProperties> = {
  teal:   { background:"var(--tealBg)",          border:"1px solid var(--tealBorder)",     color:"var(--teal)" },
  gold:   { background:"rgba(245,158,11,0.12)",  border:"1px solid rgba(245,158,11,0.3)",  color:"#b45309" },
  silver: { background:"rgba(148,163,184,0.12)", border:"1px solid rgba(148,163,184,0.25)",color:"#64748b" },
  purple: { background:"var(--accentBg)",        border:"1px solid rgba(91,79,245,0.3)",   color:"var(--accent)" },
  cyan:   { background:"rgba(6,182,212,0.12)",   border:"1px solid rgba(6,182,212,0.3)",   color:"#0891b2" },
  red:    { background:"rgba(239,68,68,0.10)",   border:"1px solid rgba(239,68,68,0.25)",  color:"#dc2626" },
  gray:   { background:"var(--bg3)",             border:"1px solid var(--border)",          color:"var(--muted)" },
};
export function Badge({ variant="gray", children }: { variant?: V; children: React.ReactNode }) {
  return (
    <span style={{ ...styles[variant],display:"inline-flex",alignItems:"center",gap:4,
      padding:"4px 10px",borderRadius:100,fontSize:11,fontWeight:700 }}>
      {children}
    </span>
  );
}
