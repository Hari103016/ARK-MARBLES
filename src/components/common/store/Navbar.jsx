
import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";

import {
  Menu,
  X,
  ShoppingCart,
  Heart,
  UserRound,
  Search,
  ChevronDown,
  ArrowUpRight,
} from "lucide-react";

import useCart from "../../../hooks/useCart";
import useWishlist from "../../../hooks/useWishlist";
import { useAuth } from "../../../hooks/useAuth";

import "./Navbar.css";

const navLinks = [
  { label: "Home", path: "/", end: true },
  { label: "Marbles", path: "/marbles", dropdown: true },
  { label: "Construction", path: "/construction", dropdown: true },
  { label: "Projects", path: "/gallery" },
  { label: "Brands", path: "/brands" },
  { label: "Contact", path: "/contact" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const navigate = useNavigate();

  const { cartCount = 0 } = useCart();
  const { wishlistCount = 0 } = useWishlist();
  const { user, profile } = useAuth();

  const closeMenu = () => setMenuOpen(false);

  // SEARCH FUNCTION
  const handleSearch = (event) => {
    event.preventDefault();

    const query = searchText.trim();

    if (!query) return;

    navigate(`/?search=${encodeURIComponent(query)}`);

    setSearchText("");
    setSearchOpen(false);
    closeMenu();
  };

  // REQUEST QUOTE FUNCTION
  const handleQuoteClick = () => {
    closeMenu();
    setSearchOpen(false);
    navigate("/contact#quote");
  };

  return (
    <header className="store-navbar">
      <div className="store-navbar-main">

        <div className="store-navbar-inner">

          {/* BRAND LOGO */}
          <Link
            to="/"
            className="store-brand"
            aria-label="ARK MARBLES home"
            onClick={closeMenu}
          >
            <span className="store-brand-mark">A</span>

            <span className="store-brand-text">
              <strong>ARK MARBLES</strong>
              <small>Build Better. Live Luxurious.</small>
            </span>
          </Link>

          {/* MAIN NAVIGATION */}
          <nav
            className={`store-navigation ${
              menuOpen ? "is-open" : ""
            }`}
            aria-label="Main navigation"
          >
            {navLinks.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end || false}
                onClick={closeMenu}
                className={({ isActive }) =>
                  `store-nav-link ${
                    isActive ? "active" : ""
                  }`
                }
              >
                {item.label}

                {item.dropdown && (
                  <ChevronDown
                    size={16}
                    className="nav-chevron"
                  />
                )}
              </NavLink>
            ))}

            {/* ADMIN LINK */}
            {user && profile?.role === "admin" && (
              <Link
                to="/admin"
                className="store-nav-link store-admin-link"
                onClick={closeMenu}
              >
                Admin
              </Link>
            )}

            {/* MOBILE REQUEST QUOTE */}
            <button
              type="button"
              className="store-nav-quote mobile-quote"
              onClick={handleQuoteClick}
            >
              Request Quote
              <ArrowUpRight size={15} />
            </button>
          </nav>

          {/* DESKTOP SEARCH */}
          <form
            className="store-navbar-search"
            onSubmit={handleSearch}
          >
            <input
              type="search"
              placeholder="Search marble, tiles, cement..."
              value={searchText}
              onChange={(event) =>
                setSearchText(event.target.value)
              }
              aria-label="Search products"
            />

            <button
              type="submit"
              aria-label="Search"
            >
              <Search size={19} />
            </button>
          </form>

          {/* RIGHT SIDE ACTIONS */}
          <div className="store-navbar-actions">

            {/* MOBILE SEARCH */}
            <button
              type="button"
              className="store-search-mobile"
              aria-label="Open search"
              aria-expanded={searchOpen}
              onClick={() => {
                setSearchOpen((open) => !open);
                setMenuOpen(false);
              }}
            >
              <Search size={21} />
            </button>

            {/* WISHLIST */}
            <Link
              to="/account/wishlist"
              className="store-icon-link"
              aria-label={`Wishlist ${wishlistCount} items`}
              onClick={closeMenu}
            >
              <Heart size={21} />

              {wishlistCount > 0 && (
                <span className="store-icon-count">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* CART */}
            <Link
              to="/cart"
              className="store-icon-link"
              aria-label={`Cart ${cartCount} items`}
              onClick={closeMenu}
            >
              <ShoppingCart size={21} />

              {cartCount > 0 && (
                <span className="store-icon-count">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* DESKTOP REQUEST QUOTE */}
            <button
              type="button"
              className="store-nav-quote desktop-quote"
              onClick={handleQuoteClick}
            >
              Request Quote
              <ArrowUpRight size={15} />
            </button>

            {/* ACCOUNT */}
            <Link
              to={user ? "/account" : "/login"}
              className="store-account-link"
              onClick={closeMenu}
              aria-label={user ? "My Account" : "Login"}
            >
              <UserRound size={17} />

              <span>
                {user ? "My Account" : "Login / Register"}
              </span>
            </Link>

            {/* MOBILE MENU BUTTON */}
            <button
              type="button"
              className="store-menu-toggle"
              aria-label={
                menuOpen ? "Close menu" : "Open menu"
              }
              aria-expanded={menuOpen}
              onClick={() => {
                setMenuOpen((open) => !open);
                setSearchOpen(false);
              }}
            >
              {menuOpen ? (
                <X size={23} />
              ) : (
                <Menu size={23} />
              )}
            </button>

          </div>
        </div>

        {/* MOBILE SEARCH BAR */}
        {searchOpen && (
          <form
            className="store-navbar-mobile-search"
            onSubmit={handleSearch}
          >
            <input
              autoFocus
              type="search"
              placeholder="Search marbles and construction materials..."
              value={searchText}
              onChange={(event) =>
                setSearchText(event.target.value)
              }
              aria-label="Search products"
            />

            <button
              type="submit"
              aria-label="Search"
            >
              <Search size={19} />
            </button>
          </form>
        )}

      </div>
    </header>
  );
}
