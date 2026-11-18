import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LogOut,
  LoaderCircle,
  ShieldCheck,
  Gem,
  AlertCircle,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

export default function Logout() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogout() {
    setLoading(true);
    setError("");

    if (!supabase) {
      setError("Supabase is not configured. Check your project settings.");
      setLoading(false);
      return;
    }

    try {
      const { error: logoutError } = await supabase.auth.signOut();

      if (logoutError) {
        throw logoutError;
      }

      navigate("/login", { replace: true });
    } catch (err) {
      setError(err.message || "Unable to sign out. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleCancel() {
    navigate(-1);
  }

  return (
    <main className="auth-page">
      <section className="auth-brand-panel">
        <div className="auth-brand-content">
          <div className="auth-brand-logo">
            <span className="auth-brand-icon">
              <Gem size={27} />
            </span>

            <span>
              <strong>ARK MARBLES</strong>
              <small>PREMIUM STONE COLLECTIONS</small>
            </span>
          </div>

          <div className="auth-brand-message">
            <span className="auth-eyebrow">SECURE YOUR ACCOUNT</span>

            <h1>
              Thank you for
              <br />
              being <em>with us.</em>
            </h1>

            <p>
              Your ARK MARBLES account is ready whenever you return.
              Sign out securely when you finish your work.
            </p>

            <div className="auth-brand-features">
              <div>
                <ShieldCheck size={19} />
                <span>Secure authentication</span>
              </div>

              <div>
                <LogOut size={19} />
                <span>Protected account access</span>
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

          <div className="auth-form-heading">
            <span className="auth-eyebrow">ACCOUNT SESSION</span>
            <h2>Sign out of your account?</h2>
            <p>
              Are you sure you want to sign out of your ARK MARBLES account?
            </p>
          </div>

          {error && (
            <div className="auth-alert auth-alert-error" role="alert">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <div className="auth-logout-card">
            <div className="auth-logout-icon">
              <LogOut size={28} />
            </div>

            <h3>Ready to leave?</h3>

            <p>
              You will need to sign in again to access your account.
            </p>

            <button
              type="button"
              className="auth-submit-button"
              onClick={handleLogout}
              disabled={loading}
            >
              {loading ? (
                <>
                  <LoaderCircle size={18} className="auth-spin" />
                  Signing out...
                </>
              ) : (
                <>
                  Sign Out
                  <LogOut size={18} />
                </>
              )}
            </button>

            <button
              type="button"
              className="auth-cancel-button"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel and go back
            </button>
          </div>

          <p className="auth-security-note">
            <ShieldCheck size={16} />
            Your session will be ended through Supabase authentication.
          </p>
        </div>
      </section>
    </main>
  );
}