import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Gem,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess(false);

    if (!email.trim()) {
      setError("Please enter your registered email address.");
      return;
    }

    if (!supabase) {
      setError("Supabase is not configured. Check your project settings.");
      return;
    }

    setLoading(true);

    try {
      const { error: resetError } =
        await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/reset-password`,
        });

      if (resetError) {
        throw resetError;
      }

      setSuccess(true);
    } catch (err) {
      setError(
        err.message || "Unable to send the password reset email."
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
              Your account,
              <br />
              <em>protected.</em>
            </h1>

            <p>
              Recover access to your ARK MARBLES account through a
              secure password reset link sent to your email.
            </p>

            <div className="auth-brand-features">
              <div>
                <ShieldCheck size={19} />
                <span>Secure password recovery</span>
              </div>

              <div>
                <Mail size={19} />
                <span>Email-based verification</span>
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
            <h2>Forgot your password?</h2>
            <p>
              Enter the email address associated with your account.
              We'll send you a link to reset your password.
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

              <h3>Check your email</h3>

              <p>
                If your account can receive password reset emails,
                instructions will be sent to:
              </p>

              <strong className="auth-reset-email">{email}</strong>

              <p>
                Check your inbox and spam folder, then follow the link
                to create a new password.
              </p>

              <button
                type="button"
                className="auth-submit-button"
                onClick={() => {
                  setSuccess(false);
                  setError("");
                }}
              >
                Try another email
                <ArrowRight size={18} />
              </button>
            </div>
          ) : (
            <form className="auth-form" onSubmit={handleSubmit}>
              <label htmlFor="forgot-email">Email address</label>

              <div className="auth-input-wrapper">
                <Mail size={19} />

                <input
                  id="forgot-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              <button
                className="auth-submit-button"
                type="submit"
                disabled={loading}
              >
                {loading ? "Sending reset link..." : "Send Reset Link"}
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>
          )}

          <p className="auth-register-link">
            Remember your password? <Link to="/login">Sign in</Link>
          </p>

          <p className="auth-security-note">
            <ShieldCheck size={16} />
            Password recovery is handled through Supabase authentication.
          </p>
        </div>
      </section>
    </main>
  );
}