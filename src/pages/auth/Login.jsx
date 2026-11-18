
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Gem,
  Building2,
  House,
  LoaderCircle,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleLogin = async (event) => {
    event.preventDefault();

    if (loading || googleLoading) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const { data, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (loginError) throw loginError;

      if (!data.user) {
        throw new Error("Unable to retrieve your account.");
      }

      setSuccess("Login successful. Redirecting...");

      // Check the user's role when a profiles table is configured.
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Could not retrieve user role:", profileError);
      }

      const destination =
        profile?.role === "admin" || profile?.role === "administrator"
          ? "/admin"
          : "/";

      navigate(destination, { replace: true });
    } catch (err) {
      setError(
        err?.message || "Login failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (loading || googleLoading) return;

    setError("");
    setSuccess("");
    setGoogleLoading(true);

    try {
      const { error: oauthError } =
        await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: window.location.origin,
          },
        });

      if (oauthError) throw oauthError;
    } catch (err) {
      setError(
        err?.message ||
          "Google sign-in failed. Check your Supabase Google provider settings."
      );
      setGoogleLoading(false);
    }
  };

  return (
    <main className="ark-login">
      <div className="ark-login-background" aria-hidden="true" />
      <div className="ark-login-overlay" aria-hidden="true" />

      <header className="ark-login-header">
        <Link className="ark-brand" to="/">
          <span className="ark-brand-mark">A</span>
          <span className="ark-brand-copy">
            <strong>ARK MARBLES</strong>
            <small>MARBLES · CONSTRUCTION · LUXURY SPACES</small>
          </span>
        </Link>

        <nav aria-label="Main navigation">
          <Link to="/">Home</Link>
          <Link to="/marbles">Marbles</Link>
          <Link to="/construction">Construction</Link>
          <Link to="/about">About</Link>
          <Link to="/contact">Contact</Link>
        </nav>
      </header>

      <section className="ark-login-main">
        <div className="ark-login-intro">
          <span className="ark-kicker">BUILD · DESIGN · LIVE BETTER</span>

          <h1>
            ARK MARBLES
            <span>Marbles &amp; Construction</span>
            <em>Beyond Expectations</em>
          </h1>

          <p className="ark-login-intro-text">
            Premium marble solutions and construction materials for your
            dream spaces.
          </p>

          <div className="ark-login-features">
            <div>
              <Gem />
              <span>Premium<br />Marbles</span>
            </div>
            <div>
              <Building2 />
              <span>Construction<br />Materials</span>
            </div>
            <div>
              <House />
              <span>Luxury<br />Spaces</span>
            </div>
          </div>
        </div>

        <form className="ark-login-card" onSubmit={handleLogin}>
          <div className="ark-login-logo">A</div>
          <h2>ARK MARBLES</h2>

          <p className="ark-login-subtitle">
            MARBLES · CONSTRUCTION · LUXURY SPACES
          </p>

          <div className="ark-login-divider">
            <span />
            <Gem size={19} />
            <span />
          </div>

          <h3>Welcome <span>Back</span></h3>
          <p className="ark-login-description">
            Sign in to your account to continue
          </p>

          {error && (
            <div className="ark-login-message ark-login-error" role="alert">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div
              className="ark-login-message ark-login-success"
              role="status"
            >
              <CheckCircle2 size={18} />
              <span>{success}</span>
            </div>
          )}

          <label className="ark-login-input">
            <Mail size={20} />
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              disabled={loading || googleLoading}
            />
          </label>

          <label className="ark-login-input">
            <Lock size={20} />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              disabled={loading || googleLoading}
            />
            <button
              type="button"
              className="ark-password-toggle"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((previous) => !previous)}
              disabled={loading || googleLoading}
            >
              {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
            </button>
          </label>

          <div className="ark-login-options">
            <label className="ark-remember">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
                disabled={loading || googleLoading}
              />
              <span>Remember me</span>
            </label>
            <Link to="/forgot-password">Forgot Password?</Link>
          </div>

          <button
            className="ark-login-submit"
            type="submit"
            disabled={loading || googleLoading}
          >
            <span>{loading ? "Signing In..." : "Sign In"}</span>
            {loading ? (
              <LoaderCircle className="ark-login-spinner" size={20} />
            ) : (
              <ArrowRight size={20} />
            )}
          </button>

          <div className="ark-login-or">
            <span />
            <small>OR</small>
            <span />
          </div>

          <button
            className="ark-google-button"
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading || googleLoading}
          >
            {googleLoading ? (
              <>
                <LoaderCircle className="ark-login-spinner" size={18} />
                Connecting to Google...
              </>
            ) : (
              "Continue with Google"
            )}
          </button>

          <p className="ark-register-link">
            Don't have an account?
            <Link to="/register">Create Account →</Link>
          </p>
        </form>
      </section>

      <footer className="ark-login-footer">
        <span>◇ Premium Materials</span>
        <span>⌖ Quality Selection</span>
        <span>◈ Trusted Service</span>
        <span>♛ Luxury Spaces</span>
      </footer>
    </main>
  );
}
