import { useEffect, useMemo, useState } from "react";

import { useLocation, useNavigate } from "react-router-dom";

import { useCartContext } from "../../context/CartContext";

import "./Checkout.css";

const firstValue = (...values) =>

  values.find((value) => value !== undefined && value !== null && value !== "");

const formatINR = (value) =>

  new Intl.NumberFormat("en-IN", {

    style: "currency",

    currency: "INR",

    maximumFractionDigits: 0,

  }).format(Number.isFinite(Number(value)) ? Number(value) : 0);

function getName(item) {

  return firstValue(item.name, item.title, item.marble_name, item.product_name, "Natural Marble");

}

function getCategory(item) {

  return firstValue(item.category_name, item.category, item.material_type, "Natural Marble");

}

function getImage(item) {

  return firstValue(item.image_url, item.image, item.thumbnail_url, item.thumbnail, item.imageUrl, "/images/hero-marble.jpg");

}

function getUnit(item) {

  return firstValue(item.unit, item.price_unit, item.unit_of_measure, "sq. ft.");

}

// Keep the same field priority used in MarbleDetails.jsx.

function getUnitPrice(item) {

  const raw = firstValue(

    item.price_per_unit,

    item.selling_price,

    item.price_per_sqft,

    item.price,

    item.unit_price,

    item.amount,

    null

  );

  if (raw === null || raw === "") return null;

  const price = Number(raw);

  return Number.isFinite(price) && price >= 0 ? price : null;

}

function getQuantity(item) {

  const quantity = Number(firstValue(item.quantity, item.qty, 1));

  return Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : 1;

}

export default function Checkout() {

  const navigate = useNavigate();

  const location = useLocation();

  const { items = [], cartItems, updateQuantity, removeFromCart } = useCartContext();

  // Buy Now is a separate one-item checkout and must not alter the cart.

  const isBuyNow = location.state?.checkoutMode === "buy-now";

  const [buyNowItem, setBuyNowItem] = useState(

    () => location.state?.buyNowItem ?? null

  );

  // Normal checkout uses the full cart; Buy Now uses only its selected product.

  const products = isBuyNow

    ? buyNowItem

      ? [buyNowItem]

      : []

    : cartItems ?? items;

  const [step, setStep] = useState(1);

  const [paymentMethod, setPaymentMethod] = useState("UPI");

  const [error, setError] = useState("");

  const [preferredAddress, setPreferredAddress] = useState(true);

  const [address, setAddress] = useState({

    fullName: "",

    phone: "",

    email: "",

    addressLine: "",

    state: "Andhra Pradesh",

    city: "",

    pincode: "",

  });

  useEffect(() => {

    window.scrollTo({ top: 0, behavior: "auto" });

  }, []);

  const hasMissingPrice = products.some((item) => getUnitPrice(item) === null);

  const subtotal = useMemo(

    () => products.reduce((sum, item) => sum + (getUnitPrice(item) ?? 0) * getQuantity(item), 0),

    [products]

  );

  const shipping = subtotal === 0 ? 0 : subtotal >= 50000 ? 0 : 500;

  const gst = Math.round(subtotal * 0.18);

  const total = subtotal + shipping + gst;

  const itemCount = products.reduce((sum, item) => sum + getQuantity(item), 0);

  function onAddressChange(event) {

    const { name, value } = event.target;

    setAddress((current) => ({ ...current, [name]: value }));

  }

  function validateDelivery() {

    if (!products.length) {

      setError("Your cart is empty. Please select a marble before checkout.");

      return false;

    }

    if (hasMissingPrice) {

      setError("A product price is missing. Return to the marble page, remove this item, and add it to the cart again.");

      return false;

    }

    if (!address.fullName.trim()) return setError("Please enter your full name."), false;

    if (!/^[6-9]\d{9}$/.test(address.phone.replace(/\D/g, ""))) return setError("Enter a valid 10-digit Indian mobile number."), false;

    if (address.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address.email.trim())) return setError("Enter a valid email address."), false;

    if (!address.addressLine.trim()) return setError("Please enter your complete delivery address."), false;

    if (!address.city.trim()) return setError("Please enter your city."), false;

    if (!/^\d{6}$/.test(address.pincode.trim())) return setError("Enter a valid 6-digit pincode."), false;

    setError("");

    return true;

  }

  function continueStep() {

    if (step === 1 && !validateDelivery()) return;

    if (!products.length || hasMissingPrice) {

      setError(!products.length ? "Your cart is empty." : "A product price is missing. Add the product to your cart again.");

      return;

    }

    setError("");

    setStep(step === 1 ? 2 : 3);

    window.scrollTo({ top: 0, behavior: "smooth" });

  }

  function goToStep(nextStep) {

    setError("");

    setStep(nextStep);

    window.scrollTo({ top: 0, behavior: "smooth" });

  }

  function updateItem(item, quantity) {

    const nextQuantity = Math.max(1, Math.floor(Number(quantity) || 1));

    // Quantity controls on Buy Now affect only the temporary checkout item.

    if (isBuyNow) {

      setBuyNowItem((current) =>

        current ? { ...current, quantity: nextQuantity } : null

      );

      return;

    }

    const id = item.id ?? item.marble_id;

    if (id == null || typeof updateQuantity !== "function") return;

    updateQuantity(id, nextQuantity);

  }

  function removeItem(item) {

    // Removing a Buy Now item empties this checkout only; the saved cart remains.

    if (isBuyNow) {

      setBuyNowItem(null);

      return;

    }

    const id = item.id ?? item.marble_id;

    if (id == null || typeof removeFromCart !== "function") return;

    removeFromCart(id);

  }

  function placeOrder() {
    if (!products.length || hasMissingPrice) {
      setError(
        !products.length
          ? "Please check your cart before continuing."
          : "A product price is missing. Please add the product again."
      );
      return;
    }

    // Demo-only order confirmation. This does not charge a payment method
    // or save an order to the database.
    const orderNumber = `ARK-${Date.now().toString().slice(-8)}`;

    const order = {
      id: orderNumber,
      orderNumber,
      customerName: address.fullName,
      customer_name: address.fullName,
      address: { ...address },
      shippingAddress: { ...address },
      preferredAddress,
      paymentMethod,
      payment_method: paymentMethod,
      items: products.map((item) => ({
        ...item,
        quantity: getQuantity(item),
        name: getName(item),
        price: getUnitPrice(item) ?? 0,
      })),
      subtotal,
      shipping,
      gst,
      total,
      total_amount: total,
      status: "Order received",
      created_at: new Date().toISOString(),
    };

    navigate("/order-confirmation", {
      state: { order },
    });
  }

  return (

    <div className="ark-luxury-checkout">

      <section className="ark-checkout-hero">

        <div className="ark-hero-inner">

          <p className="ark-eyebrow">SECURE CHECKOUT</p>

          <h1>Complete <em>your selection</em></h1>

          <p className="ark-hero-subtitle">PREMIUM MARBLES FOR TIMELESS SPACES</p>

          <div className="ark-benefits">

            <div><span className="ark-benefit-icon">♧</span><span><strong>Secure Delivery</strong><small>Across India</small></span></div>

            <div><span className="ark-benefit-icon">◇</span><span><strong>Safe Payments</strong><small>Protected checkout</small></span></div>

            <div><span className="ark-benefit-icon">✧</span><span><strong>Premium Quality</strong><small>Natural stone</small></span></div>

          </div>

        </div>

      </section>

      <main className="ark-checkout-layout">

        <section className="ark-delivery-card">

          <div className="ark-card-title-row">

            <div><h2>Checkout</h2><p>COMPLETE YOUR ORDER WITH CONFIDENCE</p></div>

            <div className="ark-checkout-steps">

              {["Delivery", "Payment", "Review"].map((label, index) => {

                const number = index + 1;

                return (

                  <button key={label} type="button" className={`ark-step ${step === number ? "active" : ""} ${step > number ? "complete" : ""}`} onClick={() => { if (number < step) { setError(""); setStep(number); } }} disabled={number > step}>

                    <span>{step > number ? "✓" : `0${number}`}</span><b>{label}</b>

                  </button>

                );

              })}

            </div>

          </div>

          <div className="ark-card-rule" />

          {error && <div className="ark-form-error" role="alert">{error}</div>}

          {step === 1 && (

            <form onSubmit={(event) => { event.preventDefault(); continueStep(); }} className="ark-checkout-form">

              <div className="ark-form-section-heading"><span className="ark-pin-icon">⌖</span><div><h3>Delivery Details</h3><p>Where should we deliver your selected stone?</p></div></div>

              <div className="ark-form-grid">

                <label className="ark-input-group"><span>Full name <b>*</b></span><input name="fullName" value={address.fullName} onChange={onAddressChange} placeholder="Enter your full name" autoComplete="name" required /></label>

                <label className="ark-input-group"><span>Mobile number <b>*</b></span><input name="phone" value={address.phone} onChange={onAddressChange} placeholder="10-digit mobile number" autoComplete="tel" inputMode="numeric" required /></label>

                <label className="ark-input-group"><span>Email address</span><input name="email" type="email" value={address.email} onChange={onAddressChange} placeholder="you@example.com" autoComplete="email" /></label>

                <label className="ark-input-group ark-input-wide"><span>Complete address <b>*</b></span><textarea name="addressLine" value={address.addressLine} onChange={onAddressChange} placeholder="House number, street, area, landmark" autoComplete="street-address" rows={2} required /></label>

                <label className="ark-input-group"><span>State <b>*</b></span><select name="state" value={address.state} onChange={onAddressChange}><option>Andhra Pradesh</option><option>Telangana</option><option>Karnataka</option><option>Tamil Nadu</option><option>Maharashtra</option><option>Kerala</option><option>Other</option></select></label>

                <label className="ark-input-group"><span>City <b>*</b></span><input name="city" value={address.city} onChange={onAddressChange} placeholder="Enter your city" autoComplete="address-level2" required /></label>

                <label className="ark-input-group"><span>Pincode <b>*</b></span><input name="pincode" value={address.pincode} onChange={onAddressChange} placeholder="6-digit pincode" inputMode="numeric" autoComplete="postal-code" required /></label>

              </div>

              <label className="ark-preferred"><input type="checkbox" checked={preferredAddress} onChange={(event) => setPreferredAddress(event.target.checked)} /><span>Use this as my preferred address for future orders</span></label>

              <button className="ark-continue-button" type="submit">Continue to Payment <span>→</span></button>

              <p className="ark-privacy-note"><span>♙</span> Your information is protected and secure.</p>

            </form>

          )}

          {step === 2 && (

            <section className="ark-step-panel">

              <div className="ark-form-section-heading"><span className="ark-pin-icon">◇</span><div><h3>Payment Method</h3><p>Choose how you would like to pay.</p></div></div>

              <div className="ark-payment-list">

                {[

                  { label: "UPI", note: "Google Pay, PhonePe, BHIM", detail: "Fast · Secure · Instant", icon: "upi", mark: "UPI", brands: ["GPay", "PhonePe", "BHIM"] },

                  { label: "Credit / Debit Card", note: "Visa, Mastercard, RuPay", detail: "Safe · Convenient · Worldwide", icon: "card", mark: "VISA", brands: ["VISA", "●●", "RuPay"] },

                  { label: "Net Banking", note: "All major Indian banks", detail: "Secure · Reliable · Easy", icon: "bank", mark: "♜", brands: ["SBI", "HDFC", "ICICI"] },

                  { label: "Cash on Delivery", note: "Pay when your order is delivered", detail: "Safe · Hassle Free · Trusted", icon: "cash", mark: "₹", brands: ["ARK", "DELIVERY"] },

                ].map((method) => (

                  <label key={method.label} className={`ark-payment-choice ${paymentMethod === method.label ? "selected" : ""}`}>

                    <input type="radio" name="paymentMethod" value={method.label} checked={paymentMethod === method.label} onChange={(event) => setPaymentMethod(event.target.value)} />

                    <span className={`ark-payment-illustration ark-payment-illustration-${method.icon}`} aria-hidden="true"><b>{method.mark}</b></span>

                    <span className="ark-payment-copy"><strong>{method.label}</strong><small>{method.note}</small><small className="ark-payment-detail">{method.detail}</small></span>

                    <span className={`ark-payment-brands ark-payment-brands-${method.icon}`} aria-hidden="true">{method.brands.map((brand) => <b key={brand}>{brand}</b>)}</span>

                    <span className="ark-payment-arrow" aria-hidden="true">›</span>

                  </label>

                ))}

              </div>

              <div className="ark-action-row"><button className="ark-back-button" type="button" onClick={() => goToStep(1)}>← Back</button><button className="ark-continue-button" type="button" onClick={() => { setError(""); setStep(3); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Review Order →</button></div>

            </section>

          )}

          {step === 3 && (

            <section className="ark-step-panel">

              <div className="ark-form-section-heading"><span className="ark-pin-icon">✓</span><div><h3>Review Your Order</h3><p>Check the delivery and payment details before continuing.</p></div></div>

              <div className="ark-review-box"><div><strong>Delivery details</strong><button type="button" onClick={() => goToStep(1)}>Edit</button></div><p>{address.fullName} · {address.phone}</p><p>{address.addressLine}, {address.city}, {address.state} {address.pincode}</p></div>

              <div className="ark-review-box"><div><strong>Payment method</strong><button type="button" onClick={() => goToStep(2)}>Edit</button></div><p>{paymentMethod}</p></div>

              <div className="ark-action-row"><button className="ark-back-button" type="button" onClick={() => goToStep(2)}>← Back</button><button className="ark-continue-button" type="button" onClick={placeOrder}>Continue to Confirmation →</button></div>

              <p className="ark-privacy-note">Demo flow only: connect your order API and payment gateway before accepting real payments.</p>

            </section>

          )}

        </section>

        <aside className="ark-summary-card">

          <div className="ark-summary-heading"><h2>Order Summary</h2><span>{itemCount} {itemCount === 1 ? "item" : "items"}</span></div>

          <div className="ark-summary-rule" />

          <div className="ark-summary-items">

            {!products.length ? <div className="ark-empty-cart"><p>Your cart is empty.</p><button type="button" onClick={() => navigate("/marbles")}>Explore marble collection →</button></div> : products.map((item, index) => {

              const price = getUnitPrice(item);

              const quantity = getQuantity(item);

              const name = getName(item);

              return <article className="ark-summary-product" key={item.id ?? item.marble_id ?? `${name}-${index}`}>

                <img src={getImage(item)} alt={name} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = "/images/hero-marble.jpg"; }} />

                <div className="ark-summary-product-info"><h3>{name}</h3><p>{getCategory(item)}</p><p>{firstValue(item.finish, item.surface_finish, item.finish_type, "Premium finish")}</p><strong>{price === null ? "Price unavailable" : <>{formatINR(price)} <small>/ {getUnit(item)}</small></>}</strong></div>

                <div className="ark-summary-product-controls"><div className="ark-qty-control"><button type="button" aria-label={`Decrease ${name} quantity`} onClick={() => updateItem(item, quantity - 1)}>−</button><span>{quantity}</span><button type="button" aria-label={`Increase ${name} quantity`} onClick={() => updateItem(item, quantity + 1)}>+</button></div><button className="ark-remove-button" type="button" onClick={() => removeItem(item)} aria-label={`Remove ${name}`}>×</button></div>

                <div className="ark-summary-line-total">{price === null ? "—" : formatINR(price * quantity)}</div>

              </article>;

            })}

          </div>

          <div className="ark-summary-totals">

            <div><span>Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})</span><strong>{formatINR(subtotal)}</strong></div>

            <div><span>Shipping estimate</span><strong>{shipping === 0 ? "Complimentary" : formatINR(shipping)}</strong></div>

            <div><span>GST estimate (18%)</span><strong>{formatINR(gst)}</strong></div>

            <div className="ark-total-row"><span>Total payable</span><strong>{formatINR(total)}</strong></div>

            {hasMissingPrice && <p className="ark-price-warning">A cart item is missing its price. Remove it and add it again from the product page.</p>}

          </div>

          <div className="ark-summary-assurances">

            <div><span>◇</span><strong>Secure Checkout</strong><small>Your data is protected</small></div>

            <div><span>♧</span><strong>Insured Delivery</strong><small>Safe and reliable</small></div>

            <div><span>✧</span><strong>Premium Marble</strong><small>Direct from source</small></div>

          </div>

        </aside>

      </main>

    </div>

  );

}
