import { useState } from "react";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";

export default function SignupPage() {
  const [, setLocation] = useLocation();
  const [selectedRole, setSelectedRole] = useState<"patron" | "creator" | null>(null);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole || !email || !displayName) return;

    setIsLoading(true);
    try {
      // Redirect to Manus OAuth with role info in state
      const returnPath = `/complete-signup?role=${selectedRole}&name=${encodeURIComponent(displayName)}`;
      const loginUrl = getLoginUrl(returnPath);
      window.location.href = loginUrl;
    } catch (error) {
      console.error("Signup error:", error);
      setIsLoading(false);
    }
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
        {!selectedRole ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "32px" }}>
            {/* Patron Card */}
            <button
              onClick={() => setSelectedRole("patron")}
              style={{
                background: "oklch(0.085 0.015 330)",
                border: "2px solid oklch(0.72 0.09 75 / 30%)",
                borderRadius: "8px",
                padding: "24px",
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.3s",
                color: "oklch(0.93 0.02 80)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "oklch(0.72 0.09 75 / 60%)";
                (e.currentTarget as HTMLElement).style.background = "oklch(0.1 0.025 330)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "oklch(0.72 0.09 75 / 30%)";
                (e.currentTarget as HTMLElement).style.background = "oklch(0.085 0.015 330)";
              }}
            >
              <div style={{ fontSize: "32px", marginBottom: "12px" }}>✦</div>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  marginBottom: "8px",
                  letterSpacing: "0.06em",
                }}
              >
                I AM A PATRON
              </div>
              <div
                style={{
                  fontFamily: "'IM Fell English', serif",
                  fontStyle: "italic",
                  fontSize: "12px",
                  color: "oklch(0.55 0.03 60)",
                }}
              >
                Discover and support dark creators
              </div>
            </button>

            {/* Creator Card */}
            <button
              onClick={() => setSelectedRole("creator")}
              style={{
                background: "oklch(0.085 0.015 330)",
                border: "2px solid oklch(0.72 0.09 75 / 30%)",
                borderRadius: "8px",
                padding: "24px",
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.3s",
                color: "oklch(0.93 0.02 80)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "oklch(0.72 0.09 75 / 60%)";
                (e.currentTarget as HTMLElement).style.background = "oklch(0.1 0.025 330)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "oklch(0.72 0.09 75 / 30%)";
                (e.currentTarget as HTMLElement).style.background = "oklch(0.085 0.015 330)";
              }}
            >
              <div style={{ fontSize: "32px", marginBottom: "12px" }}>✦</div>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  marginBottom: "8px",
                  letterSpacing: "0.06em",
                }}
              >
                I AM A CREATOR
              </div>
              <div
                style={{
                  fontFamily: "'IM Fell English', serif",
                  fontStyle: "italic",
                  fontSize: "12px",
                  color: "oklch(0.55 0.03 60)",
                }}
              >
                Monetize your exclusive dark content
              </div>
            </button>
          </div>
        ) : (
          <>
            {/* Form */}
            <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Role Display */}
              <div
                style={{
                  background: "oklch(0.1 0.025 330)",
                  border: "1px solid oklch(0.72 0.09 75 / 20%)",
                  borderRadius: "6px",
                  padding: "12px 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "8px",
                }}
              >
                <span style={{ color: "oklch(0.55 0.03 60)", fontSize: "12px" }}>
                  {selectedRole === "patron" ? "Patron Account" : "Creator Account"}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedRole(null)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "oklch(0.72 0.09 75)",
                    cursor: "pointer",
                    fontSize: "12px",
                    textDecoration: "underline",
                  }}
                >
                  Change
                </button>
              </div>

              {/* Display Name */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontFamily: "'Cinzel', serif",
                    fontSize: "11px",
                    letterSpacing: "0.1em",
                    color: "oklch(0.72 0.09 75)",
                    marginBottom: "6px",
                    textTransform: "uppercase",
                  }}
                >
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name or alias"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    background: "oklch(0.085 0.015 330)",
                    border: "1px solid oklch(0.72 0.09 75 / 30%)",
                    borderRadius: "4px",
                    color: "oklch(0.93 0.02 80)",
                    fontFamily: "'IM Fell English', serif",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Email */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontFamily: "'Cinzel', serif",
                    fontSize: "11px",
                    letterSpacing: "0.1em",
                    color: "oklch(0.72 0.09 75)",
                    marginBottom: "6px",
                    textTransform: "uppercase",
                  }}
                >
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    background: "oklch(0.085 0.015 330)",
                    border: "1px solid oklch(0.72 0.09 75 / 30%)",
                    borderRadius: "4px",
                    color: "oklch(0.93 0.02 80)",
                    fontFamily: "'IM Fell English', serif",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !email || !displayName}
                style={{
                  padding: "12px 20px",
                  background: isLoading || !email || !displayName ? "oklch(0.72 0.09 75 / 30%)" : "oklch(0.72 0.09 75)",
                  color: isLoading || !email || !displayName ? "oklch(0.55 0.03 60)" : "oklch(0.04 0.008 285)",
                  border: "none",
                  borderRadius: "4px",
                  fontFamily: "'Cinzel', serif",
                  fontSize: "11px",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  cursor: isLoading || !email || !displayName ? "not-allowed" : "pointer",
                  transition: "all 0.3s",
                  fontWeight: 700,
                }}
              >
                {isLoading ? "Creating Account..." : "Continue with Google"}
              </button>

              {/* Back Button */}
              <button
                type="button"
                onClick={() => setLocation("/")}
                style={{
                  padding: "10px 20px",
                  background: "transparent",
                  color: "oklch(0.72 0.09 75)",
                  border: "1px solid oklch(0.72 0.09 75 / 40%)",
                  borderRadius: "4px",
                  fontFamily: "'Cinzel', serif",
                  fontSize: "11px",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  transition: "all 0.3s",
                }}
              >
                Back to Home
              </button>
            </form>

            {/* Info Text */}
            <div
              style={{
                marginTop: "20px",
                padding: "12px",
                background: "oklch(0.1 0.025 330)",
                borderRadius: "4px",
                fontFamily: "'IM Fell English', serif",
                fontStyle: "italic",
                fontSize: "12px",
                color: "oklch(0.45 0.02 60)",
                textAlign: "center",
              }}
            >
              You'll be redirected to sign in with Google. Your role will be set to {selectedRole === "patron" ? "Patron" : "Creator"}.
            </div>
          </>
        )}

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
