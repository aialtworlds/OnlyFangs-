import { useLocation } from "wouter";
import type { CSSProperties } from "react";
import { getLoginUrl } from "@/const";

export default function SignupPage() {
  const [, setLocation] = useLocation();

  const handleChooseRole = (role: "patron" | "creator") => {
    const returnPath = `/complete-signup?role=${role}`;
    window.location.href = getLoginUrl(returnPath);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "oklch(0.04 0.008 285)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        fontFamily: "'Cinzel', serif",
      }}
    >
      <div
        style={{
          maxWidth: "600px",
          width: "100%",
          background: "oklch(0.055 0.012 330)",
          border: "1px solid oklch(0.72 0.09 75 / 20%)",
          borderRadius: "8px",
          padding: "40px",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h1
            style={{
              fontSize: "28px",
              fontWeight: 700,
              color: "oklch(0.93 0.02 80)",
              marginBottom: "8px",
              letterSpacing: "0.06em",
            }}
          >
            ONLY <span style={{ color: "oklch(0.72 0.09 75)" }}>FANGS</span>
          </h1>
          <p
            style={{
              fontFamily: "'IM Fell English', serif",
              fontStyle: "italic",
              fontSize: "14px",
              color: "oklch(0.55 0.03 60)",
            }}
          >
            Join the night. Choose your path.
          </p>
        </div>

        {/* Role Selection */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <button
            onClick={() => handleChooseRole("patron")}
            style={roleCardStyle}
            onMouseEnter={(e) => applyHoverStyle(e.currentTarget)}
            onMouseLeave={(e) => removeHoverStyle(e.currentTarget)}
          >
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>✦</div>
            <div style={roleTitleStyle}>I AM A PATRON</div>
            <div style={roleSubtitleStyle}>Discover and support dark creators</div>
          </button>

          <button
            onClick={() => handleChooseRole("creator")}
            style={roleCardStyle}
            onMouseEnter={(e) => applyHoverStyle(e.currentTarget)}
            onMouseLeave={(e) => removeHoverStyle(e.currentTarget)}
          >
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>✦</div>
            <div style={roleTitleStyle}>I AM A CREATOR</div>
            <div style={roleSubtitleStyle}>Monetize your exclusive dark content</div>
          </button>
        </div>

        <p
          style={{
            marginTop: "24px",
            textAlign: "center",
            fontFamily: "'IM Fell English', serif",
            fontStyle: "italic",
            fontSize: "12px",
            color: "oklch(0.45 0.02 60)",
          }}
        >
          You'll be redirected to sign in with Google, then land straight on your dashboard.
        </p>

        {/* Footer */}
        <div
          style={{
            marginTop: "32px",
            paddingTop: "20px",
            borderTop: "1px solid oklch(0.72 0.09 75 / 15%)",
            textAlign: "center",
            fontFamily: "'IM Fell English', serif",
            fontStyle: "italic",
            fontSize: "12px",
            color: "oklch(0.35 0.02 60)",
          }}
        >
          Already have an account?{" "}
          <button
            onClick={() => setLocation("/")}
            style={{
              background: "none",
              border: "none",
              color: "oklch(0.72 0.09 75)",
              cursor: "pointer",
              textDecoration: "underline",
              fontFamily: "inherit",
              fontSize: "inherit",
              fontStyle: "inherit",
            }}
          >
            Sign in here
          </button>
        </div>
      </div>
    </div>
  );
}

const roleCardStyle: CSSProperties = {
  background: "oklch(0.085 0.015 330)",
  border: "2px solid oklch(0.72 0.09 75 / 30%)",
  borderRadius: "8px",
  padding: "24px",
  textAlign: "center",
  cursor: "pointer",
  transition: "all 0.3s",
  color: "oklch(0.93 0.02 80)",
};

const roleTitleStyle: CSSProperties = {
  fontSize: "14px",
  fontWeight: 700,
  marginBottom: "8px",
  letterSpacing: "0.06em",
};

const roleSubtitleStyle: CSSProperties = {
  fontFamily: "'IM Fell English', serif",
  fontStyle: "italic",
  fontSize: "12px",
  color: "oklch(0.55 0.03 60)",
};

function applyHoverStyle(el: HTMLElement) {
  el.style.borderColor = "oklch(0.72 0.09 75 / 60%)";
  el.style.background = "oklch(0.1 0.025 330)";
}

function removeHoverStyle(el: HTMLElement) {
  el.style.borderColor = "oklch(0.72 0.09 75 / 30%)";
  el.style.background = "oklch(0.085 0.015 330)";
}
