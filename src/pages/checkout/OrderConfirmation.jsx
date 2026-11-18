import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  CheckCircle2,
  Package,
  Truck,
  MapPin,
  CreditCard,
  Copy,
  CalendarDays,
  ShoppingBag,
} from "lucide-react";

import "./OrderConfirmation.css";
import MarbleOrderSuccessPopup from "./MarbleOrderSuccessPopup.jsx";

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const getName = (item) =>
  item.name ||
  item.title ||
  item.marble_name ||
  item.product_name ||
  "Premium Marble";

const getPrice = (item) =>
  Number(
    item.price ??
      item.price_per_unit ??
      item.selling_price ??
      item.price_per_sqft ??
      item.unit_price ??
      item.amount ??
      0
  );

const getQty = (item) =>
  Math.max(1, Number(item.quantity ?? item.qty ?? 1) || 1);

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function OrderConfirmation() {
  const location = useLocation();
  const [showPopup, setShowPopup] = useState(true);

  const order = useMemo(() => {
    const state = location.state;
    if (!state) return null;

    const raw = state.order || state.orderData || state;

    if (
      typeof raw !== "object" ||
      (!Array.isArray(raw.items) &&
        raw.total === undefined &&
        raw.total_amount === undefined &&
        raw.order_number === undefined &&
        raw.id === undefined)
    ) {
      return null;
    }

    return {
      ...raw,
      items: Array.isArray(raw.items) ? raw.items : [],
    };
  }, [location.state]);

  if (!order) {
    return (
      <main className="ark-confirm-empty">
        <div className="ark-confirm-empty-card">
          <Package size={42} />
          <h1>No order details found</h1>
          <p>
            Place an order first. Order details are not available in this
            page session.
          </p>
          <Link to="/marbles" className="ark-confirm-browse-button">
            Browse Marbles
          </Link>
        </div>
      </main>
    );
  }

  const items = order.items || [];

  const address =
    order.shippingAddress ||
    order.shipping_address ||
    order.address ||
    {};

  const orderId =
    order.orderNumber ||
    order.order_number ||
    order.orderId ||
    order.id ||
    "Pending";

  const customerName =
    order.customerName ||
    order.customer_name ||
    address.fullName ||
    address.full_name ||
    "Customer";

  const paymentRaw =
    order.paymentMethod ||
    order.payment_method ||
    "Not specified";

  const paymentMethod =
    typeof paymentRaw === "string"
      ? paymentRaw
      : [
          paymentRaw?.brand,
          paymentRaw?.last4 ? `•••• ${paymentRaw.last4}` : "",
        ]
          .filter(Boolean)
          .join(" ") || "Online Payment";

  const subtotal = Number(
    order.subtotal ??
      items.reduce(
        (sum, item) => sum + getPrice(item) * getQty(item),
        0
      )
  );

  const shipping = Number(
    order.shipping ??
      order.shipping_charge ??
      order.delivery_charges ??
      0
  );

  const gst = Number(order.gst ?? order.tax ?? 0);

  const total = Number(
    order.total_amount ??
      order.total ??
      order.amount ??
      subtotal + shipping + gst
  );

  const itemCount = items.reduce(
    (sum, item) => sum + getQty(item),
    0
  );

  const orderDate =
    order.created_at ||
    order.date ||
    new Date().toISOString();

  const expectedDelivery =
    order.expectedDelivery ||
    order.expected_delivery ||
    order.estimatedDelivery ||
    order.estimated_delivery ||
    order.delivery_date ||
    order.expected_delivery_date ||
    "Will be updated soon";

  const copyOrderId = async () => {
    try {
      await navigator.clipboard.writeText(String(orderId));
      window.alert("Order ID copied.");
    } catch {
      window.prompt("Copy order ID:", String(orderId));
    }
  };

  const addressLine = [
    address.addressLine ||
      address.address_line ||
      address.address ||
      address.street,
    address.city,
    address.district,
    address.state,
    address.pincode ||
      address.postal_code ||
      address.zip,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <main className="ark-confirm-page">

      {/* SUCCESS HERO */}

      <section className="ark-confirm-hero">
        <div className="ark-confirm-hero-inner">

          <div className="ark-confirm-success-heading">
            <span className="ark-confirm-check">
              <CheckCircle2 size={29} strokeWidth={2.8} />
            </span>

            <span>Order Placed Successfully</span>
          </div>

          <h1>Thank you, {customerName}!</h1>

          <p className="ark-confirm-hero-message">
            Your order has been received. We'll notify you once it's shipped.
          </p>

          <div className="ark-confirm-order-id">
            <span>
              Order ID: <strong>{orderId}</strong>
            </span>

            <button
              type="button"
              onClick={copyOrderId}
              aria-label="Copy order ID"
            >
              <Copy size={21} />
            </button>
          </div>

        </div>
      </section>

      {/* MAIN CONTENT */}

      <div className="ark-confirm-container">

        {/* ORDER SUMMARY + PRICE DETAILS */}

        <div className="ark-confirm-top-grid">

          <section className="ark-confirm-card ark-confirm-summary-card">
            <h2>Order Summary</h2>

            {items.length > 0 ? (
              <div className="ark-confirm-item-list">
                {items.map((item, index) => (
                  <article
                    className="ark-confirm-item"
                    key={item.id || item.product_id || index}
                  >
                    <div className="ark-confirm-item-icon">
                      <Package size={34} strokeWidth={1.8} />
                    </div>

                    <div className="ark-confirm-item-description">
                      <h3>{getName(item)}</h3>

                      <p>
                        {item.category_name ||
                          item.category ||
                          item.material_type ||
                          "Marble"}{" "}
                        | Qty: {getQty(item)}
                      </p>
                    </div>

                    <strong className="ark-confirm-item-price">
                      {money(getPrice(item) * getQty(item))}
                    </strong>
                  </article>
                ))}
              </div>
            ) : (
              <p className="ark-confirm-no-items">
                Product details are not available for this order.
              </p>
            )}
          </section>

          <section className="ark-confirm-card ark-confirm-price-card">
            <h2>Price Details</h2>

            <div className="ark-confirm-price-row">
              <span>Subtotal</span>
              <strong>{money(subtotal)}</strong>
            </div>

            <div className="ark-confirm-price-row">
              <span>Delivery Charges</span>
              <strong>
                {shipping === 0 ? "Free" : money(shipping)}
              </strong>
            </div>

            <div className="ark-confirm-price-row">
              <span>GST</span>
              <strong>{money(gst)}</strong>
            </div>

            <div className="ark-confirm-total-row">
              <span>Total Payable</span>
              <strong>{money(total)}</strong>
            </div>
          </section>

        </div>

        {/* ORDER INFORMATION STRIP */}

        <section className="ark-confirm-info-strip">

          <div className="ark-confirm-info-item">
            <span className="ark-confirm-info-icon">
              <CalendarDays size={29} />
            </span>

            <div>
              <span>Order Date</span>
              <strong>{formatDate(orderDate)}</strong>
            </div>
          </div>

          <div className="ark-confirm-info-item">
            <span className="ark-confirm-info-icon">
              <CreditCard size={29} />
            </span>

            <div>
              <span>Payment Method</span>
              <strong>{paymentMethod}</strong>
            </div>
          </div>

          <div className="ark-confirm-info-item">
            <span className="ark-confirm-info-icon">
              <ShoppingBag size={29} />
            </span>

            <div>
              <span>Items Ordered</span>
              <strong>
                {itemCount} {itemCount === 1 ? "Item" : "Items"}
              </strong>
            </div>
          </div>

        </section>

        {/* DELIVERY INFORMATION */}

        <div className="ark-confirm-delivery-grid">

          <section className="ark-confirm-card ark-confirm-delivery-card">
            <span className="ark-confirm-delivery-icon">
              <MapPin size={31} />
            </span>

            <div>
              <h2>Deliver To</h2>

              <strong className="ark-confirm-delivery-name">
                {customerName}
                {address.phone ? `, ${address.phone}` : ""}
              </strong>

              <p>
                {addressLine || "Delivery address not provided"}
              </p>
            </div>
          </section>

          <section className="ark-confirm-card ark-confirm-delivery-card">
            <span className="ark-confirm-delivery-icon">
              <Truck size={32} />
            </span>

            <div>
              <h2>Expected Delivery</h2>

              <strong className="ark-confirm-delivery-date">
                {typeof expectedDelivery === "string" &&
                expectedDelivery.toLowerCase().includes("soon")
                  ? expectedDelivery
                  : Array.isArray(expectedDelivery)
                    ? expectedDelivery.join(" – ")
                    : expectedDelivery.includes?.(" - ")
                      ? expectedDelivery
                      : formatDate(expectedDelivery)}
              </strong>

              <p>
                {order.status
                  ? `Current order status: ${order.status}`
                  : "We will update you when your order is ready for dispatch."}
              </p>
            </div>
          </section>

        </div>

        {/* BUTTONS */}

        <div className="ark-confirm-bottom-actions">
          <Link to="/marbles" className="ark-confirm-shop-button">
            Continue Shopping <ShoppingBag size={17} />
          </Link>

          <Link to="/" className="ark-confirm-home-button">
            Back to Home
          </Link>
        </div>

      </div>

      {/* YOUR ORIGINAL POPUP — LEFT UNCHANGED */}

      <MarbleOrderSuccessPopup
        isOpen={showPopup}
        onClose={() => setShowPopup(false)}
        order={{
          ...order,
          orderNumber: orderId,
          customerName,
          customerEmail:
            order.customerEmail ||
            order.customer_email ||
            address.email ||
            "",
          paymentMethod,
          total_amount: total,
          estimatedDelivery:
            order.estimatedDelivery ||
            order.estimated_delivery ||
            "Will be updated soon",
        }}
      />

      <footer className="ark-confirm-footer">
        <span>© {new Date().getFullYear()} ARK MARBLES</span>
        <span>Natural Stone · Luxury Surfaces</span>
      </footer>

    </main>
  );
}