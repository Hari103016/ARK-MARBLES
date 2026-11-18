import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserRound,
  Mail,
  Phone,
  ShieldCheck,
  Save,
  LogOut,
  LoaderCircle,
  CheckCircle2,
  AlertCircle,
  Gem,
  CalendarDays,
  Globe,
  ChevronDown,
} from "lucide-react";

import { supabase } from "../../lib/supabase";
import "./CustomerProfile.css";

export default function CustomerProfile() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [user, setUser] = useState(null);

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    language: "English",
  });

  const [message, setMessage] = useState({
    type: "",
    text: "",
  });

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const { data, error } = await supabase.auth.getUser();

        if (error) throw error;

        if (!data?.user) {
          navigate("/login", { replace: true });
          return;
        }

        if (!active) return;

        const currentUser = data.user;
        const metadata = currentUser.user_metadata || {};

        setUser(currentUser);
        setForm({
          fullName:
            metadata.full_name ||
            metadata.name ||
            "",
          phone: metadata.phone || "",
          dateOfBirth: metadata.date_of_birth || "",
          gender: metadata.gender || "",
          language: metadata.language || "English",
        });
      } catch (error) {
        console.error("Unable to load profile:", error);

        if (active) {
          setMessage({
            type: "error",
            text: "Unable to load your profile. Please sign in again.",
          });
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, [navigate]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setMessage({ type: "", text: "" });
  }

  async function handleSave(event) {
    event.preventDefault();

    if (!form.fullName.trim()) {
      setMessage({
        type: "error",
        text: "Please enter your full name.",
      });
      return;
    }

    if (!user) {
      setMessage({
        type: "error",
        text: "Please sign in to update your profile.",
      });
      return;
    }

    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const { data, error } = await supabase.auth.updateUser({
        data: {
          ...(user.user_metadata || {}),
          full_name: form.fullName.trim(),
          phone: form.phone.trim(),
          date_of_birth: form.dateOfBirth,
          gender: form.gender,
          language: form.language,
        },
      });

      if (error) throw error;

      if (data?.user) setUser(data.user);

      setMessage({
        type: "success",
        text: "Your profile has been updated successfully.",
      });
    } catch (error) {
      console.error("Unable to save profile:", error);

      setMessage({
        type: "error",
        text: error.message || "Unable to save your profile. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    setMessage({ type: "", text: "" });

    try {
      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      navigate("/login", { replace: true });
    } catch (error) {
      setMessage({
        type: "error",
        text: error.message || "Unable to sign out. Please try again.",
      });
      setSigningOut(false);
    }
  }

  if (loading) {
    return (
      <div className="customer-profile-loading">
        <div className="customer-profile-spinner" />
        <p>Preparing your profile...</p>
      </div>
    );
  }

  const displayName =
    form.fullName.trim() ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    "Valued Customer";

  const email = user?.email || "No email available";

  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

  return (
    <main className="customer-profile-page">
      <div className="customer-profile-container">
        <header className="customer-profile-topbar">
          <div className="customer-profile-brand">
            <span className="customer-profile-brand-icon">
              <Gem size={22} />
            </span>
            <span className="customer-profile-brand-name">
              ARK MARBLES
              <small>MEMBER SPACE</small>
            </span>
          </div>

          <div className="customer-profile-top-note">
            <span>NATURAL STONE</span>
            <span>TIMELESS DESIGN</span>
          </div>
        </header>

        <section className="customer-profile-heading">
          <span className="customer-profile-eyebrow">YOUR ACCOUNT</span>
          <h1>My Profile</h1>
          <p>
            Manage your personal details and keep your information up to date.
          </p>
        </section>

        <section className="customer-profile-card">
          <div className="customer-profile-banner">
            <div className="customer-profile-avatar">
              <span>{initials || <UserRound size={35} />}</span>
              <div className="customer-profile-avatar-ring" />
            </div>

            <div className="customer-profile-identity">
              <span className="customer-profile-eyebrow">
                REGISTERED CUSTOMER
              </span>
              <h2>{displayName}</h2>
              <p>
                <Mail size={15} />
                {email}
              </p>
              <span className="customer-profile-badge">
                <ShieldCheck size={14} />
                Verified account
              </span>
            </div>

            <div className="customer-profile-secure">
              <span className="customer-profile-secure-icon">
                <ShieldCheck size={25} />
              </span>
              <div>
                <strong>Your information is secure</strong>
                <p>Protected by your account authentication.</p>
              </div>
            </div>
          </div>

          <form className="customer-profile-form" onSubmit={handleSave}>
            <div className="customer-profile-form-heading">
              <div>
                <span className="customer-profile-eyebrow">MY PROFILE</span>
                <h3 className="customer-profile-section-title">
                  Personal Information
                </h3>
                <p className="customer-profile-section-description">
                  Update your details for a smoother shopping experience.
                </p>
              </div>
              <span className="customer-profile-heading-gem">
                <Gem size={24} />
              </span>
            </div>

            <div className="customer-profile-fields">
              <div className="customer-profile-field">
                <label
                  htmlFor="customer-full-name"
                  className="customer-profile-label"
                >
                  Full Name
                </label>
                <div className="customer-profile-input-wrap">
                  <UserRound className="customer-profile-input-icon" size={18} />
                  <input
                    id="customer-full-name"
                    name="fullName"
                    type="text"
                    className="customer-profile-input"
                    placeholder="Enter your full name"
                    value={form.fullName}
                    onChange={handleChange}
                    autoComplete="name"
                    maxLength={100}
                    required
                  />
                </div>
              </div>

              <div className="customer-profile-field">
                <label
                  htmlFor="customer-email"
                  className="customer-profile-label"
                >
                  Email Address
                </label>
                <div className="customer-profile-input-wrap">
                  <Mail className="customer-profile-input-icon" size={18} />
                  <input
                    id="customer-email"
                    name="email"
                    type="email"
                    className="customer-profile-input"
                    value={email}
                    disabled
                    readOnly
                    autoComplete="email"
                  />
                </div>
                <small className="customer-profile-field-note">
                  Your account email cannot be changed here.
                </small>
              </div>

              <div className="customer-profile-field">
                <label
                  htmlFor="customer-phone"
                  className="customer-profile-label"
                >
                  Phone Number
                </label>
                <div className="customer-profile-input-wrap">
                  <Phone className="customer-profile-input-icon" size={18} />
                  <input
                    id="customer-phone"
                    name="phone"
                    type="tel"
                    className="customer-profile-input"
                    placeholder="Enter your phone number"
                    value={form.phone}
                    onChange={handleChange}
                    autoComplete="tel"
                    maxLength={20}
                  />
                </div>
              </div>

              <div className="customer-profile-field">
                <label
                  htmlFor="customer-dob"
                  className="customer-profile-label"
                >
                  Date of Birth
                </label>
                <div className="customer-profile-input-wrap">
                  <CalendarDays
                    className="customer-profile-input-icon"
                    size={18}
                  />
                  <input
                    id="customer-dob"
                    name="dateOfBirth"
                    type="date"
                    className="customer-profile-input"
                    value={form.dateOfBirth}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="customer-profile-field">
                <label
                  htmlFor="customer-gender"
                  className="customer-profile-label"
                >
                  Gender
                </label>
                <div className="customer-profile-input-wrap">
                  <UserRound className="customer-profile-input-icon" size={18} />
                  <select
                    id="customer-gender"
                    name="gender"
                    className="customer-profile-input customer-profile-select"
                    value={form.gender}
                    onChange={handleChange}
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                  <ChevronDown
                    className="customer-profile-select-arrow"
                    size={16}
                  />
                </div>
              </div>

              <div className="customer-profile-field">
                <label
                  htmlFor="customer-language"
                  className="customer-profile-label"
                >
                  Preferred Language
                </label>
                <div className="customer-profile-input-wrap">
                  <Globe className="customer-profile-input-icon" size={18} />
                  <select
                    id="customer-language"
                    name="language"
                    className="customer-profile-input customer-profile-select"
                    value={form.language}
                    onChange={handleChange}
                  >
                    <option value="English">English</option>
                    <option value="Telugu">Telugu</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Tamil">Tamil</option>
                    <option value="Kannada">Kannada</option>
                  </select>
                  <ChevronDown
                    className="customer-profile-select-arrow"
                    size={16}
                  />
                </div>
              </div>
            </div>

            {message.text && (
              <div
                className={`customer-profile-message ${
                  message.type === "success"
                    ? "customer-profile-success"
                    : "customer-profile-error"
                }`}
                role={message.type === "error" ? "alert" : "status"}
                aria-live="polite"
              >
                {message.type === "success" ? (
                  <CheckCircle2 size={18} />
                ) : (
                  <AlertCircle size={18} />
                )}
                <span>{message.text}</span>
              </div>
            )}

            <div className="customer-profile-actions">
              <button
                type="submit"
                className="customer-profile-save"
                disabled={saving || signingOut}
              >
                {saving ? (
                  <>
                    <LoaderCircle
                      size={18}
                      className="profile-button-spinner"
                    />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Save Changes
                  </>
                )}
              </button>

              <button
                type="button"
                className="customer-profile-logout"
                onClick={handleSignOut}
                disabled={saving || signingOut}
              >
                {signingOut ? (
                  <>
                    <LoaderCircle
                      size={17}
                      className="profile-button-spinner"
                    />
                    Signing Out...
                  </>
                ) : (
                  <>
                    <LogOut size={17} />
                    Sign Out
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

        <section className="customer-profile-security">
          <div className="customer-profile-security-icon">
            <ShieldCheck size={23} />
          </div>
          <div>
            <h3>Your Account Security</h3>
            <p>
              Your profile details are stored in Supabase authentication
              metadata. Changes are saved to your signed-in account.
            </p>
          </div>
        </section>

        <footer className="customer-profile-footer">
          <span />
          <p>
            © {new Date().getFullYear()} ARK MARBLES. Crafted for timeless spaces.
          </p>
          <span />
        </footer>
      </div>
    </main>
  );
}