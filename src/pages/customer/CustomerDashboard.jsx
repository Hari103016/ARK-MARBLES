
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  UserRound,
  Package,
  Heart,
  MapPin,
  MessageSquare,
  ArrowRight,
  ShoppingBag,
  Clock,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  ClipboardList,
} from "lucide-react";

import { supabase } from "../../lib/supabase";
import "./CustomerDashboard.css";

const dashboardItems = [
  {
    title: "My Orders",
    description: "View your orders and check delivery status.",
    icon: Package,
    link: "/account/orders",
  },
  {
    title: "My Wishlist",
    description: "View the marble products you have saved.",
    icon: Heart,
    link: "/account/wishlist",
  },
  {
    title: "My Addresses",
    description: "Manage your shipping addresses.",
    icon: MapPin,
    link: "/account/addresses",
  },
  {
    title: "My Enquiries",
    description: "Review your quotation requests.",
    icon: MessageSquare,
    link: "/account/enquiries",
  },
  {
    title: "My Profile",
    description: "Manage your personal information.",
    icon: UserRound,
    link: "/account/profile",
  },
];

const formatPrice = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const formatDate = (value) => {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

function getCustomerName(user) {
  const metadata = user?.user_metadata || {};

  const name =
    metadata.full_name ||
    metadata.name ||
    metadata.display_name ||
    localStorage.getItem("customerName");

  if (name && name.trim()) {
    return name.trim().split(/\s+/)[0];
  }

  return "Valued Customer";
}

function getStatusInfo(status) {
  const value = String(status || "Pending").trim();
  const normalized = value.toLowerCase();

  if (
    ["delivered", "completed"].includes(normalized)
  ) {
    return {
      label: value,
      className: "dashboard-status-success",
      Icon: CheckCircle2,
    };
  }

  if (
    ["cancelled", "canceled", "rejected", "failed"].includes(normalized)
  ) {
    return {
      label: value,
      className: "dashboard-status-cancelled",
      Icon: AlertCircle,
    };
  }

  if (
    ["shipped", "dispatched", "out for delivery"].includes(normalized)
  ) {
    return {
      label: value,
      className: "dashboard-status-shipped",
      Icon: Package,
    };
  }

  if (
    ["processing", "confirmed", "paid", "in progress"].includes(normalized)
  ) {
    return {
      label: value,
      className: "dashboard-status-processing",
      Icon: RefreshCw,
    };
  }

  return {
    label: value,
    className: "dashboard-status-pending",
    Icon: Clock,
  };
}

export default function CustomerDashboard() {
  const [customerName, setCustomerName] = useState("Valued Customer");
  const [stats, setStats] = useState({
    orders: 0,
    pendingOrders: 0,
    enquiries: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        setCustomerName("Valued Customer");
        setStats({ orders: 0, pendingOrders: 0, enquiries: 0 });
        setRecentOrders([]);
        setError("Your session could not be verified. Please sign in again.");
        return;
      }

      setCustomerName(getCustomerName(user));

      const [ordersResult, enquiriesResult, pendingResult, recentResult] =
        await Promise.all([
          supabase
            .from("orders")
            .select("id", { count: "exact", head: true })
            .eq("customer_id", user.id),

          supabase
            .from("quotations")
            .select("id", { count: "exact", head: true })
            .eq("customer_id", user.id),

          supabase
            .from("orders")
            .select("id", { count: "exact", head: true })
            .eq("customer_id", user.id)
            .in("status", ["pending", "processing", "confirmed"]),

          supabase
            .from("orders")
            .select("id, order_number, status, total_amount, created_at")
            .eq("customer_id", user.id)
            .order("created_at", { ascending: false })
            .limit(5),
        ]);

      if (ordersResult.error) throw ordersResult.error;
      if (enquiriesResult.error) throw enquiriesResult.error;
      if (pendingResult.error) throw pendingResult.error;
      if (recentResult.error) throw recentResult.error;

      setStats({
        orders: ordersResult.count ?? 0,
        pendingOrders: pendingResult.count ?? 0,
        enquiries: enquiriesResult.count ?? 0,
      });

      setRecentOrders(recentResult.data || []);
    } catch (err) {
      console.error("Unable to load customer dashboard:", err);
      setError(
        err.message ||
          "We could not load your account information. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  return (
    <main className="customer-dashboard">
      <header className="customer-topbar">
        <Link to="/" className="customer-brand">
          ARK MARBLES
        </Link>

        <Link to="/" className="customer-store-link">
          <ShoppingBag size={17} />
          Continue Shopping
        </Link>
      </header>

      <section className="customer-welcome">
        <p className="customer-eyebrow">ARK MARBLES · MY ACCOUNT</p>

        <h1>Welcome, {customerName}</h1>

        <p>
          Manage your account, track your purchases, and explore your
          saved marble collections in one place.
        </p>
      </section>

      {error && (
        <div className="customer-dashboard-alert" role="alert">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button type="button" onClick={loadDashboard}>
            Retry
          </button>
        </div>
      )}

      <section className="customer-stats-section">
        <div className="customer-section-title-row">
          <div>
            <span className="customer-section-eyebrow">YOUR ACTIVITY</span>
            <h2 className="customer-section-heading">Account Overview</h2>
          </div>

          <button
            type="button"
            className="customer-refresh-button"
            onClick={loadDashboard}
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? "customer-spin" : ""} />
            Refresh
          </button>
        </div>

        <div className="customer-stats-grid">
          <article className="customer-stat-card">
            <div className="customer-stat-icon">
              <Package size={21} />
            </div>
            <span className="customer-stat-label">Total Orders</span>
            <strong className="customer-stat-value">
              {loading ? "—" : stats.orders}
            </strong>
            <span className="customer-stat-note">Your purchases</span>
          </article>

          <article className="customer-stat-card">
            <div className="customer-stat-icon customer-stat-icon-gold">
              <Clock size={21} />
            </div>
            <span className="customer-stat-label">Pending Orders</span>
            <strong className="customer-stat-value">
              {loading ? "—" : stats.pendingOrders}
            </strong>
            <span className="customer-stat-note">Awaiting completion</span>
          </article>

          <article className="customer-stat-card">
            <div className="customer-stat-icon">
              <MessageSquare size={21} />
            </div>
            <span className="customer-stat-label">Quotation Requests</span>
            <strong className="customer-stat-value">
              {loading ? "—" : stats.enquiries}
            </strong>
            <span className="customer-stat-note">Your requests</span>
          </article>
        </div>
      </section>

      <section className="customer-account-section">
        <span className="customer-section-eyebrow">ACCOUNT MANAGEMENT</span>
        <h2 className="customer-section-heading">Your Account</h2>

        <div className="customer-dashboard-grid">
          {dashboardItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                to={item.link}
                className="customer-dashboard-card"
                key={item.title}
              >
                <div className="customer-dashboard-icon">
                  <Icon size={21} />
                </div>

                <h3>{item.title}</h3>
                <p>{item.description}</p>

                <div className="customer-card-arrow">
                  <span>View details</span>
                  <ArrowRight size={17} />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="customer-recent-section">
        <div className="customer-section-title-row">
          <div>
            <span className="customer-section-eyebrow">PURCHASE HISTORY</span>
            <h2 className="customer-section-heading">Recent Orders</h2>
          </div>

          <Link to="/account/orders" className="customer-view-all">
            View all <ArrowRight size={15} />
          </Link>
        </div>

        {loading ? (
          <div className="customer-recent-state">
            <RefreshCw size={20} className="customer-spin" />
            Loading recent orders...
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="customer-recent-empty">
            <div className="customer-recent-empty-icon">
              <ClipboardList size={26} />
            </div>
            <h3>No orders yet</h3>
            <p>Your recent marble purchases will appear here.</p>
            <Link to="/marbles" className="customer-empty-shop-link">
              Explore Marbles <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="customer-recent-orders">
            {recentOrders.map((order) => {
              const status = getStatusInfo(order.status);

              return (
                <article
                  className="customer-recent-order"
                  key={order.id}
                >
                  <div className="customer-recent-order-icon">
                    <Package size={20} />
                  </div>

                  <div className="customer-recent-order-info">
                    <strong>
                      Order {order.order_number || String(order.id).slice(0, 8)}
                    </strong>
                    <span>{formatDate(order.created_at)}</span>
                  </div>

                  <div className="customer-recent-order-total">
                    <strong>{formatPrice(order.total_amount)}</strong>
                    <span className={`customer-order-status ${status.className}`}>
                      <status.Icon size={13} />
                      {status.label}
                    </span>
                  </div>

                  <Link
                    to={`/account/orders/${order.id}`}
                    className="customer-order-open"
                    aria-label={`View order ${order.order_number || order.id}`}
                    title="View order"
                  >
                    <ArrowRight size={17} />
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <footer className="customer-dashboard-footer">
        © {new Date().getFullYear()} ARK MARBLES. All rights reserved.
      </footer>
    </main>
  );
}
