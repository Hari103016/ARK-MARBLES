import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  CalendarDays,
  ArrowLeft,
  Gem,
  AlertCircle,
} from "lucide-react";

const TRACKING_STEPS = [
  {
    status: "Pending",
    title: "Order Placed",
    description: "Your order has been received.",
    icon: Package,
  },
  {
    status: "Confirmed",
    title: "Order Confirmed",
    description: "Your order has been confirmed by the store.",
    icon: CheckCircle2,
  },
  {
    status: "Processing",
    title: "Preparing Order",
    description: "Your order is being prepared.",
    icon: Clock,
  },
  {
    status: "Shipped",
    title: "Order Dispatched",
    description: "Your order has been dispatched.",
    icon: Truck,
  },
  {
    status: "Delivered",
    title: "Delivered",
    description: "Your order has reached its destination.",
    icon: MapPin,
  },
];

const normalizeStatus = (status) => {
  const value = String(status || "").toLowerCase();

  if (value.includes("cancel")) return "Cancelled";
  if (value.includes("deliver")) return "Delivered";
  if (value.includes("ship") || value.includes("dispatch")) return "Shipped";
  if (value.includes("process")) return "Processing";
  if (value.includes("confirm")) return "Confirmed";

  return "Pending";
};

const formatDate = (value) => {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

export default function OrderTracking() {
  const [orderId, setOrderId] = useState("");
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleTrack(event) {
    event.preventDefault();

    setError("");
    setOrder(null);

    if (!orderId.trim()) {
      setError("Please enter your order ID.");
      return;
    }

    setLoading(true);

    try {
      /*
       * Database lookup is intentionally not guessed here.
       * Connect this function to your actual order service and
       * verified Supabase orders table before using live tracking.
       */
      setError(
        "Live tracking is not connected yet. Connect your order service to look up order status."
      );
    } catch (err) {
      setError(err.message || "Unable to track this order.");
    } finally {
      setLoading(false);
    }
  }

  const status = order ? normalizeStatus(order.status) : "Pending";
  const currentStep = TRACKING_STEPS.findIndex(
    (step) => step.status === status
  );

  const isCancelled = status === "Cancelled";

  return (
    <main className="order-tracking-page">
      <div className="order-tracking-container">
        <header className="order-tracking-header">
          <Link to="/store" className="order-tracking-brand">
            <span className="order-tracking-brand-icon">
              <Gem size={25} />
            </span>

            <span>
              <strong>ARK MARBLES</strong>
              <small>PREMIUM STONE COLLECTIONS</small>
            </span>
          </Link>

          <Link to="/store" className="order-tracking-back">
            <ArrowLeft size={17} />
            Back to store
          </Link>
        </header>

        <section className="order-tracking-intro">
          <span className="order-tracking-eyebrow">
            ORDER MANAGEMENT
          </span>

          <h1>Track Your Order</h1>

          <p>
            Enter your order reference to check its current delivery status.
          </p>
        </section>

        <section className="order-tracking-search-card">
          <div className="order-tracking-search-icon">
            <Package size={25} />
          </div>

          <h2>Where is your order?</h2>

          <p>
            Use the order ID provided in your order confirmation.
          </p>

          <form onSubmit={handleTrack} className="order-tracking-form">
            <label htmlFor="tracking-order-id">Order ID</label>

            <div className="order-tracking-input">
              <Search size={19} />

              <input
                id="tracking-order-id"
                type="text"
                placeholder="Enter your order ID"
                value={orderId}
                onChange={(event) => setOrderId(event.target.value)}
                required
              />

              <button type="submit" disabled={loading}>
                {loading ? "Searching..." : "Track Order"}
              </button>
            </div>
          </form>

          {error && (
            <div className="order-tracking-error" role="alert">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}
        </section>

        {order && (
          <section className="order-tracking-result">
            <div className="order-tracking-result-header">
              <div>
                <span className="order-tracking-label">
                  ORDER REFERENCE
                </span>

                <h2>{order.id || order.order_id || orderId}</h2>

                <p>
                  Placed on{" "}
                  {formatDate(order.created_at || order.date)}
                </p>
              </div>

              <span
                className={`order-tracking-status status-${status.toLowerCase()}`}
              >
                {status}
              </span>
            </div>

            {isCancelled ? (
              <div className="order-tracking-cancelled">
                <AlertCircle size={22} />
                <div>
                  <strong>Order cancelled</strong>
                  <p>
                    Contact the store if you need more information about
                    this order.
                  </p>
                </div>
              </div>
            ) : (
              <div className="order-tracking-timeline">
                {TRACKING_STEPS.map((step, index) => {
                  const Icon = step.icon;
                  const completed = index <= currentStep;
                  const current = index === currentStep;

                  return (
                    <div
                      className={`order-tracking-step ${
                        completed ? "step-completed" : ""
                      } ${current ? "step-current" : ""}`}
                      key={step.status}
                    >
                      <div className="order-tracking-step-marker">
                        <Icon size={20} />
                      </div>

                      <div className="order-tracking-step-content">
                        <strong>{step.title}</strong>
                        <p>{step.description}</p>

                        {current && (
                          <span className="order-tracking-current-label">
                            Current status
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="order-tracking-result-footer">
              <div>
                <CalendarDays size={18} />
                <span>
                  <small>Order date</small>
                  <strong>
                    {formatDate(order.created_at || order.date)}
                  </strong>
                </span>
              </div>

              <div>
                <Truck size={18} />
                <span>
                  <small>Delivery address</small>
                  <strong>
                    {order.shipping_address ||
                      order.delivery_address ||
                      "Not available"}
                  </strong>
                </span>
              </div>
            </div>
          </section>
        )}

        <section className="order-tracking-help">
          <div className="order-tracking-help-icon">
            <Truck size={22} />
          </div>

          <div>
            <h3>Need help with your delivery?</h3>
            <p>
              Keep your order ID ready when contacting the ARK MARBLES team.
            </p>
          </div>

          <Link to="/contact">Contact Us</Link>
        </section>

        <footer className="order-tracking-footer">
          <span>© {new Date().getFullYear()} ARK MARBLES</span>
          <span>Premium Stone Collections</span>
        </footer>
      </div>
    </main>
  );
}