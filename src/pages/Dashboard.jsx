import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend
} from "recharts";
import { supabase } from "../lib/supabase";

// ─── Static visual config (NOT data) ─────────────────────────────────────────
// These describe *how* to render, not *what* the values are. The values come
// from Supabase below.
const CATEGORY_META = [
  { key: "quality_score",     name: "Quality",     color: "#378ADD" },
  { key: "pricing_score",     name: "Pricing",     color: "#1D9E75" },
  { key: "fulfillment_score", name: "Fulfillment", color: "#639922" },
  { key: "compliance_score",  name: "Compliance",  color: "#D4537E" },
];

const TIER_COLOR = {
  Gold:   "#EF9F27",
  Silver: "#888780",
  Bronze: "#D85A30",
};

const tierBadge = {
  Gold:   { bg: "#FAEEDA", color: "#854F0B" },
  Silver: { bg: "#EDEDEB", color: "#5F5E5A" },
  Bronze: { bg: "#FAECE7", color: "#993C1D" },
};

const navItems = [
  { label: "Dashboard", active: true },
  { label: "Suppliers" },
  { label: "Performance" },
  { label: "Loyalty" },
  { label: "Reports" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function avg(nums) {
  const valid = nums.filter(n => typeof n === "number" && !Number.isNaN(n));
  if (!valid.length) return 0;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

function timeAgo(iso) {
  if (!iso) return "";
  const ms = Date.now() - new Date(iso).getTime();
  const s = Math.max(0, Math.floor(ms / 1000));
  if (s < 60)    return `${s}s ago`;
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function periodLabel() {
  const d = new Date();
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const q = Math.floor(d.getMonth() / 3) + 1;
  return `${months[d.getMonth()]} ${d.getFullYear()} · Q${q} Overview`;
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function App() {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [suppliers, setSuppliers] = useState([]);
  const [events,    setEvents]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      // Pull suppliers (select * so the page survives schema additions like
      // per-category score columns without needing a code change).
      const supRes = await supabase.from("suppliers").select("*");

      // Pull the latest tier events for the activity feed. If the table
      // doesn't exist yet, we just render an empty feed.
      const evRes = await supabase
        .from("tier_events")
        .select("supplier_id, from_tier, to_tier, trigger_type, reason, created_at")
        .order("created_at", { ascending: false })
        .limit(8);

      if (cancelled) return;

      if (supRes.error) setError(supRes.error.message);
      setSuppliers(supRes.data || []);
      setEvents(evRes.error ? [] : (evRes.data || []));
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, []);

  // ── Derived data ──────────────────────────────────────────────────────────
  const total       = suppliers.length;
  const allScores   = suppliers.map(s => Number(s.score)).filter(n => !Number.isNaN(n));
  const avgScore    = avg(allScores);
  const goldCount   = suppliers.filter(s => s.tier === "Gold").length;
  const silverCount = suppliers.filter(s => s.tier === "Silver").length;
  const bronzeCount = suppliers.filter(s => s.tier === "Bronze").length;
  const needReview  = suppliers.filter(s => Number(s.score) < 50).length;

  const categoryData = CATEGORY_META.map(c => ({
    name:  c.name,
    score: Math.round(avg(suppliers.map(s => Number(s[c.key])))),
    color: c.color,
  }));

  const tierData = [
    { name: "Gold",   value: goldCount,   color: TIER_COLOR.Gold   },
    { name: "Silver", value: silverCount, color: TIER_COLOR.Silver },
    { name: "Bronze", value: bronzeCount, color: TIER_COLOR.Bronze },
  ].filter(d => d.value > 0);

  const topSuppliers = [...suppliers]
    .sort((a, b) => (Number(b.score) || 0) - (Number(a.score) || 0))
    .slice(0, 6)
    .map(s => ({
      id:    s.id,
      name:  s.company_name || s.name || "—",
      tier:  s.tier || "Bronze",
      score: Number(s.score) || 0,
      // Trend requires a score-history table; default to 0 until that exists.
      trend: Number(s.score_trend) || 0,
    }));

  const nameById = (id) => {
    const s = suppliers.find(x => x.id === id);
    return s ? (s.company_name || s.name || "Supplier") : "Supplier";
  };

  const activity = events.map(e => ({
    color: e.trigger_type === "quality" ? "#D85A30"
         : e.trigger_type === "weekly"  ? "#EF9F27"
         :                                "#378ADD",
    title: `${nameById(e.supplier_id)} → ${e.to_tier}`,
    sub:   `${e.reason || "Tier change"} · ${timeAgo(e.created_at)}`,
  }));

  const kpiCards = [
    { label: "Total Suppliers", value: String(total),
      sub: total ? `${goldCount} Gold · ${silverCount} Silver · ${bronzeCount} Bronze` : "No suppliers yet",
      subColor: "#888" },
    { label: "Avg Score", value: avgScore ? avgScore.toFixed(1) : "—",
      sub: avgScore ? "across all suppliers" : "no scores yet",
      subColor: "#888" },
    { label: "Gold Tier", value: String(goldCount), valueColor: "#BA7517",
      sub: total ? `of ${total} suppliers` : "—",
      subColor: "#888" },
    { label: "Need Review", value: String(needReview), valueColor: needReview ? "#C0392B" : "#1a1a1a",
      sub: "score below 50",
      subColor: "#888" },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "system-ui, sans-serif", fontSize: 14, background: "#F8F7F4" }}>
      {/* Sidebar */}
      <div style={{ width: 200, background: "#F1F0EC", borderRight: "1px solid #E0DFD9", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "20px 18px 16px", borderBottom: "1px solid #E0DFD9" }}>
          <div style={{ fontWeight: 600, fontSize: 15, color: "#1a1a1a" }}>SupplierIQ</div>
          <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>Loyalty & Performance</div>
        </div>
        <nav style={{ padding: "8px 0", flex: 1 }}>
          {navItems.map(n => (
            <div
              key={n.label}
              onClick={() => setActiveNav(n.label)}
              style={{
                padding: "9px 18px",
                fontSize: 13,
                cursor: "pointer",
                color: activeNav === n.label ? "#1a1a1a" : "#666",
                fontWeight: activeNav === n.label ? 500 : 400,
                background: activeNav === n.label ? "#fff" : "transparent",
                borderRight: activeNav === n.label ? "2px solid #EF9F27" : "2px solid transparent",
                transition: "all 0.15s",
              }}
            >
              {n.label}
            </div>
          ))}
        </nav>
        <div style={{ padding: "12px 18px", borderTop: "1px solid #E0DFD9", fontSize: 12, color: "#999" }}>
          Settings
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, padding: "24px 28px", overflow: "auto" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 600, color: "#1a1a1a" }}>Dashboard</div>
            <div style={{ fontSize: 12, color: "#999", marginTop: 3 }}>
              {loading ? "Loading…" : periodLabel()}
            </div>
          </div>
          <button
            onClick={() => navigate("/register")}
            style={{ background: "#1a1a1a", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, cursor: "pointer", fontWeight: 500 }}
          >
            + Add Supplier
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div style={{ background: "#FAECE7", border: "1px solid #F5C4B3", color: "#993C1D", padding: "10px 14px", borderRadius: 8, fontSize: 12, marginBottom: 16 }}>
            Could not load suppliers: {error}
          </div>
        )}

        {/* KPI Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 22 }}>
          {kpiCards.map(c => (
            <div key={c.label} style={{ background: "#fff", border: "1px solid #E8E7E3", borderRadius: 12, padding: "16px 18px" }}>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>{c.label}</div>
              <div style={{ fontSize: 26, fontWeight: 600, color: c.valueColor || "#1a1a1a", lineHeight: 1 }}>
                {loading ? "…" : c.value}
              </div>
              <div style={{ fontSize: 11, color: c.subColor, marginTop: 6 }}>{c.sub}</div>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 14, marginBottom: 22 }}>
          {/* Bar Chart */}
          <div style={{ background: "#fff", border: "1px solid #E8E7E3", borderRadius: 12, padding: "18px 20px" }}>
            <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 4 }}>Avg score by category</div>
            <div style={{ fontSize: 11, color: "#aaa", marginBottom: 14 }}>Current quarter · out of 100</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={categoryData} barSize={36}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#999" }} />
                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#bbb" }} tickCount={5} />
                <Tooltip
                  formatter={(v) => [`${v} / 100`, "Score"]}
                  contentStyle={{ borderRadius: 8, border: "1px solid #eee", fontSize: 12 }}
                />
                <Bar dataKey="score" radius={[5, 5, 0, 0]}>
                  {categoryData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Donut Chart */}
          <div style={{ background: "#fff", border: "1px solid #E8E7E3", borderRadius: 12, padding: "18px 20px" }}>
            <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 4 }}>Tier distribution</div>
            <div style={{ fontSize: 11, color: "#aaa", marginBottom: 10 }}>
              {total ? `${total} supplier${total === 1 ? "" : "s"} total` : "No suppliers"}
            </div>
            {tierData.length === 0 ? (
              <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center", color: "#CCC", fontSize: 12 }}>
                No data
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={tierData}
                    cx="50%" cy="50%"
                    innerRadius={50} outerRadius={72}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {tierData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Legend
                    formatter={(v, e) => (
                      <span style={{ fontSize: 12, color: "#555" }}>{v}: {e.payload.value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Bottom Row */}
        <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 14 }}>
          {/* Top Performers */}
          <div style={{ background: "#fff", border: "1px solid #E8E7E3", borderRadius: 12, padding: "18px 20px" }}>
            <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 14 }}>Top performers</div>
            {topSuppliers.length === 0 ? (
              <div style={{ padding: "20px 0", textAlign: "center", color: "#CCC", fontSize: 12 }}>
                {loading ? "Loading…" : "No suppliers yet"}
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #F0EFEB" }}>
                    {["Supplier", "Tier", "Score", "Trend"].map(h => (
                      <th key={h} style={{ textAlign: "left", fontWeight: 500, fontSize: 11, color: "#aaa", paddingBottom: 8, paddingRight: 12 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {topSuppliers.map((s, i) => (
                    <tr key={s.id || i} style={{ borderBottom: i < topSuppliers.length - 1 ? "1px solid #F5F4F0" : "none" }}>
                      <td style={{ padding: "9px 12px 9px 0", color: "#1a1a1a", fontWeight: 400 }}>{s.name}</td>
                      <td style={{ padding: "9px 12px 9px 0" }}>
                        <span style={{
                          background: (tierBadge[s.tier] || tierBadge.Bronze).bg,
                          color:      (tierBadge[s.tier] || tierBadge.Bronze).color,
                          fontSize: 11, padding: "2px 8px", borderRadius: 6, fontWeight: 500,
                        }}>
                          {s.tier}
                        </span>
                      </td>
                      <td style={{ padding: "9px 12px 9px 0", fontWeight: 500 }}>{s.score}</td>
                      <td style={{ padding: "9px 0", fontSize: 12, color: s.trend > 0 ? "#1D9E75" : s.trend < 0 ? "#C0392B" : "#BBB", fontWeight: 500 }}>
                        {s.trend === 0 ? "—" : `${s.trend > 0 ? "▲" : "▼"} ${Math.abs(s.trend).toFixed(1)}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Activity */}
          <div style={{ background: "#fff", border: "1px solid #E8E7E3", borderRadius: 12, padding: "18px 20px" }}>
            <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 16 }}>Recent activity</div>
            {activity.length === 0 ? (
              <div style={{ padding: "12px 0", color: "#CCC", fontSize: 12 }}>
                {loading ? "Loading…" : "No recent activity"}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {activity.map((a, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: a.color, marginTop: 4, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 12, color: "#1a1a1a", fontWeight: 400 }}>{a.title}</div>
                      <div style={{ fontSize: 11, color: "#bbb", marginTop: 2 }}>{a.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
