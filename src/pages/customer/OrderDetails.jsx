
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Package,
  ShoppingBag,
  Clock,
  Truck,
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertCircle,
  MapPin,
  CreditCard,
  ClipboardCheck,
  PackageCheck,
} from "lucide-react";

import { supabase } from "../../lib/supabase";
import "./OrderDetails.css";

function money(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function itemPrice(item) {
  return Number(
    item.unit_price ??
      item.price_per_unit ??
      item.price ??
      item.unit_amount ??
      0
  );
}

function itemTotal(item) {
  return itemPrice(item) * (Number(item.quantity) || 1);
}

function formatDate(value) {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function normalizedStatus(status) {
  return String(status || "pending")
    .trim()
    .toLowerCase()
    .replaceAll("_", " ")
    .replaceAll("-", " ");
}

function statusInfo(status) {
  const value = normalizedStatus(status);

  if (["delivered", "completed"].includes(value)) {
    return { label: status || "Delivered", className: "is-success", Icon: CheckCircle2 };
  }

  if (["shipped", "out for delivery", "dispatched"].includes(value)) {
    return { label: status, className: "is-shipped", Icon: Truck };
  }

  if (["cancelled", "canceled", "failed", "rejected"].includes(value)) {
    return { label: status, className: "is-cancelled", Icon: XCircle };
  }

  if (["processing", "confirmed", "paid"].includes(value)) {
    return { label: status, className: "is-processing", Icon: Package };
  }

  return { label: status || "Pending", className: "is-pending", Icon: Clock };
}

const trackingSteps = [
  {
    key: "placed",
    title: "Order Placed",
    description: "Your order has been received.",
    Icon: ClipboardCheck,
  },
  {
    key: "confirmed",
    title: "Order Confirmed",
    description: "Your order has been confirmed.",
    Icon: CheckCircle2,
  },
  {
    key: "processing",
    title: "Processing",
    description: "Your order is being prepared.",
    Icon: Package,
  },
  {
    key: "shipped",
    title: "Shipped",
    description: "Your order has been dispatched.",
    Icon: Truck,
  },
  {
    key: "delivered",
    title: "Delivered",
    description: "Your order has reached its destination.",
    Icon: PackageCheck,
  },
];

function getTrackingProgress(status) {
  const value = normalizedStatus(status);

  if (["cancelled", "canceled", "failed", "rejected"].includes(value)) {
    return { current: -1, cancelled: true };
  }

  if (["delivered", "completed"].includes(value)) {
    return { current: 4, cancelled: false };
  }

  if (["shipped", "dispatched", "out for delivery"].includes(value)) {
    return { current: 3, cancelled: false };
  }

  if (["processing"].includes(value)) {
    return { current: 2, cancelled: false };
  }

  if (["confirmed", "paid"].includes(value)) {
    return { current: 1, cancelled: false };
  }

  // An unknown or pending status confirms only that the order was placed.
  return { current: 0, cancelled: false };
}

function readAddress(address) {
  if (!address) return "";

  if (typeof address === "string") {
    try {
      const parsed = JSON.parse(address);
      return readAddress(parsed);
    } catch {
      return address;
    }
  }

  if (typeof address === "object") {
    return [
      address.recipient_name || address.full_name || address.name,
      address.phone,
      address.address_line1 || address.address_line_1 || address.line1,
      address.address_line2 || address.address_line_2 || address.line2,
      address.city,
      address.state,
      address.postal_code || address.pincode || address.zip,
      address.country,
    ]
      .filter(Boolean)
      .join(", ");
  }

  return "";
}

export default function OrderDetails() {
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOrder = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        setOrder(null);
        setItems([]);
        setError("Please log in to view this order.");
        return;
      }

      const { data: orderRow, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", id)
        .eq("customer_id", user.id)
        .maybeSingle();

      if (orderError) throw orderError;

      if (!orderRow) {
        setOrder(null);
        setItems([]);
        setError("This order could not be found in your account.");
        return;
      }

      const { data: itemRows, error: itemError } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderRow.id);

      if (itemError) throw itemError;

      setOrder(orderRow);
      setItems(itemRows || []);
    } catch (err) {
      console.error("Unable to load order details:", err);
      setOrder(null);
      setItems([]);
      setError(err.message || "Unable to load order details.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  if (loading) {
    return (
      <main className="order-details-page">
        <div className="order-details-container order-details-state">
          <RefreshCw size={25} className="order-details-spin" />
          <p>Loading order details...</p>
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="order-details-page">
        <div className="order-details-container">
          <Link to="/account/orders" className="order-details-back">
            <ArrowLeft size={17} /> Back to My Orders
          </Link>

          <section className="order-details-empty">
            <AlertCircle size={40} />
            <h1>Order details unavailable</h1>
            <p>{error || "We could not find this order."}</p>

            <button
              type="button"
              className="order-details-primary"
              onClick={loadOrder}
            >
              <RefreshCw size={16} /> Try Again
            </button>
          </section>
        </div>
      </main>
    );
  }

  const status = statusInfo(order.status);
  const progress = getTrackingProgress(order.status);

  const paymentStatus = String(order.payment_status || "pending")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

  const calculatedTotal = items.reduce(
    (sum, item) => sum + itemTotal(item),
    0
  );

  const total = Number(order.total_amount ?? calculatedTotal);
  const address = readAddress(order.shipping_address);

  const itemCount = items.reduce(
    (sum, item) => sum + (Number(item.quantity) || 1),
    0
  );

  return (
    <main className="order-details-page">
      <div className="order-details-container">
        <Link to="/account/orders" className="order-details-back">
          <ArrowLeft size={17} /> Back to My Orders
        </Link>

        <header className="order-details-heading">
          <div>
            <span className="order-details-eyebrow">PURCHASE SUMMARY</span>
            <h1>Order Details</h1>
            <p>
              Order #{order.order_number || String(order.id).slice(0, 8)}
            </p>
          </div>

          <span className={`order-details-status ${status.className}`}>
            <status.Icon size={16} />
            {status.label}
          </span>
        </header>

        <section className="order-details-summary">
          <div>
            <span>ORDER PLACED</span>
            <strong>{formatDate(order.created_at)}</strong>
          </div>

          <div>
            <span>PAYMENT STATUS</span>
            <strong>
              <CreditCard size={15} /> {paymentStatus}
            </strong>
          </div>

          <div>
            <span>ITEMS ORDERED</span>
            <strong>{itemCount}</strong>
          </div>
        </section>

        <section className="order-details-card order-tracking-card">
          <div className="order-details-section-heading">
            <Truck size={19} />
            <h2>Order Tracking</h2>
          </div>

          {progress.cancelled ? (
            <div className="order-tracking-cancelled">
              <XCircle size={23} />
              <div>
                <strong>Order {status.label}</strong>
                <p>
                  This order is not progressing through the normal delivery
                  steps. Contact our team if you need assistance.
                </p>
              </div>
            </div>
          ) : (
            <>
              <p className="order-tracking-intro">
                Current status: <strong>{status.label}</strong>
              </p>

              <div className="order-tracking-timeline">
                {trackingSteps.map((step, index) => {
                  const StepIcon = step.Icon;
                  const complete = index < progress.current;
                  const active = index === progress.current;

                  return (
                    <div
                      className={[
                        "order-tracking-step",
                        complete ? "is-complete" : "",
                        active ? "is-active" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      key={step.key}
                    >
                      <div className="order-tracking-marker">
                        {complete ? (
                          <CheckCircle2 size={19} />
                        ) : (
                          <StepIcon size={18} />
                        )}
                      </div>

                      <div className="order-tracking-step-content">
                        <strong>{step.title}</strong>
                        <p>{step.description}</p>
                        {active && (
                          <span className="order-tracking-current">
                            Current stage
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="order-tracking-disclaimer">
                This timeline is based on the order status currently saved in
                the system. Individual milestone timestamps are shown only
                when recorded by your store.
              </p>
            </>
          )}
        </section>

        <section className="order-details-card">
          <div className="order-details-section-heading">
            <Package size={19} />
            <h2>Items Ordered</h2>
          </div>

          {items.length === 0 ? (
            <p className="order-details-muted">
              No item details are available for this order.
            </p>
          ) : (
            <div className="order-details-items">
              {items.map((item, index) => (
                <article
                  className="order-details-item"
                  key={item.id || `${item.order_id}-${index}`}
                >
                  <div className="order-details-product-icon">
                    <Package size={23} />
                  </div>

                  <div className="order-details-product-info">
                    <h3>
                      {item.product_name || item.name || "Marble Product"}
                    </h3>
                    <p>
                      Quantity: {Number(item.quantity) || 1}
                      {" · "}
                      Unit price: {money(itemPrice(item))}
                    </p>
                  </div>

                  <strong className="order-details-line-total">
                    {money(itemTotal(item))}
                  </strong>
                </article>
              ))}
            </div>
          )}

          <div className="order-details-total">
            <span>Order Total</span>
            <strong>{money(total)}</strong>
          </div>
        </section>

        {address && (
          <section className="order-details-card">
            <div className="order-details-section-heading">
              <MapPin size={19} />
              <h2>Shipping Address</h2>
            </div>
            <p className="order-details-address">{address}</p>
          </section>
        )}

        {order.customer_note && (
          <section className="order-details-card">
            <h2 className="order-details-note-heading">Your Order Note</h2>
            <p className="order-details-address">{order.customer_note}</p>
          </section>
        )}

        <div className="order-details-delivery-note">
          <Truck size={18} />
          <p>
            Delivery updates depend on your order status being updated by the
            store team. This page does not generate courier tracking events.
          </p>
        </div>

        <Link to="/marbles" className="order-details-primary">
          <ShoppingBag size={17} />
          Continue Shopping
        </Link>
      </div>
    </main>
  );
}
