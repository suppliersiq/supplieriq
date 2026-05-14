import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const NAV = [
  { to: "/dashboard",   label: "Dashboard"    },
  { to: "/suppliers",   label: "Suppliers"    },
  { to: "/kiosk",       label: "Office Kiosk" },
  { to: "/targets",     label: "Targets"      },
  { to: "/loyalty",     label: "Loyalty"      },
  { to: "/portal-info", label: "Info Portal"  },
  { to: "/cms",         label: "Pricing CMS"  },
  { to: "/tier-engine", label: "Tier Engine"  },
];

export default function AdminLayout({ children }) {
  const { signOut } = useAuth();
  const navigate    = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>
      {/* Sidebar */}
      <div style={{ width: 200, background: "#F1F0EC", borderRight: "1px solid #E0DFD9", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "18px 18px 14px", borderBottom: "1px solid #E0DFD9" }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a" }}>SupplierIQ</div>
          <div style={{ fontSize: 11, color: "#AAA", marginTop: 2 }}>Back Office</div>
        </div>

        <nav style={{ flex: 1, padding: "8px 0" }}>
          {NAV.map(n => (
            <NavLink key={n.to} to={n.to}
              style={({ isActive }) => ({
                display: "block", padding: "9px 18px", fontSize: 13,
                color: isActive ? "#1a1a1a" : "#666",
                fontWeight: isActive ? 500 : 400,
                background: isActive ? "#fff" : "transparent",
                borderRight: isActive ? "2px solid #EF9F27" : "2px solid transparent",
                textDecoration: "none",
                transition: "all 0.15s",
              })}>
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: "12px 18px", borderTop: "1px solid #E0DFD9" }}>
          <button onClick={handleSignOut}
            style={{ background: "none", border: "none", fontSize: 12, color: "#AAA", cursor: "pointer", padding: 0 }}>
            Sign out
          </button>
        </div>
      </div>

      {/* Page content */}
      <div style={{ flex: 1, overflow: "auto", background: "#F8F7F4" }}>
        {children}
      </div>
    </div>
  );
}
