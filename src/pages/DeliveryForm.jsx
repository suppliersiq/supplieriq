import { useState } from "react";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function todayISO() { return new Date().toISOString().slice(0, 10); }
function timeNow()  { return new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }); }
function genRef()   {
  const d = new Date().toISOString().slice(2,10).replace(/-/g,"");
  const r = Math.random().toString(36).substring(2,6).toUpperCase();
  return `DEL-${d}-${r}`;
}

// ─── Mock: supplier coming in from kiosk check-in ─────────────────────────────
const CHECKED_IN = {
  id:       "SUP-260502-A3BX",
  name:     "PT Maju Jaya",
  pic:      "Budi Santoso",
  tier:     "Gold",
  category: "Food & Beverage",
  checkin:  timeNow(),
};

const TIER_STYLE = {
  Gold:   { bg: "#FAEEDA", fg: "#854F0B" },
  Silver: { bg: "#EDEDEB", fg: "#5F5E5A" },
  Bronze: { bg: "#FAECE7", fg: "#993C1D" },
};

// ─── Default delivery fields ──────────────────────────────────────────────────
const DEFAULT_FIELDS = [
  { id: "sj_number",   label: "Surat Jalan / DO Number", type: "text",     required: true,  locked: true,  enabled: true,  placeholder: "e.g. SJ-2026-0042"  },
  { id: "po_number",   label: "PO Reference Number",     type: "text",     required: false, locked: false, enabled: true,  placeholder: "e.g. PO-2026-0099"  },
  { id: "goods_desc",  label: "Goods Description",       type: "textarea", required: true,  locked: true,  enabled: true,  placeholder: "Describe the items being delivered" },
  { id: "qty",         label: "Quantity",                type: "number",   required: true,  locked: false, enabled: true,  placeholder: "0"                  },
  { id: "unit",        label: "Unit",                    type: "select",   required: true,  locked: false, enabled: true,
    options: ["Pcs", "Kg", "Box", "Carton", "Sack", "Litre", "Dozen", "Roll", "Sheet", "Set"] },
  { id: "weight_kg",   label: "Total Weight (kg)",       type: "number",   required: false, locked: false, enabled: true,  placeholder: "0.0"                },
  { id: "vehicle",     label: "Vehicle / Plate No.",     type: "text",     required: false, locked: false, enabled: true,  placeholder: "e.g. BH 1234 AB"    },
  { id: "driver",      label: "Driver Name",             type: "text",     required: false, locked: false, enabled: false, placeholder: "Driver full name"    },
  { id: "temp",        label: "Storage Temp (°C)",       type: "number",   required: false, locked: false, enabled: false, placeholder: "e.g. 4"             },
  { id: "expiry",      label: "Expiry / Best Before",    type: "date",     required: false, locked: false, enabled: false                                    },
  { id: "notes",       label: "Additional Notes",        type: "textarea", required: false, locked: false, enabled: false, placeholder: "Any remarks…"       },
];

// ─── Toggle ───────────────────────────────────────────────────────────────────
function Toggle({ on, onClick, disabled }) {
  return (
    <div onClick={disabled ? undefined : onClick} style={{
      width: 34, height: 19, borderRadius: 10,
      background: on ? "#1a1a1a" : "#D8D7D3",
      cursor: disabled ? "not-allowed" : "pointer",
      position: "relative", flexShrink: 0,
      transition: "background 0.2s", opacity: disabled ? 0.4 : 1,
    }}>
      <div style={{ position: "absolute", width: 15, height: 15, borderRadius: "50%", background: "#fff", top: 2, left: on ? 17 : 2, transition: "left 0.18s" }} />
    </div>
  );
}

// ─── Field row in customizer ──────────────────────────────────────────────────
function FieldRow({ field, index, total, onToggle, onToggleRequired, onRemove, onMove }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: field.enabled ? "#FAFAF8" : "#fff", border: "1px solid #ECEAE4", borderRadius: 8 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <button onClick={() => onMove(field.id, -1)} disabled={index === 0}
          style={{ background: "none", border: "none", cursor: index === 0 ? "default" : "pointer", color: "#CCC", fontSize: 9, padding: "1px 3px", lineHeight: 1 }}>▲</button>
        <button onClick={() => onMove(field.id, 1)} disabled={index === total - 1}
          style={{ background: "none", border: "none", cursor: index === total - 1 ? "default" : "pointer", color: "#CCC", fontSize: 9, padding: "1px 3px", lineHeight: 1 }}>▼</button>
      </div>
      <Toggle on={field.enabled} onClick={() => onToggle(field.id)} disabled={field.locked} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: field.enabled ? "#1a1a1a" : "#BBB", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{field.label}</div>
        <div style={{ fontSize: 10, color: "#BBB", marginTop: 1 }}>{field.type}{field.locked ? " · locked" : ""}</div>
      </div>
      {field.enabled && !field.locked && (
        <button onClick={() => onToggleRequired(field.id)} style={{ fontSize: 10, padding: "2px 7px", borderRadius: 4, cursor: "pointer", border: `1px solid ${field.required ? "#C0392B" : "#DDD"}`, background: field.required ? "#FEF0EE" : "transparent", color: field.required ? "#C0392B" : "#BBB", flexShrink: 0 }}>req</button>
      )}
      {!field.locked && (
        <button onClick={() => onRemove(field.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#DDD", fontSize: 13, padding: "0 2px", flexShrink: 0 }}>✕</button>
      )}
    </div>
  );
}

// ─── Receipt screen ───────────────────────────────────────────────────────────
function Receipt({ refNum, supplier, formData, fields, onDone }) {
  const ts = TIER_STYLE[supplier.tier] || TIER_STYLE.Bronze;
  const filled = fields.filter(f => f.enabled && formData[f.id]);

  return (
    <div style={{ minHeight: "100vh", background: "#F8F7F4", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 500, width: "100%" }}>

        {/* Success header */}
        <div style={{ background: "#fff", border: "1px solid #E8E7E3", borderRadius: 18, padding: "36px 32px 28px", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 22, paddingBottom: 22, borderBottom: "1px solid #F0EFEB" }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#EAF3DE", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <polyline points="4,12 9,17 20,6" stroke="#3B6D11" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: "#1a1a1a" }}>Delivery Recorded</div>
              <div style={{ fontSize: 12, color: "#AAA", marginTop: 2 }}>Submitted at {timeNow()} · {new Date().toLocaleDateString("id-ID", { day:"numeric", month:"long", year:"numeric" })}</div>
            </div>
          </div>

          {/* Reference + supplier */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
            <div style={{ background: "#F8F7F4", borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontSize: 10, color: "#AAA", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 4 }}>Delivery Ref</div>
              <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "monospace", color: "#1a1a1a", letterSpacing: 0.5 }}>{refNum}</div>
            </div>
            <div style={{ background: "#F8F7F4", borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontSize: 10, color: "#AAA", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 4 }}>Supplier</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}>{supplier.name}</div>
              <span style={{ display: "inline-block", marginTop: 3, fontSize: 10, padding: "2px 7px", borderRadius: 4, background: ts.bg, color: ts.fg, fontWeight: 600 }}>{supplier.tier}</span>
            </div>
          </div>

          {/* Delivery details */}
          <div style={{ border: "1px solid #F0EFEB", borderRadius: 10, overflow: "hidden" }}>
            {filled.map((f, i) => (
              <div key={f.id} style={{ display: "flex", gap: 16, padding: "10px 14px", background: i % 2 === 0 ? "#fff" : "#FAFAF8", borderBottom: i < filled.length - 1 ? "1px solid #F5F4F0" : "none" }}>
                <div style={{ fontSize: 12, color: "#AAA", minWidth: 140, flexShrink: 0 }}>{f.label}</div>
                <div style={{ fontSize: 13, color: "#1a1a1a", fontWeight: 500, wordBreak: "break-word" }}>
                  {f.id === "unit" ? formData[f.id] : formData[f.id]}
                  {f.id === "qty" && formData.unit ? ` ${formData.unit}` : ""}
                </div>
              </div>
            ))}
          </div>

          {/* Signature placeholder */}
          <div style={{ marginTop: 20, border: "1px dashed #DDD", borderRadius: 10, padding: "16px", textAlign: "center" }}>
            <div style={{ fontSize: 12, color: "#CCC", marginBottom: 8 }}>Received & verified by</div>
            <div style={{ height: 48, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
              <div style={{ width: 160, height: 1, background: "#DDD" }} />
            </div>
            <div style={{ fontSize: 11, color: "#DDD", marginTop: 6 }}>Staff signature</div>
          </div>

          <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <button onClick={() => window.print()}
              style={{ background: "#F8F7F4", color: "#555", border: "1px solid #E0DFD9", borderRadius: 9, padding: "12px", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>
              🖨 Print receipt
            </button>
            <button onClick={onDone}
              style={{ background: "#1a1a1a", color: "#fff", border: "none", borderRadius: 9, padding: "12px", fontSize: 13, cursor: "pointer", fontWeight: 600 }}>
              Done — next supplier →
            </button>
          </div>
        </div>

        {/* Supplier ID reminder */}
        <div style={{ background: "#fff", border: "1px solid #E8E7E3", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6.5" stroke="#AAA" strokeWidth="1.2"/>
            <line x1="8" y1="6" x2="8" y2="10" stroke="#AAA" strokeWidth="1.2" strokeLinecap="round"/>
            <circle cx="8" cy="4.5" r="0.6" fill="#AAA"/>
          </svg>
          <div style={{ fontSize: 12, color: "#AAA", lineHeight: 1.5 }}>
            Reference <strong style={{ fontFamily: "monospace", color: "#888" }}>{refNum}</strong> is now logged in the back office. The supplier's delivery history and performance will be updated automatically.
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main form ────────────────────────────────────────────────────────────────
export default function App() {
  const [fields, setFields]           = useState(DEFAULT_FIELDS);
  const [formData, setFormData]       = useState({ delivery_date: todayISO() });
  const [errors, setErrors]           = useState({});
  const [step, setStep]               = useState("form");   // form | receipt
  const [refNum, setRefNum]           = useState("");
  const [showCustomize, setShowCustomize] = useState(false);
  const [newLabel, setNewLabel]       = useState("");
  const [newType, setNewType]         = useState("text");
  const [photoAdded, setPhotoAdded]   = useState(false);

  const activeFields = fields.filter(f => f.enabled);
  const supplier = CHECKED_IN;
  const ts = TIER_STYLE[supplier.tier] || TIER_STYLE.Bronze;

  const setField = (id, val) => {
    setFormData(p => ({ ...p, [id]: val }));
    setErrors(p => ({ ...p, [id]: "" }));
  };

  const handleSubmit = () => {
    const errs = {};
    activeFields.forEach(f => {
      if (f.required && !String(formData[f.id] || "").trim())
        errs[f.id] = `${f.label} is required`;
    });
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setRefNum(genRef());
    setStep("receipt");
  };

  const toggleField      = (id) => setFields(p => p.map(f => (!f.locked && f.id === id) ? { ...f, enabled: !f.enabled } : f));
  const toggleRequired   = (id) => setFields(p => p.map(f => (!f.locked && f.id === id) ? { ...f, required: !f.required } : f));
  const removeField      = (id) => setFields(p => p.filter(f => f.locked || f.id !== id));
  const moveField        = (id, dir) => {
    setFields(p => {
      const arr = [...p], i = arr.findIndex(f => f.id === id), ni = i + dir;
      if (ni < 0 || ni >= arr.length) return p;
      [arr[i], arr[ni]] = [arr[ni], arr[i]];
      return arr;
    });
  };
  const addCustomField = () => {
    if (!newLabel.trim()) return;
    setFields(p => [...p, { id: "c_" + Date.now(), label: newLabel.trim(), type: newType, required: false, locked: false, enabled: true, placeholder: "" }]);
    setNewLabel("");
  };

  if (step === "receipt") {
    return <Receipt refNum={refNum} supplier={supplier} formData={formData} fields={activeFields}
      onDone={() => { setStep("form"); setFormData({ delivery_date: todayISO() }); setErrors({}); setPhotoAdded(false); }} />;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F8F7F4", fontFamily: "system-ui, sans-serif" }}>

      {/* Top bar */}
      <div style={{ background: "#fff", borderBottom: "1px solid #E8E7E3", padding: "12px 28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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
            <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a", lineHeight: 1 }}>SupplierIQ</div>
            <div style={{ fontSize: 11, color: "#AAA", marginTop: 1 }}>Delivery Entry</div>
          </div>
        </div>
        <button onClick={() => setShowCustomize(v => !v)} style={{ display: "flex", alignItems: "center", gap: 6, background: showCustomize ? "#1a1a1a" : "transparent", color: showCustomize ? "#fff" : "#666", border: "1px solid #E0DFD9", borderRadius: 8, padding: "7px 14px", fontSize: 12, cursor: "pointer", fontWeight: 500 }}>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.3"/>
            <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.1 3.1l1.4 1.4M11.5 11.5l1.4 1.4M3.1 12.9l1.4-1.4M11.5 4.5l1.4-1.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          {showCustomize ? "Hide Customizer" : "Customize Fields"}
        </button>
      </div>

      <div style={{ maxWidth: 980, margin: "0 auto", padding: "28px 28px", display: "flex", gap: 24, alignItems: "flex-start" }}>

        {/* ── Main form ── */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Supplier context banner */}
          <div style={{ background: "#fff", border: "1px solid #E8E7E3", borderRadius: 12, padding: "14px 18px", marginBottom: 20, display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: "50%", background: ts.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: ts.fg }}>
                {supplier.name.split(" ").map(w => w[0]).slice(0,2).join("")}
              </span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1a" }}>{supplier.name}</span>
                <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 5, background: ts.bg, color: ts.fg, fontWeight: 600 }}>{supplier.tier}</span>
              </div>
              <div style={{ fontSize: 12, color: "#AAA", marginTop: 2 }}>
                {supplier.id} · PIC: {supplier.pic} · Checked in at {supplier.checkin}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, background: "#EAF3DE", borderRadius: 8, padding: "6px 12px" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#3B6D11" }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: "#3B6D11" }}>QR Verified</span>
            </div>
          </div>

          {/* Form card */}
          <div style={{ background: "#fff", border: "1px solid #E8E7E3", borderRadius: 14, padding: "26px 28px" }}>
            <div style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: "#1a1a1a", marginBottom: 4 }}>Delivery Details</div>
              <div style={{ fontSize: 13, color: "#888" }}>Fill in what you're delivering today. All entries are logged and visible in the back office.</div>
            </div>

            {/* Delivery date — always shown, auto-filled */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 6 }}>
                Delivery Date <span style={{ color: "#C0392B" }}>*</span>
              </label>
              <input type="date" value={formData.delivery_date || ""} onChange={e => setField("delivery_date", e.target.value)}
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #E0DFD9", borderRadius: 8, fontSize: 13, boxSizing: "border-box", outline: "none", background: "#FAFAF8", color: "#1a1a1a" }} />
            </div>

            {/* Quantity + Unit side by side */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 0 }}>
              {activeFields.filter(f => f.id === "qty" || f.id === "unit").map(f => (
                <div key={f.id}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 6 }}>
                    {f.label}{f.required && <span style={{ color: "#C0392B", marginLeft: 3 }}>*</span>}
                  </label>
                  {f.type === "select" ? (
                    <select value={formData[f.id] || ""} onChange={e => setField(f.id, e.target.value)}
                      style={{ width: "100%", padding: "10px 12px", border: `1px solid ${errors[f.id] ? "#C0392B" : "#E0DFD9"}`, borderRadius: 8, fontSize: 13, background: "#fff", boxSizing: "border-box", outline: "none" }}>
                      <option value="">Select unit</option>
                      {(f.options || []).map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input type={f.type} value={formData[f.id] || ""} onChange={e => setField(f.id, e.target.value)} placeholder={f.placeholder}
                      style={{ width: "100%", padding: "10px 12px", border: `1px solid ${errors[f.id] ? "#C0392B" : "#E0DFD9"}`, borderRadius: 8, fontSize: 13, boxSizing: "border-box", outline: "none" }} />
                  )}
                  {errors[f.id] && <div style={{ fontSize: 11, color: "#C0392B", marginTop: 4 }}>⚠ {errors[f.id]}</div>}
                </div>
              ))}
            </div>

            {/* Remaining fields (excluding qty/unit already shown above) */}
            <div style={{ display: "grid", gap: 16, marginTop: 16 }}>
              {activeFields.filter(f => f.id !== "qty" && f.id !== "unit").map(f => (
                <div key={f.id}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 6 }}>
                    {f.label}{f.required && <span style={{ color: "#C0392B", marginLeft: 3 }}>*</span>}
                  </label>
                  {f.type === "textarea" ? (
                    <textarea rows={f.id === "goods_desc" ? 3 : 2} value={formData[f.id] || ""} onChange={e => setField(f.id, e.target.value)} placeholder={f.placeholder}
                      style={{ width: "100%", padding: "10px 12px", border: `1px solid ${errors[f.id] ? "#C0392B" : "#E0DFD9"}`, borderRadius: 8, fontSize: 13, resize: "vertical", fontFamily: "inherit", boxSizing: "border-box", outline: "none" }} />
                  ) : (
                    <input type={f.type} value={formData[f.id] || ""} onChange={e => setField(f.id, e.target.value)} placeholder={f.placeholder}
                      style={{ width: "100%", padding: "10px 12px", border: `1px solid ${errors[f.id] ? "#C0392B" : "#E0DFD9"}`, borderRadius: 8, fontSize: 13, boxSizing: "border-box", outline: "none" }} />
                  )}
                  {errors[f.id] && <div style={{ fontSize: 11, color: "#C0392B", marginTop: 4 }}>⚠ {errors[f.id]}</div>}
                </div>
              ))}
            </div>

            {/* Photo attachment (simulated) */}
            <div style={{ marginTop: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 8 }}>Delivery photos <span style={{ fontSize: 11, color: "#BBB", fontWeight: 400 }}>(optional)</span></div>
              {photoAdded ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "#EAF3DE", border: "1px solid #C0DD97", borderRadius: 8 }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect x="1" y="3" width="14" height="10" rx="1.5" stroke="#3B6D11" strokeWidth="1.2"/>
                    <circle cx="8" cy="8" r="2.5" stroke="#3B6D11" strokeWidth="1.2"/>
                  </svg>
                  <span style={{ fontSize: 12, color: "#3B6D11", flex: 1 }}>delivery_photo.jpg added</span>
                  <button onClick={() => setPhotoAdded(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#AAA", fontSize: 13 }}>✕</button>
                </div>
              ) : (
                <button onClick={() => setPhotoAdded(true)}
                  style={{ width: "100%", background: "#F8F7F4", border: "1px dashed #D0CFC9", borderRadius: 8, padding: "16px", fontSize: 12, color: "#AAA", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect x="1" y="3" width="14" height="10" rx="1.5" stroke="#CCC" strokeWidth="1.2"/>
                    <circle cx="8" cy="8" r="2.5" stroke="#CCC" strokeWidth="1.2"/>
                    <line x1="12" y1="1" x2="12" y2="5" stroke="#CCC" strokeWidth="1.2" strokeLinecap="round"/>
                    <line x1="10" y1="3" x2="14" y2="3" stroke="#CCC" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                  Tap to attach photo
                </button>
              )}
            </div>

            <button onClick={handleSubmit}
              style={{ marginTop: 22, width: "100%", background: "#1a1a1a", color: "#fff", border: "none", borderRadius: 9, padding: "14px", fontSize: 14, cursor: "pointer", fontWeight: 600 }}>
              Submit Delivery →
            </button>
          </div>
        </div>

        {/* ── Customizer ── */}
        {showCustomize && (
          <div style={{ width: 300, flexShrink: 0 }}>
            <div style={{ background: "#fff", border: "1px solid #E8E7E3", borderRadius: 14, overflow: "hidden" }}>
              <div style={{ padding: "16px 18px", borderBottom: "1px solid #F0EFEB" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a" }}>Field Customizer</div>
                <div style={{ fontSize: 11, color: "#AAA", marginTop: 3 }}>Toggle, reorder, or add delivery fields.</div>
              </div>
              <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 7, maxHeight: 420, overflowY: "auto" }}>
                {fields.map((f, i) => (
                  <FieldRow key={f.id} field={f} index={i} total={fields.length}
                    onToggle={toggleField} onToggleRequired={toggleRequired} onRemove={removeField} onMove={moveField} />
                ))}
              </div>
              <div style={{ padding: "14px 16px", borderTop: "1px solid #F0EFEB", background: "#FAFAF8" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 10 }}>Add custom field</div>
                <input value={newLabel} onChange={e => setNewLabel(e.target.value)} onKeyDown={e => e.key === "Enter" && addCustomField()} placeholder="Field label…"
                  style={{ width: "100%", padding: "8px 10px", border: "1px solid #E0DFD9", borderRadius: 7, fontSize: 12, boxSizing: "border-box", marginBottom: 8, outline: "none" }} />
                <select value={newType} onChange={e => setNewType(e.target.value)}
                  style={{ width: "100%", padding: "8px 10px", border: "1px solid #E0DFD9", borderRadius: 7, fontSize: 12, boxSizing: "border-box", background: "#fff", marginBottom: 10 }}>
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="textarea">Long text</option>
                  <option value="date">Date</option>
                  <option value="select">Dropdown</option>
                </select>
                <button onClick={addCustomField} style={{ width: "100%", background: "#1a1a1a", color: "#fff", border: "none", borderRadius: 7, padding: "9px", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
                  + Add Field
                </button>
              </div>
            </div>

            {/* Field count summary */}
            <div style={{ marginTop: 12, background: "#fff", border: "1px solid #E8E7E3", borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: "#888" }}>Active fields</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#1a1a1a" }}>{activeFields.length}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: "#888" }}>Required</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#C0392B" }}>{activeFields.filter(f => f.required).length}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: "#888" }}>Optional</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#888" }}>{activeFields.filter(f => !f.required).length}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
