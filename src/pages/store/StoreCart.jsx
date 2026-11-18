import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Heart,
  LockKeyhole,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  ShieldCheck,
  Truck,
  PackageCheck,
  Info,
  X,
} from "lucide-react";

import { useCartContext } from "../../context/CartContext";
import "./StoreCart.css";

const formatPrice = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

function getUnit(item) {
  const unit =
    item.unit_label ||
    item.unit ||
    item.unit_type ||
    item.measurement_unit ||
    item.price_unit ||
    item.selling_unit;

  if (unit) return String(unit).replace(/^\/+|\/+$/g, "").trim();

  const text = `${item.name || ""} ${item.category || ""}`.toLowerCase();
  if (/cement|putty|adhesive|grout/.test(text)) return "Bag";
  if (/brick|block|paver|tool|fitting|sanitary/.test(text)) return "Piece";
  if (/marble|granite|stone|tile|slab/.test(text)) return "Sq. ft.";
  return "Unit";
}

function getItemPrice(item) {
  return Number(
    item.price_per_sqft ??
      item.price_per_unit ??
      item.selling_price ??
      item.price ??
      item.unit_price ??
      item.amount ??
      0
  ) || 0;
}

function QuantityControl({ item, updateQuantity }) {
  const [value, setValue] = useState(String(item.quantity));

  useEffect(() => {
    setValue(String(item.quantity));
  }, [item.quantity]);

  const commit = (nextValue = value) => {
    const safe = Math.max(1, Math.floor(Number(nextValue) || 1));
    setValue(String(safe));
    updateQuantity(item.id, safe);
  };

  return (
    <div className="ark-quantity" aria-label={`Quantity for ${item.name}`}>
      <button
        type="button"
        aria-label="Decrease quantity"
        disabled={item.quantity <= 1}
        onClick={() => commit(item.quantity - 1)}
      >
        <Minus size={14} />
      </button>

      <input
        type="number"
        min="1"
        step="1"
        value={value}
        aria-label={`Quantity for ${item.name}`}
        onChange={(event) => {
          if (event.target.value === "" || /^\d+$/.test(event.target.value)) {
            setValue(event.target.value);
          }
        }}
        onBlur={() => commit()}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            commit();
            event.currentTarget.blur();
          }
        }}
      />

      <button
        type="button"
        aria-label="Increase quantity"
        onClick={() => commit(item.quantity + 1)}
      >
        <Plus size={14} />
      </button>
    </div>
  );
}

export default function StoreCart() {
  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = useState([]);
  const [favorites, setFavorites] = useState([]);

  const {
    items = [],
    updateQuantity,
    removeFromCart,
  } = useCartContext();

  const products = useMemo(
    () =>
      items.map((item) => {
        const id = item.id ?? item.marble_id ?? item.product_id;
        const quantity = Math.max(
          1,
          Math.floor(Number(item.quantity ?? item.qty) || 1)
        );
        const price = getItemPrice(item);

        return {
          ...item,
          id,
          name: item.name || item.title || "Premium Product",
          image:
            item.image_url ||
            item.image ||
            item.thumbnail ||
            item.main_image ||
            "",
          quantity,
          price,
          unit: getUnit(item),
          lineTotal: price * quantity,
        };
      }),
    [items]
  );

  const productCount = products.length;
  const totalQuantity = products.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = products.reduce((sum, item) => sum + item.lineTotal, 0);

  // Keep GST at zero here unless tax is calculated in your checkout flow.
  const gstRate = 0;
  const gst = subtotal * gstRate;
  const grandTotal = subtotal + gst;

  const allSelected =
    productCount > 0 &&
    products.every((item) => selectedIds.includes(String(item.id)));

  useEffect(() => {
    const validIds = products.map((item) => String(item.id));
    setSelectedIds((old) => old.filter((id) => validIds.includes(id)));
  }, [products]);

  const toggleSelect = (id) => {
    const key = String(id);
    setSelectedIds((old) =>
      old.includes(key)
        ? old.filter((value) => value !== key)
        : [...old, key]
    );
  };

  const toggleAll = () => {
    setSelectedIds(
      allSelected ? [] : products.map((item) => String(item.id))
    );
  };

  const removeSelected = () => {
    products
      .filter((item) => selectedIds.includes(String(item.id)))
      .forEach((item) => removeFromCart(item.id));
    setSelectedIds([]);
  };

  const saveSelected = () => {
    const ids = products
      .filter((item) => selectedIds.includes(String(item.id)))
      .map((item) => item.id);

    setFavorites((old) => [...new Set([...old, ...ids])]);
  };

  const toggleFavorite = (id) => {
    setFavorites((old) =>
      old.includes(id)
        ? old.filter((value) => value !== id)
        : [...old, id]
    );
  };

  const clearCart = () => {
    products.forEach((item) => removeFromCart(item.id));
    setSelectedIds([]);
  };

  if (!productCount) {
    return (
      <main className="ark-cart-page">
        <div className="ark-cart-container">
          <div className="ark-cart-empty">
            <ShoppingBag size={46} />
            <span>ARK MARBLES</span>
            <h1>Your Cart is Empty</h1>
            <p>
              Discover beautiful natural stones and premium construction
              materials for your next project.
            </p>
            <Link to="/marbles" className="ark-gold-button">
              Explore Collection <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="ark-cart-page">
      <div className="ark-cart-container">
        <section className="ark-cart-heading">
          <div>
            <span className="ark-cart-eyebrow">
              ARK MARBLES / YOUR SELECTION
            </span>
            <h1>Shopping Cart</h1>
            <p>
              {totalQuantity} {totalQuantity === 1 ? "item" : "items"} in your
              cart · {productCount} {productCount === 1 ? "product" : "products"}
            </p>
          </div>

          <Link to="/marbles" className="ark-back-link">
            <ArrowLeft size={15} />
            Continue Shopping
          </Link>
        </section>

        <div className="ark-cart-layout">
          <section className="ark-cart-left">
            <div className="ark-cart-list-heading">
              <div>
                <span className="ark-cart-section-kicker">YOUR SELECTION</span>
                <h2>Selected Products</h2>
              </div>
              <span className="ark-cart-product-count">
                {productCount} PRODUCTS
              </span>
            </div>

            <div className="ark-cart-products">
              {products.map((item) => {
                const id = item.id;
                const selected = selectedIds.includes(String(id));
                const favorite = favorites.includes(id);

                return (
                  <article className="ark-product-row" key={String(id)}>
                    <button
                      type="button"
                      className={`ark-product-select ${selected ? "is-selected" : ""}`}
                      aria-label={`Select ${item.name}`}
                      aria-pressed={selected}
                      onClick={() => toggleSelect(id)}
                    >
                      {selected && <Check size={14} />}
                    </button>

                    <Link
                      to={`/marbles/${id}`}
                      className="ark-product-image"
                      aria-label={`View ${item.name}`}
                    >
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          onError={(event) => {
                            event.currentTarget.onerror = null;
                            event.currentTarget.src = "/images/hero-marble.jpg";
                          }}
                        />
                      ) : (
                        <PackageCheck size={35} />
                      )}
                    </Link>

                    <div className="ark-product-details">
                      <span className="ark-product-category">
                        {item.category || "ARK MARBLES"}
                      </span>

                      <Link to={`/marbles/${id}`} className="ark-product-name">
                        {item.name}
                      </Link>

                      <p className="ark-product-description">
                        {item.finish || item.material_type || "Premium quality"}
                        {item.thickness ? ` · ${item.thickness}` : ""}
                      </p>

                      {(item.rating || item.review_count) && (
                        <div className="ark-product-rating">
                          <strong>{item.rating || "4.8"} ★</strong>
                          <span>
                            {item.review_count
                              ? `${item.review_count} reviews`
                              : "Customer rated"}
                          </span>
                        </div>
                      )}

                      <div className="ark-product-price-mobile">
                        <strong>{formatPrice(item.price)}</strong>
                        <span>/ {item.unit}</span>
                      </div>

                      <div className="ark-product-stock">
                        <i />
                        Available for enquiry
                      </div>
                    </div>

                    <div className="ark-product-unit-price">
                      <span className="ark-product-field-label">UNIT PRICE</span>
                      <strong>{formatPrice(item.price)}</strong>
                      <small>/ {item.unit}</small>
                    </div>

                    <div className="ark-product-quantity">
                      <span className="ark-product-field-label">QUANTITY</span>
                      <QuantityControl
                        item={item}
                        updateQuantity={updateQuantity}
                      />
                    </div>

                    <div className="ark-product-total">
                      <span className="ark-product-field-label">ITEM TOTAL</span>
                      <strong>{formatPrice(item.lineTotal)}</strong>
                    </div>

                    <div className="ark-product-remove-top">
                      <button
                        type="button"
                        aria-label={`Remove ${item.name}`}
                        onClick={() => removeFromCart(id)}
                      >
                        <X size={17} />
                      </button>
                    </div>

                    <div className="ark-product-delivery">
                      <div className="ark-delivery-heading">
                        <Info size={15} />
                        <span>Delivery details will be confirmed at checkout</span>
                      </div>
                      <div className="ark-delivery-option">
                        <Truck size={18} />
                        <span>
                          Delivery estimate
                          <strong>To be confirmed</strong>
                        </span>
                      </div>
                      <div className="ark-delivery-option">
                        <PackageCheck size={18} />
                        <span>
                          Material availability
                          <strong>Available for enquiry</strong>
                        </span>
                      </div>
                    </div>

                    <div className="ark-product-bottom-actions">
                      <button
                        type="button"
                        onClick={() => removeFromCart(id)}
                      >
                        <Trash2 size={16} />
                        Remove
                      </button>

                      <button
                        type="button"
                        className={favorite ? "is-favorite" : ""}
                        aria-pressed={favorite}
                        onClick={() => toggleFavorite(id)}
                      >
                        <Heart
                          size={16}
                          fill={favorite ? "currentColor" : "none"}
                        />
                        {favorite ? "Saved to Wishlist" : "Move to Wishlist"}
                      </button>

                      <button
                        type="button"
                        className="ark-product-buy-now"
                        onClick={() => navigate("/checkout")}
                      >
                        Buy Now <ArrowRight size={15} />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="ark-cart-bulk-actions">
              <button type="button" className="ark-select-all" onClick={toggleAll}>
                <span className={allSelected ? "checked" : ""}>
                  {allSelected && <Check size={13} />}
                </span>
                Select All ({productCount})
              </button>

              <div className="ark-bulk-right">
                <button
                  type="button"
                  disabled={!selectedIds.length}
                  onClick={saveSelected}
                >
                  <Heart size={16} />
                  Move to Wishlist
                </button>
                <button
                  type="button"
                  disabled={!selectedIds.length}
                  onClick={removeSelected}
                >
                  <Trash2 size={16} />
                  Remove Selected
                </button>
              </div>
            </div>

            <div className="ark-cart-delivery-footnote">
              <Info size={15} />
              Shipping and delivery charges are confirmed after order details.
            </div>
          </section>

          <aside className="ark-order-summary">
            <div className="ark-summary-inner">
              <div className="ark-summary-heading">
                <div className="ark-summary-icon">
                  <ShoppingBag size={25} />
                </div>
                <div>
                  <span className="ark-summary-eyebrow">
                    ARK MARBLES · CHECKOUT
                  </span>
                  <h2>Order Summary</h2>
                </div>
              </div>

              <div className="ark-summary-product-count">
                <span>Products in your cart</span>
                <strong>{productCount}</strong>
              </div>

              <div className="ark-summary-rows">
                <div className="ark-summary-row">
                  <span>Subtotal ({totalQuantity} units)</span>
                  <strong>{formatPrice(subtotal)}</strong>
                </div>

                {gst > 0 && (
                  <div className="ark-summary-row">
                    <span>GST ({gstRate * 100}%)</span>
                    <strong>{formatPrice(gst)}</strong>
                  </div>
                )}

                <div className="ark-summary-row">
                  <span>Shipping estimate</span>
                  <strong className="ark-summary-pending">
                    To be confirmed
                  </strong>
                </div>
              </div>

              <div className="ark-summary-total">
                <span>Estimated Total</span>
                <strong>{formatPrice(grandTotal)}</strong>
              </div>

              <p className="ark-summary-note">
                Delivery charges and applicable taxes will be confirmed with
                your order details.
              </p>

              <button
                type="button"
                className="ark-summary-checkout"
                onClick={() => navigate("/checkout")}
              >
                <LockKeyhole size={17} />
                <span>Proceed to Checkout</span>
                <ArrowRight size={19} />
              </button>

              <div className="ark-summary-secure">
                <ShieldCheck size={16} />
                Secure Checkout · Personal Assistance
              </div>

              <div className="ark-summary-benefits">
                <div>
                  <Truck size={25} />
                  <span>Pan India<br />Delivery</span>
                </div>
                <div>
                  <ShieldCheck size={25} />
                  <span>Quality<br />Assurance</span>
                </div>
                <div>
                  <Heart size={24} />
                  <span>Expert<br />Support</span>
                </div>
              </div>

              <div className="ark-summary-footer">
                <span>ARK MARBLES</span>
                <small>BUILD BETTER. LIVE LUXURIOUS.</small>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
