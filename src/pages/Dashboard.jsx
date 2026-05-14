import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend
} from "recharts";

const categoryData = [
  { name: "Quality", score: 78, color: "#378ADD" },
  { name: "Pricing", score: 68, color: "#1D9E75" },
  { name: "Fulfillment", score: 74, color: "#639922" },
  { name: "Compliance", score: 71, color: "#D4537E" },
];

const tierData = [
  { name: "Gold", value: 6, color: "#EF9F27" },
  { name: "Silver", value: 10, color: "#888780" },
  { name: "Bronze", value: 8, color: "#D85A30" },
];

const topSuppliers = [
  { name: "PT Maju Jaya", tier: "Gold", score: 91, trend: +3.2 },
  { name: "CV Sumber Rezeki", tier: "Gold", score: 88, trend: +1.5 },
  { name: "PT Global Nusa", tier: "Silver", score: 76, trend: +4.0 },
  { name: "UD Karya Mandiri", tier: "Silver", score: 72, trend: -1.2 },
  { name: "PT Aneka Makmur", tier: "Bronze", score: 58, trend: +2.8 },
  { name: "CV Prima Sejahtera", tier: "Bronze", score: 53, trend: -0.5 },
];

const activity = [
  { color: "#EF9F27", title: "PT Maju Jaya → Gold", sub: "Tier upgraded · 2h ago" },
  { color: "#378ADD", title: "Score logged · CV Sinar", sub: "Q2 evaluation · 5h ago" },
  { color: "#D85A30", title: "UD Karya score dropped", sub: "Below threshold · 1d ago" },
  { color: "#1D9E75", title: "New supplier added", sub: "PT Bintang Mas · 2d ago" },
  { color: "#888780", title: "Compliance doc uploaded", sub: "CV Sumber Rezeki · 3d ago" },
];

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

export default function App() {
  const [activeNav, setActiveNav] = useState("Dashboard");

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
            <div style={{ fontSize: 12, color: "#999", marginTop: 3 }}>May 2026 · Q2 Overview</div>
          </div>
          <button style={{ background: "#1a1a1a", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>
            + Add Supplier
          </button>
        </div>

        {/* KPI Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 22 }}>
          {[
            { label: "Total Suppliers", value: "24", sub: "+2 this month", subColor: "#888" },
            { label: "Avg Score", value: "73.4", sub: "▲ +2.1 vs last month", subColor: "#1D9E75" },
            { label: "Gold Tier", value: "6", valueColor: "#BA7517", sub: "of 24 suppliers", subColor: "#888" },
            { label: "Need Review", value: "3", valueColor: "#C0392B", sub: "score below 50", subColor: "#888" },
          ].map(c => (
            <div key={c.label} style={{ background: "#fff", border: "1px solid #E8E7E3", borderRadius: 12, padding: "16px 18px" }}>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>{c.label}</div>
              <div style={{ fontSize: 26, fontWeight: 600, color: c.valueColor || "#1a1a1a", lineHeight: 1 }}>{c.value}</div>
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
            <div style={{ fontSize: 11, color: "#aaa", marginBottom: 10 }}>24 suppliers total</div>
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
          </div>
        </div>

        {/* Bottom Row */}
        <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 14 }}>
          {/* Top Performers */}
          <div style={{ background: "#fff", border: "1px solid #E8E7E3", borderRadius: 12, padding: "18px 20px" }}>
            <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 14 }}>Top performers</div>
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
                  <tr key={i} style={{ borderBottom: i < topSuppliers.length - 1 ? "1px solid #F5F4F0" : "none" }}>
                    <td style={{ padding: "9px 12px 9px 0", color: "#1a1a1a", fontWeight: 400 }}>{s.name}</td>
                    <td style={{ padding: "9px 12px 9px 0" }}>
                      <span style={{ background: tierBadge[s.tier].bg, color: tierBadge[s.tier].color, fontSize: 11, padding: "2px 8px", borderRadius: 6, fontWeight: 500 }}>
                        {s.tier}
                      </span>
                    </td>
                    <td style={{ padding: "9px 12px 9px 0", fontWeight: 500 }}>{s.score}</td>
                    <td style={{ padding: "9px 0", fontSize: 12, color: s.trend > 0 ? "#1D9E75" : "#C0392B", fontWeight: 500 }}>
                      {s.trend > 0 ? "▲" : "▼"} {Math.abs(s.trend).toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Activity */}
          <div style={{ background: "#fff", border: "1px solid #E8E7E3", borderRadius: 12, padding: "18px 20px" }}>
            <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 16 }}>Recent activity</div>
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
          </div>
        </div>
      </div>
    </div>
  );
}
