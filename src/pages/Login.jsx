import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";

export default function Login() {
  const { session, loading, role } = useAuth();
  const navigate = useNavigate();

  const [tab,      setTab]      = useState("admin");    // "admin" | "supplier"
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [suppCode, setSuppCode] = useState("");         // supplier login via code
  const [error,    setError]    = useState("");
  const [busy,     setBusy]     = useState(false);

  // Already logged in — redirect to correct home
  if (!loading && session) {
    return <Navigate to={role === "admin" ? "/dashboard" : "/portal"} replace />;
  }

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setBusy(true); setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setBusy(false); return; }
    navigate("/dashboard");
  };

  const handleSupplierLogin = async (e) => {
    e.preventDefault();
    setBusy(true); setError("");

    // Look up supplier by code
    const { data, error: dbErr } = await supabase
      .from("suppliers")
      .select("id, company_name, supplier_code, email")
      .eq("supplier_code", suppCode.trim().toUpperCase())
      .single();

    if (dbErr || !data) {
      setError("Supplier ID not found. Check your code and try again.");
      setBusy(false); return;
    }

    // Send magic link to supplier's email
    const { error: authErr } = await supabase.auth.signInWithOtp({
      email: data.email,
      options: {
        data: { role: "supplier", supplier_id: data.id },
      },
    });

    if (authErr) { setError(authErr.message); setBusy(false); return; }

    setError(""); setBusy(false);
    alert(`Magic link sent to ${data.email}. Check your inbox to log in.`);
  };

  const inp = {
    width: "100%", padding: "11px 12px", border: "1px solid #E0DFD9",
    borderRadius: 8, fontSize: 13, boxSizing: "border-box", outline: "none",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F8F7F4", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 400 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
            <svg width="22" height="22" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="1" width="6" height="6" rx="1" fill="#fff" opacity="0.9"/>
              <rect x="9" y="1" width="6" height="6" rx="1" fill="#fff" opacity="0.4"/>
              <rect x="1" y="9" width="6" height="6" rx="1" fill="#fff" opacity="0.4"/>
              <rect x="9" y="9" width="6" height="6" rx="1" fill="#fff" opacity="0.4"/>
            </svg>
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#1a1a1a" }}>SupplierIQ</div>
          <div style={{ fontSize: 13, color: "#AAA", marginTop: 4 }}>Loyalty & Performance Platform</div>
        </div>

        {/* Tab selector */}
        <div style={{ display: "flex", gap: 4, background: "#F0EFEB", borderRadius: 10, padding: 4, marginBottom: 24 }}>
          {["admin", "supplier"].map(t => (
            <button key={t} onClick={() => { setTab(t); setError(""); }}
              style={{ flex: 1, padding: "9px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: tab === t ? 600 : 400, background: tab === t ? "#fff" : "transparent", color: tab === t ? "#1a1a1a" : "#888", transition: "all 0.15s", textTransform: "capitalize" }}>
              {t === "admin" ? "🔐 Admin" : "🏭 Supplier"}
            </button>
          ))}
        </div>

        {/* Admin form */}
        {tab === "admin" && (
          <form onSubmit={handleAdminLogin} style={{ background: "#fff", border: "1px solid #E8E7E3", borderRadius: 14, padding: "28px 28px" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a", marginBottom: 20 }}>Admin Login</div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#888", marginBottom: 5 }}>EMAIL</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="admin@yourcompany.com" style={inp} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#888", marginBottom: 5 }}>PASSWORD</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" style={inp} />
            </div>
            {error && <div style={{ background: "#FAECE7", color: "#993C1D", fontSize: 12, padding: "9px 12px", borderRadius: 7, marginBottom: 14 }}>{error}</div>}
            <button type="submit" disabled={busy}
              style={{ width: "100%", background: busy ? "#CCC" : "#1a1a1a", color: "#fff", border: "none", borderRadius: 9, padding: "13px", fontSize: 14, cursor: busy ? "default" : "pointer", fontWeight: 600 }}>
              {busy ? "Signing in…" : "Sign in →"}
            </button>
          </form>
        )}

        {/* Supplier form */}
        {tab === "supplier" && (
          <form onSubmit={handleSupplierLogin} style={{ background: "#fff", border: "1px solid #E8E7E3", borderRadius: 14, padding: "28px 28px" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a", marginBottom: 6 }}>Supplier Login</div>
            <div style={{ fontSize: 12, color: "#AAA", marginBottom: 20, lineHeight: 1.5 }}>Enter your Supplier ID. A magic link will be sent to your registered email.</div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#888", marginBottom: 5 }}>SUPPLIER ID</label>
              <input value={suppCode} onChange={e => setSuppCode(e.target.value)} required placeholder="SUP-XXXXXX-XXXX" style={{ ...inp, fontFamily: "monospace", letterSpacing: 1, textTransform: "uppercase" }} />
            </div>
            {error && <div style={{ background: "#FAECE7", color: "#993C1D", fontSize: 12, padding: "9px 12px", borderRadius: 7, marginBottom: 14 }}>{error}</div>}
            <button type="submit" disabled={busy}
              style={{ width: "100%", background: busy ? "#CCC" : "#1a1a1a", color: "#fff", border: "none", borderRadius: 9, padding: "13px", fontSize: 14, cursor: busy ? "default" : "pointer", fontWeight: 600 }}>
              {busy ? "Sending link…" : "Send Magic Link →"}
            </button>
            <div style={{ marginTop: 14, fontSize: 12, color: "#AAA", textAlign: "center", lineHeight: 1.5 }}>
              First time? Ask your account manager or <a href="/register" style={{ color: "#1a1a1a", fontWeight: 600 }}>register here</a>.
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
