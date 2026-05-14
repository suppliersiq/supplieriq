import { useState, useEffect, useCallback } from "react";

// ─── Token logic (same as registration & kiosk) ───────────────────────────────
const SECRET = "SUPPLIERIQ_OFFICE_2026";
function fnv1a(str) {
  let h = 0x811c9dc5 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).toUpperCase().padStart(8, "0");
}
function todayStr() { return new Date().toISOString().slice(0,10).replace(/-/g,""); }
function getDailyToken(id) { return fnv1a(`${id}|${todayStr()}|${SECRET}`); }
function buildQRPayload(id) { return `${id}|${todayStr()}|${getDailyToken(id)}`; }
function msUntilMidnight() {
  const now = new Date(), mid = new Date(now);
  mid.setHours(24,0,0,0);
  return mid - now;
}
function formatCountdown(ms) {
  const s = Math.floor(ms/1000);
  return `${Math.floor(s/3600).toString().padStart(2,"0")}:${Math.floor((s%3600)/60).toString().padStart(2,"0")}:${(s%60).toString().padStart(2,"0")}`;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const TIER_CONFIG = {
  Bronze: { min:0,  max:59, next:"Silver", nextMin:60, color:"#D85A30", bg:"#FAECE7", fg:"#993C1D", emoji:"🥉" },
  Silver: { min:60, max:79, next:"Gold",   nextMin:80, color:"#888780", bg:"#EDEDEB", fg:"#5F5E5A", emoji:"🥈" },
  Gold:   { min:80, max:100,next:null,     nextMin:null,color:"#EF9F27",bg:"#FAEEDA", fg:"#854F0B", emoji:"🥇" },
};

const STATUS_STYLE = {
  achieved: { bg:"#E6F1FB", fg:"#185FA5", bar:"#378ADD", label:"Achieved"  },
  on_track: { bg:"#EAF3DE", fg:"#3B6D11", bar:"#639922", label:"On Track"  },
  at_risk:  { bg:"#FAEEDA", fg:"#854F0B", bar:"#EF9F27", label:"At Risk"   },
  missed:   { bg:"#FAECE7", fg:"#993C1D", bar:"#D85A30", label:"Missed"    },
};

const TARGET_ICONS = {
  delivery_volume:"📦", quality_score:"⭐", fulfillment_rate:"✅",
  pricing_score:"💰", compliance_score:"📋", on_time_deliveries:"⏱",
};

function deriveStatus(current, target, daysLeft) {
  const p = Math.min(100, (current/target)*100);
  if (p >= 100) return "achieved";
  if (p >= 70 || (daysLeft > 15 && p >= 40)) return "on_track";
  if (p >= 40 || daysLeft > 5) return "at_risk";
  return "missed";
}
function pct(c,t) { return Math.min(100, Math.round((c/t)*100)); }

// ─── Mock logged-in supplier ──────────────────────────────────────────────────
const SUPPLIER = {
  id:       "SUP-260502-A3BX",
  name:     "PT Maju Jaya",
  pic:      "Budi Santoso",
  email:    "budi@ptmajujaya.co.id",
  phone:    "+62 812-3456-7890",
  category: "Food & Beverage",
  tier:     "Gold",
  avgScore: 91,
  joinedDate: "2025-03-15",
};

const MY_TARGETS = [
  { id:"T-001", type:"delivery_volume",  label:"Monthly Deliveries", target:20, current:18, unit:"deliveries", period:"May 2026", daysLeft:28 },
  { id:"T-002", type:"quality_score",    label:"Quality Score",      target:85, current:91, unit:"/ 100",      period:"May 2026", daysLeft:28 },
  { id:"T-003", type:"fulfillment_rate", label:"Fulfillment Rate",   target:90, current:94, unit:"%",          period:"May 2026", daysLeft:28 },
];

const MY_DELIVERIES = [
  { ref:"DEL-260502-A1B2", date:"02 May 2026", goods:"Frozen Chicken 25kg",    qty:"50 Kg",  sj:"SJ-2026-0088", status:"received" },
  { ref:"DEL-260430-C3D4", date:"30 Apr 2026", goods:"Fresh Vegetables Mixed", qty:"12 Box", sj:"SJ-2026-0081", status:"received" },
  { ref:"DEL-260428-E5F6", date:"28 Apr 2026", goods:"Cooking Oil 5L",         qty:"24 Pcs", sj:"SJ-2026-0074", status:"received" },
  { ref:"DEL-260425-G7H8", date:"25 Apr 2026", goods:"Flour 25kg Bags",        qty:"8 Sack", sj:"SJ-2026-0069", status:"received" },
  { ref:"DEL-260422-I9J0", date:"22 Apr 2026", goods:"Spices & Condiments",    qty:"15 Box", sj:"SJ-2026-0062", status:"received" },
];

const SCORE_CATEGORIES = [
  { label:"Quality",     score:92, color:"#378ADD" },
  { label:"Pricing",     score:85, color:"#1D9E75" },
  { label:"Fulfillment", score:94, color:"#639922" },
  { label:"Compliance",  score:91, color:"#D4537E" },
];

// ─── Tier benefits per tier ───────────────────────────────────────────────────
const TIER_BENEFITS = {
  Bronze: ["Access to basic supplier portal","Standard payment terms (30 days)","Monthly performance report"],
  Silver: ["All Bronze benefits","Priority scheduling at receiving dock","Faster payment terms (21 days)","Quarterly performance review","Dedicated account contact"],
  Gold:   ["All Silver benefits","Premium pricing tier access","Fastest payment terms (14 days)","Monthly business review","Early access to new product opportunities","Featured supplier status"],
};

// ─── QR Tab ───────────────────────────────────────────────────────────────────
function QRTab({ supplier }) {
  const [countdown, setCountdown] = useState(msUntilMidnight());
  const [qrReady, setQrReady]     = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const drawQR = useCallback(() => {
    setQrReady(false);
    const payload = buildQRPayload(supplier.id);
    const draw = () => {
      const canvas = document.getElementById("portal-qr");
      if (!canvas || !window.QRCode) return;
      window.QRCode.toCanvas(canvas, payload, { width: 220, margin: 2, color: { dark:"#1a1a1a", light:"#FFFFFF" } }, err => { if (!err) setQrReady(true); });
    };
    if (window.QRCode) { draw(); return; }
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js";
    s.onload = draw;
    document.head.appendChild(s);
  }, [supplier.id, refreshKey]);

  useEffect(() => { drawQR(); }, [drawQR]);

  useEffect(() => {
    const t = setInterval(() => {
      const ms = msUntilMidnight();
      setCountdown(ms);
      if (ms < 1000) setRefreshKey(k => k+1);
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const download = () => {
    const c = document.getElementById("portal-qr");
    if (!c) return;
    const a = document.createElement("a");
    a.download = `${supplier.id}-${todayStr()}.png`;
    a.href = c.toDataURL();
    a.click();
  };

  return (
    <div style={{ maxWidth: 440, margin: "0 auto" }}>
      {/* Main QR card */}
      <div style={{ background:"#fff", border:"1px solid #E8E7E3", borderRadius:16, padding:"32px 28px", textAlign:"center", marginBottom:14 }}>
        <div style={{ fontSize:15, fontWeight:700, color:"#1a1a1a", marginBottom:4 }}>Today's Access QR</div>
        <div style={{ fontSize:12, color:"#AAA", marginBottom:24, lineHeight:1.5 }}>
          Show this code at the receiving desk. It's valid only today and auto-refreshes at midnight.
        </div>

        {/* QR */}
        <div style={{ position:"relative", display:"inline-block", marginBottom:18 }}>
          <div style={{ background:"#F8F7F4", borderRadius:14, padding:20 }}>
            <canvas id="portal-qr" style={{ display:"block" }} />
            {!qrReady && <div style={{ width:220, height:220, display:"flex", alignItems:"center", justifyContent:"center", color:"#CCC", fontSize:12 }}>Generating…</div>}
          </div>
          <div style={{ position:"absolute", top:-10, right:-10, background:"#1a1a1a", color:"#fff", fontSize:10, fontWeight:700, padding:"4px 9px", borderRadius:20, letterSpacing:0.3 }}>DAILY</div>
        </div>

        {/* Countdown */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:7, background:"#FFFBF0", border:"1px solid #FAEEDA", borderRadius:10, padding:"10px 16px", marginBottom:18 }}>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6.5" stroke="#BA7517" strokeWidth="1.3"/>
            <polyline points="8,4.5 8,8.5 10.5,10.5" stroke="#BA7517" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontSize:12, color:"#BA7517", fontWeight:500 }}>
            Expires in <strong style={{ fontFamily:"monospace", letterSpacing:0.5 }}>{formatCountdown(countdown)}</strong>
          </span>
        </div>

        {/* Supplier ID */}
        <div style={{ background:"#F8F7F4", borderRadius:10, padding:"10px 16px", marginBottom:20 }}>
          <div style={{ fontSize:10, color:"#AAA", letterSpacing:0.8, textTransform:"uppercase", marginBottom:3 }}>Supplier ID</div>
          <div style={{ fontSize:15, fontWeight:700, fontFamily:"monospace", color:"#1a1a1a", letterSpacing:1.5 }}>{supplier.id}</div>
        </div>

        <button onClick={download} style={{ width:"100%", background:"#1a1a1a", color:"#fff", border:"none", borderRadius:9, padding:"13px", fontSize:14, cursor:"pointer", fontWeight:600 }}>
          ↓ Download QR
        </button>
      </div>

      {/* Instructions card */}
      <div style={{ background:"#fff", border:"1px solid #E8E7E3", borderRadius:12, padding:"16px 18px" }}>
        <div style={{ fontSize:12, fontWeight:700, color:"#888", marginBottom:12 }}>HOW TO USE</div>
        {[
          ["Open this page", "Access your portal on the day of your visit"],
          ["Show QR at the desk", "Our staff will scan it at the receiving area"],
          ["Confirm office code", "Staff will verify the secondary office code"],
          ["Fill delivery form", "Log what you're delivering on the tablet"],
        ].map(([title, desc], i) => (
          <div key={i} style={{ display:"flex", gap:12, marginBottom:i < 3 ? 12 : 0, alignItems:"flex-start" }}>
            <div style={{ width:22, height:22, borderRadius:"50%", background:"#F0EFEB", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:1 }}>
              <span style={{ fontSize:11, fontWeight:700, color:"#888" }}>{i+1}</span>
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:500, color:"#1a1a1a" }}>{title}</div>
              <div style={{ fontSize:11, color:"#AAA", marginTop:1 }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Targets Tab ──────────────────────────────────────────────────────────────
function TargetsTab() {
  const overall = MY_TARGETS.reduce((sum, t) => sum + pct(t.current, t.target), 0) / MY_TARGETS.length;

  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      {/* Overall progress */}
      <div style={{ background:"#fff", border:"1px solid #E8E7E3", borderRadius:14, padding:"22px 24px", marginBottom:14 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:"#1a1a1a" }}>May 2026 Targets</div>
            <div style={{ fontSize:12, color:"#AAA", marginTop:2 }}>28 days remaining in this period</div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:26, fontWeight:700, color:"#1a1a1a" }}>{Math.round(overall)}%</div>
            <div style={{ fontSize:11, color:"#AAA" }}>overall</div>
          </div>
        </div>

        {/* Overall bar */}
        <div style={{ height:10, borderRadius:10, background:"#F0EFEB", overflow:"hidden", marginBottom:6 }}>
          <div style={{ height:"100%", width:`${overall}%`, borderRadius:10, background: overall >= 100 ? "#378ADD" : overall >= 70 ? "#639922" : overall >= 40 ? "#EF9F27" : "#D85A30", transition:"width 0.5s" }} />
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:"#CCC" }}>
          <span>0%</span><span>50%</span><span>100%</span>
        </div>
      </div>

      {/* Individual targets */}
      {MY_TARGETS.map(t => {
        const status = deriveStatus(t.current, t.target, t.daysLeft);
        const ss = STATUS_STYLE[status];
        const p = pct(t.current, t.target);
        const icon = TARGET_ICONS[t.type] || "🎯";
        const remaining = Math.max(0, t.target - t.current);

        return (
          <div key={t.id} style={{ background:"#fff", border:"1px solid #E8E7E3", borderRadius:14, padding:"20px 22px", marginBottom:12 }}>
            <div style={{ display:"flex", alignItems:"flex-start", gap:12, marginBottom:14 }}>
              <span style={{ fontSize:22, flexShrink:0 }}>{icon}</span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:4 }}>
                  <span style={{ fontSize:14, fontWeight:700, color:"#1a1a1a" }}>{t.label}</span>
                  <span style={{ fontSize:11, padding:"2px 8px", borderRadius:5, background:ss.bg, color:ss.fg, fontWeight:600 }}>{ss.label}</span>
                </div>
                <div style={{ fontSize:12, color:"#AAA" }}>{t.period} · {t.daysLeft} days left</div>
              </div>
              <div style={{ textAlign:"right", flexShrink:0 }}>
                <div style={{ fontSize:22, fontWeight:700, color:ss.bar }}>{p}%</div>
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ height:10, borderRadius:10, background:"#F0EFEB", overflow:"hidden", marginBottom:10 }}>
              <div style={{ height:"100%", width:`${p}%`, borderRadius:10, background:ss.bar, transition:"width 0.5s" }} />
            </div>

            {/* Stats row */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
              {[
                { label:"Current",   value:`${t.current} ${t.unit}`, highlight:true, color:ss.bar },
                { label:"Target",    value:`${t.target} ${t.unit}`,  highlight:false },
                { label:"Remaining", value:remaining > 0 ? `${remaining} ${t.unit}` : "Done ✓", highlight: remaining === 0, color:"#3B6D11" },
              ].map(s => (
                <div key={s.label} style={{ background:"#F8F7F4", borderRadius:8, padding:"10px 12px", textAlign:"center" }}>
                  <div style={{ fontSize:12, fontWeight:700, color: s.color || "#1a1a1a" }}>{s.value}</div>
                  <div style={{ fontSize:10, color:"#AAA", marginTop:2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <div style={{ padding:"14px 16px", background:"#F8F7F4", border:"1px solid #E8E7E3", borderRadius:10, fontSize:12, color:"#AAA", display:"flex", gap:8 }}>
        <span>💡</span>
        <span>Targets are set by our team and updated as you make deliveries. Contact your account manager if you have questions.</span>
      </div>
    </div>
  );
}

// ─── Tier Tab ─────────────────────────────────────────────────────────────────
function TierTab({ supplier }) {
  const tier    = TIER_CONFIG[supplier.tier];
  const score   = supplier.avgScore;
  const [hovered, setHovered] = useState(null);

  // Progress to next tier
  const progressToNext = tier.next
    ? Math.min(100, Math.round(((score - tier.min) / (tier.nextMin - tier.min)) * 100))
    : 100;

  return (
    <div style={{ maxWidth: 580, margin: "0 auto" }}>
      {/* Current tier card */}
      <div style={{ background:"#fff", border:`2px solid ${tier.color}`, borderRadius:16, padding:"28px 28px", marginBottom:14, textAlign:"center" }}>
        <div style={{ fontSize:48, marginBottom:8 }}>{tier.emoji}</div>
        <div style={{ fontSize:24, fontWeight:800, color:tier.fg, marginBottom:4 }}>{supplier.tier} Supplier</div>
        <div style={{ fontSize:13, color:"#888", marginBottom:20 }}>Average score: <strong style={{ color:"#1a1a1a" }}>{score}/100</strong></div>

        {/* Score breakdown */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:20 }}>
          {SCORE_CATEGORIES.map(c => (
            <div key={c.label} style={{ background:"#F8F7F4", borderRadius:10, padding:"12px 14px", textAlign:"left" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                <span style={{ fontSize:12, color:"#888" }}>{c.label}</span>
                <span style={{ fontSize:13, fontWeight:700, color:c.color }}>{c.score}</span>
              </div>
              <div style={{ height:5, borderRadius:5, background:"#EBEBEB" }}>
                <div style={{ height:"100%", width:`${c.score}%`, borderRadius:5, background:c.color }} />
              </div>
            </div>
          ))}
        </div>

        {/* Progress to next tier */}
        {tier.next ? (
          <div style={{ background:"#F8F7F4", borderRadius:12, padding:"16px 18px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
              <span style={{ fontSize:12, color:"#888" }}>Progress to <strong>{tier.next}</strong></span>
              <span style={{ fontSize:12, fontWeight:700, color:"#1a1a1a" }}>{progressToNext}%</span>
            </div>
            <div style={{ height:8, borderRadius:8, background:"#E8E7E3", overflow:"hidden", marginBottom:8 }}>
              <div style={{ height:"100%", width:`${progressToNext}%`, borderRadius:8, background: TIER_CONFIG[tier.next].color, transition:"width 0.5s" }} />
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"#AAA" }}>
              <span>Current: {score}</span>
              <span>{tier.next} tier at {tier.nextMin}+</span>
            </div>
            {score >= tier.nextMin - 5 && (
              <div style={{ marginTop:10, padding:"8px 12px", background:"#EAF3DE", borderRadius:8, fontSize:12, color:"#3B6D11", fontWeight:500 }}>
                🎉 You're almost {tier.next}! Just {tier.nextMin - score} more points needed.
              </div>
            )}
          </div>
        ) : (
          <div style={{ background:"#FAEEDA", border:"1px solid #FAC775", borderRadius:12, padding:"14px 18px" }}>
            <div style={{ fontSize:13, fontWeight:700, color:"#854F0B" }}>🏆 You've reached the highest tier!</div>
            <div style={{ fontSize:12, color:"#BA7517", marginTop:4 }}>Maintain your score above 80 to keep your Gold status.</div>
          </div>
        )}
      </div>

      {/* Tier comparison */}
      <div style={{ background:"#fff", border:"1px solid #E8E7E3", borderRadius:14, overflow:"hidden", marginBottom:14 }}>
        <div style={{ padding:"14px 18px", borderBottom:"1px solid #F0EFEB" }}>
          <div style={{ fontSize:13, fontWeight:700, color:"#1a1a1a" }}>Tier Comparison</div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr" }}>
          {["Bronze","Silver","Gold"].map(t => {
            const tc = TIER_CONFIG[t];
            const isActive = t === supplier.tier;
            return (
              <div key={t} onMouseEnter={() => setHovered(t)} onMouseLeave={() => setHovered(null)}
                style={{ padding:"18px 16px", borderRight: t !== "Gold" ? "1px solid #F0EFEB" : "none", background: isActive ? tc.bg : hovered === t ? "#FAFAF8" : "#fff", transition:"background 0.15s", cursor:"default" }}>
                <div style={{ textAlign:"center", marginBottom:12 }}>
                  <div style={{ fontSize:24, marginBottom:4 }}>{tc.emoji}</div>
                  <div style={{ fontSize:13, fontWeight:700, color:tc.fg }}>{t}</div>
                  <div style={{ fontSize:10, color:"#AAA", marginTop:1 }}>{tc.min}–{tc.max} pts</div>
                  {isActive && <div style={{ marginTop:5, fontSize:10, padding:"2px 8px", background:tc.bg, color:tc.fg, borderRadius:10, fontWeight:700, display:"inline-block" }}>CURRENT</div>}
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  {TIER_BENEFITS[t].slice(0,3).map((b,i) => (
                    <div key={i} style={{ display:"flex", gap:5, alignItems:"flex-start" }}>
                      <span style={{ fontSize:10, color: isActive ? tc.fg : "#CCC", marginTop:1, flexShrink:0 }}>✓</span>
                      <span style={{ fontSize:10, color: isActive ? "#555" : "#BBB", lineHeight:1.4 }}>{b}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Current benefits */}
      <div style={{ background:"#fff", border:"1px solid #E8E7E3", borderRadius:14, padding:"18px 20px" }}>
        <div style={{ fontSize:13, fontWeight:700, color:"#1a1a1a", marginBottom:14 }}>Your {supplier.tier} Benefits</div>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {TIER_BENEFITS[supplier.tier].map((b, i) => (
            <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
              <div style={{ width:20, height:20, borderRadius:"50%", background:tier.bg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:1 }}>
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                  <polyline points="2,6 5,9 10,3" stroke={tier.fg} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span style={{ fontSize:13, color:"#333", lineHeight:1.5 }}>{b}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── History Tab ──────────────────────────────────────────────────────────────
function HistoryTab() {
  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <div style={{ background:"#fff", border:"1px solid #E8E7E3", borderRadius:14, overflow:"hidden", marginBottom:14 }}>
        <div style={{ padding:"14px 20px", borderBottom:"1px solid #F0EFEB", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontSize:13, fontWeight:700, color:"#1a1a1a" }}>Delivery History</div>
          <span style={{ fontSize:11, color:"#AAA" }}>Last 5 deliveries</span>
        </div>
        {MY_DELIVERIES.map((d, i) => (
          <div key={d.ref} style={{ padding:"14px 20px", borderBottom: i < MY_DELIVERIES.length-1 ? "1px solid #F5F4F0" : "none" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:4 }}>
              <div>
                <div style={{ fontSize:13, fontWeight:500, color:"#1a1a1a" }}>{d.goods}</div>
                <div style={{ fontSize:11, color:"#AAA", marginTop:2 }}>{d.date} · SJ: {d.sj}</div>
              </div>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4 }}>
                <span style={{ fontSize:12, fontWeight:600, color:"#1a1a1a" }}>{d.qty}</span>
                <span style={{ fontSize:10, padding:"2px 7px", borderRadius:5, background:"#EAF3DE", color:"#3B6D11", fontWeight:600 }}>Received</span>
              </div>
            </div>
            <div style={{ fontSize:11, fontFamily:"monospace", color:"#CCC", marginTop:4 }}>{d.ref}</div>
          </div>
        ))}
      </div>

      {/* Monthly summary */}
      <div style={{ background:"#fff", border:"1px solid #E8E7E3", borderRadius:14, padding:"18px 20px" }}>
        <div style={{ fontSize:13, fontWeight:700, color:"#1a1a1a", marginBottom:14 }}>May 2026 Summary</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
          {[
            { label:"Deliveries",   value:"18",  sub:"of 20 target",  color:"#1a1a1a" },
            { label:"Total Items",  value:"284", sub:"units delivered",color:"#1a1a1a" },
            { label:"On-Time Rate", value:"94%", sub:"above 90% target",color:"#3B6D11" },
          ].map(s => (
            <div key={s.label} style={{ background:"#F8F7F4", borderRadius:10, padding:"14px 14px", textAlign:"center" }}>
              <div style={{ fontSize:22, fontWeight:700, color:s.color, marginBottom:2 }}>{s.value}</div>
              <div style={{ fontSize:11, fontWeight:500, color:"#888" }}>{s.label}</div>
              <div style={{ fontSize:10, color:"#BBB", marginTop:2 }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main portal ──────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("qr");
  const supplier = SUPPLIER;
  const tier = TIER_CONFIG[supplier.tier];

  const tabs = [
    { id:"qr",      label:"My QR Code",  icon:"⬛" },
    { id:"targets", label:"My Targets",  icon:"🎯" },
    { id:"tier",    label:"My Tier",     icon:tier.emoji },
    { id:"history", label:"History",     icon:"📄" },
  ];

  return (
    <div style={{ minHeight:"100vh", background:"#F8F7F4", fontFamily:"system-ui, sans-serif" }}>

      {/* ── Header ── */}
      <div style={{ background:"#fff", borderBottom:"1px solid #E8E7E3" }}>
        <div style={{ maxWidth:720, margin:"0 auto", padding:"16px 24px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:44, height:44, borderRadius:"50%", background:tier.bg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <span style={{ fontSize:15, fontWeight:800, color:tier.fg }}>
                  {supplier.name.split(" ").map(w=>w[0]).slice(0,2).join("")}
                </span>
              </div>
              <div>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:16, fontWeight:700, color:"#1a1a1a" }}>{supplier.name}</span>
                  <span style={{ fontSize:11, padding:"2px 9px", borderRadius:6, background:tier.bg, color:tier.fg, fontWeight:700 }}>{tier.emoji} {supplier.tier}</span>
                </div>
                <div style={{ fontSize:12, color:"#AAA", marginTop:1 }}>PIC: {supplier.pic} · {supplier.id}</div>
              </div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:22, fontWeight:800, color:"#1a1a1a" }}>{supplier.avgScore}</div>
              <div style={{ fontSize:10, color:"#AAA" }}>avg score</div>
            </div>
          </div>
        </div>

        {/* Tab nav */}
        <div style={{ maxWidth:720, margin:"0 auto", padding:"0 24px", display:"flex", gap:2 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{
                background:"transparent", border:"none", cursor:"pointer",
                padding:"12px 16px", fontSize:13, fontWeight: tab === t.id ? 600 : 400,
                color: tab === t.id ? "#1a1a1a" : "#888",
                borderBottom: tab === t.id ? "2px solid #1a1a1a" : "2px solid transparent",
                display:"flex", alignItems:"center", gap:6,
                transition:"color 0.15s",
              }}>
              <span style={{ fontSize:14 }}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ── */}
      <div style={{ maxWidth:720, margin:"0 auto", padding:"28px 24px" }}>
        {tab === "qr"      && <QRTab      supplier={supplier} />}
        {tab === "targets" && <TargetsTab />}
        {tab === "tier"    && <TierTab    supplier={supplier} />}
        {tab === "history" && <HistoryTab />}
      </div>
    </div>
  );
}
