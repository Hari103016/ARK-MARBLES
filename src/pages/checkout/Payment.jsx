import React, { useMemo, useState } from "react";
import "./Payment.css";
import { useCartContext } from "../../context/CartContext";

const PAYMENT_METHODS = [
  {
    id: "upi",
    title: "UPI",
    description: "Google Pay, PhonePe, BHIM",
    tagline: "Fast · Secure · Instant",
    logo: "UPI▶",
    logoClass: "upi-logo",
    brands: ["GPay", "PhonePe", "BHIM"],
  },
  {
    id: "card",
    title: "Credit / Debit Card",
    description: "Visa, Mastercard, RuPay",
    tagline: "Safe · Convenient · Worldwide",
    logo: "VISA",
    logoClass: "card-logo",
    brands: ["VISA", "● ●", "RuPay"],
  },
  {
    id: "netbanking",
    title: "Net Banking",
    description: "All major Indian banks",
    tagline: "Secure · Reliable · Easy",
    logo: "▤",
    logoClass: "bank-logo",
    brands: ["SBI", "HDFC", "ICICI"],
  },
  {
    id: "cod",
    title: "Cash on Delivery",
    description: "Pay when your order is delivered",
    tagline: "Safe · Hassle Free · Trusted",
    logo: "₹",
    logoClass: "cash-logo",
    brands: ["ARK", "DELIVERY"],
  },
];

const formatINR = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

function getProductId(item) {
  return String(item.id ?? item.marble_id ?? "");
}

function getProductPrice(item) {
  return Number(item.price_per_sqft ?? item.price ?? 0) || 0;
}

export default function PaymentMethod({
  onBack,
  onReview,
  initialMethod = "upi",
}) {
  const cart = useCartContext();

  const items = cart.items ?? cart.cartItems ?? [];
  const updateQuantity = cart.updateQuantity;
  const removeFromCart = cart.removeFromCart;

  const [selectedMethod, setSelectedMethod] = useState(initialMethod);
  const [error, setError] = useState("");

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum + getProductPrice(item) * (Number(item.quantity) || 0),
        0
      ),
    [items]
  );

  const shipping = subtotal > 0 ? 500 : 0;
  const gst = Math.round(subtotal * 0.18);
  const total = subtotal + shipping + gst;

  const itemCount = items.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0),
    0
  );

  function handleReview() {
    if (items.length === 0) {
      setError("Your cart is empty. Please add a marble before continuing.");
      return;
    }

    setError("");

    if (typeof onReview === "function") {
      onReview({
        paymentMethod: selectedMethod,
        items,
        subtotal,
        shipping,
        gst,
        total,
      });
    } else {
      console.warn(
        "Connect the onReview prop to your checkout review step."
      );
    }
  }

  return (
    <main className="ark-payment-screen">
      <div className="ark-payment-backdrop" aria-hidden="true" />

      <div className="ark-payment-layout">
        <section className="ark-payment-panel">
          <div className="ark-payment-brand">
            <span className="ark-payment-monogram">A</span>

            <div>
              <div className="ark-payment-brand-name">
                ARK MARBLES
              </div>

              <div className="ark-payment-brand-caption">
                NATURAL STONE · CONSTRUCTION · LUXURY SURFACES
              </div>
            </div>
          </div>

          <div className="ark-payment-step">
            STEP 2 OF 3
          </div>

          <h1 className="ark-payment-title">
            Payment <em>Method</em>
          </h1>

          <p className="ark-payment-subtitle">
            CHOOSE HOW YOU WOULD LIKE TO PAY
          </p>

          <div
            className="ark-payment-options"
            role="radiogroup"
            aria-label="Choose a payment method"
          >
            {PAYMENT_METHODS.map((method) => {
              const selected = selectedMethod === method.id;

              return (
                <button
                  key={method.id}
                  type="button"
                  className={`ark-payment-option ${
                    selected ? "is-selected" : ""
                  }`}
                  role="radio"
                  aria-checked={selected}
                  onClick={() => {
                    setSelectedMethod(method.id);
                    setError("");
                  }}
                >
                  <span className="ark-payment-radio">
                    {selected && <span />}
                  </span>

                  <span
                    className={`ark-payment-method-logo ${method.logoClass}`}
                    aria-hidden="true"
                  >
                    {method.logo}
                  </span>

                  <span className="ark-payment-method-copy">
                    <span className="ark-payment-method-name">
                      {method.title}
                    </span>

                    <span className="ark-payment-method-description">
                      {method.description}
                    </span>

                    <span className="ark-payment-method-tagline">
                      {method.tagline}
                    </span>
                  </span>

                  <span
                    className="ark-payment-brands"
                    aria-hidden="true"
                  >
                    {method.brands.map((brand) => (
                      <span
                        key={brand}
                        className={`ark-payment-brand-chip brand-${method.id}`}
                      >
                        {brand}
                      </span>
                    ))}
                  </span>

                  <span
                    className="ark-payment-arrow"
                    aria-hidden="true"
                  >
                    ›
                  </span>
                </button>
              );
            })}
          </div>

          {error && (
            <p className="ark-payment-error" role="alert">
              {error}
            </p>
          )}

          <div className="ark-payment-actions">
            <button
              type="button"
              className="ark-payment-back-button"
              onClick={() => {
                if (typeof onBack === "function") onBack();
              }}
            >
              <span aria-hidden="true">←</span> Back
            </button>

            <button
              type="button"
              className="ark-payment-review-button"
              onClick={handleReview}
            >
              Review Order <span aria-hidden="true">⟶</span>
            </button>
          </div>

          <div className="ark-payment-trust">
            <div className="ark-payment-trust-item">
              <span className="ark-payment-trust-icon">♢</span>
              <span>
                <strong>100%</strong>
                <small>Secure Payment</small>
              </span>
            </div>

            <div className="ark-payment-trust-item">
              <span className="ark-payment-trust-icon">♧</span>
              <span>
                <strong>Insured</strong>
                <small>Delivery</small>
              </span>
            </div>

            <div className="ark-payment-trust-item">
              <span className="ark-payment-trust-icon">✧</span>
              <span>
                <strong>Premium</strong>
                <small>Marble &amp; Construction</small>
              </span>
            </div>
          </div>
        </section>

        <aside className="ark-payment-showroom">
          <div className="ark-payment-showroom-overlay" />

          <div className="ark-payment-showroom-copy">
            <span>From</span>

            <h2>
              Marbles
              <i>to</i>
              Constructions
            </h2>

            <div className="ark-payment-showroom-rule" />

            <p>
              BUILDING SPACES
              <br />
              THAT LAST FOREVER
            </p>
          </div>

          <div className="ark-payment-showroom-caption">
            <span className="ark-payment-caption-mark">A</span>

            <span>
              <strong>ARK MARBLES</strong>
              <small>NATURAL STONE · LUXURY SURFACES</small>
            </span>
          </div>
        </aside>
      </div>

      <section className="ark-payment-order-summary">
        <div className="ark-payment-summary-heading">
          <div>
            <span className="ark-payment-summary-eyebrow">
              YOUR SELECTION
            </span>

            <h2>Order Summary</h2>
          </div>

          <span className="ark-payment-item-count">
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </span>
        </div>

        {items.length === 0 ? (
          <p className="ark-payment-empty">
            Your cart is currently empty.
          </p>
        ) : (
          <div className="ark-payment-cart-items">
            {items.map((item) => {
              const id = getProductId(item);
              const quantity = Number(item.quantity) || 1;
              const price = getProductPrice(item);

              const image =
                item.image_url ||
                item.image ||
                item.imageUrl ||
                item.marble_image;

              return (
                <article
                  className="ark-payment-cart-item"
                  key={id}
                >
                  {image ? (
                    <img
                      className="ark-payment-product-image"
                      src={image}
                      alt={item.name || item.title || "Marble"}
                    />
                  ) : (
                    <div className="ark-payment-product-placeholder">
                      A
                    </div>
                  )}

                  <div className="ark-payment-product-info">
                    <h3>
                      {item.name || item.title || "Premium Marble"}
                    </h3>

                    <p>{item.category || "Natural Stone"}</p>

                    <p>
                      {item.finish ||
                        item.surface_finish ||
                        "Premium finish"}
                    </p>

                    <small>
                      {formatINR(price)} / sq. ft.
                    </small>

                    <button
                      type="button"
                      className="ark-payment-remove"
                      onClick={() => removeFromCart?.(id)}
                    >
                      Remove item
                    </button>
                  </div>

                  <div className="ark-payment-product-controls">
                    <div className="ark-payment-quantity">
                      <button
                        type="button"
                        aria-label={`Decrease ${
                          item.name || "item"
                        } quantity`}
                        onClick={() =>
                          updateQuantity?.(id, quantity - 1)
                        }
                      >
                        −
                      </button>

                      <span>{quantity}</span>

                      <button
                        type="button"
                        aria-label={`Increase ${
                          item.name || "item"
                        } quantity`}
                        onClick={() =>
                          updateQuantity?.(id, quantity + 1)
                        }
                      >
                        +
                      </button>
                    </div>

                    <strong>
                      {formatINR(price * quantity)}
                    </strong>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div className="ark-payment-totals">
          <div>
            <span>Subtotal ({itemCount} items)</span>
            <strong>{formatINR(subtotal)}</strong>
          </div>

          <div>
            <span>Shipping estimate</span>
            <strong>
              {subtotal > 0 ? formatINR(shipping) : "—"}
            </strong>
          </div>

          <div>
            <span>GST estimate (18%)</span>
            <strong>{formatINR(gst)}</strong>
          </div>

          <div className="ark-payment-total">
            <span>Total payable</span>
            <strong>{formatINR(total)}</strong>
          </div>
        </div>

        <div className="ark-payment-summary-promises">
          <div>
            <span>◇</span>
            <strong>Secure Checkout</strong>
            <small>Your data is protected</small>
          </div>

          <div>
            <span>♧</span>
            <strong>Insured Delivery</strong>
            <small>Safe and reliable</small>
          </div>

          <div>
            <span>✧</span>
            <strong>Premium Marble</strong>
            <small>Direct from source</small>
          </div>
        </div>

        <p className="ark-payment-disclaimer">
          Estimates only. Final delivery charges and applicable taxes
          should be confirmed before accepting payment.
        </p>
      </section>
    </main>
  );
}