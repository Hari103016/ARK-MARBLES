
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  Package,
  ShoppingBag,
} from "lucide-react";
import "./MyOrders.css";

const INITIAL_ORDERS = [
  {
    id: "ARK0001",
    date: "09 Oct 2026",
    product: "Rosso Levanto",
    quantity: "1 tonne",
    amount: 42500,
    status: "Delivered",
    marble: "rosso",
  },
  {
    id: "ARK0002",
    date: "08 Oct 2026",
    product: "Carrara White",
    quantity: "2 slabs",
    amount: 18750,
    status: "Processing",
    marble: "carrara",
  },
  {
    id: "ARK0003",
    date: "30 Sep 2026",
    product: "Black Galaxy",
    quantity: "3 slabs",
    amount: 11900,
    status: "Shipped",
    marble: "galaxy",
  },
];

const FILTERS = ["All", "Processing", "Shipped", "Delivered"];

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

function MarbleThumbnail({ type }) {
  return (
    <div
      className={`my-orders-marble my-orders-marble-${type}`}
      aria-label="Marble product thumbnail"
      role="img"
    >
      <span className="marble-vein marble-vein-one" />
      <span className="marble-vein marble-vein-two" />
      <span className="marble-vein marble-vein-three" />
    </div>
  );
}

function StatusBadge({ status }) {
  return (
    <span
      className={`my-orders-status my-orders-status-${status
        .toLowerCase()
        .replace(/\s+/g, "-")}`}
    >
      <span className="my-orders-status-dot" />
      {status}
    </span>
  );
}

export default function MyOrders() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState("All");

  const filteredOrders =
    activeFilter === "All"
      ? INITIAL_ORDERS
      : INITIAL_ORDERS.filter(
          (order) => order.status === activeFilter
        );

  function openOrder(order) {
    navigate(`/account/orders/${order.id}`, {
      state: { order },
    });
  }

  return (
    <main className="my-orders-page">
      <div className="my-orders-background" aria-hidden="true">
        <span className="my-orders-glow my-orders-glow-one" />
        <span className="my-orders-glow my-orders-glow-two" />
      </div>

      <div className="my-orders-container">
        <header className="my-orders-heading">
          <div className="my-orders-heading-copy">
            <span className="my-orders-eyebrow">
              ARK MARBLES
              <span className="my-orders-eyebrow-line" />
            </span>

            <h1>My Orders</h1>

            <p>
              Track your marble orders and check their delivery status.
            </p>
          </div>

          <div className="my-orders-count">
            <ShoppingBag size={20} />
            <span>{INITIAL_ORDERS.length} Orders</span>
          </div>
        </header>

        <div
          className="my-orders-filters"
          role="group"
          aria-label="Filter orders by status"
        >
          {FILTERS.map((filter) => {
            const count =
              filter === "All"
                ? INITIAL_ORDERS.length
                : INITIAL_ORDERS.filter(
                    (order) => order.status === filter
                  ).length;

            return (
              <button
                type="button"
                key={filter}
                className={`my-orders-filter ${
                  activeFilter === filter ? "active" : ""
                }`}
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
                <span>{count}</span>
              </button>
            );
          })}
        </div>

        <section className="my-orders-list" aria-label="Your orders">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => (
              <article className="my-order-card" key={order.id}>
                <MarbleThumbnail type={order.marble} />

                <div className="my-order-details">
                  <div className="my-order-id-row">
                    <span className="my-order-id">
                      Order #{order.id}
                    </span>
                    <span className="my-order-date">
                      <CalendarDays size={13} />
                      {order.date}
                    </span>
                  </div>

                  <h2>{order.product}</h2>

                  <p className="my-order-product-meta">
                    {order.quantity}
                    <span className="my-order-meta-dot">•</span>
                    Natural Stone
                  </p>
                </div>

                <div className="my-order-amount">
                  <span className="my-order-amount-label">
                    Order Total
                  </span>
                  <strong>{formatCurrency(order.amount)}</strong>
                </div>

                <div className="my-order-status-wrap">
                  <StatusBadge status={order.status} />
                </div>

                <button
                  type="button"
                  className="my-order-view-button"
                  onClick={() => openOrder(order)}
                >
                  View Details
                  <ArrowRight size={15} />
                </button>
              </article>
            ))
          ) : (
            <div className="my-orders-empty">
              <div className="my-orders-empty-icon">
                <Package size={34} />
              </div>

              <h2>No {activeFilter.toLowerCase()} orders</h2>

              <p>
                Orders with this status will appear here.
              </p>

              <button
                type="button"
                onClick={() => setActiveFilter("All")}
              >
                View All Orders
              </button>
            </div>
          )}
        </section>

        <footer className="my-orders-footer">
          <span className="my-orders-footer-line" />
          <span>ARK MARBLES</span>
          <span>Natural Stone · Timeless Design</span>
          <span className="my-orders-footer-line" />
        </footer>
      </div>
    </main>
  );
}