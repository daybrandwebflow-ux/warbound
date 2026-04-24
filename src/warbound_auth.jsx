import { useState, useEffect } from "react";

// ============================================================
// WARBOUND — AUTH SCREEN (Login & Register)
// Cara pakai: import komponen ini ke file utama warbound_charsheet.jsx
// Ganti fungsi SetupScreen & AuthScreen yang lama dengan ini
// ============================================================

// Load Supabase client
let supabaseInstance = null;
async function getSupabase(url, key) {
  if (supabaseInstance) return supabaseInstance;
  if (!window.supabaseJs) {
    const mod = await import("https://esm.sh/@supabase/supabase-js@2");
    window.supabaseJs = mod;
  }
  supabaseInstance = window.supabaseJs.createClient(url, key);
  return supabaseInstance;
}

// ============================================================
// PALETTE — sesuai WARBOUND style guide
// ============================================================
const P = {
  bg:      "#060809",
  surface: "#0a0e10",
  border:  "#1a2018",
  borderA: "#2a3828",
  accent:  "#d97706",
  text:    "#c9d4c7",
  dim:     "#3a4a38",
  dim2:    "#5a6a58",
  danger:  "#dc2626",
  success: "#22c55e",
};

const fontMono = "'Share Tech Mono', monospace";
const fontHead = "'Orbitron', sans-serif";

// ============================================================
// SETUP SCREEN — Input Supabase URL + Anon Key
// ============================================================
export function SetupScreen({ onSetup }) {
  const [url, setUrl]       = useState("");
  const [key, setKey]       = useState("");
  const [err, setErr]       = useState("");
  const [loading, setLoading] = useState(false);
  const [scanLine, setScanLine] = useState(0);

  // Animasi scan line
  useEffect(() => {
    const t = setInterval(() => setScanLine(v => (v + 1) % 100), 30);
    return () => clearInterval(t);
  }, []);

  // Auto-isi dari localStorage jika pernah connect
  useEffect(() => {
    const saved = localStorage.getItem("wb_config");
    if (saved) {
      try {
        const { url: u, key: k } = JSON.parse(saved);
        if (u) setUrl(u);
        if (k) setKey(k);
      } catch (_) {}
    }
  }, []);

  const connect = async () => {
    setErr("");
    if (!url || !key) { setErr("URL dan anon key wajib diisi"); return; }
    if (!/supabase\.co/.test(url)) { setErr("URL Supabase tidak valid — harus mengandung supabase.co"); return; }
    setLoading(true);
    try {
      const sb = await getSupabase(url.trim(), key.trim());
      // Test koneksi
      const { error } = await sb.from("warbound_profiles").select("id").limit(1);
      if (error && error.code !== "PGRST116") throw error;
      localStorage.setItem("wb_config", JSON.stringify({ url: url.trim(), key: key.trim() }));
      onSetup({ url: url.trim(), key: key.trim(), supabase: sb });
    } catch (e) {
      setErr("Koneksi gagal: " + (e.message || "Cek URL dan key kamu"));
    }
    setLoading(false);
  };

  const demo = () => onSetup({ mode: "demo" });

  return (
    <div style={{
      minHeight: "100vh",
      background: P.bg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: fontMono,
      color: P.text,
      overflow: "hidden",
      position: "relative",
    }}>
      {/* Grid background */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0,
        backgroundImage: `
          linear-gradient(rgba(217,119,6,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(217,119,6,0.03) 1px, transparent 1px)
        `,
        backgroundSize: "40px 40px",
      }} />

      {/* Scan line animasi */}
      <div style={{
        position: "fixed", left: 0, right: 0, zIndex: 1,
        top: `${scanLine}%`,
        height: "2px",
        background: "linear-gradient(90deg, transparent, rgba(217,119,6,0.15), transparent)",
        pointerEvents: "none",
        transition: "top 0.03s linear",
      }} />

      {/* Corner decorations */}
      {[
        { top: 20, left: 20, borderTop: `2px solid ${P.accent}`, borderLeft: `2px solid ${P.accent}` },
        { top: 20, right: 20, borderTop: `2px solid ${P.accent}`, borderRight: `2px solid ${P.accent}` },
        { bottom: 20, left: 20, borderBottom: `2px solid ${P.accent}`, borderLeft: `2px solid ${P.accent}` },
        { bottom: 20, right: 20, borderBottom: `2px solid ${P.accent}`, borderRight: `2px solid ${P.accent}` },
      ].map((s, i) => (
        <div key={i} style={{ position: "fixed", width: 30, height: 30, zIndex: 2, ...s }} />
      ))}

      {/* Main card */}
      <div style={{
        position: "relative", zIndex: 3,
        maxWidth: 500, width: "100%", margin: "0 20px",
        background: P.surface,
        border: `1px solid ${P.border}`,
        padding: "36px 32px",
      }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{
            fontFamily: fontHead, fontSize: 32, fontWeight: 900,
            color: P.accent, letterSpacing: 8, lineHeight: 1,
            marginBottom: 4,
          }}>WARBOUND</div>
          <div style={{ fontSize: 9, color: P.dim, letterSpacing: 4 }}>
            SYSTEM SETUP — DATABASE CONNECTION
          </div>
          <div style={{
            marginTop: 16, height: 1,
            background: `linear-gradient(90deg, ${P.accent}, transparent)`,
          }} />
        </div>

        {/* Status indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
          <div style={{
            width: 8, height: 8, borderRadius: "50%",
            background: loading ? P.accent : P.dim,
            boxShadow: loading ? `0 0 8px ${P.accent}` : "none",
            animation: loading ? "pulse 1s infinite" : "none",
          }} />
          <span style={{ fontSize: 9, color: P.dim2, letterSpacing: 2 }}>
            {loading ? "CONNECTING..." : "AWAITING CONNECTION"}
          </span>
        </div>

        {/* Input fields */}
        <Field label="SUPABASE URL" value={url} onChange={setUrl}
          placeholder="https://xxxxxxxx.supabase.co" />
        <Field label="ANON KEY" value={key} onChange={setKey}
          placeholder="eyJhbGciOiJIUzI1NiIs..." type="password" />

        {/* Error */}
        {err && (
          <div style={{
            background: "rgba(220,38,38,0.1)", border: `1px solid ${P.danger}`,
            padding: "10px 14px", fontSize: 11, color: P.danger,
            marginBottom: 16, letterSpacing: 1,
          }}>
            ✕ {err}
          </div>
        )}

        {/* Buttons */}
        <button onClick={connect} disabled={loading} style={{
          width: "100%", padding: "13px",
          background: loading ? P.dim : P.accent,
          border: "none", color: "#000",
          fontFamily: fontHead, fontWeight: 700,
          fontSize: 12, letterSpacing: 4,
          cursor: loading ? "wait" : "pointer",
          marginBottom: 10,
          transition: "all 0.2s",
        }}>
          {loading ? "CONNECTING..." : "CONNECT TO DATABASE"}
        </button>

        <button onClick={demo} style={{
          width: "100%", padding: "11px",
          background: "transparent",
          border: `1px solid ${P.borderA}`,
          color: P.dim2,
          fontFamily: fontHead, fontSize: 10, letterSpacing: 3,
          cursor: "pointer",
        }}>
          DEMO MODE (tanpa database)
        </button>

        {/* Footer info */}
        <div style={{
          marginTop: 24, padding: "12px 14px",
          border: `1px solid ${P.border}`,
          borderLeft: `3px solid ${P.accent}`,
          fontSize: 10, color: P.dim2, lineHeight: 1.7,
        }}>
          URL dan key bisa ditemukan di:<br/>
          <span style={{ color: P.accent }}>Supabase Dashboard → Project Settings → API</span>
        </div>

        {/* Version tag */}
        <div style={{
          marginTop: 20, textAlign: "right",
          fontSize: 9, color: P.dim, letterSpacing: 2,
        }}>
          SRD v3.4 PLAYTEST EDITION
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Share+Tech+Mono&display=swap');
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        * { box-sizing: border-box; }
        input::placeholder { color: #3a4a38; }
        button:hover:not(:disabled) { filter: brightness(1.1); }
      `}</style>
    </div>
  );
}

// ============================================================
// AUTH SCREEN — Login & Register
// ============================================================
export function AuthScreen({ supabase, onAuth, onReset }) {
  const [mode, setMode]     = useState("login");
  const [email, setEmail]   = useState("");
  const [pass, setPass]     = useState("");
  const [err, setErr]       = useState("");
  const [info, setInfo]     = useState("");
  const [loading, setLoading] = useState(false);
  const [glitch, setGlitch] = useState(false);

  // Glitch effect saat error
  const triggerGlitch = () => {
    setGlitch(true);
    setTimeout(() => setGlitch(false), 400);
  };

  const submit = async () => {
    setErr(""); setInfo(""); setLoading(true);
    try {
      if (mode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) throw error;
        onAuth(data.user);
      } else {
        if (pass.length < 6) throw new Error("Password minimal 6 karakter");
        const { data, error } = await supabase.auth.signUp({ email, password: pass });
        if (error) throw error;
        if (data.user && !data.session) {
          setInfo("Cek email untuk konfirmasi akun, lalu login.");
        } else if (data.session) {
          onAuth(data.user);
        }
      }
    } catch (e) {
      setErr(e.message || "Autentikasi gagal");
      triggerGlitch();
    }
    setLoading(false);
  };

  const handleKey = (e) => { if (e.key === "Enter") submit(); };

  return (
    <div style={{
      minHeight: "100vh",
      background: P.bg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: fontMono,
      color: P.text,
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Animated background lines */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0,
        backgroundImage: `
          linear-gradient(rgba(217,119,6,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(217,119,6,0.02) 1px, transparent 1px)
        `,
        backgroundSize: "60px 60px",
      }} />

      {/* Vignette */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 1,
        background: "radial-gradient(ellipse at center, transparent 40%, rgba(6,8,9,0.8) 100%)",
        pointerEvents: "none",
      }} />

      {/* Corner brackets */}
      {[
        { top: 16, left: 16, borderTop: `1px solid ${P.accent}`, borderLeft: `1px solid ${P.accent}` },
        { top: 16, right: 16, borderTop: `1px solid ${P.accent}`, borderRight: `1px solid ${P.accent}` },
        { bottom: 16, left: 16, borderBottom: `1px solid ${P.accent}`, borderLeft: `1px solid ${P.accent}` },
        { bottom: 16, right: 16, borderBottom: `1px solid ${P.accent}`, borderRight: `1px solid ${P.accent}` },
      ].map((s, i) => (
        <div key={i} style={{ position: "fixed", width: 24, height: 24, zIndex: 2, ...s }} />
      ))}

      {/* Status bar atas */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 3,
        padding: "8px 20px",
        borderBottom: `1px solid ${P.border}`,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        background: "rgba(6,8,9,0.9)",
        fontSize: 9, letterSpacing: 2, color: P.dim,
      }}>
        <span style={{ color: P.accent, fontFamily: fontHead, fontSize: 10, fontWeight: 700 }}>WARBOUND</span>
        <span>PILOT AUTHENTICATION SYSTEM</span>
        <span style={{ color: P.success }}>● ONLINE</span>
      </div>

      {/* Main card */}
      <div style={{
        position: "relative", zIndex: 4,
        maxWidth: 420, width: "100%", margin: "60px 20px 20px",
        background: P.surface,
        border: `1px solid ${glitch ? P.danger : P.border}`,
        transition: "border-color 0.1s",
        animation: glitch ? "shake 0.3s" : "none",
      }}>
        {/* Top accent bar */}
        <div style={{
          height: 3,
          background: `linear-gradient(90deg, ${P.accent}, rgba(217,119,6,0.2))`,
        }} />

        <div style={{ padding: "28px 28px 32px" }}>
          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <div style={{
              fontFamily: fontHead, fontSize: 26, fontWeight: 900,
              color: P.accent, letterSpacing: 6, marginBottom: 2,
            }}>
              {mode === "login" ? "PILOT LOGIN" : "NEW RECRUIT"}
            </div>
            <div style={{ fontSize: 9, color: P.dim, letterSpacing: 3 }}>
              {mode === "login"
                ? "MASUKKAN KREDENSIAL PILOT ANDA"
                : "DAFTARKAN UNIT BARU KE SISTEM"}
            </div>
          </div>

          {/* Tab switcher */}
          <div style={{
            display: "flex", marginBottom: 24,
            border: `1px solid ${P.border}`,
          }}>
            {["login", "register"].map(m => (
              <button key={m} onClick={() => { setMode(m); setErr(""); setInfo(""); }}
                style={{
                  flex: 1, padding: "10px",
                  background: mode === m ? "rgba(217,119,6,0.15)" : "transparent",
                  border: "none",
                  borderBottom: mode === m ? `2px solid ${P.accent}` : "2px solid transparent",
                  color: mode === m ? P.accent : P.dim2,
                  fontFamily: fontHead, fontWeight: 700,
                  fontSize: 10, letterSpacing: 3,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}>
                {m === "login" ? "LOGIN" : "REGISTER"}
              </button>
            ))}
          </div>

          {/* Form */}
          <Field label="EMAIL / ID PILOT" value={email}
            onChange={setEmail} placeholder="pilot@warbound.id"
            onKeyDown={handleKey} />
          <Field label="PASSWORD" value={pass} type="password"
            onChange={setPass} placeholder="••••••••"
            onKeyDown={handleKey} />

          {/* Error / Info */}
          {err && (
            <div style={{
              background: "rgba(220,38,38,0.08)",
              border: `1px solid ${P.danger}`,
              borderLeft: `3px solid ${P.danger}`,
              padding: "10px 14px", marginBottom: 16,
              fontSize: 11, color: P.danger, letterSpacing: 1,
            }}>
              ✕ {err}
            </div>
          )}
          {info && (
            <div style={{
              background: "rgba(34,197,94,0.08)",
              border: `1px solid ${P.success}`,
              borderLeft: `3px solid ${P.success}`,
              padding: "10px 14px", marginBottom: 16,
              fontSize: 11, color: P.success, letterSpacing: 1,
            }}>
              ✓ {info}
            </div>
          )}

          {/* Submit button */}
          <button onClick={submit} disabled={loading} style={{
            width: "100%", padding: "13px",
            background: loading ? P.dim : P.accent,
            border: "none", color: "#000",
            fontFamily: fontHead, fontWeight: 900,
            fontSize: 12, letterSpacing: 4,
            cursor: loading ? "wait" : "pointer",
            marginBottom: 12,
            position: "relative", overflow: "hidden",
            transition: "all 0.2s",
          }}>
            {loading ? "PROCESSING..." : (mode === "login" ? "LOGIN" : "REGISTER")}
          </button>

          {/* Back to setup */}
          <button onClick={onReset} style={{
            background: "none", border: "none",
            color: P.dim2, cursor: "pointer",
            fontSize: 9, letterSpacing: 2,
            fontFamily: fontHead,
            display: "flex", alignItems: "center", gap: 4,
          }}>
            ‹ GANTI KONEKSI SUPABASE
          </button>
        </div>

        {/* Bottom info */}
        {mode === "register" && (
          <div style={{
            borderTop: `1px solid ${P.border}`,
            padding: "12px 28px",
            fontSize: 9, color: P.dim2, lineHeight: 1.7,
          }}>
            ⚠ Role GM hanya bisa diset manual oleh admin lewat Supabase Dashboard.
            Semua akun baru otomatis terdaftar sebagai <span style={{ color: P.accent }}>PLAYER</span>.
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Share+Tech+Mono&display=swap');
        @keyframes shake {
          0%,100%{transform:translateX(0)}
          20%{transform:translateX(-6px)}
          40%{transform:translateX(6px)}
          60%{transform:translateX(-4px)}
          80%{transform:translateX(4px)}
        }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        * { box-sizing: border-box; }
        input { outline: none; }
        input::placeholder { color: #2a3828; }
        button:hover:not(:disabled) { filter: brightness(1.1); }
      `}</style>
    </div>
  );
}

// ============================================================
// REUSABLE FIELD COMPONENT
// ============================================================
function Field({ label, value, onChange, placeholder, type = "text", onKeyDown }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{
        fontSize: 9, letterSpacing: 3, color: focused ? P.accent : P.dim,
        marginBottom: 6, fontFamily: fontHead,
        transition: "color 0.2s",
      }}>
        {label}
      </div>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        style={{
          width: "100%", padding: "10px 12px",
          background: "rgba(0,0,0,0.4)",
          border: `1px solid ${focused ? P.accent : P.border}`,
          color: P.text,
          fontFamily: fontMono, fontSize: 13,
          transition: "border-color 0.2s",
          boxShadow: focused ? `0 0 0 1px rgba(217,119,6,0.2)` : "none",
        }}
      />
    </div>
  );
}

// ============================================================
// CARA INTEGRASI KE warbound_charsheet.jsx
// ============================================================
// 1. Import di bagian atas file utama:
//    import { SetupScreen, AuthScreen } from "./warbound_auth.jsx";
//
// 2. Hapus fungsi SetupScreen dan AuthScreen yang lama
//
// 3. Pastikan App component punya state:
//    const [config, setConfig] = useState(null);
//    const [user, setUser]     = useState(null);
//
// 4. Render flow:
//    if (!config) return <SetupScreen onSetup={setConfig} />;
//    if (!user)   return <AuthScreen supabase={config.supabase} onAuth={setUser} onReset={() => setConfig(null)} />;
//    return <MainApp ... />;
// ============================================================

// Preview standalone (hapus ini saat integrasi)
export default function PreviewApp() {
  const [screen, setScreen] = useState("setup");
  const [config, setConfig] = useState(null);

  if (screen === "setup") {
    return <SetupScreen onSetup={(cfg) => { setConfig(cfg); setScreen("auth"); }} />;
  }
  return (
    <AuthScreen
      supabase={config?.supabase}
      onAuth={(user) => alert("Login berhasil: " + user.email)}
      onReset={() => setScreen("setup")}
    />
  );
}
