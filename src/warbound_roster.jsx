import { useState, useEffect } from "react";

// ============================================================
// WARBOUND — ROSTER SCREEN
// Menampilkan daftar karakter milik player yang login
// ============================================================

const P = {
  bg:       "#060809",
  surface:  "#0a0e10",
  surface2: "#0e1412",
  border:   "#1a2018",
  borderA:  "#2a3828",
  accent:   "#d97706",
  text:     "#c9d4c7",
  textBr:   "#e8f0e6",
  dim:      "#3a4a38",
  dim2:     "#5a6a58",
  danger:   "#dc2626",
  success:  "#22c55e",
  def:      "#3b82f6",
};

const fontMono = "'Share Tech Mono', monospace";
const fontHead = "'Orbitron', sans-serif";

const boxStyle = {
  background: P.surface,
  border: `1px solid ${P.border}`,
  padding: "16px",
};

// ============================================================
// ROSTER SCREEN
// ============================================================
export function RosterScreen({
  supabase,
  user,
  isDemo = false,
  isGm = false,
  onOpen,       // (char) => void
  onNew,        // () => void
  onLogout,     // () => void
  onSwitchToGm, // () => void (opsional, hanya jika isGm)
}) {
  const [chars, setChars]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr]         = useState("");
  const [deleting, setDeleting] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [ticker, setTicker]   = useState(0);

  // Animasi ticker
  useEffect(() => {
    const t = setInterval(() => setTicker(v => (v + 1) % 100), 80);
    return () => clearInterval(t);
  }, []);

  // Load karakter dari Supabase
  useEffect(() => {
    loadChars();
  }, []);

  const loadChars = async () => {
    setLoading(true); setErr("");
    if (isDemo) {
      // Demo data
      setChars([
        {
          id: "demo-1",
          name: "UNIT-7 RAVEN",
          data: { chassis: "HEAVY", job: "Vanguard", tier: "T1", faction: "PU", pilotName: "Sasha Volkov" },
          updated_at: new Date().toISOString(),
        },
        {
          id: "demo-2",
          name: "SPECTRE-3",
          data: { chassis: "SCOUT", job: "Infiltrator", tier: "T0", faction: "SAU", pilotName: "Jin Park" },
          updated_at: new Date(Date.now() - 86400000).toISOString(),
        },
      ]);
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from("warbound_characters")
        .select("id, name, data, updated_at, created_at")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      setChars(data || []);
    } catch (e) {
      setErr("Gagal load karakter: " + e.message);
    }
    setLoading(false);
  };

  const deleteChar = async (id) => {
    setDeleting(id);
    if (isDemo) {
      setChars(c => c.filter(x => x.id !== id));
      setConfirmDel(null);
      setDeleting(null);
      return;
    }
    try {
      const { error } = await supabase
        .from("warbound_characters")
        .delete()
        .eq("id", id);
      if (error) throw error;
      setChars(c => c.filter(x => x.id !== id));
      setConfirmDel(null);
    } catch (e) {
      setErr("Gagal hapus: " + e.message);
    }
    setDeleting(null);
  };

  const chassisColor = (chassis) => ({
    HEAVY:  "#d97706",
    SCOUT:  "#22c55e",
    SUPPORT:"#3b82f6",
    SIEGE:  "#dc2626",
  }[chassis] || P.accent);

  return (
    <div style={{
      minHeight: "100vh",
      background: P.bg,
      fontFamily: fontMono,
      color: P.text,
      position: "relative",
      backgroundImage: `
        linear-gradient(rgba(217,119,6,0.02) 1px, transparent 1px),
        linear-gradient(90deg, rgba(217,119,6,0.02) 1px, transparent 1px)
      `,
      backgroundSize: "50px 50px",
    }}>

      {/* Top nav bar */}
      <div style={{
        borderBottom: `1px solid ${P.border}`,
        background: "rgba(6,8,9,0.95)",
        padding: "12px 20px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        {/* Logo */}
        <div>
          <div style={{
            fontFamily: fontHead, fontSize: 18, fontWeight: 900,
            color: P.accent, letterSpacing: 5,
          }}>WARBOUND</div>
          <div style={{ fontSize: 8, color: P.dim, letterSpacing: 3, marginTop: 1 }}>
            PILOT ROSTER {isDemo && "— DEMO MODE"}
          </div>
        </div>

        {/* User info + actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Ticker animasi */}
          <div style={{
            fontSize: 8, color: P.dim, letterSpacing: 1,
            display: "flex", alignItems: "center", gap: 4,
          }}>
            <div style={{
              width: 5, height: 5, borderRadius: "50%",
              background: P.success,
              boxShadow: `0 0 6px ${P.success}`,
              animation: "pulse 2s infinite",
            }} />
            <span style={{ display: "none" }}>ONLINE</span>
          </div>

          {/* GM switch */}
          {isGm && onSwitchToGm && (
            <button onClick={onSwitchToGm} style={{
              background: "transparent",
              border: `1px solid ${P.def}`,
              color: P.def,
              padding: "6px 12px",
              fontFamily: fontHead, fontSize: 9, letterSpacing: 2,
              cursor: "pointer",
            }}>◈ GM</button>
          )}

          {/* Logout */}
          <button onClick={onLogout} style={{
            background: "transparent",
            border: `1px solid ${P.borderA}`,
            color: P.dim2,
            padding: "6px 12px",
            fontFamily: fontHead, fontSize: 9, letterSpacing: 2,
            cursor: "pointer",
          }}>LOGOUT</button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px" }}>

        {/* User info bar */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginBottom: 20,
          padding: "10px 14px",
          border: `1px solid ${P.border}`,
          borderLeft: `3px solid ${P.accent}`,
          background: P.surface,
        }}>
          <div>
            <div style={{ fontSize: 9, color: P.dim, letterSpacing: 2, marginBottom: 2 }}>SIGNED IN AS</div>
            <div style={{ fontSize: 12, color: P.textBr }}>{user?.email || "DEMO PILOT"}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 9, color: P.dim, letterSpacing: 2, marginBottom: 2 }}>UNITS REGISTERED</div>
            <div style={{
              fontFamily: fontHead, fontSize: 20, fontWeight: 900,
              color: P.accent,
            }}>{chars.length}</div>
          </div>
        </div>

        {/* Error */}
        {err && (
          <div style={{
            background: "rgba(220,38,38,0.08)",
            border: `1px solid ${P.danger}`,
            borderLeft: `3px solid ${P.danger}`,
            padding: "10px 14px", marginBottom: 16,
            fontSize: 11, color: P.danger,
          }}>✕ {err}</div>
        )}

        {/* Actions row */}
        <div style={{
          display: "flex", gap: 10, marginBottom: 20,
          flexWrap: "wrap",
        }}>
          <button onClick={onNew} style={{
            background: P.accent, border: "none",
            color: "#000", padding: "11px 22px",
            fontFamily: fontHead, fontWeight: 900,
            fontSize: 11, letterSpacing: 3,
            cursor: "pointer", flex: 1, minWidth: 200,
          }}>+ CREATE NEW PILOT</button>

          <button onClick={loadChars} style={{
            background: "transparent",
            border: `1px solid ${P.borderA}`,
            color: P.dim2, padding: "11px 16px",
            fontFamily: fontHead, fontSize: 9, letterSpacing: 2,
            cursor: "pointer",
          }}>↻ REFRESH</button>
        </div>

        {/* Divider */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10, marginBottom: 20,
        }}>
          <div style={{ flex: 1, height: 1, background: P.border }} />
          <div style={{ fontSize: 9, color: P.dim, letterSpacing: 3 }}>REGISTERED UNITS</div>
          <div style={{ flex: 1, height: 1, background: P.border }} />
        </div>

        {/* Loading */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: P.dim2 }}>
            <div style={{ fontFamily: fontHead, fontSize: 12, letterSpacing: 4, marginBottom: 8 }}>
              LOADING...
            </div>
            <div style={{ fontSize: 9, color: P.dim, letterSpacing: 2 }}>MENGAKSES DATABASE</div>
          </div>
        ) : chars.length === 0 ? (
          /* Empty state */
          <div style={{
            ...boxStyle, padding: "50px 30px",
            textAlign: "center", borderStyle: "dashed",
          }}>
            <div style={{
              fontFamily: fontHead, fontSize: 14, letterSpacing: 4,
              color: P.dim2, marginBottom: 10,
            }}>NO UNITS REGISTERED</div>
            <div style={{ fontSize: 10, color: P.dim, marginBottom: 20, lineHeight: 1.6 }}>
              Belum ada karakter. Tap "CREATE NEW PILOT" untuk mendaftarkan unit pertama kamu.
            </div>
            <button onClick={onNew} style={{
              background: "transparent",
              border: `1px solid ${P.accent}`,
              color: P.accent, padding: "10px 20px",
              fontFamily: fontHead, fontSize: 10, letterSpacing: 3,
              cursor: "pointer",
            }}>+ CREATE NOW</button>
          </div>
        ) : (
          /* Character grid */
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 12,
          }}>
            {chars.map(c => {
              const d = c.data || {};
              const col = chassisColor(d.chassis);
              const isConfirming = confirmDel === c.id;

              return (
                <div key={c.id} style={{
                  background: P.surface,
                  border: `1px solid ${P.border}`,
                  borderLeft: `3px solid ${col}`,
                  position: "relative",
                  transition: "background 0.15s, border-color 0.15s",
                  cursor: "pointer",
                }}
                  onMouseEnter={e => e.currentTarget.style.background = P.surface2}
                  onMouseLeave={e => e.currentTarget.style.background = P.surface}
                  onClick={() => !isConfirming && onOpen(c)}
                >
                  {/* Card header */}
                  <div style={{ padding: "14px 14px 0" }}>
                    {/* Chassis badge */}
                    <div style={{
                      display: "inline-block",
                      fontSize: 8, letterSpacing: 2,
                      color: col, border: `1px solid ${col}`,
                      padding: "2px 8px", marginBottom: 8,
                      background: `${col}15`,
                    }}>
                      SCAR-{d.chassis || "HEAVY"}
                    </div>

                    {/* Unit name */}
                    <div style={{
                      fontFamily: fontHead, fontSize: 15, fontWeight: 700,
                      color: P.textBr, letterSpacing: 1, marginBottom: 4,
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    }}>
                      {c.name || "UNNAMED UNIT"}
                    </div>

                    {/* Pilot name */}
                    {d.pilotName && (
                      <div style={{ fontSize: 10, color: P.dim2, marginBottom: 4 }}>
                        ✦ {d.pilotName}
                      </div>
                    )}

                    {/* Meta info */}
                    <div style={{
                      display: "flex", gap: 12, fontSize: 9,
                      color: P.dim, marginBottom: 12,
                    }}>
                      <span>{d.job || "NO JOB"}</span>
                      <span>·</span>
                      <span>{d.tier || "T0"}</span>
                      {d.faction && <><span>·</span><span>{d.faction}</span></>}
                    </div>

                    {/* Updated at */}
                    <div style={{ fontSize: 8, color: P.dim, marginBottom: 12 }}>
                      Updated: {c.updated_at
                        ? new Date(c.updated_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
                        : "—"}
                    </div>
                  </div>

                  {/* Divider */}
                  <div style={{ height: 1, background: P.border, margin: "0 14px" }} />

                  {/* Actions */}
                  <div style={{ padding: "10px 14px", display: "flex", gap: 8 }}>
                    {!isConfirming ? (
                      <>
                        <button
                          onClick={e => { e.stopPropagation(); onOpen(c); }}
                          style={{
                            flex: 1, padding: "8px",
                            background: "transparent",
                            border: `1px solid ${col}`,
                            color: col,
                            fontFamily: fontHead, fontSize: 9, letterSpacing: 2,
                            cursor: "pointer",
                          }}>OPEN</button>
                        <button
                          onClick={e => { e.stopPropagation(); setConfirmDel(c.id); }}
                          style={{
                            padding: "8px 12px",
                            background: "transparent",
                            border: `1px solid ${P.border}`,
                            color: P.dim2, cursor: "pointer", fontSize: 12,
                          }}>✕</button>
                      </>
                    ) : (
                      /* Confirm delete */
                      <>
                        <div style={{ flex: 1, fontSize: 9, color: P.danger, display: "flex", alignItems: "center" }}>
                          HAPUS UNIT INI?
                        </div>
                        <button
                          onClick={e => { e.stopPropagation(); deleteChar(c.id); }}
                          disabled={deleting === c.id}
                          style={{
                            padding: "8px 12px",
                            background: P.danger, border: "none",
                            color: "#fff", cursor: "pointer",
                            fontFamily: fontHead, fontSize: 9, letterSpacing: 1,
                          }}>
                          {deleting === c.id ? "..." : "YA"}
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); setConfirmDel(null); }}
                          style={{
                            padding: "8px 12px",
                            background: "transparent",
                            border: `1px solid ${P.borderA}`,
                            color: P.dim2, cursor: "pointer",
                            fontFamily: fontHead, fontSize: 9,
                          }}>BATAL</button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div style={{
          marginTop: 40, paddingTop: 16,
          borderTop: `1px solid ${P.border}`,
          display: "flex", justifyContent: "space-between",
          fontSize: 8, color: P.dim, letterSpacing: 2,
        }}>
          <span>WARBOUND SRD v3.4</span>
          <span>PLAYTEST EDITION</span>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Share+Tech+Mono&display=swap');
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        * { box-sizing: border-box; }
        button:hover:not(:disabled) { filter: brightness(1.15); }
        button:active:not(:disabled) { filter: brightness(0.9); }
      `}</style>
    </div>
  );
}

// ============================================================
// CARA INTEGRASI KE App.jsx
// ============================================================
// import { RosterScreen } from "./warbound_roster.jsx";
//
// Di App.jsx, ganti placeholder roster dengan:
//
// if (screen === "roster") {
//   return (
//     <RosterScreen
//       supabase={config.supabase}
//       user={user}
//       isDemo={config.mode === "demo"}
//       isGm={profile?.role === "gm"}
//       onOpen={(char) => { setActiveChar(char); setScreen("charsheet"); }}
//       onNew={() => { setActiveChar(null); setScreen("charsheet"); }}
//       onLogout={async () => {
//         await config.supabase.auth.signOut();
//         setUser(null); setScreen("auth");
//       }}
//       onSwitchToGm={() => setScreen("gm")}
//     />
//   );
// }
// ============================================================
