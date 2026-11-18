import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Mail,
  LockKeyhole,
  UserRound,
  Phone,
  ArrowRight,
  Gem,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import "./Register.css";
export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
    setSuccess("");

    if (
      !form.fullName.trim() ||
      !form.email.trim() ||
      !form.password ||
      !form.confirmPassword
    ) {
      setError("Please complete all required fields.");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!supabase) {
      setError("Supabase is not configured. Check your project settings.");
      return;
    }

    setLoading(true);

    try {
      const { data, error: registerError } =
        await supabase.auth.signUp({
          email: form.email.trim(),
          password: form.password,
          options: {
            data: {
              full_name: form.fullName.trim(),
              phone: form.phone.trim(),
            },
          },
        });

      if (registerError) {
        throw registerError;
      }

      if (data.session) {
        navigate("/store", { replace: true });
        return;
      }

      setSuccess(
        "Account created. Check your email for a verification link before signing in."
      );

      setForm({
        fullName: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
      });
    } catch (err) {
      setError(err.message || "Unable to create your account.");
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
            <span className="auth-eyebrow">YOUR SPACE, YOUR STYLE</span>

            <h1>
              Discover the
              <br />
              beauty of <em>stone.</em>
            </h1>

            <p>
              Create your account to explore marble collections,
              manage your orders, and make your next project exceptional.
            </p>

            <div className="auth-brand-features">
              <div>
                <ShieldCheck size={19} />
                <span>Secure account access</span>
              </div>

              <div>
                <Gem size={19} />
                <span>Premium stone collections</span>
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
            <span className="auth-eyebrow">GET STARTED</span>
            <h2>Create your account</h2>
            <p>Enter your details to join ARK MARBLES.</p>
          </div>

          {error && (
            <div className="auth-alert auth-alert-error" role="alert">
              {error}
            </div>
          )}

          {success && (
            <div className="auth-alert auth-alert-success" role="status">
              {success}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            <label htmlFor="register-fullname">Full name</label>

            <div className="auth-input-wrapper">
              <UserRound size={19} />

              <input
                id="register-fullname"
                name="fullName"
                type="text"
                placeholder="Enter your full name"
                value={form.fullName}
                onChange={handleChange}
                autoComplete="name"
                required
              />
            </div>

            <label htmlFor="register-email">Email address</label>

            <div className="auth-input-wrapper">
              <Mail size={19} />

              <input
                id="register-email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                required
              />
            </div>

            <label htmlFor="register-phone">Phone number</label>

            <div className="auth-input-wrapper">
              <Phone size={19} />

              <input
                id="register-phone"
                name="phone"
                type="tel"
                placeholder="Enter your phone number"
                value={form.phone}
                onChange={handleChange}
                autoComplete="tel"
              />
            </div>

            <label htmlFor="register-password">Password</label>

            <div className="auth-input-wrapper">
              <LockKeyhole size={19} />

              <input
                id="register-password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="At least 6 characters"
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

            <label htmlFor="register-confirm-password">
              Confirm password
            </label>

            <div className="auth-input-wrapper">
              <LockKeyhole size={19} />

              <input
                id="register-confirm-password"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Re-enter your password"
                value={form.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
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

            <button
              className="auth-submit-button"
              type="submit"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Create Account"}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="auth-divider">
            <span>ALREADY A CUSTOMER?</span>
          </div>

          <p className="auth-register-link">
            Already have an account?{" "}
            <Link to="/login">Sign in</Link>
          </p>

          <p className="auth-security-note">
            <ShieldCheck size={16} />
            Your account is protected by secure authentication.
          </p>
        </div>
      </section>
    </main>
  );
}