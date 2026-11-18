import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Package,
  Search,
  ShoppingBag,
  Eye,
  Clock3,
  CheckCircle2,
  Truck,
  XCircle,
  LoaderCircle,
  RefreshCw,
  Gem,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    icon: Clock3,
    className: "pending",
  },
  confirmed: {
    label: "Confirmed",
    icon: CheckCircle2,
    className: "confirmed",
  },
  processing: {
    label: "Processing",
    icon: RefreshCw,
    className: "processing",
  },
  shipped: {
    label: "Shipped",
    icon: Truck,
    className: "shipped",
  },
  delivered: {
    label: "Delivered",
    icon: CheckCircle2,
    className: "delivered",
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    className: "cancelled",
  },
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

const formatDate = (date) => {
  if (!date) return "Date unavailable";

  const value = new Date(date);

  if (Number.isNaN(value.getTime())) {
    return "Date unavailable";
  }

  return value.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function CustomerOrders() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadOrders() {
      setLoading(true);
      setError("");

      try {
        const { data, error: authError } =
          await supabase.auth.getUser();

        if (authError) throw authError;

        if (!data?.user) {
          navigate("/login", { replace: true });
          return;
        }

        if (!active) return;

        setUser(data.user);

        // Connect your actual orders table here when its schema is known.
        // No table name or column structure is assumed.
        setOrders([]);
      } catch (err) {
        if (active) {
          setError(err.message || "Unable to load your orders.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadOrders();

    return () => {
      active = false;
    };
  }, [navigate]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setError("");

    try {
      const { data, error: authError } =
        await supabase.auth.getUser();

      if (authError) throw authError;

      if (!data?.user) {
        navigate("/login", { replace: true });
        return;
      }

      setUser(data.user);

      // Replace this section with the order service used by your project.
      setOrders([]);
    } catch (err) {
      setError(err.message || "Unable to refresh your orders.");
    } finally {
      setRefreshing(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const orderId = String(
      order.order_number || order.orderNumber || order.id || ""
    ).toLowerCase();

    const status = String(order.status || "pending").toLowerCase();

    const matchesSearch = orderId.includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getOrderTotal = (order) =>
    Number(order.total_amount ?? order.total ?? 0);

  const getOrderItems = (order) =>
    Array.isArray(order.items) ? order.items : [];

  const getStatus = (status) => {
    const normalized = String(status || "pending").toLowerCase();

    return (
      STATUS_CONFIG[normalized] || {
        label: normalized.charAt(0).toUpperCase() + normalized.slice(1),
        icon: Package,
        className: "pending",
      }
    );
  };

  const openOrder = (order) => {
    navigate("/order-confirmation", {
      state: { order },
    });
  };

  return (
    <main className="customer-orders-page">
      <style>{`
        .customer-orders-page {
          min-height: 100vh;
          padding: 30px 20px;
          background: #f5f7fb;
          color: #172033;
          font-family: Inter, Arial, sans-serif;
        }

        .customer-orders-container {
          max-width: 1120px;
          margin: 0 auto;
        }

        .customer-orders-topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          margin-bottom: 30px;
          flex-wrap: wrap;
        }

        .customer-orders-back {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #536178;
          text-decoration: none;
          font-size: 13px;
          font-weight: 600;
        }

        .customer-orders-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #183a63;
          font-size: 16px;
          font-weight: 800;
          letter-spacing: 1.5px;
        }

        .customer-orders-brand-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: #183a63;
          color: #e5c58c;
        }

        .customer-orders-heading {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 20px;
          margin-bottom: 25px;
          flex-wrap: wrap;
        }

        .customer-orders-heading h1 {
          margin: 0 0 9px;
          font-size: clamp(26px, 4vw, 34px);
          letter-spacing: -1px;
        }

        .customer-orders-heading p {
          margin: 0;
          color: #788399;
          font-size: 13px;
          line-height: 1.7;
        }

        .customer-orders-refresh {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 42px;
          padding: 0 14px;
          border: 1px solid #dfe5ee;
          border-radius: 9px;
          background: white;
          color: #263b58;
          font-family: inherit;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .customer-orders-refresh:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .customer-orders-filters {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 22px;
          padding: 16px;
          border: 1px solid #e6ebf2;
          border-radius: 12px;
          background: white;
          flex-wrap: wrap;
        }

        .customer-orders-search {
          position: relative;
          flex: 1;
          min-width: 200px;
        }

        .customer-orders-search-icon {
          position: absolute;
          top: 50%;
          left: 13px;
          color: #8a94a6;
          transform: translateY(-50%);
          pointer-events: none;
        }

        .customer-orders-search input {
          box-sizing: border-box;
          width: 100%;
          height: 43px;
          padding: 0 12px 0 39px;
          border: 1px solid #e1e6ef;
          border-radius: 8px;
          outline: none;
          background: #fbfcfe;
          color: #172033;
          font-family: inherit;
          font-size: 12px;
        }

        .customer-orders-search input:focus {
          border-color: #183a63;
        }

        .customer-orders-filter-select {
          min-width: 160px;
          height: 43px;
          padding: 0 12px;
          border: 1px solid #e1e6ef;
          border-radius: 8px;
          background: white;
          color: #38465c;
          font-family: inherit;
          font-size: 12px;
          outline: none;
        }

        .customer-orders-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .customer-order-card {
          overflow: hidden;
          border: 1px solid #e5eaf1;
          border-radius: 13px;
          background: white;
          box-shadow: 0 4px 16px rgba(20, 35, 55, 0.025);
        }

        .customer-order-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          padding: 20px 22px;
          border-bottom: 1px solid #edf0f5;
          flex-wrap: wrap;
        }

        .customer-order-id {
          margin: 0 0 7px;
          font-size: 14px;
          font-weight: 800;
          overflow-wrap: anywhere;
        }

        .customer-order-date {
          display: flex;
          align-items: center;
          gap: 7px;
          color: #8490a3;
          font-size: 11px;
        }

        .customer-order-status {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 7px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
          white-space: nowrap;
        }

        .customer-order-status.pending {
          background: #fff5dd;
          color: #936600;
        }

        .customer-order-status.confirmed,
        .customer-order-status.delivered {
          background: #e8f8ef;
          color: #187747;
        }

        .customer-order-status.processing,
        .customer-order-status.shipped {
          background: #eaf2ff;
          color: #245bb2;
        }

        .customer-order-status.cancelled {
          background: #fff0f0;
          color: #b42318;
        }

        .customer-order-card-body {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 24px;
          padding: 22px;
        }

        .customer-order-products {
          display: flex;
          flex-direction: column;
          gap: 11px;
          min-width: 0;
        }

        .customer-order-product {
          display: flex;
          align-items: center;
          gap: 11px;
          min-width: 0;
        }

        .customer-order-product-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 42px;
          height: 42px;
          flex-shrink: 0;
          border-radius: 9px;
          background: #f0f4fa;
          color: #183a63;
        }

        .customer-order-product-info {
          min-width: 0;
        }

        .customer-order-product-info h3 {
          margin: 0 0 5px;
          color: #27364e;
          font-size: 12px;
          overflow-wrap: anywhere;
        }

        .customer-order-product-info p {
          margin: 0;
          color: #8a94a6;
          font-size: 11px;
        }

        .customer-order-more {
          color: #7a879a;
          font-size: 11px;
        }

        .customer-order-total {
          min-width: 145px;
          text-align: right;
        }

        .customer-order-total-label {
          margin-bottom: 7px;
          color: #8993a5;
          font-size: 11px;
        }

        .customer-order-total-amount {
          margin-bottom: 13px;
          color: #183a63;
          font-size: 19px;
          font-weight: 800;
          overflow-wrap: anywhere;
        }

        .customer-order-view {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          min-height: 37px;
          padding: 0 12px;
          border: 1px solid #dce4ef;
          border-radius: 8px;
          background: white;
          color: #183a63;
          font-family: inherit;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
        }

        .customer-orders-empty,
        .customer-orders-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 290px;
          padding: 30px 20px;
          border: 1px solid #e5eaf1;
          border-radius: 14px;
          background: white;
          text-align: center;
        }

        .customer-orders-empty-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 68px;
          height: 68px;
          margin-bottom: 18px;
          border-radius: 50%;
          background: #edf3fb;
          color: #183a63;
        }

        .customer-orders-empty h2 {
          margin: 0 0 9px;
          font-size: 19px;
        }

        .customer-orders-empty p,
        .customer-orders-loading p {
          max-width: 430px;
          margin: 0;
          color: #788399;
          font-size: 12px;
          line-height: 1.8;
        }

        .customer-orders-shop {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 43px;
          margin-top: 20px;
          padding: 0 17px;
          border-radius: 8px;
          background: #183a63;
          color: white;
          font-size: 12px;
          font-weight: 700;
          text-decoration: none;
        }

        .customer-orders-error {
          margin-bottom: 20px;
          padding: 14px 16px;
          border: 1px solid #f4cccc;
          border-radius: 9px;
          background: #fff0f0;
          color: #b42318;
          font-size: 12px;
          line-height: 1.7;
          overflow-wrap: anywhere;
        }

        .customer-orders-footer {
          margin-top: 28px;
          color: #8a94a6;
          font-size: 11px;
          text-align: center;
        }

        .customer-orders-spin {
          animation: customer-orders-rotate 1s linear infinite;
        }

        @keyframes customer-orders-rotate {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 650px) {
          .customer-orders-page {
            padding: 20px 12px;
          }

          .customer-orders-filters {
            align-items: stretch;
          }

          .customer-orders-search,
          .customer-orders-filter-select {
            width: 100%;
            min-width: 0;
          }

          .customer-order-card-header {
            padding: 17px;
          }

          .customer-order-card-body {
            align-items: stretch;
            flex-direction: column;
            padding: 17px;
          }

          .customer-order-total {
            padding-top: 16px;
            border-top: 1px solid #edf0f5;
            text-align: left;
          }

          .customer-order-total-amount {
            font-size: 18px;
          }
        }
      `}</style>

      <div className="customer-orders-container">
        <div className="customer-orders-topbar">
          <Link to="/store" className="customer-orders-back">
            <ArrowLeft size={17} />
            Back to Store
          </Link>

          <div className="customer-orders-brand">
            <span className="customer-orders-brand-icon">
              <Gem size={22} />
            </span>
            ARK MARBLES
          </div>
        </div>

        <header className="customer-orders-heading">
          <div>
            <h1>My Orders</h1>
            <p>
              View your purchases, order status, and order details.
              {user?.email ? ` Signed in as ${user.email}.` : ""}
            </p>
          </div>

          <button
            type="button"
            className="customer-orders-refresh"
            onClick={handleRefresh}
            disabled={refreshing || loading}
          >
            <RefreshCw
              size={15}
              className={refreshing ? "customer-orders-spin" : ""}
            />
            Refresh
          </button>
        </header>

        <section className="customer-orders-filters">
          <div className="customer-orders-search">
            <Search
              size={17}
              className="customer-orders-search-icon"
            />

            <input
              type="search"
              placeholder="Search by order number..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search orders by order number"
            />
          </div>

          <select
            className="customer-orders-filter-select"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter orders by status"
          >
            <option value="all">All Orders</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </section>

        {error && (
          <div className="customer-orders-error" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <div className="customer-orders-loading">
            <LoaderCircle
              size={30}
              className="customer-orders-spin"
            />
            <p style={{ marginTop: 14 }}>Loading your orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <section className="customer-orders-empty">
            <div className="customer-orders-empty-icon">
              <ShoppingBag size={30} />
            </div>

            <h2>
              {search || statusFilter !== "all"
                ? "No matching orders"
                : "Your orders will appear here"}
            </h2>

            <p>
              {search || statusFilter !== "all"
                ? "Try changing your search or status filter."
                : "Your order history is not connected to the database yet. Once your order service is connected, your purchases will appear here."}
            </p>

            {!search && statusFilter === "all" && (
              <Link to="/store" className="customer-orders-shop">
                Explore Marble Collection
              </Link>
            )}
          </section>
        ) : (
          <section className="customer-orders-list">
            {filteredOrders.map((order) => {
              const orderId =
                order.order_number || order.orderNumber || order.id;

              const status = getStatus(order.status);
              const StatusIcon = status.icon;
              const items = getOrderItems(order);

              return (
                <article
                  className="customer-order-card"
                  key={orderId}
                >
                  <header className="customer-order-card-header">
                    <div>
                      <h2 className="customer-order-id">
                        Order #{orderId}
                      </h2>

                      <div className="customer-order-date">
                        <Clock3 size={13} />
                        Placed on{" "}
                        {formatDate(order.created_at || order.date)}
                      </div>
                    </div>

                    <span
                      className={`customer-order-status ${status.className}`}
                    >
                      <StatusIcon size={14} />
                      {status.label}
                    </span>
                  </header>

                  <div className="customer-order-card-body">
                    <div className="customer-order-products">
                      {items.slice(0, 2).map((item, index) => (
                        <div
                          className="customer-order-product"
                          key={item.id || item.product_id || index}
                        >
                          <div className="customer-order-product-icon">
                            <Package size={21} />
                          </div>

                          <div className="customer-order-product-info">
                            <h3>
                              {item.name ||
                                item.product_name ||
                                item.title ||
                                "Marble Product"}
                            </h3>

                            <p>
                              Quantity:{" "}
                              {Number(item.quantity ?? item.qty ?? 1)}
                            </p>
                          </div>
                        </div>
                      ))}

                      {items.length > 2 && (
                        <p className="customer-order-more">
                          +{items.length - 2} more item(s)
                        </p>
                      )}

                      {items.length === 0 && (
                        <div className="customer-order-product">
                          <div className="customer-order-product-icon">
                            <Package size={21} />
                          </div>

                          <div className="customer-order-product-info">
                            <h3>Order items</h3>
                            <p>Item details unavailable</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="customer-order-total">
                      <div className="customer-order-total-label">
                        Total Amount
                      </div>

                      <div className="customer-order-total-amount">
                        {formatCurrency(getOrderTotal(order))}
                      </div>

                      <button
                        type="button"
                        className="customer-order-view"
                        onClick={() => openOrder(order)}
                      >
                        <Eye size={15} />
                        View Order
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        <footer className="customer-orders-footer">
          ARK MARBLES · Customer Order History
        </footer>
      </div>
    </main>
  );
}