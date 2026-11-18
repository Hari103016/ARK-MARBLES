import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Package,
  Search,
  CalendarDays,
  IndianRupee,
  Eye,
  ShoppingBag,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  ArrowRight,
  Gem,
  RefreshCw,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

function normalizeStatus(status) {
  const value = String(status || "Pending").toLowerCase();

  if (value.includes("cancel")) return "Cancelled";
  if (value.includes("deliver")) return "Delivered";
  if (value.includes("ship") || value.includes("dispatch")) return "Shipped";
  if (value.includes("process")) return "Processing";
  if (value.includes("confirm")) return "Confirmed";

  return "Pending";
}

function getStatusIcon(status) {
  switch (normalizeStatus(status)) {
    case "Delivered":
      return CheckCircle2;
    case "Shipped":
      return Truck;
    case "Processing":
      return RefreshCw;
    case "Cancelled":
      return XCircle;
    default:
      return Clock;
  }
}

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);

  async function loadOrders(isRefresh = false) {
    setError("");

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      if (!supabase) {
        throw new Error(
          "Supabase is not configured. Check your project settings."
        );
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        setOrders([]);
        throw new Error("Please sign in to view your order history.");
      }

      /*
       * The actual orders table and its column names have not been
       * confirmed. Connect your orderService here rather than guessing
       * a database schema or exposing another customer's orders.
       */
      setOrders([]);
      setError(
        "Order history is not connected to your database yet. Connect this page to your existing order service."
      );
    } catch (err) {
      setError(err.message || "Unable to load your orders.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  const filteredOrders = orders.filter((order) => {
    const query = search.trim().toLowerCase();

    const orderId = String(
      order.order_number || order.orderNumber || order.id || ""
    ).toLowerCase();

    const status = normalizeStatus(order.status);

    const matchesSearch =
      !query ||
      orderId.includes(query) ||
      String(order.customer_name || "").toLowerCase().includes(query);

    const matchesStatus =
      statusFilter === "All" || status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalSpent = orders
    .filter(
      (order) =>
        normalizeStatus(order.status) !== "Cancelled"
    )
    .reduce(
      (sum, order) =>
        sum +
        Number(
          order.total_amount ?? order.total ?? order.amount ?? 0
        ),
      0
    );

  const deliveredCount = orders.filter(
    (order) => normalizeStatus(order.status) === "Delivered"
  ).length;

  return (
    <main className="order-history-page">
      <div className="order-history-container">
        <header className="order-history-header">
          <Link to="/store" className="order-history-brand">
            <span className="order-history-brand-icon">
              <Gem size={25} />
            </span>

            <span>
              <strong>ARK MARBLES</strong>
              <small>PREMIUM STONE COLLECTIONS</small>
            </span>
          </Link>

          <Link to="/store" className="order-history-store-link">
            <ShoppingBag size={17} />
            Continue Shopping
          </Link>
        </header>

        <section className="order-history-intro">
          <span className="order-history-eyebrow">YOUR ACCOUNT</span>
          <h1>My Orders</h1>
          <p>
            View your purchases and check the status of your orders.
          </p>
        </section>

        <section className="order-history-stats">
          <article>
            <div className="order-history-stat-icon history-blue">
              <Package size={22} />
            </div>
            <span>Total Orders</span>
            <strong>{orders.length}</strong>
          </article>

          <article>
            <div className="order-history-stat-icon history-green">
              <CheckCircle2 size={22} />
            </div>
            <span>Delivered Orders</span>
            <strong>{deliveredCount}</strong>
          </article>

          <article>
            <div className="order-history-stat-icon history-purple">
              <IndianRupee size={22} />
            </div>
            <span>Total Order Value</span>
            <strong>{formatCurrency(totalSpent)}</strong>
          </article>
        </section>

        <section className="order-history-card">
          <div className="order-history-card-header">
            <div>
              <h2>Order History</h2>
              <p>Review your previous purchases.</p>
            </div>

            <button
              type="button"
              className="order-history-refresh"
              onClick={() => loadOrders(true)}
              disabled={refreshing}
            >
              <RefreshCw
                size={16}
                className={refreshing ? "order-history-spin" : ""}
              />
              Refresh
            </button>
          </div>

          <div className="order-history-toolbar">
            <label className="order-history-search">
              <Search size={18} />
              <input
                type="search"
                placeholder="Search by order number..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>

            <select
              className="order-history-filter"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter orders by status"
            >
              <option value="All">All statuses</option>
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Processing">Processing</option>
              <option value="Shipped">Shipped</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {error && (
            <div className="order-history-error" role="alert">
              {error}
            </div>
          )}

          {loading ? (
            <div className="order-history-state">
              <RefreshCw size={28} className="order-history-spin" />
              <strong>Loading your orders...</strong>
              <p>Please wait while we check your order history.</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="order-history-empty">
              <div className="order-history-empty-icon">
                <Package size={32} />
              </div>

              <h3>No orders to display</h3>

              <p>
                {orders.length === 0
                  ? "Your order history will appear here after the database connection is completed."
                  : "No orders match your search or selected status."}
              </p>

              {orders.length > 0 ? (
                <button
                  type="button"
                  className="order-history-primary-button"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("All");
                  }}
                >
                  Clear Filters
                </button>
              ) : (
                <Link
                  to="/store"
                  className="order-history-primary-button"
                >
                  Explore Store
                  <ArrowRight size={17} />
                </Link>
              )}
            </div>
          ) : (
            <div className="order-history-table-wrap">
              <table className="order-history-table">
                <thead>
                  <tr>
                    <th>Order Number</th>
                    <th>Order Date</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredOrders.map((order, index) => {
                    const StatusIcon = getStatusIcon(order.status);

                    return (
                      <tr key={order.id || order.order_id || index}>
                        <td>
                          <strong>
                            {order.order_number ||
                              order.orderNumber ||
                              order.id ||
                              "—"}
                          </strong>
                        </td>

                        <td>
                          <span className="order-history-date">
                            <CalendarDays size={15} />
                            {formatDate(order.created_at || order.date)}
                          </span>
                        </td>

                        <td>
                          {Array.isArray(order.items)
                            ? order.items.reduce(
                                (sum, item) =>
                                  sum +
                                  Number(item.quantity ?? item.qty ?? 1),
                                0
                              )
                            : Number(order.item_count || 0)}{" "}
                          items
                        </td>

                        <td>
                          <strong>
                            {formatCurrency(
                              order.total_amount ??
                                order.total ??
                                order.amount
                            )}
                          </strong>
                        </td>

                        <td>
                          <span
                            className={`order-history-status history-status-${normalizeStatus(
                              order.status
                            ).toLowerCase()}`}
                          >
                            <StatusIcon size={14} />
                            {normalizeStatus(order.status)}
                          </span>
                        </td>

                        <td>
                          <button
                            type="button"
                            className="order-history-view-button"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <Eye size={16} />
                            Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="order-history-card-footer">
            <span>
              Showing {filteredOrders.length} of {orders.length} orders
            </span>
            <span>ARK MARBLES · Order Management</span>
          </div>
        </section>

        {selectedOrder && (
          <div
            className="order-history-modal-backdrop"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setSelectedOrder(null);
              }
            }}
          >
            <section
              className="order-history-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="order-detail-title"
            >
              <div className="order-history-modal-header">
                <div>
                  <span>ORDER DETAILS</span>
                  <h2 id="order-detail-title">
                    {selectedOrder.order_number ||
                      selectedOrder.orderNumber ||
                      selectedOrder.id}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  aria-label="Close order details"
                >
                  ×
                </button>
              </div>

              <div className="order-history-detail-row">
                <span>Order date</span>
                <strong>
                  {formatDate(
                    selectedOrder.created_at || selectedOrder.date
                  )}
                </strong>
              </div>

              <div className="order-history-detail-row">
                <span>Status</span>
                <strong>{normalizeStatus(selectedOrder.status)}</strong>
              </div>

              <div className="order-history-detail-row">
                <span>Payment method</span>
                <strong>
                  {selectedOrder.payment_method ||
                    selectedOrder.paymentMethod ||
                    "—"}
                </strong>
              </div>

              <div className="order-history-detail-row">
                <span>Total amount</span>
                <strong>
                  {formatCurrency(
                    selectedOrder.total_amount ??
                      selectedOrder.total ??
                      selectedOrder.amount
                  )}
                </strong>
              </div>

              <div className="order-history-modal-actions">
                <button
                  type="button"
                  className="order-history-primary-button"
                  onClick={() => setSelectedOrder(null)}
                >
                  Close Details
                </button>
              </div>
            </section>
          </div>
        )}

        <footer className="order-history-footer">
          <span>© {new Date().getFullYear()} ARK MARBLES</span>
          <span>Premium Stone Collections</span>
        </footer>
      </div>
    </main>
  );
}