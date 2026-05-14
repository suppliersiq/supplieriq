import { useState, useCallback } from "react";

// ─── Tier constants ───────────────────────────────────────────────────────────
const TIER_RANK = { Bronze: 0, Silver: 1, Gold: 2 };
const RANK_TIER = { 0: "Bronze", 1: "Silver", 2: "Gold" };
const TIER_META = {
  Gold:   { bg: "#FAEEDA", fg: "#854F0B", border: "#FAC775", emoji: "🥇" },
  Silver: { bg: "#EDEDEB", fg: "#5F5E5A", border: "#D3D1C7", emoji: "🥈" },
  Bronze: { bg: "#FAECE7", fg: "#993C1D", border: "#F5C4B3", emoji: "🥉" },
};

// ─── Pure engine functions ────────────────────────────────────────────────────
function tierDown(currentTier, reason) {
  const newRank = Math.max(0, TIER_RANK[currentTier] - 1);
  const newTier = RANK_TIER[newRank];
  return { tier: newTier, changed: newTier !== currentTier, direction: "down", reason };
}

function tierUp(currentTier, reason) {
  const newRank = Math.min(2, TIER_RANK[currentTier] + 1);
  const newTier = RANK_TIER[newRank];
  return { tier: newTier, changed: newTier !== currentTier, direction: "up", reason };
}

// TRIGGER 1 — called after every delivery form submission
function evaluateDeliveryQuality(currentTier, deductionPoints, threshold) {
  if (deductionPoints > threshold) {
    return tierDown(currentTier, `Deduction ${deductionPoints} pts exceeded threshold of ${threshold} pts`);
  }
  return { tier: currentTier, changed: false, direction: null, reason: `Quality OK — ${deductionPoints} of ${threshold} pts` };
}

// TRIGGER 2 — called at every weekly rollover (Sunday night)
function evaluateWeeklyTarget(currentTier, deliveriesThisWeek, weeklyTarget, wasDowngradedLastWeek) {
  const met = deliveriesThisWeek >= weeklyTarget;
  if (!met) {
    const result = tierDown(currentTier, `Missed weekly target: ${deliveriesThisWeek} of ${weeklyTarget} deliveries`);
    return { ...result, newDowngradedFlag: true };
  }
  if (wasDowngradedLastWeek) {
    const result = tierUp(currentTier, `Recovered weekly target: ${deliveriesThisWeek} of ${weeklyTarget} deliveries`);
    return { ...result, newDowngradedFlag: false };
  }
  return { tier: currentTier, changed: false, direction: null, reason: `Target met (${deliveriesThisWeek}/${weeklyTarget}) — tier maintained`, newDowngradedFlag: false };
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const INIT_SUPPLIERS = [
  { id: "A", name: "PT Maju Jaya",       tier: "Gold",   weeklyDeliveries: 0, wasDowngradedLastWeek: false },
  { id: "B", name: "CV Sumber Rezeki",   tier: "Gold",   weeklyDeliveries: 0, wasDowngradedLastWeek: false },
  { id: "C", name: "PT Global Nusa",     tier: "Silver", weeklyDeliveries: 0, wasDowngradedLastWeek: false },
  { id: "D", name: "UD Karya Mandiri",   tier: "Silver", weeklyDeliveries: 0, wasDowngradedLastWeek: false },
  { id: "E", name: "PT Aneka Makmur",    tier: "Bronze", weeklyDeliveries: 0, wasDowngradedLastWeek: false },
];

const INIT_RULES = { qualityThreshold: 20, weeklyTarget: 4 };

function nowStr() {
  return new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

// ─── TierBadge ────────────────────────────────────────────────────────────────
function TierBadge({ tier, size }) {
  const tm = TIER_META[tier] || TIER_META.Bronze;
  return (
    <span style={{
      fontSize: size === "sm" ? 11 : 13,
      padding: size === "sm" ? "2px 7px" : "3px 10px",
      borderRadius: 6, background: tm.bg, color: tm.fg, fontWeight: 700,
      display: "inline-flex", alignItems: "center", gap: 4,
    }}>
      {tm.emoji} {tier}
    </span>
  );
}

// ─── TierArrow ────────────────────────────────────────────────────────────────
function TierArrow({ from, to }) {
  if (from === to) return <span style={{ fontSize: 12, color: "#BBB" }}>no change</span>;
  const up = TIER_RANK[to] > TIER_RANK[from];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <TierBadge tier={from} size="sm" />
      <span style={{ fontSize: 14, color: up ? "#3B6D11" : "#C0392B", fontWeight: 700 }}>{up ? "▲" : "▼"}</span>
      <TierBadge tier={to} size="sm" />
    </span>
  );
}

// ─── LogEntry ─────────────────────────────────────────────────────────────────
function LogEntry({ entry }) {
  const up   = entry.direction === "up";
  const down = entry.direction === "down";
  const dotColor = up ? "#3B6D11" : down ? "#C0392B" : "#CCC";
  return (
    <div style={{ display: "flex", gap: 10, padding: "10px 14px", borderBottom: "1px solid #F5F4F0", alignItems: "flex-start" }}>
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: dotColor, flexShrink: 0, marginTop: 5 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#1a1a1a" }}>{entry.supplier}</span>
          <TierArrow from={entry.from} to={entry.to} />
          <span style={{ marginLeft: "auto", fontSize: 10, color: "#BBB", flexShrink: 0 }}>{entry.time}</span>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{
            fontSize: 10, padding: "2px 7px", borderRadius: 4, fontWeight: 600,
            background: entry.trigger === "quality" ? "#FAECE7" : "#E6F1FB",
            color: entry.trigger === "quality" ? "#993C1D" : "#185FA5",
          }}>
            {entry.trigger === "quality" ? "⭐ Quality" : "📅 Weekly"}
          </span>
          <span style={{ fontSize: 11, color: "#666" }}>{entry.reason}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Rules panel ─────────────────────────────────────────────────────────────
function RulesPanel({ rules, onChange }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #E8E7E3", borderRadius: 12, padding: "18px 20px", marginBottom: 14 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", marginBottom: 3 }}>Engine Rules</div>
      <div style={{ fontSize: 12, color: "#AAA", marginBottom: 16 }}>Adjust thresholds — simulator reacts immediately.</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
        {/* Quality threshold */}
        <div style={{ background: "#FAECE7", border: "1px solid #F5C4B3", borderRadius: 10, padding: "14px 16px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#993C1D", marginBottom: 2 }}>⭐ QUALITY DEDUCTION THRESHOLD</div>
          <div style={{ fontSize: 11, color: "#993C1D", opacity: 0.7, marginBottom: 12, lineHeight: 1.5 }}>
            If deduction points on a delivery exceed this → downgrade 1 tier
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <input type="range" min={5} max={50} step={1} value={rules.qualityThreshold}
                onChange={e => onChange({ ...rules, qualityThreshold: Number(e.target.value) })}
                style={{ width: "100%" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#F5C4B3", marginTop: 2 }}>
                <span>5</span><span>50</span>
              </div>
            </div>
            <div style={{ textAlign: "center", minWidth: 52, background: "#fff", borderRadius: 8, padding: "8px 10px" }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#993C1D" }}>{rules.qualityThreshold}</div>
              <div style={{ fontSize: 9, color: "#993C1D", opacity: 0.6 }}>pts max</div>
            </div>
          </div>
        </div>

        {/* Weekly target */}
        <div style={{ background: "#E6F1FB", border: "1px solid #B5D4F4", borderRadius: 10, padding: "14px 16px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#185FA5", marginBottom: 2 }}>📅 WEEKLY DELIVERY TARGET</div>
          <div style={{ fontSize: 11, color: "#185FA5", opacity: 0.7, marginBottom: 12, lineHeight: 1.5 }}>
            Global default. Miss → down 1. Recover following week → up 1.
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <input type="range" min={1} max={20} step={1} value={rules.weeklyTarget}
                onChange={e => onChange({ ...rules, weeklyTarget: Number(e.target.value) })}
                style={{ width: "100%" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#B5D4F4", marginTop: 2 }}>
                <span>1</span><span>20</span>
              </div>
            </div>
            <div style={{ textAlign: "center", minWidth: 52, background: "#fff", borderRadius: 8, padding: "8px 10px" }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#185FA5" }}>{rules.weeklyTarget}</div>
              <div style={{ fontSize: 9, color: "#185FA5", opacity: 0.6 }}>/ week</div>
            </div>
          </div>
        </div>
      </div>

      {/* Logic summary */}
      <div style={{ background: "#F8F7F4", borderRadius: 10, padding: "12px 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#555", marginBottom: 8 }}>⭐ Quality flow</div>
          {[
            { cond: `Deduction > ${rules.qualityThreshold} pts`, action: "Downgrade 1 tier", color: "#C0392B", arrow: "▼" },
            { cond: `Deduction ≤ ${rules.qualityThreshold} pts`, action: "No tier change",   color: "#3B6D11", arrow: "✓" },
          ].map(r => (
            <div key={r.cond} style={{ display: "flex", gap: 7, marginBottom: 5, alignItems: "flex-start" }}>
              <span style={{ fontSize: 11, color: r.color, fontWeight: 700, flexShrink: 0 }}>{r.arrow}</span>
              <span style={{ fontSize: 11, color: "#555", lineHeight: 1.4 }}><strong>{r.cond}</strong> → {r.action}</span>
            </div>
          ))}
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#555", marginBottom: 8 }}>📅 Weekly flow</div>
          {[
            { cond: `< ${rules.weeklyTarget} deliveries`,                 action: "Downgrade 1 tier (floor: Bronze)", color: "#C0392B", arrow: "▼" },
            { cond: `≥ ${rules.weeklyTarget} AND was downgraded last wk`, action: "Upgrade 1 tier (ceil: Gold)",       color: "#3B6D11", arrow: "▲" },
            { cond: `≥ ${rules.weeklyTarget} AND not downgraded`,         action: "No change — tier maintained",       color: "#BBB",    arrow: "—" },
          ].map(r => (
            <div key={r.cond} style={{ display: "flex", gap: 7, marginBottom: 5, alignItems: "flex-start" }}>
              <span style={{ fontSize: 11, color: r.color, fontWeight: 700, flexShrink: 0 }}>{r.arrow}</span>
              <span style={{ fontSize: 11, color: "#555", lineHeight: 1.4 }}><strong>{r.cond}</strong> → {r.action}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Supplier simulator row ───────────────────────────────────────────────────
function SupplierRow({ supplier, rules, onDelivery, onWeeklyCheck }) {
  const [deduction,   setDeduction]  = useState(0);
  const [deliveries,  setDeliveries] = useState(0);
  const tm = TIER_META[supplier.tier] || TIER_META.Bronze;

  const qWillDowngrade = deduction > rules.qualityThreshold;
  const wMet           = deliveries >= rules.weeklyTarget;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "190px 1fr 1fr", borderBottom: "1px solid #F0EFEB" }}>
      {/* Supplier info */}
      <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: tm.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: tm.fg }}>
            {supplier.name.split(" ").map(w => w[0]).slice(0, 2).join("")}
          </span>
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: "#1a1a1a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{supplier.name}</div>
          <div style={{ marginTop: 3 }}><TierBadge tier={supplier.tier} size="sm" /></div>
          {supplier.wasDowngradedLastWeek && (
            <div style={{ fontSize: 10, color: "#C0392B", marginTop: 2 }}>↓ downgraded last wk</div>
          )}
        </div>
      </div>

      {/* Quality column */}
      <div style={{ padding: "14px 14px", borderLeft: "1px solid #F8F7F4" }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: "#AAA", marginBottom: 8 }}>
          DEDUCTION POINTS
          <span style={{ marginLeft: 6, color: qWillDowngrade ? "#C0392B" : "#3B6D11", fontWeight: 700 }}>
            {qWillDowngrade ? "⚠ WILL DOWNGRADE" : "✓ OK"}
          </span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
          <input type="range" min={0} max={50} step={1} value={deduction}
            onChange={e => setDeduction(Number(e.target.value))} style={{ flex: 1 }} />
          <div style={{ minWidth: 52, textAlign: "center", background: qWillDowngrade ? "#FAECE7" : "#EAF3DE", borderRadius: 7, padding: "5px 8px" }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: qWillDowngrade ? "#C0392B" : "#3B6D11" }}>{deduction}</span>
            <span style={{ fontSize: 10, color: "#AAA" }}>/{rules.qualityThreshold}</span>
          </div>
        </div>
        <button onClick={() => onDelivery(supplier.id, deduction)}
          style={{ width: "100%", background: "#1a1a1a", color: "#fff", border: "none", borderRadius: 7, padding: "8px", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
          Submit Delivery →
        </button>
      </div>

      {/* Weekly column */}
      <div style={{ padding: "14px 14px", borderLeft: "1px solid #F8F7F4" }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: "#AAA", marginBottom: 8 }}>
          WEEKLY DELIVERIES
          <span style={{ marginLeft: 6, color: wMet ? "#3B6D11" : "#C0392B", fontWeight: 700 }}>
            {wMet ? "✓ TARGET MET" : "✗ BELOW TARGET"}
          </span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <button onClick={() => setDeliveries(d => Math.max(0, d - 1))}
              style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #E0DFD9", background: "#fff", cursor: "pointer", fontSize: 16, color: "#888", lineHeight: 1 }}>−</button>
            <div style={{ width: 44, textAlign: "center", fontSize: 16, fontWeight: 800, color: wMet ? "#3B6D11" : "#C0392B" }}>{deliveries}</div>
            <button onClick={() => setDeliveries(d => d + 1)}
              style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #E0DFD9", background: "#fff", cursor: "pointer", fontSize: 16, color: "#888", lineHeight: 1 }}>+</button>
          </div>
          <div style={{ fontSize: 12, color: "#AAA" }}>target: <strong style={{ color: "#555" }}>{rules.weeklyTarget}</strong></div>
        </div>
        <button onClick={() => onWeeklyCheck(supplier.id, deliveries)}
          style={{ width: "100%", background: "#185FA5", color: "#fff", border: "none", borderRadius: 7, padding: "8px", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
          Run Week-End Check →
        </button>
      </div>
    </div>
  );
}

// ─── Integration snippets ─────────────────────────────────────────────────────
const SNIPPETS = {
  delivery: `// DeliveryForm.jsx — call after form submit
// 1. Add "Quality Deduction" number field to the form
// 2. After saving delivery, run this:

const result = evaluateDeliveryQuality(
  supplier.tier,
  Number(formData.qualityDeduction),  // from new field
  rules.qualityThreshold               // from settings
);

if (result.changed) {
  // Update supplier tier in DB
  await supabase
    .from("suppliers")
    .update({ tier: result.tier })
    .eq("id", supplier.id);

  // Log the tier event
  await supabase.from("tier_events").insert({
    supplier_id:  supplier.id,
    from_tier:    supplier.tier,
    to_tier:      result.tier,
    trigger_type: "quality",
    reason:       result.reason,
  });
}`,

  weekly: `// BackOfficeTargets.jsx — "Run Week-End Check" button
// Also add weekly_target text field per supplier

const result = evaluateWeeklyTarget(
  supplier.tier,
  supplier.weeklyDeliveries,        // count from DB
  supplier.weeklyTarget,            // per-supplier field
  supplier.wasDowngradedLastWeek    // boolean flag in DB
);

if (result.changed) {
  await supabase.from("suppliers").update({
    tier: result.tier
  }).eq("id", supplier.id);
}

// Always update the flag + reset counter
await supabase.from("suppliers").update({
  was_downgraded_last_week: result.newDowngradedFlag,
  weekly_deliveries: 0,
}).eq("id", supplier.id);`,

  database: `-- New columns needed in 'suppliers' table:
ALTER TABLE suppliers
  ADD COLUMN weekly_target           INT     DEFAULT 4,
  ADD COLUMN weekly_deliveries       INT     DEFAULT 0,
  ADD COLUMN was_downgraded_last_week BOOLEAN DEFAULT FALSE,
  ADD COLUMN tier_updated_at         TIMESTAMPTZ;

-- New table for tier event history:
CREATE TABLE tier_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id  UUID REFERENCES suppliers(id),
  from_tier    TEXT,
  to_tier      TEXT,
  trigger_type TEXT,   -- 'quality' | 'weekly'
  reason       TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- New column in 'deliveries' table:
ALTER TABLE deliveries
  ADD COLUMN quality_deduction INT DEFAULT 0;

-- New table for engine rules (configurable per org):
CREATE TABLE tier_rules (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quality_threshold   INT DEFAULT 20,
  weekly_target       INT DEFAULT 4,
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);`,
};

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [suppliers, setSuppliers] = useState(INIT_SUPPLIERS);
  const [rules,     setRules]     = useState(INIT_RULES);
  const [log,       setLog]       = useState([]);
  const [tab,       setTab]       = useState("simulator");
  const [snippet,   setSnippet]   = useState("delivery");

  const pushLog = useCallback((entry) => {
    setLog(prev => [entry, ...prev.slice(0, 49)]);
  }, []);

  const handleDelivery = useCallback((supplierId, deductionPoints) => {
    setSuppliers(prev => prev.map(s => {
      if (s.id !== supplierId) return s;
      const result = evaluateDeliveryQuality(s.tier, deductionPoints, rules.qualityThreshold);
      pushLog({ supplier: s.name, from: s.tier, to: result.tier, changed: result.changed, direction: result.direction, reason: result.reason, trigger: "quality", time: nowStr() });
      return { ...s, tier: result.tier };
    }));
  }, [rules, pushLog]);

  const handleWeeklyCheck = useCallback((supplierId, deliveriesThisWeek) => {
    setSuppliers(prev => prev.map(s => {
      if (s.id !== supplierId) return s;
      const result = evaluateWeeklyTarget(s.tier, deliveriesThisWeek, rules.weeklyTarget, s.wasDowngradedLastWeek);
      pushLog({ supplier: s.name, from: s.tier, to: result.tier, changed: result.changed, direction: result.direction, reason: result.reason, trigger: "weekly", time: nowStr() });
      return { ...s, tier: result.tier, wasDowngradedLastWeek: result.newDowngradedFlag, weeklyDeliveries: 0 };
    }));
  }, [rules, pushLog]);

  return (
    <div style={{ minHeight: "100vh", background: "#F8F7F4", fontFamily: "system-ui, sans-serif" }}>

      {/* Top bar */}
      <div style={{ background: "#fff", borderBottom: "1px solid #E8E7E3", padding: "12px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 30, height: 30, borderRadius: 7, background: "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="1" width="6" height="6" rx="1" fill="#fff" opacity="0.9"/>
              <rect x="9" y="1" width="6" height="6" rx="1" fill="#fff" opacity="0.4"/>
              <rect x="1" y="9" width="6" height="6" rx="1" fill="#fff" opacity="0.4"/>
              <rect x="9" y="9" width="6" height="6" rx="1" fill="#fff" opacity="0.4"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a", lineHeight: 1 }}>SupplierIQ — Tier Engine</div>
            <div style={{ fontSize: 11, color: "#AAA", marginTop: 1 }}>Automated tier management · Quality + Weekly triggers</div>
          </div>
        </div>
        <button onClick={() => { setSuppliers(INIT_SUPPLIERS); setLog([]); }}
          style={{ background: "transparent", color: "#888", border: "1px solid #E0DFD9", borderRadius: 8, padding: "7px 14px", fontSize: 12, cursor: "pointer" }}>
          ↺ Reset
        </button>
      </div>

      {/* Tabs */}
      <div style={{ background: "#fff", borderBottom: "1px solid #E8E7E3", padding: "0 24px", display: "flex", gap: 2 }}>
        {[
          { id: "simulator",   label: "⚡ Simulator"        },
          { id: "integration", label: "🔗 Integration Code" },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ background: "transparent", border: "none", cursor: "pointer", padding: "12px 16px", fontSize: 13, fontWeight: tab === t.id ? 600 : 400, color: tab === t.id ? "#1a1a1a" : "#888", borderBottom: tab === t.id ? "2px solid #1a1a1a" : "2px solid transparent" }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "24px 24px" }}>

        {/* ── SIMULATOR TAB ── */}
        {tab === "simulator" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 18 }}>
            <div>
              <RulesPanel rules={rules} onChange={setRules} />

              {/* Simulator table */}
              <div style={{ background: "#fff", border: "1px solid #E8E7E3", borderRadius: 12, overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "190px 1fr 1fr", background: "#FAFAF8", borderBottom: "1px solid #F0EFEB" }}>
                  {[
                    { label: "Supplier",                        sub: ""                                    },
                    { label: "⭐ Quality Deduction Trigger",    sub: "Per delivery — fires immediately"    },
                    { label: "📅 Weekly Target Trigger",        sub: "Fires at week-end rollover"          },
                  ].map((h, i) => (
                    <div key={i} style={{ padding: "10px 16px", borderLeft: i > 0 ? "1px solid #F0EFEB" : "none" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#555" }}>{h.label}</div>
                      {h.sub && <div style={{ fontSize: 10, color: "#BBB", marginTop: 1 }}>{h.sub}</div>}
                    </div>
                  ))}
                </div>
                {suppliers.map(s => (
                  <SupplierRow key={s.id} supplier={s} rules={rules} onDelivery={handleDelivery} onWeeklyCheck={handleWeeklyCheck} />
                ))}
              </div>

              {/* Tier state summary */}
              <div style={{ background: "#fff", border: "1px solid #E8E7E3", borderRadius: 12, padding: "16px 18px", marginTop: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#AAA", letterSpacing: 0.4, marginBottom: 12 }}>CURRENT TIER STATE</div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {suppliers.map(s => {
                    const tm = TIER_META[s.tier] || TIER_META.Bronze;
                    return (
                      <div key={s.id} style={{ background: tm.bg, border: `1px solid ${tm.border}`, borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: tm.fg }}>{s.name.split(" ").map(w => w[0]).slice(0, 2).join("")}</span>
                        </div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 500, color: tm.fg }}>{s.name.split(" ")[0]} {s.name.split(" ")[1]}</div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: tm.fg }}>{tm.emoji} {s.tier}</div>
                          {s.wasDowngradedLastWeek && <div style={{ fontSize: 10, color: tm.fg, opacity: 0.6 }}>↓ downgraded last wk</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Event log */}
            <div style={{ position: "sticky", top: 20 }}>
              <div style={{ background: "#fff", border: "1px solid #E8E7E3", borderRadius: 12, overflow: "hidden" }}>
                <div style={{ padding: "12px 16px", borderBottom: "1px solid #F0EFEB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a" }}>Event Log</span>
                  <span style={{ fontSize: 11, color: "#AAA" }}>{log.length} events</span>
                </div>
                <div style={{ maxHeight: 540, overflowY: "auto" }}>
                  {log.length === 0
                    ? <div style={{ padding: "32px 16px", textAlign: "center", fontSize: 12, color: "#CCC" }}>No events yet — use the simulator above</div>
                    : log.map((e, i) => <LogEntry key={i} entry={e} />)
                  }
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── INTEGRATION TAB ── */}
        {tab === "integration" && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#1a1a1a", marginBottom: 4 }}>Wiring the engine into existing screens</div>
              <div style={{ fontSize: 13, color: "#888", lineHeight: 1.6 }}>
                The two engine functions are pure — they take inputs and return a result object. Drop them into the relevant files and call them at the right moment.
              </div>
            </div>

            {/* Snippet selector */}
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              {[
                { id: "delivery",  label: "DeliveryForm.jsx",      bg: "#FAECE7", fg: "#993C1D" },
                { id: "weekly",    label: "BackOfficeTargets.jsx",  bg: "#E6F1FB", fg: "#185FA5" },
                { id: "database",  label: "Supabase schema",        bg: "#EAF3DE", fg: "#3B6D11" },
              ].map(s => (
                <button key={s.id} onClick={() => setSnippet(s.id)}
                  style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${snippet === s.id ? s.fg : "#E0DFD9"}`, background: snippet === s.id ? s.bg : "#fff", color: snippet === s.id ? s.fg : "#888", fontSize: 12, cursor: "pointer", fontWeight: snippet === s.id ? 700 : 400 }}>
                  {s.label}
                </button>
              ))}
            </div>

            <div style={{ background: "#1a1a1a", borderRadius: 12, padding: "20px 22px", overflowX: "auto" }}>
              <pre style={{ margin: 0, fontSize: 12, color: "#D4D0C8", lineHeight: 1.8, fontFamily: "monospace", whiteSpace: "pre" }}>
                {SNIPPETS[snippet]}
              </pre>
            </div>

            {/* What changes where */}
            <div style={{ marginTop: 20, background: "#fff", border: "1px solid #E8E7E3", borderRadius: 12, padding: "20px 22px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", marginBottom: 16 }}>Integration map — what changes in each file</div>
              <div style={{ display: "grid", gap: 10 }}>
                {[
                  { file: "DeliveryForm.jsx",       trigger: "Quality", bg: "#FAECE7", fg: "#993C1D", change: "Add 'Quality Deduction' number input (0–50). Call evaluateDeliveryQuality() after save. Show tier-change toast if supplier is downgraded." },
                  { file: "BackOfficeTargets.jsx",   trigger: "Weekly",  bg: "#E6F1FB", fg: "#185FA5", change: "Add 'Weekly Target' text field per supplier (e.g. 4 deliveries/week). Add 'Run Week-End Check' button. Call evaluateWeeklyTarget() on click or on a Sunday midnight schedule." },
                  { file: "SupplierPortal.jsx",      trigger: "Display", bg: "#EAF3DE", fg: "#3B6D11", change: "Show tier_events history on the Tier tab. Highlight last tier change date and reason." },
                  { file: "SupplierDashboard.jsx",   trigger: "Display", bg: "#EAF3DE", fg: "#3B6D11", change: "Tier change events appear in the Recent Activity feed with ▲/▼ indicators." },
                  { file: "Supabase DB",             trigger: "Schema",  bg: "#EDEDEB", fg: "#5F5E5A", change: "Add weekly_target, weekly_deliveries, was_downgraded_last_week to suppliers. Add quality_deduction to deliveries. Create tier_events table and tier_rules table." },
                ].map(r => (
                  <div key={r.file} style={{ display: "flex", gap: 12, padding: "12px 14px", background: "#FAFAF8", borderRadius: 10 }}>
                    <span style={{ fontSize: 11, padding: "3px 9px", borderRadius: 5, background: r.bg, color: r.fg, fontWeight: 700, flexShrink: 0, height: "fit-content", marginTop: 2 }}>{r.trigger}</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#1a1a1a", fontFamily: "monospace", marginBottom: 3 }}>{r.file}</div>
                      <div style={{ fontSize: 12, color: "#666", lineHeight: 1.5 }}>{r.change}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
