import { Outlet, NavLink, Link } from "react-router-dom";
import {
  UserRound,
  MapPin,
  Heart,
  Package,
  MessageSquare,
  ArrowLeft,
  Gem,
  ChevronRight,
  House,
} from "lucide-react";
import "./AccountLayout.css";

const accountLinks = [
  { label: "My Account", path: "/account", icon: House },
  { label: "My Profile", path: "/account/profile", icon: UserRound },
  { label: "My Addresses", path: "/account/addresses", icon: MapPin },
  { label: "My Orders", path: "/account/orders", icon: Package },
  { label: "My Wishlist", path: "/account/wishlist", icon: Heart },
  { label: "My Enquiries", path: "/account/enquiries", icon: MessageSquare },
];

export default function AccountLayout() {
  return (
    <div className="account-layout">
      <header className="account-heading">
        <div className="account-heading-inner">
          <Link to="/" className="account-back-link">
            <ArrowLeft size={17} />
            <span>Back to Store</span>
          </Link>

          <Link
            to="/"
            className="account-heading-brand"
            aria-label="ARK MARBLES home"
          >
            <span className="account-brand-mark">
              <Gem size={25} strokeWidth={1.4} />
            </span>
            <span>ARK MARBLES</span>
          </Link>

          <span className="account-heading-kicker">
            YOUR PERSONAL COLLECTION
          </span>

          <h1>My Account</h1>
          <p>
            A refined space to manage your profile, purchases, and preferences.
          </p>
        </div>
      </header>

      <div className="account-content">
        <aside className="account-sidebar">
          <div className="account-sidebar-brand">
            <span className="account-sidebar-mark">
              <Gem size={27} strokeWidth={1.5} />
            </span>

            <div>
              <strong>ARK MARBLES</strong>
              <span>MEMBER SPACE</span>
            </div>
          </div>

          <p className="account-sidebar-label">ACCOUNT MENU</p>

          <nav className="account-sidebar-navigation" aria-label="Account navigation">
            {accountLinks.map(({ label, path, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                end={path === "/account"}
                className={({ isActive }) =>
                  `account-nav-link${isActive ? " active" : ""}`
                }
              >
                <Icon className="account-nav-icon" size={24} strokeWidth={1.7} />
                <span className="account-nav-text">{label}</span>
                <ChevronRight
                  className="account-nav-chevron"
                  size={19}
                  strokeWidth={1.8}
                  aria-hidden="true"
                />
              </NavLink>
            ))}
          </nav>

          <div className="account-sidebar-decoration">
            <span className="account-decoration-line" />
            <div className="account-sidebar-image">
              <div className="account-sidebar-image-content">
                <Gem size={24} strokeWidth={1.3} />
                <p>Natural Stone</p>
                <p>Timeless Design</p>
                <span />
              </div>
            </div>
          </div>

          <div className="account-sidebar-footer">
            <Gem size={17} />
            <span>Natural Stone · Timeless Design</span>
          </div>
        </aside>

        <main className="account-page">
          <Outlet />
        </main>
      </div>
    </div>
  );
}