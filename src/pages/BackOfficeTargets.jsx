import { useState } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────
const TIER_STYLE = {
  Gold:   { bg: "#FAEEDA", fg: "#854F0B", dot: "#EF9F27" },
  Silver: { bg: "#EDEDEB", fg: "#5F5E5A", dot: "#888780" },
  Bronze: { bg: "#FAECE7", fg: "#993C1D", dot: "#D85A30" },
};

const STATUS_STYLE = {
  achieved: { bg: "#E6F1FB", fg: "#185FA5", label: "Achieved",  dot: "#378ADD" },
  on_track: { bg: "#EAF3DE", fg: "#3B6D11", label: "On Track",  dot: "#639922" },
  at_risk:  { bg: "#FAEEDA", fg: "#854F0B", label: "At Risk",   dot: "#EF9F27" },
  missed:   { bg: "#FAECE7", fg: "#993C1D", label: "Missed",    dot: "#D85A30" },
};

const TARGET_TYPES = [
  { id: "delivery_volume",    label: "Delivery Volume",       unit: "deliveries", icon: "📦" },
  { id: "quality_score",      label: "Min. Quality Score",    unit: "/ 100",      icon: "⭐" },
  { id: "fulfillment_rate",   label: "Fulfillment Rate",      unit: "%",          icon: "✅" },
  { id: "pricing_score",      label: "Min. Pricing Score",    unit: "/ 100",      icon: "💰" },
  { id: "compliance_score",   label: "Compliance Score",      unit: "/ 100",      icon: "📋" },
  { id: "on_time_deliveries", label: "On-Time Deliveries",    unit: "%",          icon: "⏱" },
];

const PERIODS = ["May 2026", "Apr 2026", "Mar 2026", "Q2 2026", "Q1 2026"];

function pct(current, target) {
  return Math.min(100, Math.round((current / target) * 100));
}

function deriveStatus(current, target, daysLeft) {
  const p = pct(current, target);
  if (p >= 100) return "achieved";
  if (p >= 70 || (daysLeft > 15 && p >= 40)) return "on_track";
  if (p >= 40 || daysLeft > 5) return "at_risk";
  return "missed";
}

function genId() { return "T-" + Math.random().toString(36).substring(2,8).toUpperCase(); }

// ─── Mock data ────────────────────────────────────────────────────────────────
const INIT_SUPPLIERS = [
  { id: "SUP-260502-A3BX", name: "PT Maju Jaya",      tier: "Gold",   pic: "Budi Santoso" },
  { id: "SUP-260502-B7CD", name: "CV Sumber Rezeki",   tier: "Gold",   pic: "Hendra Wijaya" },
  { id: "SUP-260430-C9EF", name: "PT Global Nusa",     tier: "Silver", pic: "Siti Rahayu" },
  { id: "SUP-260430-D2GH", name: "UD Karya Mandiri",   tier: "Silver", pic: "Ahmad Fauzi" },
  { id: "SUP-260428-E5IJ", name: "PT Aneka Makmur",    tier: "Bronze", pic: "Dewi Kusuma" },
  { id: "SUP-260425-F8KL", name: "CV Prima Sejahtera", tier: "Bronze", pic: "Rizky Pratama" },
];

const INIT_TARGETS = [
  { id:"T-001", supplierId:"SUP-260502-A3BX", type:"delivery_volume",    label:"Monthly Deliveries", target:20, current:18, unit:"deliveries", period:"May 2026", daysLeft:28 },
  { id:"T-002", supplierId:"SUP-260502-A3BX", type:"quality_score",      label:"Quality Score",      target:85, current:91, unit:"/ 100",      period:"May 2026", daysLeft:28 },
  { id:"T-003", supplierId:"SUP-260502-A3BX", type:"fulfillment_rate",   label:"Fulfillment Rate",   target:90, current:94, unit:"%",          period:"May 2026", daysLeft:28 },
  { id:"T-004", supplierId:"SUP-260502-B7CD", type:"delivery_volume",    label:"Monthly Deliveries", target:15, current:12, unit:"deliveries", period:"May 2026", daysLeft:28 },
  { id:"T-005", supplierId:"SUP-260502-B7CD", type:"quality_score",      label:"Quality Score",      target:80, current:88, unit:"/ 100",      period:"May 2026", daysLeft:28 },
  { id:"T-006", supplierId:"SUP-260502-B7CD", type:"compliance_score",   label:"Compliance Score",   target:85, current:72, unit:"/ 100",      period:"May 2026", daysLeft:28 },
  { id:"T-007", supplierId:"SUP-260430-C9EF", type:"delivery_volume",    label:"Monthly Deliveries", target:12, current:7,  unit:"deliveries", period:"May 2026", daysLeft:28 },
  { id:"T-008", supplierId:"SUP-260430-C9EF", type:"on_time_deliveries", label:"On-Time Rate",       target:85, current:76, unit:"%",          period:"May 2026", daysLeft:28 },
  { id:"T-009", supplierId:"SUP-260430-D2GH", type:"quality_score",      label:"Quality Score",      target:75, current:72, unit:"/ 100",      period:"May 2026", daysLeft:28 },
  { id:"T-010", supplierId:"SUP-260430-D2GH", type:"fulfillment_rate",   label:"Fulfillment Rate",   target:80, current:61, unit:"%",          period:"May 2026", daysLeft:28 },
  { id:"T-011", supplierId:"SUP-260428-E5IJ", type:"delivery_volume",    label:"Monthly Deliveries", target:8,  current:2,  unit:"deliveries", period:"May 2026", daysLeft:28 },
  { id:"T-012", supplierId:"SUP-260428-E5IJ", type:"pricing_score",      label:"Pricing Score",      target:70, current:58, unit:"/ 100",      period:"May 2026", daysLeft:28 },
  { id:"T-013", supplierId:"SUP-260425-F8KL", type:"delivery_volume",    label:"Monthly Deliveries", target:6,  current:4,  unit:"deliveries", period:"May 2026", daysLeft:28 },
];

// ─── Progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ current, target, status, size = "md" }) {
  const p = pct(current, target);
  const ss = STATUS_STYLE[status];
  const h = size === "sm" ? 5 : 8;
  return (
    <div style={{ position: "relative" }}>
      <div style={{ height: h, borderRadius: h, background: "#F0EFEB", overflow: "hidden" }}>
        <div style={{
          height: "100%", borderRadius: h,
          width: `${p}%`,
          background: ss.dot,
          transition: "width 0.5s ease",
        }} />
      </div>
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status, small }) {
  const ss = STATUS_STYLE[status];
  return (
    <span style={{ fontSize: small ? 10 : 11, padding: small ? "2px 6px" : "3px 9px", borderRadius: 5, background: ss.bg, color: ss.fg, fontWeight: 600, flexShrink: 0 }}>
      {ss.label}
    </span>
  );
}

// ─── Supplier summary card (left panel) ──────────────────────────────────────
function SupplierCard({ supplier, targets, selected, onClick }) {
  const ts = TIER_STYLE[supplier.tier];
  const statuses = targets.map(t => deriveStatus(t.current, t.target, t.daysLeft));
  const health = statuses.includes("missed") ? "missed" : statuses.includes("at_risk") ? "at_risk" : statuses.includes("on_track") ? "on_track" : statuses.length > 0 ? "achieved" : null;
  const achieved = statuses.filter(s => s === "achieved").length;

  return (
    <div onClick={onClick} style={{
      padding: "13px 16px", cursor: "pointer", borderBottom: "1px solid #F0EFEB",
      background: selected ? "#F8F7F4" : "#fff",
      borderLeft: selected ? "3px solid #1a1a1a" : "3px solid transparent",
      transition: "background 0.15s",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: ts.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: ts.fg }}>
            {supplier.name.split(" ").map(w => w[0]).slice(0,2).join("")}
          </span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "#1a1a1a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{supplier.name}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
            <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 4, background: ts.bg, color: ts.fg, fontWeight: 600 }}>{supplier.tier}</span>
            <span style={{ fontSize: 11, color: "#AAA" }}>{targets.length} target{targets.length !== 1 ? "s" : ""}</span>
          </div>
        </div>
        {health && <StatusBadge status={health} small />}
      </div>

      {/* Mini progress row */}
      {targets.length > 0 && (
        <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ flex: 1 }}>
            <ProgressBar
              current={statuses.filter(s => s === "achieved" || s === "on_track").length}
              target={targets.length}
              status={health || "on_track"}
              size="sm"
            />
          </div>
          <span style={{ fontSize: 10, color: "#AAA", flexShrink: 0 }}>{achieved}/{targets.length}</span>
        </div>
      )}
    </div>
  );
}

// ─── Target row ───────────────────────────────────────────────────────────────
function TargetRow({ target, onEdit, onDelete }) {
  const status = deriveStatus(target.current, target.target, target.daysLeft);
  const ss = STATUS_STYLE[status];
  const p = pct(target.current, target.target);
  const typeInfo = TARGET_TYPES.find(t => t.id === target.type);

  return (
    <div style={{ padding: "14px 0", borderBottom: "1px solid #F5F4F0" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
        <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{typeInfo?.icon || "🎯"}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}>{target.label}</span>
            <StatusBadge status={status} small />
          </div>
          <div style={{ display: "flex", align: "center", gap: 12, fontSize: 12, color: "#888", flexWrap: "wrap" }}>
            <span>Target: <strong style={{ color: "#1a1a1a" }}>{target.target} {target.unit}</strong></span>
            <span>Current: <strong style={{ color: ss.dot }}>{target.current} {target.unit}</strong></span>
            <span style={{ color: p >= 100 ? "#3B6D11" : "#AAA" }}>{p}% complete</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <button onClick={() => onEdit(target)} style={{ background: "none", border: "1px solid #E0DFD9", borderRadius: 6, padding: "4px 10px", fontSize: 11, color: "#888", cursor: "pointer" }}>Edit</button>
          <button onClick={() => onDelete(target.id)} style={{ background: "none", border: "1px solid #E0DFD9", borderRadius: 6, padding: "4px 8px", fontSize: 11, color: "#CCC", cursor: "pointer" }}>✕</button>
        </div>
      </div>
      <ProgressBar current={target.current} target={target.target} status={status} />

      {/* Progress markers */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
        <span style={{ fontSize: 10, color: "#CCC" }}>0</span>
        <span style={{ fontSize: 10, color: "#CCC" }}>{Math.round(target.target * 0.5)}</span>
        <span style={{ fontSize: 10, color: "#CCC" }}>{target.target}</span>
      </div>
    </div>
  );
}

// ─── Add / Edit target form ───────────────────────────────────────────────────
function TargetForm({ supplierId, editing, onSave, onCancel }) {
  const [type, setType]         = useState(editing?.type || "delivery_volume");
  const [label, setLabel]       = useState(editing?.label || "");
  const [target, setTarget]     = useState(editing?.target || "");
  const [current, setCurrent]   = useState(editing?.current || 0);
  const [period, setPeriod]     = useState(editing?.period || "May 2026");
  const [daysLeft, setDaysLeft] = useState(editing?.daysLeft || 28);

  const typeInfo = TARGET_TYPES.find(t => t.id === type);

  const handleSave = () => {
    if (!target || isNaN(Number(target))) return;
    onSave({
      id:         editing?.id || genId(),
      supplierId,
      type,
      label:      label.trim() || typeInfo?.label || type,
      target:     Number(target),
      current:    Number(current),
      unit:       typeInfo?.unit || "",
      period,
      daysLeft,
    });
  };

  const inp = { width: "100%", padding: "9px 11px", border: "1px solid #E0DFD9", borderRadius: 8, fontSize: 13, boxSizing: "border-box", outline: "none", background: "#fff" };

  return (
    <div style={{ background: "#F8F7F4", border: "1px solid #E8E7E3", borderRadius: 12, padding: "18px 18px", marginTop: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", marginBottom: 14 }}>
        {editing ? "Edit Target" : "New Target"}
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        <div>
          <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#888", marginBottom: 5 }}>TYPE</label>
          <select value={type} onChange={e => { setType(e.target.value); setLabel(""); }} style={inp}>
            {TARGET_TYPES.map(t => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
          </select>
        </div>

        <div>
          <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#888", marginBottom: 5 }}>LABEL <span style={{ fontSize: 10, fontWeight: 400, color: "#BBB" }}>(optional — defaults to type name)</span></label>
          <input value={label} onChange={e => setLabel(e.target.value)} placeholder={typeInfo?.label} style={inp} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#888", marginBottom: 5 }}>TARGET VALUE <span style={{ color: "#C0392B" }}>*</span></label>
            <input type="number" value={target} onChange={e => setTarget(e.target.value)} placeholder="e.g. 20" style={inp} />
            <div style={{ fontSize: 10, color: "#BBB", marginTop: 3 }}>{typeInfo?.unit}</div>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#888", marginBottom: 5 }}>CURRENT VALUE</label>
            <input type="number" value={current} onChange={e => setCurrent(e.target.value)} placeholder="0" style={inp} />
            <div style={{ fontSize: 10, color: "#BBB", marginTop: 3 }}>Starting baseline</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#888", marginBottom: 5 }}>PERIOD</label>
            <select value={period} onChange={e => setPeriod(e.target.value)} style={inp}>
              {PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#888", marginBottom: 5 }}>DAYS REMAINING</label>
            <input type="number" value={daysLeft} onChange={e => setDaysLeft(Number(e.target.value))} min={1} max={90} style={inp} />
          </div>
        </div>
      </div>

      {/* Preview */}
      {target && !isNaN(Number(target)) && (
        <div style={{ marginTop: 14, padding: "10px 12px", background: "#fff", border: "1px solid #E8E7E3", borderRadius: 8 }}>
          <div style={{ fontSize: 11, color: "#AAA", marginBottom: 8 }}>Preview</div>
          <ProgressBar current={Number(current)} target={Number(target)} status={deriveStatus(Number(current), Number(target), daysLeft)} />
          <div style={{ fontSize: 11, color: "#888", marginTop: 5 }}>{pct(Number(current), Number(target))}% — {deriveStatus(Number(current), Number(target), daysLeft).replace("_"," ")}</div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14 }}>
        <button onClick={onCancel} style={{ background: "transparent", color: "#888", border: "1px solid #E0DFD9", borderRadius: 8, padding: "10px", fontSize: 13, cursor: "pointer" }}>Cancel</button>
        <button onClick={handleSave} style={{ background: "#1a1a1a", color: "#fff", border: "none", borderRadius: 8, padding: "10px", fontSize: 13, cursor: "pointer", fontWeight: 600 }}>
          {editing ? "Save Changes" : "Add Target"}
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function App() {
  const [suppliers]       = useState(INIT_SUPPLIERS);
  const [targets, setTargets] = useState(INIT_TARGETS);
  const [selected, setSelected] = useState(INIT_SUPPLIERS[0].id);
  const [period, setPeriod]     = useState("May 2026");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState(null);
  const [search, setSearch]     = useState("");

  const supplier  = suppliers.find(s => s.id === selected);
  const ts        = supplier ? TIER_STYLE[supplier.tier] : TIER_STYLE.Bronze;
  const myTargets = targets.filter(t => t.supplierId === selected && t.period === period);

  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const saveTarget = (t) => {
    setTargets(prev => editing
      ? prev.map(x => x.id === t.id ? t : x)
      : [...prev, t]
    );
    setShowForm(false);
    setEditing(null);
  };

  const deleteTarget = (id) => setTargets(p => p.filter(t => t.id !== id));

  const updateCurrent = (id, val) => {
    setTargets(p => p.map(t => t.id === id ? { ...t, current: Math.max(0, Number(val)) } : t));
  };

  // Overall stats for header
  const allCurrent = targets.filter(t => t.period === period);
  const statuses   = allCurrent.map(t => deriveStatus(t.current, t.target, t.daysLeft));
  const counts = {
    achieved: statuses.filter(s => s === "achieved").length,
    on_track: statuses.filter(s => s === "on_track").length,
    at_risk:  statuses.filter(s => s === "at_risk").length,
    missed:   statuses.filter(s => s === "missed").length,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F8F7F4", fontFamily: "system-ui, sans-serif" }}>

      {/* ── Top bar ── */}
      <div style={{ background: "#fff", borderBottom: "1px solid #E8E7E3", padding: "13px 28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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
            <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a", lineHeight: 1 }}>SupplierIQ — Back Office</div>
            <div style={{ fontSize: 11, color: "#AAA", marginTop: 1 }}>Target Management</div>
          </div>
        </div>

        {/* Period selector */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: "#AAA" }}>Period:</span>
          <select value={period} onChange={e => setPeriod(e.target.value)}
            style={{ padding: "6px 10px", border: "1px solid #E0DFD9", borderRadius: 8, fontSize: 13, background: "#fff", outline: "none", cursor: "pointer" }}>
            {PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      {/* ── Summary bar ── */}
      <div style={{ background: "#fff", borderBottom: "1px solid #F0EFEB", padding: "12px 28px", display: "flex", gap: 24, alignItems: "center" }}>
        <span style={{ fontSize: 12, color: "#AAA", fontWeight: 600 }}>ALL TARGETS · {period}</span>
        {Object.entries(counts).map(([status, count]) => {
          const ss = STATUS_STYLE[status];
          return (
            <div key={status} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: ss.dot }} />
              <span style={{ fontSize: 12, color: "#555" }}>{ss.label}: <strong>{count}</strong></span>
            </div>
          );
        })}
        <span style={{ marginLeft: "auto", fontSize: 12, color: "#AAA" }}>{allCurrent.length} targets across {suppliers.length} suppliers</span>
      </div>

      {/* ── Body ── */}
      <div style={{ display: "flex", maxWidth: 1100, margin: "0 auto", padding: "24px 28px", gap: 20 }}>

        {/* ── Left: supplier list ── */}
        <div style={{ width: 260, flexShrink: 0 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search suppliers…"
            style={{ width: "100%", padding: "9px 12px", border: "1px solid #E0DFD9", borderRadius: 9, fontSize: 13, boxSizing: "border-box", marginBottom: 12, outline: "none", background: "#fff" }} />

          <div style={{ background: "#fff", border: "1px solid #E8E7E3", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "10px 16px", borderBottom: "1px solid #F0EFEB", fontSize: 11, fontWeight: 600, color: "#AAA", letterSpacing: 0.5 }}>
              {filtered.length} SUPPLIERS
            </div>
            {filtered.map(s => {
              const st = targets.filter(t => t.supplierId === s.id && t.period === period);
              return (
                <SupplierCard key={s.id} supplier={s} targets={st} selected={selected === s.id} onClick={() => { setSelected(s.id); setShowForm(false); setEditing(null); }} />
              );
            })}
          </div>
        </div>

        {/* ── Right: targets detail ── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {supplier && (
            <>
              {/* Supplier header */}
              <div style={{ background: "#fff", border: "1px solid #E8E7E3", borderRadius: 12, padding: "18px 20px", marginBottom: 18, display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: ts.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: ts.fg }}>
                    {supplier.name.split(" ").map(w => w[0]).slice(0,2).join("")}
                  </span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: "#1a1a1a" }}>{supplier.name}</span>
                    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 5, background: ts.bg, color: ts.fg, fontWeight: 600 }}>{supplier.tier}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#AAA", marginTop: 3 }}>{supplier.id} · PIC: {supplier.pic}</div>
                </div>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <div style={{ textAlign: "center", padding: "8px 14px", background: "#F8F7F4", borderRadius: 8 }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#1a1a1a" }}>{myTargets.length}</div>
                    <div style={{ fontSize: 10, color: "#AAA" }}>targets</div>
                  </div>
                  <div style={{ textAlign: "center", padding: "8px 14px", background: "#EAF3DE", borderRadius: 8 }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#3B6D11" }}>
                      {myTargets.filter(t => deriveStatus(t.current, t.target, t.daysLeft) === "achieved").length}
                    </div>
                    <div style={{ fontSize: 10, color: "#3B6D11" }}>achieved</div>
                  </div>
                </div>
              </div>

              {/* Targets list */}
              <div style={{ background: "#fff", border: "1px solid #E8E7E3", borderRadius: 12, padding: "18px 22px", marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a" }}>Targets · {period}</div>
                  {!showForm && (
                    <button onClick={() => { setShowForm(true); setEditing(null); }}
                      style={{ background: "#1a1a1a", color: "#fff", border: "none", borderRadius: 7, padding: "7px 14px", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
                      + Add Target
                    </button>
                  )}
                </div>

                {myTargets.length === 0 && !showForm ? (
                  <div style={{ padding: "32px 0", textAlign: "center" }}>
                    <div style={{ fontSize: 13, color: "#CCC", marginBottom: 8 }}>No targets set for this period</div>
                    <button onClick={() => setShowForm(true)} style={{ background: "transparent", border: "1px dashed #DDD", borderRadius: 8, padding: "8px 18px", fontSize: 12, color: "#BBB", cursor: "pointer" }}>
                      + Set first target
                    </button>
                  </div>
                ) : (
                  myTargets.map(t => (
                    <TargetRow key={t.id} target={t}
                      onEdit={(t) => { setEditing(t); setShowForm(true); }}
                      onDelete={deleteTarget}
                    />
                  ))
                )}

                {showForm && (
                  <TargetForm
                    supplierId={selected}
                    editing={editing}
                    onSave={saveTarget}
                    onCancel={() => { setShowForm(false); setEditing(null); }}
                  />
                )}
              </div>

              {/* Quick update panel — update current values fast */}
              {myTargets.length > 0 && (
                <div style={{ background: "#fff", border: "1px solid #E8E7E3", borderRadius: 12, padding: "18px 22px" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", marginBottom: 14 }}>Quick Update — Current Values</div>
                  <div style={{ display: "grid", gap: 12 }}>
                    {myTargets.map(t => {
                      const typeInfo = TARGET_TYPES.find(x => x.id === t.type);
                      const status = deriveStatus(t.current, t.target, t.daysLeft);
                      const ss = STATUS_STYLE[status];
                      return (
                        <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <span style={{ fontSize: 16, flexShrink: 0 }}>{typeInfo?.icon || "🎯"}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 500, color: "#555", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.label}</div>
                            <ProgressBar current={t.current} target={t.target} status={status} size="sm" />
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                            <button onClick={() => updateCurrent(t.id, t.current - 1)}
                              style={{ width: 26, height: 26, borderRadius: 6, border: "1px solid #E0DFD9", background: "#fff", cursor: "pointer", fontSize: 14, color: "#888", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                            <span style={{ fontSize: 13, fontWeight: 700, color: ss.dot, minWidth: 28, textAlign: "center" }}>{t.current}</span>
                            <button onClick={() => updateCurrent(t.id, t.current + 1)}
                              style={{ width: 26, height: 26, borderRadius: 6, border: "1px solid #E0DFD9", background: "#fff", cursor: "pointer", fontSize: 14, color: "#888", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                            <span style={{ fontSize: 11, color: "#BBB" }}>/ {t.target}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ marginTop: 14, padding: "10px 12px", background: "#F8F7F4", borderRadius: 8, fontSize: 12, color: "#AAA", display: "flex", gap: 8 }}>
                    <span>💡</span>
                    <span>These values are also visible on the supplier's portal page so they can track their own progress.</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
