import { useState, useEffect, useRef, useCallback } from "react";

// ─── Same token logic as registration (shared in real app via util module) ────
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

function getDailyToken(id) {
  return fnv1a(`${id}|${todayStr()}|${SECRET}`);
}

function buildPayload(id) {
  return `${id}|${todayStr()}|${getDailyToken(id)}`;
}

function timeNow() {
  return new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

// ─── Mock supplier DB ─────────────────────────────────────────────────────────
const SUPPLIERS = {
  "SUP-260502-A3BX": { name: "PT Maju Jaya",       tier: "Gold",   pic: "Budi Santoso",  category: "Food & Beverage" },
  "SUP-260502-B7CD": { name: "CV Sumber Rezeki",    tier: "Gold",   pic: "Hendra Wijaya", category: "Raw Materials"   },
  "SUP-260430-C9EF": { name: "PT Global Nusa",      tier: "Silver", pic: "Siti Rahayu",   category: "Packaging"       },
  "SUP-260430-D2GH": { name: "UD Karya Mandiri",    tier: "Silver", pic: "Ahmad Fauzi",   category: "Electronics"     },
  "SUP-260428-E5IJ": { name: "PT Aneka Makmur",     tier: "Bronze", pic: "Dewi Kusuma",   category: "Logistics"       },
  "SUP-260425-F8KL": { name: "CV Prima Sejahtera",  tier: "Bronze", pic: "Rizky Pratama", category: "Services"        },
};

const DEFAULT_OFFICE_CODE = "JMBI-2026";

const TIER_STYLE = {
  Gold:   { bg: "#FAEEDA", fg: "#854F0B", dot: "#EF9F27" },
  Silver: { bg: "#EDEDEB", fg: "#5F5E5A", dot: "#888780" },
  Bronze: { bg: "#FAECE7", fg: "#993C1D", dot: "#D85A30" },
};

// ─── Validate a raw QR string ─────────────────────────────────────────────────
function validatePayload(raw, officeCode, configuredOfficeCode) {
  const parts = raw.trim().split("|");
  if (parts.length !== 3) return { ok: false, reason: "Invalid QR format" };

  const [supplierId, date, token] = parts;

  if (date !== todayStr())
    return { ok: false, reason: `QR expired — issued for ${date.slice(0,4)}-${date.slice(4,6)}-${date.slice(6)}, not today` };

  const expected = getDailyToken(supplierId);
  if (token !== expected)
    return { ok: false, reason: "Token mismatch — QR may be tampered" };

  const supplier = SUPPLIERS[supplierId];
  if (!supplier)
    return { ok: false, reason: `Supplier ID not found: ${supplierId}` };

  if (officeCode.trim().toUpperCase() !== configuredOfficeCode.toUpperCase())
    return { ok: false, reason: "Office code incorrect" };

  return { ok: true, supplier, supplierId };
}

// ─── Scanning animation dots ──────────────────────────────────────────────────
function ScanDots() {
  const [dot, setDot] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setDot(d => (d + 1) % 4), 400);
    return () => clearInterval(t);
  }, []);
  return <span>{".".repeat(dot)}&nbsp;</span>;
}

// ─── Camera viewfinder ────────────────────────────────────────────────────────
function Viewfinder({ scanState }) {
  const [linePos, setLinePos] = useState(0);
  const [lineDir, setLineDir] = useState(1);

  useEffect(() => {
    if (scanState !== "idle" && scanState !== "scanning") return;
    const t = setInterval(() => {
      setLinePos(p => {
        const next = p + lineDir * 2;
        if (next >= 100) setLineDir(-1);
        if (next <= 0)   setLineDir(1);
        return Math.max(0, Math.min(100, next));
      });
    }, 16);
    return () => clearInterval(t);
  }, [scanState, lineDir]);

  const colors = {
    idle:       { border: "#444", line: "#EF9F27", bg: "#111" },
    scanning:   { border: "#EF9F27", line: "#fff", bg: "#111" },
    success:    { border: "#3B6D11", line: "#63C132", bg: "#0D1F09" },
    error:      { border: "#A32D2D", line: "#E24B4A", bg: "#1F0D0D" },
    manual:     { border: "#444", line: "#888", bg: "#111" },
  };
  const c = colors[scanState] || colors.idle;

  return (
    <div style={{ position: "relative", width: "100%", aspectRatio: "1", borderRadius: 16, background: c.bg, overflow: "hidden", border: `2px solid ${c.border}`, transition: "border-color 0.3s, background 0.3s" }}>
      {/* Corner brackets */}
      {[["0%","0%","right","bottom"], ["0%","auto","right","top"], ["auto","0%","left","bottom"], ["auto","auto","left","top"]].map(([t,b,br,bl], i) => (
        <div key={i} style={{ position: "absolute", top: t === "auto" ? undefined : 16, bottom: b === "auto" ? undefined : 16, right: br === "left" ? undefined : 16, left: bl === "right" ? undefined : 16, width: 28, height: 28, borderTop: bl === "top" || br === "top" ? `3px solid ${c.border}` : "none", borderBottom: bl === "bottom" || br === "bottom" ? `3px solid ${c.border}` : "none", borderLeft: bl !== "right" ? `3px solid ${c.border}` : "none", borderRight: br !== "left" ? `3px solid ${c.border}` : "none", transition: "border-color 0.3s" }} />
      ))}

      {/* Scan line */}
      {(scanState === "idle" || scanState === "scanning") && (
        <div style={{ position: "absolute", left: "10%", right: "10%", height: 2, background: c.line, top: `${linePos}%`, opacity: 0.8, borderRadius: 1, boxShadow: `0 0 8px ${c.line}`, transition: "background 0.3s" }} />
      )}

      {/* State overlays */}
      {scanState === "success" && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(59,109,17,0.3)", border: "2px solid #63C132", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <polyline points="4,12 9,17 20,6" stroke="#63C132" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{ color: "#63C132", fontSize: 14, fontWeight: 700, letterSpacing: 1 }}>VALIDATED</span>
        </div>
      )}

      {scanState === "error" && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(163,45,45,0.3)", border: "2px solid #E24B4A", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <line x1="5" y1="5" x2="19" y2="19" stroke="#E24B4A" strokeWidth="3" strokeLinecap="round"/>
              <line x1="19" y1="5" x2="5" y2="19" stroke="#E24B4A" strokeWidth="3" strokeLinecap="round"/>
            </svg>
          </div>
          <span style={{ color: "#E24B4A", fontSize: 14, fontWeight: 700, letterSpacing: 1 }}>REJECTED</span>
        </div>
      )}

      {scanState === "scanning" && (
        <div style={{ position: "absolute", bottom: 16, left: 0, right: 0, textAlign: "center" }}>
          <span style={{ color: "#EF9F27", fontSize: 12, fontWeight: 600, letterSpacing: 0.5 }}>READING QR<ScanDots /></span>
        </div>
      )}

      {(scanState === "idle" || scanState === "manual") && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center" }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" style={{ margin: "0 auto 8px", display: "block", opacity: 0.3 }}>
              <rect x="3" y="3" width="7" height="7" rx="1" stroke="#fff" strokeWidth="1.5"/>
              <rect x="14" y="3" width="7" height="7" rx="1" stroke="#fff" strokeWidth="1.5"/>
              <rect x="3" y="14" width="7" height="7" rx="1" stroke="#fff" strokeWidth="1.5"/>
              <rect x="15" y="15" width="2" height="2" fill="#fff" opacity="0.5"/>
              <rect x="19" y="15" width="2" height="2" fill="#fff" opacity="0.5"/>
              <rect x="15" y="19" width="2" height="2" fill="#fff" opacity="0.5"/>
              <rect x="19" y="19" width="2" height="2" fill="#fff" opacity="0.5"/>
            </svg>
            <p style={{ color: "#666", fontSize: 12, margin: 0 }}>Point supplier QR here</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Check-in log row ─────────────────────────────────────────────────────────
function LogRow({ entry }) {
  const ts = TIER_STYLE[entry.tier] || TIER_STYLE.Bronze;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderBottom: "1px solid #F0EFEB" }}>
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: entry.ok ? "#3B6D11" : "#A32D2D", flexShrink: 0 }} />
      <div style={{ fontSize: 12, color: "#AAA", flexShrink: 0, minWidth: 40 }}>{entry.time}</div>
      {entry.ok ? (
        <>
          <div style={{ flex: 1, fontSize: 13, fontWeight: 500, color: "#1a1a1a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.name}</div>
          <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 5, background: ts.bg, color: ts.fg, fontWeight: 600, flexShrink: 0 }}>{entry.tier}</span>
        </>
      ) : (
        <>
          <div style={{ flex: 1, fontSize: 13, color: "#A32D2D", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.reason}</div>
          <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 5, background: "#FAECE7", color: "#993C1D", fontWeight: 600, flexShrink: 0 }}>DENIED</span>
        </>
      )}
    </div>
  );
}

// ─── Main kiosk app ───────────────────────────────────────────────────────────
export default function App() {
  const [scanState, setScanState] = useState("idle");   // idle | scanning | success | error | manual
  const [result, setResult]       = useState(null);
  const [errorMsg, setErrorMsg]   = useState("");
  const [log, setLog]             = useState([
    { ok: true,  time: "08:41", name: "CV Sumber Rezeki",  tier: "Gold"   },
    { ok: true,  time: "08:19", name: "PT Global Nusa",    tier: "Silver" },
    { ok: false, time: "07:55", reason: "QR expired — issued for yesterday", tier: null },
  ]);

  const [officeCode, setOfficeCode]         = useState(DEFAULT_OFFICE_CODE);
  const [configuredCode, setConfiguredCode] = useState(DEFAULT_OFFICE_CODE);
  const [showSettings, setShowSettings]     = useState(false);
  const [newCode, setNewCode]               = useState(DEFAULT_OFFICE_CODE);
  const [showManual, setShowManual]         = useState(false);
  const [manualInput, setManualInput]       = useState("");
  const [officeInput, setOfficeInput]       = useState(DEFAULT_OFFICE_CODE);

  const resetTimer = useRef(null);

  const handleResult = useCallback((raw, inputtedOfficeCode) => {
    setScanState("scanning");
    setShowManual(false);

    setTimeout(() => {
      const val = validatePayload(raw, inputtedOfficeCode, configuredCode);
      if (val.ok) {
        setResult(val);
        setErrorMsg("");
        setScanState("success");
        setLog(l => [{ ok: true, time: timeNow(), name: val.supplier.name, tier: val.supplier.tier }, ...l.slice(0, 19)]);
      } else {
        setResult(null);
        setErrorMsg(val.reason);
        setScanState("error");
        setLog(l => [{ ok: false, time: timeNow(), reason: val.reason, tier: null }, ...l.slice(0, 19)]);
      }

      // Auto-reset after 4 seconds
      clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => {
        setScanState("idle");
        setResult(null);
        setErrorMsg("");
      }, 4000);
    }, 800);
  }, [configuredCode]);

  // Demo scans
  const demoValid = (id) => {
    setOfficeInput(configuredCode);
    handleResult(buildPayload(id), configuredCode);
  };

  const demoExpired = () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10).replace(/-/g, "");
    const fakeId = "SUP-260430-C9EF";
    const token = fnv1a(`${fakeId}|${yesterday}|${SECRET}`);
    handleResult(`${fakeId}|${yesterday}|${token}`, configuredCode);
  };

  const demoWrongCode = () => {
    handleResult(buildPayload("SUP-260502-A3BX"), "WRONG-CODE");
  };

  const submitManual = () => {
    if (!manualInput.trim()) return;
    handleResult(manualInput.trim(), officeInput);
    setManualInput("");
  };

  const saveSettings = () => {
    setConfiguredCode(newCode.trim().toUpperCase());
    setOfficeInput(newCode.trim().toUpperCase());
    setOfficeCode(newCode.trim().toUpperCase());
    setShowSettings(false);
  };

  const ts = result ? (TIER_STYLE[result.supplier.tier] || TIER_STYLE.Bronze) : null;

  return (
    <div style={{ minHeight: "100vh", background: "#111", fontFamily: "system-ui, sans-serif", color: "#fff" }}>

      {/* ── Top bar ── */}
      <div style={{ background: "#1A1A1A", borderBottom: "1px solid #2A2A2A", padding: "12px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 30, height: 30, borderRadius: 7, background: "#333", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="1" width="6" height="6" rx="1" fill="#fff" opacity="0.9"/>
              <rect x="9" y="1" width="6" height="6" rx="1" fill="#fff" opacity="0.4"/>
              <rect x="1" y="9" width="6" height="6" rx="1" fill="#fff" opacity="0.4"/>
              <rect x="9" y="9" width="6" height="6" rx="1" fill="#fff" opacity="0.4"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1 }}>SupplierIQ — Office Kiosk</div>
            <div style={{ fontSize: 10, color: "#555", marginTop: 2 }}>Receiving Desk · Jambi</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Office code pill */}
          <div style={{ background: "#2A2A2A", border: "1px solid #333", borderRadius: 8, padding: "6px 12px", display: "flex", alignItems: "center", gap: 7 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#3B6D11" }} />
            <span style={{ fontSize: 11, color: "#AAA" }}>Office code:</span>
            <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "monospace", color: "#EF9F27", letterSpacing: 1 }}>{configuredCode}</span>
          </div>

          <button onClick={() => { setShowSettings(s => !s); setNewCode(configuredCode); }}
            style={{ background: showSettings ? "#333" : "transparent", border: "1px solid #333", borderRadius: 8, padding: "7px 12px", fontSize: 12, color: "#888", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.1 3.1l1.4 1.4M11.5 11.5l1.4 1.4M3.1 12.9l1.4-1.4M11.5 4.5l1.4-1.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            Settings
          </button>
        </div>
      </div>

      {/* ── Settings panel ── */}
      {showSettings && (
        <div style={{ background: "#1E1E1E", borderBottom: "1px solid #2A2A2A", padding: "16px 24px", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#888", minWidth: 120 }}>Change office code</div>
          <input value={newCode} onChange={e => setNewCode(e.target.value.toUpperCase())}
            style={{ background: "#2A2A2A", border: "1px solid #444", borderRadius: 8, padding: "8px 12px", fontSize: 14, color: "#fff", fontFamily: "monospace", letterSpacing: 1, outline: "none", width: 160 }} />
          <button onClick={saveSettings}
            style={{ background: "#EF9F27", color: "#1a1a1a", border: "none", borderRadius: 8, padding: "8px 18px", fontSize: 13, cursor: "pointer", fontWeight: 700 }}>
            Save
          </button>
          <div style={{ fontSize: 11, color: "#555", lineHeight: 1.5 }}>
            This code acts as a second factor. Suppliers must present a valid QR <em>and</em> staff must confirm the office code matches.
          </div>
        </div>
      )}

      {/* ── Main content ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, padding: "28px 28px 20px", maxWidth: 1000, margin: "0 auto" }}>

        {/* ── Left: viewfinder + demo buttons ── */}
        <div>
          <div style={{ fontSize: 11, color: "#555", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>Scanner</div>
          <Viewfinder scanState={scanState} />

          {/* Office code entry (shown with scanner) */}
          <div style={{ marginTop: 14, background: "#1A1A1A", border: "1px solid #2A2A2A", borderRadius: 10, padding: "12px 14px" }}>
            <label style={{ fontSize: 11, color: "#555", fontWeight: 600, letterSpacing: 0.5, display: "block", marginBottom: 6 }}>OFFICE CODE (staff confirms)</label>
            <input
              value={officeInput}
              onChange={e => setOfficeInput(e.target.value.toUpperCase())}
              style={{ width: "100%", background: "#2A2A2A", border: "1px solid #444", borderRadius: 7, padding: "9px 12px", fontSize: 14, color: "#fff", fontFamily: "monospace", letterSpacing: 1, outline: "none", boxSizing: "border-box" }}
            />
          </div>

          {/* Demo buttons */}
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 11, color: "#444", fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>Demo — simulate scans</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
              {Object.entries(SUPPLIERS).slice(0, 3).map(([id, s]) => (
                <button key={id} onClick={() => demoValid(id)} disabled={scanState === "scanning"}
                  style={{ background: "#1E2A1A", border: "1px solid #2A4020", borderRadius: 8, padding: "8px 6px", fontSize: 11, color: "#63C132", cursor: "pointer", textAlign: "center", lineHeight: 1.3, opacity: scanState === "scanning" ? 0.5 : 1 }}>
                  ✓ {s.name.split(" ")[0]}<br/><span style={{ color: "#555", fontSize: 10 }}>{s.tier}</span>
                </button>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <button onClick={demoExpired} disabled={scanState === "scanning"}
                style={{ background: "#2A1A1A", border: "1px solid #4A2020", borderRadius: 8, padding: "8px", fontSize: 11, color: "#E24B4A", cursor: "pointer", opacity: scanState === "scanning" ? 0.5 : 1 }}>
                ✗ Expired QR
              </button>
              <button onClick={demoWrongCode} disabled={scanState === "scanning"}
                style={{ background: "#2A1A1A", border: "1px solid #4A2020", borderRadius: 8, padding: "8px", fontSize: 11, color: "#E24B4A", cursor: "pointer", opacity: scanState === "scanning" ? 0.5 : 1 }}>
                ✗ Wrong code
              </button>
            </div>
          </div>

          {/* Manual entry toggle */}
          <button onClick={() => { setShowManual(v => !v); setScanState(showManual ? "idle" : "manual"); }}
            style={{ marginTop: 12, width: "100%", background: "transparent", border: "1px solid #2A2A2A", borderRadius: 8, padding: "9px", fontSize: 12, color: "#555", cursor: "pointer" }}>
            {showManual ? "✕ Close manual entry" : "⌨  Manual QR entry"}
          </button>

          {showManual && (
            <div style={{ marginTop: 10, background: "#1A1A1A", border: "1px solid #333", borderRadius: 10, padding: "14px" }}>
              <div style={{ fontSize: 11, color: "#555", marginBottom: 8 }}>Paste or type QR payload (supplierId|date|token)</div>
              <input value={manualInput} onChange={e => setManualInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && submitManual()}
                placeholder="SUP-XXXXXX-XXXX|YYYYMMDD|XXXXXXXX"
                style={{ width: "100%", background: "#2A2A2A", border: "1px solid #444", borderRadius: 7, padding: "9px 12px", fontSize: 12, color: "#fff", fontFamily: "monospace", outline: "none", boxSizing: "border-box", marginBottom: 8 }} />
              <button onClick={submitManual}
                style={{ width: "100%", background: "#333", border: "none", borderRadius: 7, padding: "9px", fontSize: 13, color: "#fff", cursor: "pointer", fontWeight: 600 }}>
                Validate →
              </button>
            </div>
          )}
        </div>

        {/* ── Right: status panel ── */}
        <div>
          <div style={{ fontSize: 11, color: "#555", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>Validation Status</div>

          {/* Status card */}
          <div style={{
            background: "#1A1A1A", border: `1px solid ${scanState === "success" ? "#3B6D11" : scanState === "error" ? "#A32D2D" : "#2A2A2A"}`,
            borderRadius: 14, padding: "24px 22px", marginBottom: 16,
            transition: "border-color 0.3s",
          }}>
            {scanState === "idle" || scanState === "manual" ? (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.2 }}>⬛</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: "#444" }}>Waiting for scan</div>
                <div style={{ fontSize: 12, color: "#333", marginTop: 6 }}>Use demo buttons or manual entry below</div>
              </div>
            ) : scanState === "scanning" ? (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ fontSize: 14, color: "#EF9F27", fontWeight: 600 }}>Reading QR code<ScanDots /></div>
                <div style={{ fontSize: 12, color: "#444", marginTop: 6 }}>Verifying token + office code…</div>
              </div>
            ) : scanState === "success" && result ? (
              <div>
                {/* Supplier header */}
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18, paddingBottom: 18, borderBottom: "1px solid #2A2A2A" }}>
                  <div style={{ width: 52, height: 52, borderRadius: "50%", background: ts.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: 18, fontWeight: 700, color: ts.fg }}>
                      {result.supplier.name.split(" ").map(w => w[0]).slice(0,2).join("")}
                    </span>
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>{result.supplier.name}</div>
                    <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>PIC: {result.supplier.pic}</div>
                  </div>
                  <span style={{ marginLeft: "auto", fontSize: 12, padding: "4px 10px", borderRadius: 6, background: ts.bg, color: ts.fg, fontWeight: 700, flexShrink: 0 }}>
                    {result.supplier.tier}
                  </span>
                </div>

                {/* Validation checks */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    { label: "QR Token",     value: "Valid — matches today's hash",    ok: true },
                    { label: "Date",         value: `Today, ${new Date().toLocaleDateString("id-ID")}`, ok: true },
                    { label: "Office Code",  value: `${configuredCode} confirmed`,      ok: true },
                    { label: "Supplier ID",  value: result.supplierId,                  ok: true },
                    { label: "Category",     value: result.supplier.category,           ok: true },
                  ].map(r => (
                    <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#1A3A10", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                          <polyline points="2,6 5,9 10,3" stroke="#63C132" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: 11, color: "#555" }}>{r.label}: </span>
                        <span style={{ fontSize: 12, color: "#CCC", fontFamily: r.label === "Supplier ID" ? "monospace" : "inherit" }}>{r.value}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 18, background: "#1A3A10", border: "1px solid #2A5A18", borderRadius: 10, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <polyline points="4,12 9,17 20,6" stroke="#63C132" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#63C132" }}>Check-in approved</div>
                    <div style={{ fontSize: 11, color: "#4A8A30" }}>Logged at {timeNow()} · Proceed to delivery form</div>
                  </div>
                </div>
              </div>
            ) : scanState === "error" ? (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#2A1010", border: "1px solid #A32D2D", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <line x1="5" y1="5" x2="19" y2="19" stroke="#E24B4A" strokeWidth="2.5" strokeLinecap="round"/>
                      <line x1="19" y1="5" x2="5" y2="19" stroke="#E24B4A" strokeWidth="2.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#E24B4A" }}>Access denied</div>
                    <div style={{ fontSize: 12, color: "#664040", marginTop: 3 }}>This QR could not be validated</div>
                  </div>
                </div>

                <div style={{ background: "#2A1010", border: "1px solid #4A2020", borderRadius: 10, padding: "12px 14px", marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color: "#664040", marginBottom: 3 }}>Reason</div>
                  <div style={{ fontSize: 13, color: "#E24B4A", fontWeight: 500 }}>{errorMsg}</div>
                </div>

                <div style={{ fontSize: 12, color: "#444", lineHeight: 1.6 }}>
                  Ask the supplier to open their supplier portal to get today's fresh QR code, or use manual override below.
                </div>

                <button onClick={() => { setScanState("manual"); setShowManual(true); setResult(null); clearTimeout(resetTimer.current); }}
                  style={{ marginTop: 14, width: "100%", background: "#2A1A00", border: "1px solid #4A3000", borderRadius: 8, padding: "10px", fontSize: 12, color: "#EF9F27", cursor: "pointer", fontWeight: 600 }}>
                  ⚡ Override — Manual Entry
                </button>
              </div>
            ) : null}
          </div>

          {/* Quick how-it-works */}
          <div style={{ background: "#151515", border: "1px solid #222", borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ fontSize: 11, color: "#444", fontWeight: 600, marginBottom: 10, letterSpacing: 0.5 }}>VALIDATION STEPS</div>
            {[
              { n: "1", label: "Scan QR", desc: "Supplier presents daily QR" },
              { n: "2", label: "Token check", desc: "Hash re-derived & matched" },
              { n: "3", label: "Date check", desc: "Confirms QR is today's" },
              { n: "4", label: "Office code", desc: "Staff confirms room code" },
            ].map(s => (
              <div key={s.n} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#222", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#555" }}>{s.n}</span>
                </div>
                <div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#666" }}>{s.label} </span>
                  <span style={{ fontSize: 11, color: "#444" }}>— {s.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Check-in log ── */}
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "0 28px 32px" }}>
        <div style={{ background: "#1A1A1A", border: "1px solid #2A2A2A", borderRadius: 14, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid #2A2A2A", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#666", letterSpacing: 0.5 }}>TODAY'S CHECK-IN LOG</div>
            <div style={{ fontSize: 11, color: "#444" }}>{log.filter(l => l.ok).length} approved · {log.filter(l => !l.ok).length} denied</div>
          </div>
          {log.length === 0 ? (
            <div style={{ padding: "24px", textAlign: "center", fontSize: 13, color: "#333" }}>No check-ins yet today</div>
          ) : (
            log.slice(0, 8).map((entry, i) => <LogRow key={i} entry={entry} />)
          )}
        </div>
      </div>
    </div>
  );
}
