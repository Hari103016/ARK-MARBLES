import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  LockKeyhole,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Gem,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

export default function ResetPassword() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!form.password || !form.confirmPassword) {
      setError("Please complete both password fields.");
      return;
    }

    if (form.password.length < 6) {
      setError("Your password must contain at least 6 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    if (!supabase) {
      setError("Supabase is not configured. Check your project settings.");
      return;
    }

    setLoading(true);

    try {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      if (!sessionData.session) {
        throw new Error(
          "Your reset session is missing or expired. Request a new password reset link."
        );
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: form.password,
      });

      if (updateError) {
        throw updateError;
      }

      setSuccess(true);
      setForm({
        password: "",
        confirmPassword: "",
      });
    } catch (err) {
      setError(
        err.message || "Unable to update your password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-brand-panel">
        <div className="auth-brand-content">
          <Link to="/" className="auth-brand-logo">
            <span className="auth-brand-icon">
              <Gem size={27} />
            </span>

            <span>
              <strong>ARK MARBLES</strong>
              <small>PREMIUM STONE COLLECTIONS</small>
            </span>
          </Link>

          <div className="auth-brand-message">
            <span className="auth-eyebrow">ACCOUNT SECURITY</span>

            <h1>
              A fresh start,
              <br />
              a stronger <em>password.</em>
            </h1>

            <p>
              Choose a secure password to regain access to your ARK
              MARBLES account.
            </p>

            <div className="auth-brand-features">
              <div>
                <ShieldCheck size={19} />
                <span>Secure account recovery</span>
              </div>

              <div>
                <LockKeyhole size={19} />
                <span>Protected authentication</span>
              </div>
            </div>
          </div>

          <div className="auth-brand-footer">
            © {new Date().getFullYear()} ARK MARBLES
            <span>CRAFTED FOR LASTING IMPRESSIONS</span>
          </div>
        </div>
      </section>

      <section className="auth-form-panel">
        <div className="auth-form-container">
          <div className="auth-mobile-logo">
            <span className="auth-brand-icon">
              <Gem size={24} />
            </span>
            <strong>ARK MARBLES</strong>
          </div>

          <Link to="/login" className="auth-back-link">
            <ArrowLeft size={17} />
            Back to login
          </Link>

          <div className="auth-form-heading">
            <span className="auth-eyebrow">PASSWORD RECOVERY</span>
            <h2>Create a new password</h2>
            <p>
              Enter your new password below to secure your account.
            </p>
          </div>

          {error && (
            <div className="auth-alert auth-alert-error" role="alert">
              {error}
            </div>
          )}

          {success ? (
            <div className="auth-success-panel" role="status">
              <div className="auth-success-icon">
                <CheckCircle2 size={30} />
              </div>

              <h3>Password updated</h3>

              <p>
                Your password has been changed successfully. You can now
                sign in using your new password.
              </p>

              <button
                type="button"
                className="auth-submit-button"
                onClick={() => navigate("/login", { replace: true })}
              >
                Continue to Login
                <ArrowRight size={18} />
              </button>
            </div>
          ) : (
            <form className="auth-form" onSubmit={handleSubmit}>
              <label htmlFor="reset-password">New password</label>

              <div className="auth-input-wrapper">
                <LockKeyhole size={19} />

                <input
                  id="reset-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your new password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  minLength={6}
                  required
                />

                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </div>

              <label htmlFor="reset-confirm-password">
                Confirm new password
              </label>

              <div className="auth-input-wrapper">
                <LockKeyhole size={19} />

                <input
                  id="reset-confirm-password"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter your new password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                  minLength={6}
                  required
                />

                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() =>
                    setShowConfirmPassword((current) => !current)
                  }
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </div>

              <p className="auth-password-hint">
                Use at least 6 characters. Avoid passwords you use on
                other websites.
              </p>

              <button
                className="auth-submit-button"
                type="submit"
                disabled={loading}
              >
                {loading ? "Updating password..." : "Update Password"}
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>
          )}

          <p className="auth-register-link">
            Need another reset link?{" "}
            <Link to="/forgot-password">Request one</Link>
          </p>

          <p className="auth-security-note">
            <ShieldCheck size={16} />
            Password updates are handled through Supabase authentication.
          </p>
        </div>
      </section>
    </main>
  );
}