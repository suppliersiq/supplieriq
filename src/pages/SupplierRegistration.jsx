import { useState, useEffect, useCallback } from "react";

// ─── Token logic ──────────────────────────────────────────────────────────────
// In production this SECRET lives server-side only.
const SECRET = "SUPPLIERIQ_OFFICE_2026";

function fnv1a(str) {
  let h = 0x811c9dc5 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).toUpperCase().padStart(8, "0");
}

function todayStr() {
  return new Date().toISOString().slice(0, 10).replace(/-/g, "");
}

function getDailyToken(supplierId) {
  return fnv1a(`${supplierId}|${todayStr()}|${SECRET}`);
}

function buildQRPayload(supplierId) {
  return `${supplierId}|${todayStr()}|${getDailyToken(supplierId)}`;
}

function msUntilMidnight() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return midnight - now;
}

function formatCountdown(ms) {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600).toString().padStart(2, "0");
  const m = Math.floor((totalSec % 3600) / 60).toString().padStart(2, "0");
  const s = (totalSec % 60).toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
}

// ─── Default fields ───────────────────────────────────────────────────────────
const DEFAULT_FIELDS = [
  { id: "company",  label: "Company Name",          type: "text",     required: true,  locked: true,  enabled: true  },
  { id: "pic",      label: "PIC / Contact Person",  type: "text",     required: true,  locked: false, enabled: true  },
  { id: "phone",    label: "Phone Number",           type: "tel",      required: true,  locked: false, enabled: true  },
  { id: "email",    label: "Email Address",          type: "email",    required: true,  locked: false, enabled: true  },
  { id: "category", label: "Business Category",     type: "select",   required: true,  locked: false, enabled: true,
    options: ["Food & Beverage", "Raw Materials", "Packaging", "Electronics", "Logistics", "Services", "Other"] },
  { id: "address",  label: "Business Address",       type: "textarea", required: false, locked: false, enabled: true  },
  { id: "npwp",     label: "NPWP / Tax ID",          type: "text",     required: false, locked: false, enabled: true  },
  { id: "bank",     label: "Bank Account Number",    type: "text",     required: false, locked: false, enabled: false },
  { id: "website",  label: "Website / Social Media", type: "text",     required: false, locked: false, enabled: false },
  { id: "notes",    label: "Additional Notes",       type: "textarea", required: false, locked: false, enabled: false },
];

function generateSupplierId() {
  const d = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  const r = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `SUP-${d}-${r}`;
}

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
        <button onClick={() => onRemove(field.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#DDD", fontSize: 13, padding: "0 2px", flexShrink: 0, lineHeight: 1 }}>✕</button>
      )}
    </div>
  );
}

// ─── Success / QR Screen ──────────────────────────────────────────────────────
function SuccessScreen({ supplierId, companyName, onReset }) {
  const [countdown, setCountdown] = useState(msUntilMidnight());
  const [qrReady, setQrReady] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const drawQR = useCallback(() => {
    setQrReady(false);
    const payload = buildQRPayload(supplierId);
    const draw = () => {
      const canvas = document.getElementById("qr-canvas");
      if (!canvas || !window.QRCode) return;
      window.QRCode.toCanvas(canvas, payload, { width: 200, margin: 2, color: { dark: "#1a1a1a", light: "#FFFFFF" } }, (err) => {
        if (!err) setQrReady(true);
      });
    };
    if (window.QRCode) { draw(); return; }
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js";
    s.onload = draw;
    document.head.appendChild(s);
  }, [supplierId, refreshKey]);

  useEffect(() => { drawQR(); }, [drawQR]);

  useEffect(() => {
    const interval = setInterval(() => {
      const ms = msUntilMidnight();
      setCountdown(ms);
      if (ms < 1000) setRefreshKey(k => k + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const downloadQR = () => {
    const canvas = document.getElementById("qr-canvas");
    if (!canvas) return;
    const a = document.createElement("a");
    a.download = `${supplierId}-${todayStr()}.png`;
    a.href = canvas.toDataURL();
    a.click();
  };

  const token = getDailyToken(supplierId);

  return (
    <div style={{ minHeight: "100vh", background: "#F8F7F4", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 460, width: "100%" }}>

        {/* Main QR card */}
        <div style={{ background: "#fff", border: "1px solid #E8E7E3", borderRadius: 18, padding: "36px 36px 28px", textAlign: "center", marginBottom: 14 }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#EAF3DE", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <polyline points="4,12 9,17 20,6" stroke="#3B6D11" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          <div style={{ fontSize: 20, fontWeight: 700, color: "#1a1a1a", marginBottom: 5 }}>You're registered!</div>
          <div style={{ fontSize: 13, color: "#888", marginBottom: 28, lineHeight: 1.6 }}>
            Welcome, <strong style={{ color: "#1a1a1a" }}>{companyName}</strong>.<br/>
            Present this QR at our receiving desk on every visit.
          </div>

          {/* QR code */}
          <div style={{ position: "relative", display: "inline-block", marginBottom: 16 }}>
            <div style={{ background: "#F8F7F4", borderRadius: 14, padding: 20 }}>
              <canvas id="qr-canvas" style={{ display: "block" }} />
              {!qrReady && (
                <div style={{ width: 200, height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "#BBB", fontSize: 12 }}>
                  Generating…
                </div>
              )}
            </div>
            <div style={{ position: "absolute", top: -10, right: -10, background: "#1a1a1a", color: "#fff", fontSize: 10, fontWeight: 700, padding: "4px 9px", borderRadius: 20, letterSpacing: 0.3 }}>
              DAILY QR
            </div>
          </div>

          {/* Countdown */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#FFFBF0", border: "1px solid #FAEEDA", borderRadius: 10, padding: "10px 16px", marginBottom: 16 }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6.5" stroke="#BA7517" strokeWidth="1.3"/>
              <polyline points="8,4.5 8,8.5 10.5,10.5" stroke="#BA7517" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontSize: 12, color: "#BA7517", fontWeight: 500 }}>
              Expires in&nbsp;<strong style={{ fontFamily: "monospace", letterSpacing: 0.5 }}>{formatCountdown(countdown)}</strong>&nbsp;— auto-refreshes at midnight
            </span>
          </div>

          {/* Supplier ID */}
          <div style={{ background: "#F8F7F4", borderRadius: 10, padding: "10px 18px", marginBottom: 20 }}>
            <div style={{ fontSize: 10, color: "#AAA", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 3 }}>Supplier ID</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a", letterSpacing: 1.5, fontFamily: "monospace" }}>{supplierId}</div>
          </div>

          <button onClick={downloadQR} style={{ width: "100%", background: "#1a1a1a", color: "#fff", border: "none", borderRadius: 9, padding: "13px", fontSize: 14, cursor: "pointer", fontWeight: 600, marginBottom: 10 }}>
            ↓ Download Today's QR
          </button>
          <button onClick={onReset} style={{ width: "100%", background: "transparent", color: "#888", border: "1px solid #E0DFD9", borderRadius: 9, padding: "12px", fontSize: 13, cursor: "pointer" }}>
            Register Another Supplier
          </button>
        </div>

        {/* Token breakdown — admin info */}
        <div style={{ background: "#fff", border: "1px solid #E8E7E3", borderRadius: 14, padding: "18px 20px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#555", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="5" width="14" height="9" rx="1.5" stroke="#888" strokeWidth="1.2"/>
              <path d="M5 5V4a3 3 0 0 1 6 0v1" stroke="#888" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            QR Payload (admin view)
          </div>
          {[
            { label: "Supplier ID", value: supplierId },
            { label: "Date",        value: todayStr() },
            { label: "Daily token", value: token, mono: true, bold: true },
            { label: "Full payload", value: buildQRPayload(supplierId), mono: true },
          ].map(r => (
            <div key={r.label} style={{ display: "flex", gap: 12, fontSize: 12, marginBottom: 7 }}>
              <span style={{ color: "#AAA", minWidth: 90, flexShrink: 0 }}>{r.label}</span>
              <span style={{ fontFamily: r.mono ? "monospace" : "inherit", color: "#1a1a1a", wordBreak: "break-all", fontWeight: r.bold ? 700 : 400 }}>{r.value}</span>
            </div>
          ))}
          <div style={{ marginTop: 10, fontSize: 11, color: "#BBB", lineHeight: 1.6, borderTop: "1px solid #F0EFEB", paddingTop: 10 }}>
            Token = FNV1a( supplierID + date + SECRET ). The office scanner re-derives this hash to validate without a database round-trip. Secret key never leaves the server.
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [step, setStep] = useState("form");
  const [fields, setFields] = useState(DEFAULT_FIELDS);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [supplierId, setSupplierId] = useState("");
  const [showCustomize, setShowCustomize] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newType, setNewType] = useState("text");

  const activeFields = fields.filter(f => f.enabled);

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
    setSupplierId(generateSupplierId());
    setStep("success");
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
    setFields(p => [...p, { id: "c_" + Date.now(), label: newLabel.trim(), type: newType, required: false, locked: false, enabled: true }]);
    setNewLabel("");
  };

  if (step === "success") {
    return (
      <SuccessScreen
        supplierId={supplierId}
        companyName={formData.company}
        onReset={() => { setStep("form"); setFormData({}); setErrors({}); setSupplierId(""); }}
      />
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F8F7F4", fontFamily: "system-ui, sans-serif" }}>
      {/* Top bar */}
      <div style={{ background: "#fff", borderBottom: "1px solid #E8E7E3", padding: "13px 28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="1" width="6" height="6" rx="1" fill="#fff" opacity="0.9"/>
              <rect x="9" y="1" width="6" height="6" rx="1" fill="#fff" opacity="0.5"/>
              <rect x="1" y="9" width="6" height="6" rx="1" fill="#fff" opacity="0.5"/>
              <rect x="9" y="9" width="6" height="6" rx="1" fill="#fff" opacity="0.5"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a", lineHeight: 1 }}>SupplierIQ</div>
            <div style={{ fontSize: 11, color: "#AAA", marginTop: 1 }}>Supplier Registration</div>
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

      <div style={{ maxWidth: 980, margin: "0 auto", padding: "36px 28px", display: "flex", gap: 24, alignItems: "flex-start" }}>
        {/* Form */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#1a1a1a", marginBottom: 7 }}>Become a Registered Supplier</div>
            <div style={{ fontSize: 13, color: "#888", lineHeight: 1.6 }}>Fill in your company details. You'll receive a daily-rotating QR code to use at our receiving office.</div>
          </div>

          <div style={{ background: "#fff", border: "1px solid #E8E7E3", borderRadius: 14, padding: "30px 28px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 26 }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>1</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 500, color: "#1a1a1a" }}>Company Information</div>
              <div style={{ flex: 1, height: 1, background: "#EEE" }} />
              <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#F0EFEB", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: "#BBB", fontSize: 11, fontWeight: 700 }}>2</span>
              </div>
              <div style={{ fontSize: 13, color: "#BBB" }}>Daily QR Code</div>
            </div>

            <div style={{ display: "grid", gap: 18 }}>
              {activeFields.map(f => (
                <div key={f.id}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 6 }}>
                    {f.label}{f.required && <span style={{ color: "#C0392B", marginLeft: 3 }}>*</span>}
                  </label>
                  {f.type === "textarea" ? (
                    <textarea rows={3} value={formData[f.id] || ""} onChange={e => setField(f.id, e.target.value)} placeholder={`Enter ${f.label.toLowerCase()}`}
                      style={{ width: "100%", padding: "10px 12px", border: `1px solid ${errors[f.id] ? "#C0392B" : "#E0DFD9"}`, borderRadius: 8, fontSize: 13, resize: "vertical", fontFamily: "inherit", boxSizing: "border-box", outline: "none" }} />
                  ) : f.type === "select" ? (
                    <select value={formData[f.id] || ""} onChange={e => setField(f.id, e.target.value)}
                      style={{ width: "100%", padding: "10px 12px", border: `1px solid ${errors[f.id] ? "#C0392B" : "#E0DFD9"}`, borderRadius: 8, fontSize: 13, background: "#fff", boxSizing: "border-box", outline: "none" }}>
                      <option value="">Select {f.label}</option>
                      {(f.options || []).map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input type={f.type} value={formData[f.id] || ""} onChange={e => setField(f.id, e.target.value)} placeholder={`Enter ${f.label.toLowerCase()}`}
                      style={{ width: "100%", padding: "10px 12px", border: `1px solid ${errors[f.id] ? "#C0392B" : "#E0DFD9"}`, borderRadius: 8, fontSize: 13, boxSizing: "border-box", outline: "none" }} />
                  )}
                  {errors[f.id] && <div style={{ fontSize: 11, color: "#C0392B", marginTop: 4 }}>⚠ {errors[f.id]}</div>}
                </div>
              ))}
            </div>

            <div style={{ marginTop: 22, padding: "12px 14px", background: "#FFFBF0", border: "1px solid #FAEEDA", borderRadius: 8, fontSize: 12, color: "#996600", lineHeight: 1.6, display: "flex", gap: 8 }}>
              <span style={{ flexShrink: 0 }}>🔄</span>
              <span>Your QR code rotates daily for security. Return to your supplier portal each morning to get today's fresh code before visiting.</span>
            </div>

            <div style={{ marginTop: 10, padding: "12px 14px", background: "#F8F7F4", borderRadius: 8, fontSize: 12, color: "#999", lineHeight: 1.6 }}>
              By registering, you agree to our supplier terms and consent to data collection for performance monitoring and loyalty program purposes.
            </div>

            <button onClick={handleSubmit} style={{ marginTop: 18, width: "100%", background: "#1a1a1a", color: "#fff", border: "none", borderRadius: 9, padding: "14px", fontSize: 14, cursor: "pointer", fontWeight: 600 }}>
              Register &amp; Generate My Daily QR →
            </button>
          </div>
        </div>

        {/* Customizer */}
        {showCustomize && (
          <div style={{ width: 300, flexShrink: 0 }}>
            <div style={{ background: "#fff", border: "1px solid #E8E7E3", borderRadius: 14, overflow: "hidden" }}>
              <div style={{ padding: "16px 18px", borderBottom: "1px solid #F0EFEB" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a" }}>Field Customizer</div>
                <div style={{ fontSize: 11, color: "#AAA", marginTop: 3 }}>Toggle, reorder, or add fields.</div>
              </div>
              <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 7, maxHeight: 400, overflowY: "auto" }}>
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
                  <option value="email">Email</option>
                  <option value="tel">Phone</option>
                  <option value="textarea">Long text</option>
                  <option value="date">Date</option>
                </select>
                <button onClick={addCustomField} style={{ width: "100%", background: "#1a1a1a", color: "#fff", border: "none", borderRadius: 7, padding: "9px", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
                  + Add Field
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
