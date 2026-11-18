
import { useRef, useState } from "react";
import {
  Settings as SettingsIcon,
  Building2,
  Users,
  Bell,
  CreditCard,
  Plug,
  ShieldCheck,
  Database,
  Save,
  RotateCcw,
  Upload,
  Trash2,
  Moon,
  Sun,
  Monitor,
  UserPlus,
  Mail,
  MessageCircle,
  Globe,
  CalendarDays,
  Languages,
  Coins,
  Tag,
  Store,
} from "lucide-react";

import "./Settings.css";

const menuItems = [
  { name: "General", description: "Basic store configuration", icon: SettingsIcon },
  { name: "Company", description: "Business & contact details", icon: Building2 },
  { name: "Users & Roles", description: "Manage staff and permissions", icon: Users },
  { name: "Notifications", description: "Email, SMS & WhatsApp settings", icon: Bell },
  { name: "Payments", description: "Payment methods & gateways", icon: CreditCard },
  { name: "Integrations", description: "Third-party services & APIs", icon: Plug },
  { name: "Security", description: "Password, access & login control", icon: ShieldCheck },
  { name: "Backup & Restore", description: "Data backup and system recovery", icon: Database },
];

const initialSettings = {
  systemName: "ARK Marbles",
  tagline: "Premium Marble & Construction Solutions",
  currency: "INR",
  dateFormat: "DD-MM-YYYY",
  timezone: "Asia/Kolkata",
  language: "English",
  theme: "dark",
  customerRegistration: true,
  emailNotifications: true,
  whatsappNotifications: true,
};

export default function Settings() {
  const [activeTab, setActiveTab] = useState("General");
  const [settings, setSettings] = useState(initialSettings);
  const [logo, setLogo] = useState(null);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef(null);

  const update = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleLogo = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setLogo(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSave = (event) => {
    event.preventDefault();

    // Frontend demonstration only. Connect this to Supabase to persist settings.
    console.log("ARK MARBLES settings:", settings);
    console.log("Selected logo:", logo);
    setSaved(true);
  };

  const handleReset = () => {
    setSettings(initialSettings);
    setLogo(null);
    if (fileRef.current) fileRef.current.value = "";
    setSaved(false);
  };

  const Toggle = ({ icon: Icon, title, description, value, onChange }) => (
    <div className="ark-setting-toggle-row">
      <div className="ark-setting-toggle-icon">
        <Icon size={20} />
      </div>

      <div className="ark-setting-toggle-copy">
        <h4>{title}</h4>
        <p>{description}</p>
      </div>

      <button
        type="button"
        className={`ark-setting-switch ${value ? "is-on" : ""}`}
        onClick={() => onChange(!value)}
        aria-label={`Toggle ${title}`}
        aria-pressed={value}
      >
        <span />
      </button>
    </div>
  );

  const currentIcon =
    menuItems.find((item) => item.name === activeTab)?.icon || SettingsIcon;

  const CurrentIcon = currentIcon;

  return (
    <div className="ark-settings-page">
      {/* PAGE BANNER */}

      <section className="ark-settings-banner">
        <div className="ark-settings-banner-icon">
          <SettingsIcon size={40} />
        </div>

        <div>
          <span className="ark-settings-kicker">SYSTEM CONFIGURATION</span>
          <h1>Settings Management</h1>
          <p>
            Manage your store, users, notifications and integrations in one place.
          </p>
        </div>
      </section>

      <div className="ark-settings-layout">
        {/* SETTINGS SIDEBAR */}

        <aside className="ark-settings-sidebar">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                type="button"
                key={item.name}
                onClick={() => setActiveTab(item.name)}
                className={`ark-settings-nav-item ${
                  activeTab === item.name ? "active" : ""
                }`}
              >
                <span className="ark-settings-nav-icon">
                  <Icon size={23} />
                </span>

                <span className="ark-settings-nav-text">
                  <strong>{item.name}</strong>
                  <small>{item.description}</small>
                </span>
              </button>
            );
          })}
        </aside>

        {/* SETTINGS CONTENT */}

        <main className="ark-settings-content">
          <form onSubmit={handleSave}>
            <div className="ark-settings-content-heading">
              <div className="ark-settings-heading-left">
                <span className="ark-settings-heading-icon">
                  <CurrentIcon size={27} />
                </span>

                <div>
                  <h2>{activeTab === "General" ? "General Settings" : `${activeTab} Settings`}</h2>
                  <p>
                    Manage your store's {activeTab.toLowerCase()} configuration and preferences.
                  </p>
                </div>
              </div>

              <div className="ark-settings-heading-actions">
                <button
                  type="button"
                  className="ark-settings-reset"
                  onClick={handleReset}
                >
                  <RotateCcw size={17} />
                  Reset
                </button>

                <button type="submit" className="ark-settings-save">
                  <Save size={18} />
                  Save Changes
                </button>
              </div>
            </div>

            {activeTab === "General" && (
              <>
                {/* STORE INFORMATION */}

                <div className="ark-settings-top-grid">
                  <section className="ark-settings-card">
                    <div className="ark-settings-card-title">
                      <Store size={22} />
                      <h3>Store Information</h3>
                    </div>

                    <div className="ark-settings-fields">
                      <label className="ark-settings-field">
                        <span>System / Store Name *</span>
                        <div className="ark-settings-input-wrap">
                          <Store size={17} />
                          <input
                            value={settings.systemName}
                            onChange={(e) => update("systemName", e.target.value)}
                            required
                          />
                        </div>
                      </label>

                      <label className="ark-settings-field">
                        <span>System Tagline</span>
                        <div className="ark-settings-input-wrap">
                          <Tag size={17} />
                          <input
                            value={settings.tagline}
                            onChange={(e) => update("tagline", e.target.value)}
                          />
                        </div>
                      </label>

                      <label className="ark-settings-field">
                        <span>Default Currency</span>
                        <div className="ark-settings-input-wrap">
                          <Coins size={17} />
                          <select
                            value={settings.currency}
                            onChange={(e) => update("currency", e.target.value)}
                          >
                            <option value="INR">Indian Rupee (₹)</option>
                            <option value="USD">US Dollar ($)</option>
                            <option value="EUR">Euro (€)</option>
                          </select>
                        </div>
                      </label>

                      <label className="ark-settings-field">
                        <span>Date Format</span>
                        <div className="ark-settings-input-wrap">
                          <CalendarDays size={17} />
                          <select
                            value={settings.dateFormat}
                            onChange={(e) => update("dateFormat", e.target.value)}
                          >
                            <option>DD-MM-YYYY</option>
                            <option>MM-DD-YYYY</option>
                            <option>YYYY-MM-DD</option>
                          </select>
                        </div>
                      </label>

                      <label className="ark-settings-field">
                        <span>Time Zone</span>
                        <div className="ark-settings-input-wrap">
                          <Globe size={17} />
                          <select
                            value={settings.timezone}
                            onChange={(e) => update("timezone", e.target.value)}
                          >
                            <option value="Asia/Kolkata">
                              (GMT+05:30) India Standard Time
                            </option>
                            <option value="UTC">UTC</option>
                          </select>
                        </div>
                      </label>

                      <label className="ark-settings-field">
                        <span>Language</span>
                        <div className="ark-settings-input-wrap">
                          <Languages size={17} />
                          <select
                            value={settings.language}
                            onChange={(e) => update("language", e.target.value)}
                          >
                            <option>English</option>
                            <option>Hindi</option>
                            <option>Telugu</option>
                          </select>
                        </div>
                      </label>
                    </div>
                  </section>

                  {/* BRAND LOGO */}

                  <section className="ark-settings-card ark-settings-logo-card">
                    <div className="ark-settings-card-title">
                      <Building2 size={22} />
                      <h3>Brand Logo</h3>
                    </div>

                    <div className="ark-settings-logo-preview">
                      {logo ? (
                        <img src={logo} alt="Selected ARK Marbles logo" />
                      ) : (
                        <div className="ark-settings-logo-placeholder">
                          <span>A</span>
                          <strong>ARK</strong>
                          <small>MARBLES & CONSTRUCTION</small>
                        </div>
                      )}
                    </div>

                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={handleLogo}
                    />

                    <div className="ark-settings-logo-actions">
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                      >
                        <Upload size={16} />
                        Upload Logo
                      </button>

                      <button
                        type="button"
                        className="remove"
                        onClick={() => {
                          setLogo(null);
                          if (fileRef.current) fileRef.current.value = "";
                        }}
                      >
                        <Trash2 size={16} />
                        Remove
                      </button>
                    </div>

                    <small className="ark-settings-logo-note">
                      Recommended: 512 × 512 px (PNG, JPG)
                    </small>
                  </section>
                </div>

                {/* APPEARANCE + PREFERENCES */}

                <div className="ark-settings-bottom-grid">
                  <section className="ark-settings-card">
                    <div className="ark-settings-card-title">
                      <Monitor size={22} />
                      <h3>Appearance</h3>
                    </div>

                    <p className="ark-settings-description">
                      Choose how the admin panel looks and feels.
                    </p>

                    <div className="ark-settings-themes">
                      {[
                        { value: "dark", title: "Dark (Default)", description: "Dark theme with gold accents", icon: Moon },
                        { value: "light", title: "Light", description: "Clean and minimal look", icon: Sun },
                        { value: "system", title: "System", description: "Follow your device theme", icon: Monitor },
                      ].map((theme) => {
                        const Icon = theme.icon;

                        return (
                          <button
                            type="button"
                            key={theme.value}
                            className={`ark-settings-theme-option ${
                              settings.theme === theme.value ? "selected" : ""
                            }`}
                            onClick={() => update("theme", theme.value)}
                          >
                            <Icon size={24} />
                            <strong>{theme.title}</strong>
                            <small>{theme.description}</small>
                          </button>
                        );
                      })}
                    </div>
                  </section>

                  <section className="ark-settings-card">
                    <div className="ark-settings-card-title">
                      <SettingsIcon size={22} />
                      <h3>Preferences</h3>
                    </div>

                    <Toggle
                      icon={UserPlus}
                      title="Allow Customer Registration"
                      description="Let customers create their own accounts"
                      value={settings.customerRegistration}
                      onChange={(value) => update("customerRegistration", value)}
                    />

                    <Toggle
                      icon={Mail}
                      title="Email Notifications"
                      description="Send order, payment and enquiry updates via email"
                      value={settings.emailNotifications}
                      onChange={(value) => update("emailNotifications", value)}
                    />

                    <Toggle
                      icon={MessageCircle}
                      title="WhatsApp Notifications"
                      description="Send order and enquiry alerts via WhatsApp"
                      value={settings.whatsappNotifications}
                      onChange={(value) => update("whatsappNotifications", value)}
                    />
                  </section>
                </div>
              </>
            )}

            {activeTab !== "General" && (
              <section className="ark-settings-card ark-settings-coming-soon">
                <span className="ark-settings-heading-icon">
                  <CurrentIcon size={30} />
                </span>
                <h3>{activeTab} Configuration</h3>
                <p>
                  This section is ready for its dedicated settings and controls.
                  Its fields and functionality can be added next.
                </p>
              </section>
            )}

            <div className="ark-settings-status">
              <span>{saved ? "✓ Settings saved in this session" : "Changes are ready to save"}</span>
              <span>ARK MARBLES ADMIN</span>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
