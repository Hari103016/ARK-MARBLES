
import React, { useContext, useState } from "react";
import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  MessageSquare,
  CreditCard,
  Receipt,
  BarChart3,
  UserCog,
  Settings,
  Boxes,
  Gem,
  Search,
  Bell,
  UserRound,
  LogOut,
  LoaderCircle,
  ChevronDown,
  ArrowUpRight,
  Trash2,
} from "lucide-react";

import { AuthContext } from "../context/AuthContext";
import "./AdminLayout.css";

const navigation = [
  { label: "Dashboard", path: "/admin", icon: LayoutDashboard, end: true },
  { label: "Inventory", path: "/admin/inventory", icon: Package },
  { label: "Add Marble", path: "/admin/inventory/add", icon: Gem },
  { label: "Stock Movements", path: "/admin/inventory-movements", icon: Boxes },
  { label: "Customers", path: "/admin/customers", icon: Users },
  { label: "Orders", path: "/admin/orders", icon: ShoppingCart },
  { label: "Enquiries", path: "/admin/enquiries", icon: MessageSquare },
  { label: "Payments", path: "/admin/payments", icon: CreditCard },
  { label: "Receipts", path: "/admin/receipts", icon: Receipt },
  { label: "Reports", path: "/admin/reports", icon: BarChart3 },
  { label: "Staff", path: "/admin/staff", icon: UserCog },
  { label: "Settings", path: "/admin/settings", icon: Settings },
  { label: "Recycle Bin", path: "/admin/recycle-bin", icon: Trash2 },
];

function getPageTitle(pathname) {
  if (pathname === "/admin") return "Business Dashboard";

  if (pathname.startsWith("/admin/inventory/edit/")) {
    return "Edit Marble";
  }

  if (pathname.startsWith("/admin/customers/")) {
    return "Customer Details";
  }

  if (pathname.startsWith("/admin/orders/")) {
    return "Order Details";
  }

  const match = navigation
    .filter((item) => !item.end)
    .sort((a, b) => b.path.length - a.path.length)
    .find(
      (item) =>
        pathname === item.path ||
        pathname.startsWith(`${item.path}/`)
    );

  return match?.label || "Admin Panel";
}

function AdminHeader({ onLogout, loggingOut }) {
  const [searchValue, setSearchValue] = useState("");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleSearch = (event) => {
    event.preventDefault();

    const query = searchValue.trim();
    if (!query) return;

    const searchInput = document.querySelector(
      'main input[type="search"], main input[placeholder*="Search"], main input[placeholder*="search"]'
    );

    if (!searchInput) {
      window.alert("Search is not available on this page.");
      return;
    }

    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value"
    )?.set;

    if (setter) {
      setter.call(searchInput, query);
    } else {
      searchInput.value = query;
    }

    searchInput.dispatchEvent(
      new Event("input", { bubbles: true })
    );

    searchInput.focus();
  };

  return (
    <header className="ark-admin-header">

      {/* TOP HEADER */}

      <div className="ark-admin-topbar">

        {/* LEFT BRAND */}

        <NavLink to="/admin" className="ark-admin-brand">

          <img
            src="/images/logos/ARK-MARBLES-A-LOGO.png"
            alt="ARK Marbles A Logo"
            className="ark-admin-brand-logo"
          />

          <span className="ark-admin-brand-divider" />

          <span className="ark-admin-brand-copy">
            <strong>
              ARK MARBLES<sup>®</sup>
            </strong>

            <small>
              <span className="ark-brand-line" />
              NATURAL STONE · LUXURY SURFACES
              <span className="ark-brand-line" />
            </small>
          </span>

        </NavLink>

        {/* RIGHT ACTIONS */}

        <div className="ark-admin-top-actions">

          {/* SEARCH */}

          <form
            className="ark-admin-search"
            onSubmit={handleSearch}
          >
            <Search size={21} />

            <input
              type="search"
              placeholder="Search here..."
              value={searchValue}
              onChange={(event) =>
                setSearchValue(event.target.value)
              }
              aria-label="Search admin pages"
            />
          </form>

          {/* NOTIFICATIONS */}

          <div className="ark-admin-notification-wrap">
            <button
              type="button"
              className="ark-admin-notification"
              aria-label="Notifications"
              aria-expanded={showNotifications}
              onClick={() => {
                setShowNotifications((value) => !value);
                setShowProfileMenu(false);
              }}
            >
              <Bell size={25} />
              <span className="ark-admin-notification-count">3</span>
            </button>

            {showNotifications && (
              <div className="ark-admin-dropdown ark-admin-notification-menu">
                <div className="ark-admin-dropdown-heading">
                  <Bell size={17} />
                  Notifications
                </div>

                <p>No notification details are connected yet.</p>
              </div>
            )}
          </div>

          {/* VERTICAL DIVIDER */}

          <span className="ark-admin-action-divider" />

          {/* ADMIN PROFILE */}

          <div className="ark-admin-profile-wrap">
            <button
              type="button"
              className="ark-admin-profile"
              onClick={() => {
                setShowProfileMenu((value) => !value);
                setShowNotifications(false);
              }}
              aria-expanded={showProfileMenu}
            >
              <span className="ark-admin-avatar">
                <UserRound size={27} />
              </span>

              <span className="ark-admin-profile-text">
                <strong>Admin</strong>
              </span>

              <ChevronDown size={19} />
            </button>

            {showProfileMenu && (
              <div className="ark-admin-dropdown ark-admin-profile-menu">

                <div className="ark-admin-dropdown-heading">
                  <UserRound size={17} />
                  Admin Account
                </div>

                <NavLink
                  to="/admin/settings"
                  onClick={() => setShowProfileMenu(false)}
                >
                  <Settings size={16} />
                  Account Settings
                </NavLink>

                <button
                  type="button"
                  disabled={loggingOut}
                  onClick={() => {
                    setShowProfileMenu(false);
                    onLogout();
                  }}
                >
                  {loggingOut ? (
                    <LoaderCircle
                      size={16}
                      className="ark-admin-spin"
                    />
                  ) : (
                    <LogOut size={16} />
                  )}

                  {loggingOut ? "Logging out..." : "Logout"}
                </button>

              </div>
            )}
          </div>

          {/* MAIN WEBSITE */}

          <NavLink
            to="/"
            className="ark-admin-store-link"
            title="Main Website"
          >
            <ArrowUpRight size={17} />
            <span>Main Website</span>
          </NavLink>

        </div>
      </div>

      {/* NAVIGATION */}

      <div className="ark-admin-navigation">
        <nav
          className="ark-admin-nav-links"
          aria-label="Admin navigation"
        >
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  `ark-admin-nav-link ${isActive ? "active" : ""}`
                }
              >
                <Icon size={17} strokeWidth={1.9} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

    </header>
  );
}

export default function AdminLayout() {
  const [loggingOut, setLoggingOut] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const auth = useContext(AuthContext);
  const signOut = auth?.signOut;

  const pageTitle = getPageTitle(location.pathname);

  const handleLogout = async () => {
    if (loggingOut) return;

    if (typeof signOut !== "function") {
      window.alert("Authentication is unavailable. Check AuthProvider.");
      return;
    }

    setLoggingOut(true);

    try {
      await signOut();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
      window.alert(error?.message || "Unable to log out.");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="ark-admin-layout">

      <AdminHeader
        onLogout={handleLogout}
        loggingOut={loggingOut}
      />

      <main className="ark-admin-main">
        <Outlet />
      </main>

      <footer className="ark-admin-footer">
        <span>© {new Date().getFullYear()} ARK MARBLES</span>
        <span>PREMIUM MARBLE &amp; NATURAL STONE MANAGEMENT</span>
        <span>{pageTitle}</span>
      </footer>

    </div>
  );
}
