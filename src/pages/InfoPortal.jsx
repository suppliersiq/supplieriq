import { useState } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────
const TIER_STYLE = {
  Gold:   { bg:"#FAEEDA", fg:"#854F0B", border:"#FAC775", dot:"#EF9F27", emoji:"🥇" },
  Silver: { bg:"#EDEDEB", fg:"#5F5E5A", border:"#D3D1C7", dot:"#888780", emoji:"🥈" },
  Bronze: { bg:"#FAECE7", fg:"#993C1D", border:"#F5C4B3", dot:"#D85A30", emoji:"🥉" },
};

const ANNOUNCEMENT_TYPES = {
  info:    { bg:"#E6F1FB", border:"#B5D4F4", fg:"#185FA5", icon:"ℹ",  label:"Info"        },
  promo:   { bg:"#FAEEDA", border:"#FAC775", fg:"#854F0B", icon:"🎁", label:"Promotion"   },
  warning: { bg:"#FAECE7", border:"#F5C4B3", fg:"#993C1D", icon:"⚠",  label:"Important"   },
  success: { bg:"#EAF3DE", border:"#C0DD97", fg:"#3B6D11", icon:"✓",  label:"Announcement"},
};

// ─── Tier order for visibility logic ─────────────────────────────────────────
const TIER_RANK = { Bronze: 0, Silver: 1, Gold: 2 };

// ─── Mock pricing data ────────────────────────────────────────────────────────
const PRICING_CATEGORIES = [
  {
    id: "payment",
    label: "Payment Terms",
    icon: "💳",
    desc: "Invoice settlement period after delivery confirmation",
    items: [
      { name: "Standard Invoice",       Bronze:"Net 30 days",  Silver:"Net 21 days",  Gold:"Net 14 days"  },
      { name: "Early Payment Discount", Bronze:"—",            Silver:"1.5% if < 14d",Gold:"2% if < 7d"   },
      { name: "Payment Method",         Bronze:"Bank transfer",Silver:"Bank / virtual",Gold:"All methods"  },
    ],
  },
  {
    id: "pricing",
    label: "Purchase Price Tier",
    icon: "💰",
    desc: "Base pricing applied to your purchase orders",
    items: [
      { name: "Standard goods",         Bronze:"List price",   Silver:"List − 3%",    Gold:"List − 7%"    },
      { name: "Bulk order (>50 units)",  Bronze:"List − 1%",   Silver:"List − 5%",    Gold:"List − 10%"   },
      { name: "Seasonal items",          Bronze:"List price",  Silver:"List − 2%",    Gold:"List − 5%"    },
      { name: "Contract pricing",        Bronze:"Not eligible",Silver:"On request",    Gold:"Included"     },
    ],
  },
  {
    id: "logistics",
    label: "Logistics & Scheduling",
    icon: "🚚",
    desc: "Receiving dock priority and scheduling access",
    items: [
      { name: "Dock scheduling",         Bronze:"Walk-in only", Silver:"Pre-book 1 day",Gold:"Pre-book 7 days"},
      { name: "Receiving priority",      Bronze:"Standard queue",Silver:"Priority lane", Gold:"Dedicated lane"},
      { name: "Emergency delivery slot", Bronze:"Not available",Silver:"On request",     Gold:"Guaranteed"   },
      { name: "Weekend delivery",        Bronze:"Not available",Silver:"Not available",  Gold:"Available"    },
    ],
  },
  {
    id: "support",
    label: "Account Support",
    icon: "🤝",
    desc: "Dedicated support and account management services",
    items: [
      { name: "Account manager",         Bronze:"General line", Silver:"Named contact",  Gold:"Dedicated AM" },
      { name: "Performance review",      Bronze:"Annual",       Silver:"Quarterly",      Gold:"Monthly"      },
      { name: "Portal access",           Bronze:"Basic",        Silver:"Standard",       Gold:"Full"         },
      { name: "Early tender access",     Bronze:"Not eligible", Silver:"Not eligible",   Gold:"Included"     },
    ],
  },
];

// ─── Initial announcements ────────────────────────────────────────────────────
const INIT_ANNOUNCEMENTS = [
  { id:"ann-1", type:"promo",   title:"Ramadan Season Bonus",         body:"All Gold suppliers delivering during 25 Mar – 5 Apr will receive an additional 1% discount on all food & beverage categories. No action needed — will be applied automatically to your invoices.", pinned:true,  createdAt:"01 May 2026" },
  { id:"ann-2", type:"info",    title:"New Receiving Hours — May 2026",body:"Effective May 5, receiving desk hours are extended to 07:00–18:00 Monday through Saturday. Sunday remains closed. Please plan your deliveries accordingly.", pinned:false, createdAt:"28 Apr 2026" },
  { id:"ann-3", type:"warning", title:"Compliance Docs Due 31 May",    body:"All suppliers must re-submit updated NPWP and business license documents by 31 May 2026. Suppliers missing this deadline will be temporarily suspended until documents are received.", pinned:false, createdAt:"20 Apr 2026" },
];

function genId() { return "ann-" + Math.random().toString(36).slice(2,8); }

// ─── Announcement card ────────────────────────────────────────────────────────
function AnnouncementCard({ ann, isAdmin, onEdit, onDelete, onPin }) {
  const at = ANNOUNCEMENT_TYPES[ann.type];
  return (
    <div style={{ background:at.bg, border:`1px solid ${at.border}`, borderRadius:12, padding:"16px 18px", marginBottom:12, position:"relative" }}>
      {ann.pinned && (
        <div style={{ position:"absolute", top:-8, left:16, background:at.fg, color:"#fff", fontSize:10, fontWeight:700, padding:"2px 9px", borderRadius:10, letterSpacing:0.3 }}>
          📌 PINNED
        </div>
      )}
      <div style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
        <span style={{ fontSize:18, flexShrink:0, marginTop:1 }}>{at.icon}</span>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:4 }}>
            <span style={{ fontSize:13, fontWeight:700, color:at.fg }}>{ann.title}</span>
            <span style={{ fontSize:10, padding:"2px 7px", background:"rgba(255,255,255,0.5)", borderRadius:4, color:at.fg, fontWeight:600 }}>{at.label}</span>
          </div>
          <p style={{ fontSize:13, color:"#444", margin:"0 0 8px", lineHeight:1.6 }}>{ann.body}</p>
          <span style={{ fontSize:11, color:"#888" }}>Posted {ann.createdAt}</span>
        </div>
        {isAdmin && (
          <div style={{ display:"flex", gap:5, flexShrink:0 }}>
            <button onClick={() => onPin(ann.id)} title={ann.pinned ? "Unpin" : "Pin"}
              style={{ background:"rgba(255,255,255,0.5)", border:`1px solid ${at.border}`, borderRadius:6, padding:"4px 8px", fontSize:11, cursor:"pointer", color:at.fg }}>
              {ann.pinned ? "Unpin" : "📌"}
            </button>
            <button onClick={() => onEdit(ann)}
              style={{ background:"rgba(255,255,255,0.5)", border:`1px solid ${at.border}`, borderRadius:6, padding:"4px 8px", fontSize:11, cursor:"pointer", color:at.fg }}>Edit</button>
            <button onClick={() => onDelete(ann.id)}
              style={{ background:"rgba(255,255,255,0.5)", border:`1px solid ${at.border}`, borderRadius:6, padding:"4px 8px", fontSize:11, cursor:"pointer", color:at.fg }}>✕</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Announcement form ────────────────────────────────────────────────────────
function AnnouncementForm({ editing, onSave, onCancel }) {
  const [type,  setType]  = useState(editing?.type  || "info");
  const [title, setTitle] = useState(editing?.title || "");
  const [body,  setBody]  = useState(editing?.body  || "");
  const [pinned, setPinned] = useState(editing?.pinned || false);
  const [visibleTo, setVisibleTo] = useState(editing?.visibleTo || "All");

  const at = ANNOUNCEMENT_TYPES[type];
  const canSave = title.trim() && body.trim();

  return (
    <div style={{ background:"#fff", border:"1px solid #E8E7E3", borderRadius:12, padding:"20px 20px", marginBottom:16 }}>
      <div style={{ fontSize:13, fontWeight:700, color:"#1a1a1a", marginBottom:14 }}>
        {editing ? "Edit Announcement" : "New Announcement"}
      </div>

      <div style={{ display:"grid", gap:12 }}>
        {/* Type selector */}
        <div>
          <label style={{ display:"block", fontSize:11, fontWeight:600, color:"#888", marginBottom:6 }}>TYPE</label>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {Object.entries(ANNOUNCEMENT_TYPES).map(([key, val]) => (
              <button key={key} onClick={() => setType(key)}
                style={{ padding:"6px 14px", borderRadius:8, border:`1px solid ${type === key ? val.fg : "#E0DFD9"}`, background: type === key ? val.bg : "#fff", color: type === key ? val.fg : "#888", fontSize:12, cursor:"pointer", fontWeight: type === key ? 700 : 400, display:"flex", alignItems:"center", gap:5 }}>
                <span>{val.icon}</span> {val.label}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label style={{ display:"block", fontSize:11, fontWeight:600, color:"#888", marginBottom:6 }}>TITLE <span style={{ color:"#C0392B" }}>*</span></label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. New pricing effective June 2026"
            style={{ width:"100%", padding:"10px 12px", border:"1px solid #E0DFD9", borderRadius:8, fontSize:13, boxSizing:"border-box", outline:"none" }} />
        </div>

        {/* Body */}
        <div>
          <label style={{ display:"block", fontSize:11, fontWeight:600, color:"#888", marginBottom:6 }}>MESSAGE <span style={{ color:"#C0392B" }}>*</span></label>
          <textarea value={body} onChange={e => setBody(e.target.value)} rows={4}
            placeholder="Write your announcement here. Be clear and specific — suppliers will see this on their portal."
            style={{ width:"100%", padding:"10px 12px", border:"1px solid #E0DFD9", borderRadius:8, fontSize:13, boxSizing:"border-box", outline:"none", resize:"vertical", fontFamily:"inherit", lineHeight:1.6 }} />
          <div style={{ display:"flex", justifyContent:"flex-end", marginTop:3 }}>
            <span style={{ fontSize:10, color:body.length > 400 ? "#C0392B" : "#BBB" }}>{body.length}/500</span>
          </div>
        </div>

        {/* Options row */}
        <div style={{ display:"flex", gap:16, alignItems:"center", flexWrap:"wrap" }}>
          {/* Visible to */}
          <div style={{ flex:1, minWidth:140 }}>
            <label style={{ display:"block", fontSize:11, fontWeight:600, color:"#888", marginBottom:6 }}>VISIBLE TO</label>
            <select value={visibleTo} onChange={e => setVisibleTo(e.target.value)}
              style={{ width:"100%", padding:"9px 11px", border:"1px solid #E0DFD9", borderRadius:8, fontSize:13, background:"#fff", outline:"none" }}>
              <option value="All">All Suppliers</option>
              <option value="Gold">Gold only</option>
              <option value="Silver">Silver & above</option>
              <option value="Bronze">Bronze only</option>
            </select>
          </div>

          {/* Pin toggle */}
          <div style={{ display:"flex", alignItems:"center", gap:8, paddingTop:18 }}>
            <div onClick={() => setPinned(v => !v)} style={{ width:34, height:19, borderRadius:10, background: pinned ? "#1a1a1a" : "#D8D7D3", cursor:"pointer", position:"relative", transition:"background 0.2s" }}>
              <div style={{ position:"absolute", width:15, height:15, borderRadius:"50%", background:"#fff", top:2, left: pinned ? 17 : 2, transition:"left 0.18s" }} />
            </div>
            <span style={{ fontSize:12, color:"#888" }}>Pin to top</span>
          </div>
        </div>

        {/* Preview */}
        {(title || body) && (
          <div>
            <div style={{ fontSize:11, fontWeight:600, color:"#AAA", marginBottom:6 }}>PREVIEW</div>
            <div style={{ background:at.bg, border:`1px solid ${at.border}`, borderRadius:10, padding:"12px 14px" }}>
              <div style={{ fontSize:12, fontWeight:700, color:at.fg, marginBottom:3 }}>{at.icon} {title || "Title…"}</div>
              <div style={{ fontSize:12, color:"#555", lineHeight:1.5 }}>{body || "Message…"}</div>
            </div>
          </div>
        )}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginTop:16 }}>
        <button onClick={onCancel} style={{ background:"transparent", color:"#888", border:"1px solid #E0DFD9", borderRadius:8, padding:"10px", fontSize:13, cursor:"pointer" }}>Cancel</button>
        <button onClick={() => canSave && onSave({ id: editing?.id || genId(), type, title:title.trim(), body:body.trim(), pinned, visibleTo, createdAt: new Date().toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}) })}
          disabled={!canSave}
          style={{ background: canSave ? "#1a1a1a" : "#E8E7E3", color: canSave ? "#fff" : "#BBB", border:"none", borderRadius:8, padding:"10px", fontSize:13, cursor: canSave ? "pointer" : "default", fontWeight:600 }}>
          {editing ? "Save Changes" : "Post Announcement"}
        </button>
      </div>
    </div>
  );
}

// ─── Pricing table ────────────────────────────────────────────────────────────
function PricingCategory({ cat, viewAsTier }) {
  const viewRank = TIER_RANK[viewAsTier];
  const [open, setOpen] = useState(true);

  return (
    <div style={{ background:"#fff", border:"1px solid #E8E7E3", borderRadius:14, overflow:"hidden", marginBottom:14 }}>
      <button onClick={() => setOpen(v => !v)}
        style={{ width:"100%", padding:"16px 20px", background:"transparent", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:12, textAlign:"left" }}>
        <span style={{ fontSize:20 }}>{cat.icon}</span>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:14, fontWeight:700, color:"#1a1a1a" }}>{cat.label}</div>
          <div style={{ fontSize:11, color:"#AAA", marginTop:1 }}>{cat.desc}</div>
        </div>
        <span style={{ fontSize:12, color:"#AAA", transform: open ? "rotate(180deg)" : "none", transition:"transform 0.2s" }}>▾</span>
      </button>

      {open && (
        <div>
          {/* Column headers */}
          <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr", gap:0, background:"#F8F7F4", borderTop:"1px solid #F0EFEB", borderBottom:"1px solid #F0EFEB", padding:"8px 20px" }}>
            <div style={{ fontSize:11, fontWeight:600, color:"#AAA" }}>Item</div>
            {["Bronze","Silver","Gold"].map(t => {
              const ts = TIER_STYLE[t];
              const isActive = t === viewAsTier;
              return (
                <div key={t} style={{ fontSize:11, fontWeight:700, color: isActive ? ts.fg : "#CCC", textAlign:"center", display:"flex", alignItems:"center", justifyContent:"center", gap:4 }}>
                  {ts.emoji} {t}
                  {isActive && <span style={{ fontSize:9, padding:"1px 5px", background:ts.bg, borderRadius:4 }}>YOU</span>}
                </div>
              );
            })}
          </div>

          {/* Rows */}
          {cat.items.map((item, i) => (
            <div key={i} style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr", gap:0, padding:"11px 20px", borderBottom: i < cat.items.length-1 ? "1px solid #F8F7F4" : "none", alignItems:"center" }}>
              <div style={{ fontSize:13, color:"#333" }}>{item.name}</div>
              {["Bronze","Silver","Gold"].map(t => {
                const ts = TIER_STYLE[t];
                const rank = TIER_RANK[t];
                const isActive = t === viewAsTier;
                const isLocked = rank > viewRank;
                const val = item[t];
                return (
                  <div key={t} style={{ textAlign:"center", padding:"0 4px" }}>
                    {isLocked ? (
                      <span style={{ fontSize:12, color:"#DDD", display:"flex", alignItems:"center", justifyContent:"center", gap:3 }}>
                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                          <rect x="2" y="5" width="8" height="6" rx="1" stroke="#CCC" strokeWidth="1.1"/>
                          <path d="M4 5V4a2 2 0 0 1 4 0v1" stroke="#CCC" strokeWidth="1.1"/>
                        </svg>
                        Upgrade
                      </span>
                    ) : (
                      <span style={{ fontSize:12, fontWeight: isActive ? 700 : 400, color: isActive ? ts.fg : "#888", background: isActive ? ts.bg : "transparent", padding: isActive ? "3px 8px" : "3px 4px", borderRadius:6, display:"inline-block" }}>
                        {val}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function App() {
  const [announcements, setAnnouncements] = useState(INIT_ANNOUNCEMENTS);
  const [showForm,  setShowForm]  = useState(false);
  const [editing,   setEditing]   = useState(null);
  const [isAdmin,   setIsAdmin]   = useState(false);
  const [viewAsTier, setViewAsTier] = useState("Gold");

  // Sort: pinned first, then by date desc
  const sorted = [...announcements].sort((a,b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  // Filter by tier visibility
  const visible = sorted.filter(ann => {
    if (ann.visibleTo === "All") return true;
    if (ann.visibleTo === "Gold") return viewAsTier === "Gold";
    if (ann.visibleTo === "Silver") return TIER_RANK[viewAsTier] >= TIER_RANK["Silver"];
    if (ann.visibleTo === "Bronze") return viewAsTier === "Bronze";
    return true;
  });

  const saveAnn = (ann) => {
    setAnnouncements(prev => editing ? prev.map(a => a.id === ann.id ? ann : a) : [ann, ...prev]);
    setShowForm(false); setEditing(null);
  };
  const deleteAnn = (id) => setAnnouncements(p => p.filter(a => a.id !== id));
  const pinAnn    = (id) => setAnnouncements(p => p.map(a => a.id === id ? {...a, pinned:!a.pinned} : a));
  const editAnn   = (ann) => { setEditing(ann); setShowForm(true); };

  const ts = TIER_STYLE[viewAsTier];

  return (
    <div style={{ minHeight:"100vh", background:"#F8F7F4", fontFamily:"system-ui, sans-serif" }}>

      {/* ── Top bar ── */}
      <div style={{ background:"#fff", borderBottom:"1px solid #E8E7E3", padding:"13px 28px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:30, height:30, borderRadius:7, background:"#1a1a1a", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="1" width="6" height="6" rx="1" fill="#fff" opacity="0.9"/>
              <rect x="9" y="1" width="6" height="6" rx="1" fill="#fff" opacity="0.4"/>
              <rect x="1" y="9" width="6" height="6" rx="1" fill="#fff" opacity="0.4"/>
              <rect x="9" y="9" width="6" height="6" rx="1" fill="#fff" opacity="0.4"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize:14, fontWeight:600, color:"#1a1a1a", lineHeight:1 }}>SupplierIQ</div>
            <div style={{ fontSize:11, color:"#AAA", marginTop:1 }}>Info & Pricing Portal</div>
          </div>
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          {/* Tier view switcher */}
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ fontSize:12, color:"#AAA" }}>Viewing as:</span>
            <div style={{ display:"flex", gap:3 }}>
              {["Bronze","Silver","Gold"].map(t => {
                const style = TIER_STYLE[t];
                return (
                  <button key={t} onClick={() => setViewAsTier(t)}
                    style={{ padding:"5px 12px", borderRadius:7, border:`1px solid ${viewAsTier===t ? style.border : "#E0DFD9"}`, background: viewAsTier===t ? style.bg : "#fff", color: viewAsTier===t ? style.fg : "#AAA", fontSize:12, cursor:"pointer", fontWeight: viewAsTier===t ? 700 : 400 }}>
                    {style.emoji} {t}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Admin toggle */}
          <button onClick={() => { setIsAdmin(v=>!v); setShowForm(false); setEditing(null); }}
            style={{ display:"flex", alignItems:"center", gap:6, background: isAdmin ? "#1a1a1a" : "transparent", color: isAdmin ? "#fff" : "#666", border:"1px solid #E0DFD9", borderRadius:8, padding:"7px 14px", fontSize:12, cursor:"pointer", fontWeight:500 }}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="5" width="14" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M5 5V4a3 3 0 0 1 6 0v1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            {isAdmin ? "Admin mode ON" : "Admin mode"}
          </button>
        </div>
      </div>

      <div style={{ maxWidth:820, margin:"0 auto", padding:"28px 28px" }}>

        {/* ── Announcements section ── */}
        <div style={{ marginBottom:32 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
            <div>
              <div style={{ fontSize:16, fontWeight:700, color:"#1a1a1a" }}>Announcements</div>
              <div style={{ fontSize:12, color:"#AAA", marginTop:2 }}>{visible.length} message{visible.length !== 1 ? "s" : ""} for {viewAsTier} suppliers</div>
            </div>
            {isAdmin && !showForm && (
              <button onClick={() => { setShowForm(true); setEditing(null); }}
                style={{ background:"#1a1a1a", color:"#fff", border:"none", borderRadius:8, padding:"8px 16px", fontSize:13, cursor:"pointer", fontWeight:600 }}>
                + New Announcement
              </button>
            )}
          </div>

          {/* Compose / edit form */}
          {isAdmin && showForm && (
            <AnnouncementForm
              editing={editing}
              onSave={saveAnn}
              onCancel={() => { setShowForm(false); setEditing(null); }}
            />
          )}

          {/* Announcement cards */}
          {visible.length === 0 ? (
            <div style={{ background:"#fff", border:"1px dashed #DDD", borderRadius:12, padding:"28px", textAlign:"center" }}>
              <div style={{ fontSize:13, color:"#CCC" }}>No announcements at this time</div>
            </div>
          ) : (
            visible.map(ann => (
              <AnnouncementCard key={ann.id} ann={ann} isAdmin={isAdmin} onEdit={editAnn} onDelete={deleteAnn} onPin={pinAnn} />
            ))
          )}
        </div>

        {/* ── Divider ── */}
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:28 }}>
          <div style={{ flex:1, height:1, background:"#E8E7E3" }} />
          <span style={{ fontSize:12, color:"#AAA", fontWeight:600, letterSpacing:0.5 }}>PRICING & BENEFITS</span>
          <div style={{ flex:1, height:1, background:"#E8E7E3" }} />
        </div>

        {/* ── Pricing tier banner ── */}
        <div style={{ background:ts.bg, border:`1px solid ${ts.border}`, borderRadius:14, padding:"18px 22px", marginBottom:20, display:"flex", alignItems:"center", gap:14 }}>
          <span style={{ fontSize:32 }}>{ts.emoji}</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:15, fontWeight:700, color:ts.fg }}>{viewAsTier} Tier Pricing</div>
            <div style={{ fontSize:12, color:ts.fg, opacity:0.7, marginTop:2, lineHeight:1.5 }}>
              You are seeing prices and terms applicable to {viewAsTier} tier suppliers.
              {TIER_RANK[viewAsTier] < 2 && ` Upgrade to unlock better rates — locked items show what higher tiers receive.`}
            </div>
          </div>
          {TIER_RANK[viewAsTier] < 2 && (
            <div style={{ textAlign:"right", flexShrink:0 }}>
              <div style={{ fontSize:11, color:ts.fg, opacity:0.7, marginBottom:4 }}>Next tier</div>
              <div style={{ fontSize:13, fontWeight:700, color:ts.fg }}>
                {viewAsTier === "Bronze" ? "🥈 Silver at 60pts" : "🥇 Gold at 80pts"}
              </div>
            </div>
          )}
        </div>

        {/* ── Pricing tables ── */}
        {PRICING_CATEGORIES.map(cat => (
          <PricingCategory key={cat.id} cat={cat} viewAsTier={viewAsTier} />
        ))}

        {/* ── Upgrade CTA for non-Gold ── */}
        {TIER_RANK[viewAsTier] < 2 && (
          <div style={{ background:"#fff", border:"1px solid #E8E7E3", borderRadius:14, padding:"22px 24px", textAlign:"center", marginTop:6 }}>
            <div style={{ fontSize:16, fontWeight:700, color:"#1a1a1a", marginBottom:6 }}>
              Want better rates? Improve your score.
            </div>
            <div style={{ fontSize:13, color:"#888", marginBottom:18, lineHeight:1.6 }}>
              Your performance score determines your tier. Higher scores unlock faster payments, bigger discounts, and priority scheduling.
            </div>
            <div style={{ display:"flex", justifyContent:"center", gap:16, flexWrap:"wrap" }}>
              {[
                { icon:"⭐", label:"Quality", tip:"Submit accurate & complete goods" },
                { icon:"⏱", label:"On-Time", tip:"Deliver on your scheduled slots" },
                { icon:"📋", label:"Compliance", tip:"Keep your docs up to date" },
                { icon:"💰", label:"Pricing", tip:"Stay competitive on quoted prices" },
              ].map(s => (
                <div key={s.label} style={{ background:"#F8F7F4", borderRadius:10, padding:"12px 16px", minWidth:120, textAlign:"center" }}>
                  <div style={{ fontSize:20, marginBottom:4 }}>{s.icon}</div>
                  <div style={{ fontSize:12, fontWeight:600, color:"#1a1a1a", marginBottom:2 }}>{s.label}</div>
                  <div style={{ fontSize:11, color:"#AAA", lineHeight:1.4 }}>{s.tip}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
