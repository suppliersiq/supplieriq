import { useState } from "react";

// ─── Initial data ─────────────────────────────────────────────────────────────
const INIT_BENEFITS = {
  Bronze: [
    "Access to basic supplier portal",
    "Standard payment terms (Net 30 days)",
    "Monthly performance report",
  ],
  Silver: [
    "All Bronze benefits",
    "Priority scheduling at receiving dock",
    "Faster payment terms (Net 21 days)",
    "Quarterly performance review",
    "Dedicated account contact",
  ],
  Gold: [
    "All Silver benefits",
    "Premium pricing tier access",
    "Fastest payment terms (Net 14 days)",
    "Monthly business review",
    "Early access to new product opportunities",
    "Featured supplier status",
  ],
};

const INIT_CATEGORIES = [
  {
    id: "cat-1", label: "Payment Terms", icon: "💳",
    desc: "Invoice settlement period after delivery confirmation",
    items: [
      { id:"i-1", name:"Standard Invoice",        Bronze:"Net 30 days",   Silver:"Net 21 days",   Gold:"Net 14 days"   },
      { id:"i-2", name:"Early Payment Discount",  Bronze:"—",             Silver:"1.5% if < 14d", Gold:"2% if < 7d"    },
      { id:"i-3", name:"Payment Method",          Bronze:"Bank transfer", Silver:"Bank / virtual", Gold:"All methods"  },
    ],
  },
  {
    id: "cat-2", label: "Purchase Price Tier", icon: "💰",
    desc: "Base pricing applied to your purchase orders",
    items: [
      { id:"i-4", name:"Standard goods",          Bronze:"List price",    Silver:"List − 3%",     Gold:"List − 7%"    },
      { id:"i-5", name:"Bulk order (>50 units)",  Bronze:"List − 1%",    Silver:"List − 5%",     Gold:"List − 10%"   },
      { id:"i-6", name:"Seasonal items",          Bronze:"List price",   Silver:"List − 2%",     Gold:"List − 5%"    },
      { id:"i-7", name:"Contract pricing",        Bronze:"Not eligible", Silver:"On request",     Gold:"Included"     },
    ],
  },
  {
    id: "cat-3", label: "Logistics & Scheduling", icon: "🚚",
    desc: "Receiving dock priority and scheduling access",
    items: [
      { id:"i-8",  name:"Dock scheduling",         Bronze:"Walk-in only",  Silver:"Pre-book 1 day", Gold:"Pre-book 7 days" },
      { id:"i-9",  name:"Receiving priority",      Bronze:"Standard queue",Silver:"Priority lane",  Gold:"Dedicated lane"  },
      { id:"i-10", name:"Emergency delivery slot", Bronze:"Not available", Silver:"On request",     Gold:"Guaranteed"      },
      { id:"i-11", name:"Weekend delivery",        Bronze:"Not available", Silver:"Not available",  Gold:"Available"       },
    ],
  },
  {
    id: "cat-4", label: "Account Support", icon: "🤝",
    desc: "Dedicated support and account management services",
    items: [
      { id:"i-12", name:"Account manager",     Bronze:"General line", Silver:"Named contact", Gold:"Dedicated AM" },
      { id:"i-13", name:"Performance review",  Bronze:"Annual",       Silver:"Quarterly",     Gold:"Monthly"      },
      { id:"i-14", name:"Portal access",       Bronze:"Basic",        Silver:"Standard",      Gold:"Full"         },
      { id:"i-15", name:"Early tender access", Bronze:"Not eligible", Silver:"Not eligible",  Gold:"Included"     },
    ],
  },
];

const TIER_META = {
  Bronze: { bg:"#FAECE7", fg:"#993C1D", border:"#F5C4B3", emoji:"🥉" },
  Silver: { bg:"#EDEDEB", fg:"#5F5E5A", border:"#D3D1C7", emoji:"🥈" },
  Gold:   { bg:"#FAEEDA", fg:"#854F0B", border:"#FAC775", emoji:"🥇" },
};

const ICONS = ["💳","💰","🚚","🤝","📦","⭐","🔧","🏭","📊","🎯","🤝","🌐","📋","💡","🔑"];

function genId() { return "x-" + Math.random().toString(36).slice(2,9); }

// ─── Tiny reusable components ─────────────────────────────────────────────────
function SectionLabel({ children }) {
  return <div style={{ fontSize:11, fontWeight:700, color:"#AAA", letterSpacing:0.6, marginBottom:8, textTransform:"uppercase" }}>{children}</div>;
}

function Pill({ children, color }) {
  return <span style={{ fontSize:11, padding:"2px 9px", borderRadius:5, background: color?.bg || "#F0EFEB", color: color?.fg || "#888", fontWeight:600 }}>{children}</span>;
}

function IconBtn({ onClick, children, danger, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ background:"none", border:`1px solid ${danger ? "#F5C4B3" : "#E0DFD9"}`, borderRadius:6, padding:"4px 9px", fontSize:11, cursor: disabled ? "default" : "pointer", color: danger ? "#C0392B" : "#888", opacity: disabled ? 0.4 : 1 }}>
      {children}
    </button>
  );
}

// ─── BENEFITS CMS ─────────────────────────────────────────────────────────────
function BenefitsCMS({ benefits, onChange }) {
  const [editing, setEditing] = useState(null);   // { tier, index }
  const [draft,   setDraft]   = useState("");
  const [adding,  setAdding]  = useState(null);   // tier string
  const [newText, setNewText] = useState("");

  const startEdit = (tier, index) => {
    setEditing({ tier, index });
    setDraft(benefits[tier][index]);
    setAdding(null);
  };

  const saveEdit = () => {
    if (!editing || !draft.trim()) return;
    const updated = { ...benefits };
    updated[editing.tier] = [...updated[editing.tier]];
    updated[editing.tier][editing.index] = draft.trim();
    onChange(updated);
    setEditing(null);
  };

  const deleteItem = (tier, index) => {
    const updated = { ...benefits };
    updated[tier] = updated[tier].filter((_, i) => i !== index);
    onChange(updated);
    if (editing?.tier === tier && editing?.index === index) setEditing(null);
  };

  const addItem = (tier) => {
    if (!newText.trim()) return;
    const updated = { ...benefits };
    updated[tier] = [...updated[tier], newText.trim()];
    onChange(updated);
    setNewText("");
    setAdding(null);
  };

  const move = (tier, index, dir) => {
    const arr = [...benefits[tier]];
    const ni = index + dir;
    if (ni < 0 || ni >= arr.length) return;
    [arr[index], arr[ni]] = [arr[ni], arr[index]];
    onChange({ ...benefits, [tier]: arr });
  };

  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14 }}>
      {["Bronze","Silver","Gold"].map(tier => {
        const tm = TIER_META[tier];
        const items = benefits[tier];
        return (
          <div key={tier} style={{ background:"#fff", border:`1px solid ${tm.border}`, borderRadius:12, overflow:"hidden" }}>
            <div style={{ padding:"12px 14px", background:tm.bg, borderBottom:`1px solid ${tm.border}`, display:"flex", alignItems:"center", gap:7 }}>
              <span style={{ fontSize:18 }}>{tm.emoji}</span>
              <span style={{ fontSize:13, fontWeight:700, color:tm.fg }}>{tier}</span>
              <span style={{ marginLeft:"auto", fontSize:11, color:tm.fg, opacity:0.6 }}>{items.length} benefits</span>
            </div>

            <div style={{ padding:"10px 10px" }}>
              {items.map((item, idx) => (
                <div key={idx} style={{ marginBottom:6 }}>
                  {editing?.tier === tier && editing?.index === idx ? (
                    <div style={{ background:"#F8F7F4", borderRadius:8, padding:"8px 10px" }}>
                      <textarea value={draft} onChange={e => setDraft(e.target.value)} rows={2} autoFocus
                        style={{ width:"100%", padding:"6px 8px", border:"1px solid #E0DFD9", borderRadius:6, fontSize:12, resize:"none", fontFamily:"inherit", boxSizing:"border-box", outline:"none", marginBottom:6 }} />
                      <div style={{ display:"flex", gap:5 }}>
                        <button onClick={saveEdit} style={{ flex:1, background:"#1a1a1a", color:"#fff", border:"none", borderRadius:6, padding:"6px", fontSize:11, cursor:"pointer", fontWeight:600 }}>Save</button>
                        <button onClick={() => setEditing(null)} style={{ flex:1, background:"transparent", color:"#888", border:"1px solid #E0DFD9", borderRadius:6, padding:"6px", fontSize:11, cursor:"pointer" }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display:"flex", gap:6, alignItems:"flex-start", padding:"6px 8px", borderRadius:8, background:"#FAFAF8", border:"1px solid #F0EFEB" }}>
                      <div style={{ display:"flex", flexDirection:"column", gap:1, flexShrink:0 }}>
                        <button onClick={() => move(tier, idx, -1)} disabled={idx===0} style={{ background:"none", border:"none", cursor: idx===0?"default":"pointer", color:"#CCC", fontSize:9, padding:"0 2px", lineHeight:1 }}>▲</button>
                        <button onClick={() => move(tier, idx, 1)} disabled={idx===items.length-1} style={{ background:"none", border:"none", cursor: idx===items.length-1?"default":"pointer", color:"#CCC", fontSize:9, padding:"0 2px", lineHeight:1 }}>▼</button>
                      </div>
                      <span style={{ flex:1, fontSize:12, color:"#333", lineHeight:1.5, minWidth:0 }}>{item}</span>
                      <div style={{ display:"flex", gap:3, flexShrink:0 }}>
                        <button onClick={() => startEdit(tier, idx)} style={{ background:"none", border:"none", cursor:"pointer", color:"#BBB", fontSize:12, padding:"1px 3px" }}>✏</button>
                        <button onClick={() => deleteItem(tier, idx)} style={{ background:"none", border:"none", cursor:"pointer", color:"#DDD", fontSize:12, padding:"1px 3px" }}>✕</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Add new */}
              {adding === tier ? (
                <div style={{ background:"#F8F7F4", borderRadius:8, padding:"8px 10px", marginTop:4 }}>
                  <input value={newText} onChange={e => setNewText(e.target.value)} autoFocus
                    onKeyDown={e => { if (e.key === "Enter") addItem(tier); if (e.key === "Escape") { setAdding(null); setNewText(""); } }}
                    placeholder="New benefit text…"
                    style={{ width:"100%", padding:"7px 9px", border:"1px solid #E0DFD9", borderRadius:6, fontSize:12, boxSizing:"border-box", outline:"none", marginBottom:6 }} />
                  <div style={{ display:"flex", gap:5 }}>
                    <button onClick={() => addItem(tier)} style={{ flex:1, background:"#1a1a1a", color:"#fff", border:"none", borderRadius:6, padding:"6px", fontSize:11, cursor:"pointer", fontWeight:600 }}>Add</button>
                    <button onClick={() => { setAdding(null); setNewText(""); }} style={{ flex:1, background:"transparent", color:"#888", border:"1px solid #E0DFD9", borderRadius:6, padding:"6px", fontSize:11, cursor:"pointer" }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => { setAdding(tier); setEditing(null); setNewText(""); }}
                  style={{ marginTop:4, width:"100%", background:"transparent", border:"1px dashed #DDD", borderRadius:7, padding:"7px", fontSize:12, color:"#BBB", cursor:"pointer" }}>
                  + Add benefit
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── PRICING CMS ──────────────────────────────────────────────────────────────
function PricingCMS({ categories, onChange }) {
  const [openCat,   setOpenCat]   = useState(categories[0]?.id);
  const [editingCat, setEditingCat] = useState(null);
  const [catDraft,  setCatDraft]  = useState({});
  const [editingRow, setEditingRow] = useState(null);
  const [rowDraft,  setRowDraft]  = useState({});
  const [addingRow, setAddingRow] = useState(null);
  const [newRow,    setNewRow]    = useState({ name:"", Bronze:"", Silver:"", Gold:"" });
  const [addingCat, setAddingCat] = useState(false);
  const [newCat,    setNewCat]    = useState({ label:"", icon:"📦", desc:"" });
  const [showIconPicker, setShowIconPicker] = useState(false);

  // ── Category ops ──
  const saveCat = (id) => {
    onChange(categories.map(c => c.id === id ? { ...c, ...catDraft } : c));
    setEditingCat(null);
  };
  const deleteCat = (id) => {
    onChange(categories.filter(c => c.id !== id));
    if (openCat === id) setOpenCat(categories.find(c => c.id !== id)?.id);
  };
  const moveCat = (id, dir) => {
    const arr = [...categories];
    const i = arr.findIndex(c => c.id === id);
    const ni = i + dir;
    if (ni < 0 || ni >= arr.length) return;
    [arr[i], arr[ni]] = [arr[ni], arr[i]];
    onChange(arr);
  };
  const addCat = () => {
    if (!newCat.label.trim()) return;
    onChange([...categories, { id: genId(), ...newCat, items:[] }]);
    setNewCat({ label:"", icon:"📦", desc:"" });
    setAddingCat(false);
  };

  // ── Row ops ──
  const saveRow = (catId) => {
    onChange(categories.map(c => c.id === catId
      ? { ...c, items: c.items.map(r => r.id === editingRow ? { ...r, ...rowDraft } : r) }
      : c));
    setEditingRow(null);
  };
  const deleteRow = (catId, rowId) => {
    onChange(categories.map(c => c.id === catId ? { ...c, items: c.items.filter(r => r.id !== rowId) } : c));
  };
  const moveRow = (catId, rowId, dir) => {
    onChange(categories.map(c => {
      if (c.id !== catId) return c;
      const arr = [...c.items];
      const i = arr.findIndex(r => r.id === rowId);
      const ni = i + dir;
      if (ni < 0 || ni >= arr.length) return c;
      [arr[i], arr[ni]] = [arr[ni], arr[i]];
      return { ...c, items: arr };
    }));
  };
  const addRow = (catId) => {
    if (!newRow.name.trim()) return;
    onChange(categories.map(c => c.id === catId
      ? { ...c, items: [...c.items, { id: genId(), ...newRow }] }
      : c));
    setNewRow({ name:"", Bronze:"", Silver:"", Gold:"" });
    setAddingRow(null);
  };

  const inp = (extra={}) => ({ padding:"7px 9px", border:"1px solid #E0DFD9", borderRadius:6, fontSize:12, outline:"none", boxSizing:"border-box", ...extra });

  return (
    <div>
      {/* Category list */}
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {categories.map((cat, ci) => (
          <div key={cat.id} style={{ background:"#fff", border:"1px solid #E8E7E3", borderRadius:12, overflow:"hidden" }}>

            {/* Category header */}
            <div style={{ display:"flex", alignItems:"center", gap:10, padding:"13px 16px", background:"#FAFAF8", borderBottom: openCat === cat.id ? "1px solid #F0EFEB" : "none" }}>
              {/* Move */}
              <div style={{ display:"flex", flexDirection:"column", gap:1 }}>
                <button onClick={() => moveCat(cat.id,-1)} disabled={ci===0} style={{ background:"none", border:"none", cursor: ci===0?"default":"pointer", color:"#CCC", fontSize:9, padding:"0 2px", lineHeight:1 }}>▲</button>
                <button onClick={() => moveCat(cat.id,1)} disabled={ci===categories.length-1} style={{ background:"none", border:"none", cursor: ci===categories.length-1?"default":"pointer", color:"#CCC", fontSize:9, padding:"0 2px", lineHeight:1 }}>▼</button>
              </div>

              {editingCat === cat.id ? (
                <div style={{ display:"flex", gap:8, flex:1, alignItems:"center", flexWrap:"wrap" }}>
                  {/* Icon picker */}
                  <div style={{ position:"relative" }}>
                    <button onClick={() => setShowIconPicker(v => !v)}
                      style={{ fontSize:18, background:"#fff", border:"1px solid #E0DFD9", borderRadius:6, padding:"4px 8px", cursor:"pointer" }}>
                      {catDraft.icon || cat.icon}
                    </button>
                    {showIconPicker && (
                      <div style={{ position:"absolute", top:34, left:0, background:"#fff", border:"1px solid #E0DFD9", borderRadius:8, padding:8, display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:4, zIndex:10, boxShadow:"0 4px 12px rgba(0,0,0,0.1)" }}>
                        {ICONS.map(ic => (
                          <button key={ic} onClick={() => { setCatDraft(d => ({...d, icon:ic})); setShowIconPicker(false); }}
                            style={{ fontSize:16, background:"none", border:"none", cursor:"pointer", borderRadius:4, padding:"4px" }}>{ic}</button>
                        ))}
                      </div>
                    )}
                  </div>
                  <input value={catDraft.label ?? cat.label} onChange={e => setCatDraft(d => ({...d,label:e.target.value}))} placeholder="Category name" style={{ ...inp(), flex:1, minWidth:120, fontWeight:600 }} />
                  <input value={catDraft.desc ?? cat.desc} onChange={e => setCatDraft(d => ({...d,desc:e.target.value}))} placeholder="Description" style={{ ...inp(), flex:2, minWidth:160 }} />
                  <IconBtn onClick={() => saveCat(cat.id)}>Save</IconBtn>
                  <IconBtn onClick={() => { setEditingCat(null); setShowIconPicker(false); }}>Cancel</IconBtn>
                </div>
              ) : (
                <>
                  <span style={{ fontSize:18 }}>{cat.icon}</span>
                  <div style={{ flex:1, cursor:"pointer" }} onClick={() => setOpenCat(openCat === cat.id ? null : cat.id)}>
                    <div style={{ fontSize:13, fontWeight:600, color:"#1a1a1a" }}>{cat.label}</div>
                    <div style={{ fontSize:11, color:"#AAA", marginTop:1 }}>{cat.desc} · {cat.items.length} rows</div>
                  </div>
                  <div style={{ display:"flex", gap:5 }}>
                    <IconBtn onClick={() => { setEditingCat(cat.id); setCatDraft({}); setShowIconPicker(false); }}>✏ Edit</IconBtn>
                    <IconBtn onClick={() => deleteCat(cat.id)} danger>✕</IconBtn>
                  </div>
                  <span style={{ fontSize:12, color:"#CCC", marginLeft:4, cursor:"pointer" }} onClick={() => setOpenCat(openCat === cat.id ? null : cat.id)}>
                    {openCat === cat.id ? "▲" : "▼"}
                  </span>
                </>
              )}
            </div>

            {/* Rows table */}
            {openCat === cat.id && (
              <div style={{ padding:"12px 16px" }}>
                {/* Column headers */}
                <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr 80px", gap:8, marginBottom:8, padding:"0 8px" }}>
                  {["Item Name","🥉 Bronze","🥈 Silver","🥇 Gold",""].map((h,i) => (
                    <div key={i} style={{ fontSize:11, fontWeight:600, color:"#AAA" }}>{h}</div>
                  ))}
                </div>

                {cat.items.map((row, ri) => (
                  <div key={row.id} style={{ marginBottom:6 }}>
                    {editingRow === row.id ? (
                      <div style={{ background:"#F8F7F4", borderRadius:8, padding:"10px" }}>
                        <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr", gap:8, marginBottom:8 }}>
                          <input value={rowDraft.name ?? row.name} onChange={e => setRowDraft(d => ({...d,name:e.target.value}))} placeholder="Item name" style={inp({width:"100%"})} />
                          {["Bronze","Silver","Gold"].map(t => (
                            <input key={t} value={rowDraft[t] ?? row[t]} onChange={e => setRowDraft(d => ({...d,[t]:e.target.value}))} placeholder={t} style={inp({width:"100%"})} />
                          ))}
                        </div>
                        <div style={{ display:"flex", gap:6 }}>
                          <button onClick={() => saveRow(cat.id)} style={{ background:"#1a1a1a", color:"#fff", border:"none", borderRadius:6, padding:"6px 14px", fontSize:12, cursor:"pointer", fontWeight:600 }}>Save row</button>
                          <button onClick={() => setEditingRow(null)} style={{ background:"transparent", color:"#888", border:"1px solid #E0DFD9", borderRadius:6, padding:"6px 14px", fontSize:12, cursor:"pointer" }}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr 80px", gap:8, padding:"8px 8px", borderRadius:8, background: ri % 2 === 0 ? "#FAFAF8" : "#fff", alignItems:"center", border:"1px solid #F5F4F0" }}>
                        <span style={{ fontSize:13, color:"#333", fontWeight:500 }}>{row.name}</span>
                        {["Bronze","Silver","Gold"].map(t => {
                          const tm = TIER_META[t];
                          return (
                            <span key={t} style={{ fontSize:12, color: row[t] === "Not eligible" || row[t] === "—" ? "#CCC" : tm.fg, background: row[t] === "Not eligible" || row[t] === "—" ? "transparent" : tm.bg, padding:"3px 7px", borderRadius:5, display:"inline-block" }}>
                              {row[t]}
                            </span>
                          );
                        })}
                        <div style={{ display:"flex", gap:4, alignItems:"center" }}>
                          <div style={{ display:"flex", flexDirection:"column", gap:1 }}>
                            <button onClick={() => moveRow(cat.id, row.id, -1)} disabled={ri===0} style={{ background:"none", border:"none", cursor: ri===0?"default":"pointer", color:"#CCC", fontSize:9, padding:"0 2px", lineHeight:1 }}>▲</button>
                            <button onClick={() => moveRow(cat.id, row.id, 1)} disabled={ri===cat.items.length-1} style={{ background:"none", border:"none", cursor: ri===cat.items.length-1?"default":"pointer", color:"#CCC", fontSize:9, padding:"0 2px", lineHeight:1 }}>▼</button>
                          </div>
                          <button onClick={() => { setEditingRow(row.id); setRowDraft({}); }} style={{ background:"none", border:"none", cursor:"pointer", color:"#BBB", fontSize:13, padding:"2px" }}>✏</button>
                          <button onClick={() => deleteRow(cat.id, row.id)} style={{ background:"none", border:"none", cursor:"pointer", color:"#DDD", fontSize:13, padding:"2px" }}>✕</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Add row */}
                {addingRow === cat.id ? (
                  <div style={{ background:"#F0F8E8", border:"1px solid #C0DD97", borderRadius:8, padding:"10px", marginTop:8 }}>
                    <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr", gap:8, marginBottom:8 }}>
                      <input value={newRow.name} onChange={e => setNewRow(r => ({...r,name:e.target.value}))} placeholder="Item name" style={inp({width:"100%"})} autoFocus />
                      {["Bronze","Silver","Gold"].map(t => (
                        <input key={t} value={newRow[t]} onChange={e => setNewRow(r => ({...r,[t]:e.target.value}))} placeholder={`${t} value`} style={inp({width:"100%"})} />
                      ))}
                    </div>
                    <div style={{ display:"flex", gap:6 }}>
                      <button onClick={() => addRow(cat.id)} style={{ background:"#1a1a1a", color:"#fff", border:"none", borderRadius:6, padding:"6px 14px", fontSize:12, cursor:"pointer", fontWeight:600 }}>Add row</button>
                      <button onClick={() => { setAddingRow(null); setNewRow({ name:"", Bronze:"", Silver:"", Gold:"" }); }} style={{ background:"transparent", color:"#888", border:"1px solid #E0DFD9", borderRadius:6, padding:"6px 14px", fontSize:12, cursor:"pointer" }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => { setAddingRow(cat.id); setEditingRow(null); }}
                    style={{ marginTop:8, width:"100%", background:"transparent", border:"1px dashed #DDD", borderRadius:7, padding:"8px", fontSize:12, color:"#BBB", cursor:"pointer" }}>
                    + Add row
                  </button>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Add category */}
        {addingCat ? (
          <div style={{ background:"#fff", border:"1px solid #E8E7E3", borderRadius:12, padding:"16px 18px" }}>
            <div style={{ fontSize:13, fontWeight:700, color:"#1a1a1a", marginBottom:12 }}>New Category</div>
            <div style={{ display:"grid", gap:10 }}>
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <div style={{ position:"relative" }}>
                  <button onClick={() => setShowIconPicker(v => !v)}
                    style={{ fontSize:20, background:"#F8F7F4", border:"1px solid #E0DFD9", borderRadius:8, padding:"7px 10px", cursor:"pointer" }}>
                    {newCat.icon}
                  </button>
                  {showIconPicker && (
                    <div style={{ position:"absolute", top:40, left:0, background:"#fff", border:"1px solid #E0DFD9", borderRadius:8, padding:8, display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:4, zIndex:10, boxShadow:"0 4px 12px rgba(0,0,0,0.1)" }}>
                      {ICONS.map(ic => (
                        <button key={ic} onClick={() => { setNewCat(c => ({...c,icon:ic})); setShowIconPicker(false); }}
                          style={{ fontSize:16, background:"none", border:"none", cursor:"pointer", borderRadius:4, padding:"4px" }}>{ic}</button>
                      ))}
                    </div>
                  )}
                </div>
                <input value={newCat.label} onChange={e => setNewCat(c => ({...c,label:e.target.value}))} placeholder="Category name *"
                  style={{ ...inp(), flex:1, fontWeight:600 }} />
              </div>
              <input value={newCat.desc} onChange={e => setNewCat(c => ({...c,desc:e.target.value}))} placeholder="Short description"
                style={inp({width:"100%"})} />
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={addCat} style={{ flex:1, background:"#1a1a1a", color:"#fff", border:"none", borderRadius:8, padding:"10px", fontSize:13, cursor:"pointer", fontWeight:600 }}>Add Category</button>
                <button onClick={() => { setAddingCat(false); setShowIconPicker(false); }} style={{ flex:1, background:"transparent", color:"#888", border:"1px solid #E0DFD9", borderRadius:8, padding:"10px", fontSize:13, cursor:"pointer" }}>Cancel</button>
              </div>
            </div>
          </div>
        ) : (
          <button onClick={() => { setAddingCat(true); setShowIconPicker(false); }}
            style={{ background:"transparent", border:"1px dashed #DDD", borderRadius:10, padding:"12px", fontSize:13, color:"#BBB", cursor:"pointer", width:"100%" }}>
            + Add category
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Live Preview ──────────────────────────────────────────────────────────────
function Preview({ benefits, categories, previewTier }) {
  const [openCat, setOpenCat] = useState(null);
  const tm = TIER_META[previewTier];
  const TIER_RANK = { Bronze:0, Silver:1, Gold:2 };
  const rank = TIER_RANK[previewTier];

  return (
    <div style={{ background:"#F8F7F4", borderRadius:12, padding:"16px", minHeight:400 }}>
      <div style={{ fontSize:11, fontWeight:700, color:"#AAA", letterSpacing:0.5, marginBottom:14, textTransform:"uppercase" }}>Preview — {previewTier} view</div>

      {/* Tier banner */}
      <div style={{ background:tm.bg, border:`1px solid ${tm.border}`, borderRadius:10, padding:"12px 16px", marginBottom:14, display:"flex", alignItems:"center", gap:10 }}>
        <span style={{ fontSize:24 }}>{tm.emoji}</span>
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:tm.fg }}>{previewTier} Tier</div>
          <div style={{ fontSize:11, color:tm.fg, opacity:0.7 }}>Your active pricing & benefits</div>
        </div>
      </div>

      {/* Benefits preview */}
      <div style={{ background:"#fff", border:"1px solid #E8E7E3", borderRadius:10, padding:"14px 16px", marginBottom:12 }}>
        <div style={{ fontSize:12, fontWeight:700, color:"#888", marginBottom:10 }}>YOUR BENEFITS</div>
        {(benefits[previewTier] || []).map((b, i) => (
          <div key={i} style={{ display:"flex", gap:7, alignItems:"flex-start", marginBottom:7 }}>
            <div style={{ width:16, height:16, borderRadius:"50%", background:tm.bg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:2 }}>
              <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                <polyline points="1,5 4,8 9,2" stroke={tm.fg} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span style={{ fontSize:12, color:"#333", lineHeight:1.5 }}>{b}</span>
          </div>
        ))}
      </div>

      {/* Pricing preview */}
      {categories.map(cat => (
        <div key={cat.id} style={{ background:"#fff", border:"1px solid #E8E7E3", borderRadius:10, marginBottom:8, overflow:"hidden" }}>
          <div onClick={() => setOpenCat(openCat === cat.id ? null : cat.id)}
            style={{ padding:"10px 14px", cursor:"pointer", display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:16 }}>{cat.icon}</span>
            <span style={{ fontSize:12, fontWeight:600, color:"#1a1a1a", flex:1 }}>{cat.label}</span>
            <span style={{ fontSize:11, color:"#CCC" }}>{openCat === cat.id ? "▲" : "▼"}</span>
          </div>
          {openCat === cat.id && cat.items.map((row, i) => (
            <div key={row.id} style={{ display:"flex", justifyContent:"space-between", padding:"8px 14px", background: i%2===0?"#FAFAF8":"#fff", borderTop:"1px solid #F5F4F0", alignItems:"center" }}>
              <span style={{ fontSize:12, color:"#555" }}>{row.name}</span>
              {rank >= TIER_RANK["Gold"] || previewTier === "Gold"
                ? <span style={{ fontSize:12, fontWeight:600, color:tm.fg, background:tm.bg, padding:"2px 8px", borderRadius:5 }}>{row[previewTier]}</span>
                : TIER_RANK[previewTier] >= 0
                  ? <span style={{ fontSize:12, fontWeight:600, color:tm.fg, background:tm.bg, padding:"2px 8px", borderRadius:5 }}>{row[previewTier]}</span>
                  : <span style={{ fontSize:11, color:"#CCC" }}>🔒</span>
              }
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Main CMS App ─────────────────────────────────────────────────────────────
export default function App() {
  const [tab,         setTab]         = useState("benefits");
  const [benefits,    setBenefits]    = useState(INIT_BENEFITS);
  const [categories,  setCategories]  = useState(INIT_CATEGORIES);
  const [previewTier, setPreviewTier] = useState("Gold");
  const [showPreview, setShowPreview] = useState(true);
  const [saved,       setSaved]       = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ minHeight:"100vh", background:"#F8F7F4", fontFamily:"system-ui, sans-serif" }}>

      {/* ── Top bar ── */}
      <div style={{ background:"#fff", borderBottom:"1px solid #E8E7E3", padding:"12px 28px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
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
            <div style={{ fontSize:14, fontWeight:600, color:"#1a1a1a", lineHeight:1 }}>SupplierIQ — Admin</div>
            <div style={{ fontSize:11, color:"#AAA", marginTop:1 }}>Pricing & Benefits CMS</div>
          </div>
        </div>

        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <button onClick={() => setShowPreview(v => !v)}
            style={{ background: showPreview ? "#F0EFEB" : "transparent", color:"#666", border:"1px solid #E0DFD9", borderRadius:8, padding:"7px 14px", fontSize:12, cursor:"pointer" }}>
            {showPreview ? "Hide Preview" : "Show Preview"}
          </button>
          <button onClick={handleSave}
            style={{ background: saved ? "#EAF3DE" : "#1a1a1a", color: saved ? "#3B6D11" : "#fff", border:"none", borderRadius:8, padding:"8px 18px", fontSize:13, cursor:"pointer", fontWeight:600, transition:"all 0.2s", minWidth:100 }}>
            {saved ? "✓ Saved!" : "Save Changes"}
          </button>
        </div>
      </div>

      <div style={{ display:"flex", maxWidth:1200, margin:"0 auto", padding:"24px 28px", gap:20 }}>

        {/* ── Editor ── */}
        <div style={{ flex:1, minWidth:0 }}>
          {/* Tabs */}
          <div style={{ display:"flex", gap:2, marginBottom:20, background:"#fff", border:"1px solid #E8E7E3", borderRadius:10, padding:4, width:"fit-content" }}>
            {[
              { id:"benefits", label:"🎁 Tier Benefits" },
              { id:"pricing",  label:"💰 Pricing Tables" },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{ padding:"8px 18px", borderRadius:8, border:"none", cursor:"pointer", fontSize:13, fontWeight: tab===t.id ? 600 : 400, background: tab===t.id ? "#1a1a1a" : "transparent", color: tab===t.id ? "#fff" : "#888", transition:"all 0.15s" }}>
                {t.label}
              </button>
            ))}
          </div>

          {tab === "benefits" && (
            <>
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:16, fontWeight:700, color:"#1a1a1a", marginBottom:4 }}>Tier Benefits</div>
                <div style={{ fontSize:13, color:"#888" }}>Manage the benefit list shown to suppliers for each tier. Changes apply immediately to the Info Portal.</div>
              </div>
              <BenefitsCMS benefits={benefits} onChange={setBenefits} />
            </>
          )}

          {tab === "pricing" && (
            <>
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:16, fontWeight:700, color:"#1a1a1a", marginBottom:4 }}>Pricing Tables</div>
                <div style={{ fontSize:13, color:"#888" }}>Add, edit, or reorder pricing categories and their per-tier values. Locked values show as "🔒 Upgrade" to lower-tier suppliers.</div>
              </div>
              <PricingCMS categories={categories} onChange={setCategories} />
            </>
          )}
        </div>

        {/* ── Preview panel ── */}
        {showPreview && (
          <div style={{ width:300, flexShrink:0 }}>
            <div style={{ position:"sticky", top:24 }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                <div style={{ fontSize:12, fontWeight:700, color:"#888" }}>LIVE PREVIEW</div>
                <div style={{ display:"flex", gap:3 }}>
                  {["Bronze","Silver","Gold"].map(t => {
                    const tm = TIER_META[t];
                    return (
                      <button key={t} onClick={() => setPreviewTier(t)}
                        style={{ fontSize:11, padding:"4px 10px", borderRadius:6, border:`1px solid ${previewTier===t ? tm.border : "#E0DFD9"}`, background: previewTier===t ? tm.bg : "#fff", color: previewTier===t ? tm.fg : "#AAA", cursor:"pointer", fontWeight: previewTier===t ? 700 : 400 }}>
                        {tm.emoji}
                      </button>
                    );
                  })}
                </div>
              </div>
              <Preview benefits={benefits} categories={categories} previewTier={previewTier} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
