
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Gem,
  Heart,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Truck,
  Headset,
  PackageCheck,
} from "lucide-react";
import { useCartContext } from "../../context/CartContext";
import "./Cart.css";

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const productId = (item) =>
  String(item.id ?? item.marble_id ?? item.product_id ?? "");

const productName = (item) =>
  item.name ?? item.title ?? item.product_name ?? "Marble Product";

const productCategory = (item) =>
  item.category ?? item.material ?? "Natural Stone";

const productPrice = (item) => {
  const value =
    item.price_per_unit ??
    item.selling_price ??
    item.price_per_sqft ??
    item.price ??
    item.unit_price ??
    item.amount ??
    0;

  const price = Number(value);
  return Number.isFinite(price) && price >= 0 ? price : 0;
};

const productImage = (item) =>
  item.image_url ??
  item.image ??
  item.thumbnail ??
  item.main_image ??
  item.cover_image ??
  (Array.isArray(item.images) ? item.images[0] : item.images) ??
  "";

const productUnit = (item) =>
  item.unit ?? item.sold_by ?? item.unit_label ?? "sq. ft.";

export default function Cart() {
  const cart = useCartContext();
  const navigate = useNavigate();

  const items = cart.items ?? cart.cartItems ?? [];
  const updateQuantity = cart.updateQuantity;
  const removeFromCart = cart.removeFromCart;
  const clearCart = cart.clearCart;

  const itemCount = items.reduce(
    (total, item) =>
      total + Math.max(0, Number(item.quantity ?? item.qty ?? 1) || 0),
    0
  );

  const subtotal = items.reduce(
    (total, item) =>
      total +
      productPrice(item) *
        Math.max(0, Number(item.quantity ?? item.qty ?? 1) || 0),
    0
  );

  const handleCheckout = () => {
    if (items.length) navigate("/checkout");
  };

  if (!items.length) {
    return (
      <main className="ark-cart-page">
        <div className="ark-cart-container">
          <div className="ark-cart-breadcrumbs">
            <Link to="/"><ArrowLeft size={15} /> Home</Link>
            <span>/</span>
            <span>Shopping Cart</span>
          </div>

          <section className="ark-cart-empty">
            <div className="ark-cart-empty-icon">
              <ShoppingBag size={34} />
            </div>
            <p className="ark-cart-eyebrow">ARK MARBLES / YOUR SELECTION</p>
            <h1>Your cart is waiting.</h1>
            <p>
              Discover exceptional marble and natural stone selected for
              beautiful spaces.
            </p>
            <Link
              to="/marbles"
              className="ark-cart-button ark-cart-button-primary"
            >
              Explore Collection <ArrowRight size={17} />
            </Link>
            <div className="ark-cart-empty-benefits">
              <span><Gem size={17} /> Premium materials</span>
              <span><ShieldCheck size={17} /> Secure checkout</span>
              <span><Truck size={17} /> Delivery assistance</span>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="ark-cart-page">
      <div className="ark-cart-container">
        <div className="ark-cart-breadcrumbs">
          <Link to="/"><ArrowLeft size={15} /> Home</Link>
          <span>/</span>
          <span>Shopping Cart</span>
        </div>

        <header className="ark-cart-heading">
          <div>
            <p className="ark-cart-eyebrow">YOUR SELECTION / ARK MARBLES</p>
            <h1>
              Shopping <em>Cart.</em>
            </h1>
            <p className="ark-cart-muted">
              Review your selected materials before proceeding to checkout.
            </p>
          </div>

          <Link to="/marbles" className="ark-cart-continue-top">
            <ArrowLeft size={16} /> Continue shopping
          </Link>
        </header>

        <div className="ark-cart-service-strip">
          <div>
            <span className="ark-cart-service-icon"><Gem size={21} /></span>
            <span><strong>Premium Quality</strong><small>Carefully selected stone</small></span>
          </div>
          <div>
            <span className="ark-cart-service-icon"><Truck size={21} /></span>
            <span><strong>Delivery Assistance</strong><small>Support for your order</small></span>
          </div>
          <div>
            <span className="ark-cart-service-icon"><ShieldCheck size={21} /></span>
            <span><strong>Secure Checkout</strong><small>Reliable order process</small></span>
          </div>
          <div>
            <span className="ark-cart-service-icon"><Headset size={21} /></span>
            <span><strong>Dedicated Support</strong><small>Help when you need it</small></span>
          </div>
        </div>

        <div className="ark-cart-layout">
          <section className="ark-cart-items">
            <div className="ark-cart-section-heading">
              <div>
                <span className="ark-cart-section-kicker">YOUR ORDER</span>
                <h2>Selected Materials</h2>
              </div>
              <span className="ark-cart-product-count">
                {items.length} {items.length === 1 ? "product" : "products"}
              </span>
            </div>

            <div className="ark-cart-product-list">
              {items.map((item, index) => {
                const id = productId(item);
                const name = productName(item);
                const image = productImage(item);
                const quantity = Math.max(
                  1,
                  Number(item.quantity ?? item.qty ?? 1) || 1
                );
                const price = productPrice(item);
                const unit = productUnit(item);
                const total = price * quantity;

                return (
                  <article
                    className="ark-cart-item"
                    key={id || `${name}-${index}`}
                  >
                    <div className="ark-cart-item-image">
                      {image ? (
                        <img
                          src={image}
                          alt={name}
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                            event.currentTarget.parentElement
                              ?.querySelector(".ark-cart-image-fallback")
                              ?.classList.remove("is-hidden");
                          }}
                        />
                      ) : null}
                      <div
                        className={`ark-cart-image-fallback ${
                          image ? "is-hidden" : ""
                        }`}
                      >
                        <Gem size={31} />
                        <span>ARK MARBLES</span>
                      </div>
                    </div>

                    <div className="ark-cart-item-main">
                      <div className="ark-cart-item-title-row">
                        <div>
                          <span className="ark-cart-item-category">
                            {productCategory(item)}
                          </span>
                          <h3>{name}</h3>
                        </div>

                        <div className="ark-cart-item-actions">
                          <button
                            type="button"
                            className="ark-cart-icon-button"
                            aria-label={`Wishlist ${name}`}
                            title="Wishlist"
                            onClick={() =>
                              window.alert(
                                "Connect this button to your wishlist feature."
                              )
                            }
                          >
                            <Heart size={18} />
                          </button>
                          <button
                            type="button"
                            className="ark-cart-icon-button ark-cart-delete"
                            aria-label={`Remove ${name}`}
                            title="Remove item"
                            onClick={() => removeFromCart?.(id)}
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </div>

                      <p className="ark-cart-item-description">
                        {item.description ??
                          item.short_description ??
                          "A distinctive natural stone selected for timeless elegance."}
                      </p>

                      <div className="ark-cart-specs">
                        <div>
                          <span>Finish</span>
                          <strong>{item.finish ?? item.surface_finish ?? "Polished"}</strong>
                        </div>
                        <div>
                          <span>Thickness</span>
                          <strong>{item.thickness ?? "18 mm"}</strong>
                        </div>
                        <div>
                          <span>Origin</span>
                          <strong>{item.origin ?? "Natural Stone"}</strong>
                        </div>
                        <div>
                          <span>Unit</span>
                          <strong>{unit}</strong>
                        </div>
                      </div>

                      <div className="ark-cart-item-bottom">
                        <div className="ark-cart-unit-price">
                          <strong>{money(price)}</strong>
                          <span>/ {unit}</span>
                        </div>

                        <div className="ark-cart-quantity-block">
                          <span>Quantity</span>
                          <div className="ark-cart-quantity">
                            <button
                              type="button"
                              aria-label={`Decrease ${name} quantity`}
                              disabled={quantity <= 1}
                              onClick={() =>
                                updateQuantity?.(id, quantity - 1)
                              }
                            >
                              <Minus size={14} />
                            </button>
                            <span>{quantity}</span>
                            <button
                              type="button"
                              aria-label={`Increase ${name} quantity`}
                              onClick={() =>
                                updateQuantity?.(id, quantity + 1)
                              }
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>

                        <div className="ark-cart-line-total">
                          <span>Item total</span>
                          <strong>{money(total)}</strong>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="ark-cart-list-footer">
              <button
                type="button"
                className="ark-cart-clear"
                onClick={() => {
                  if (window.confirm("Remove all products from your cart?")) {
                    clearCart?.();
                  }
                }}
              >
                <Trash2 size={16} /> Clear cart
              </button>

              <Link to="/marbles" className="ark-cart-continue-bottom">
                <ArrowLeft size={16} /> Continue shopping
              </Link>
            </div>
          </section>

          <aside className="ark-cart-sidebar">
            <section className="ark-cart-summary">
              <p className="ark-cart-eyebrow">ARK MARBLES / CHECKOUT</p>
              <h2>Order Summary</h2>

              <div className="ark-cart-summary-row">
                <span>Subtotal ({itemCount} items)</span>
                <strong>{money(subtotal)}</strong>
              </div>

              <div className="ark-cart-summary-row">
                <span>Shipping charges</span>
                <span className="ark-cart-calculated">At checkout</span>
              </div>

              <div className="ark-cart-summary-row">
                <span>Tax (GST)</span>
                <span className="ark-cart-calculated">At checkout</span>
              </div>

              <div className="ark-cart-summary-divider" />

              <div className="ark-cart-summary-total">
                <span>Estimated total</span>
                <strong>{money(subtotal)}</strong>
              </div>

              <p className="ark-cart-summary-disclaimer">
                Shipping and applicable taxes are confirmed during checkout.
              </p>

              <button
                type="button"
                onClick={handleCheckout}
                className="ark-cart-button ark-cart-button-primary ark-cart-checkout"
              >
                Proceed to Checkout <ArrowRight size={18} />
              </button>

              <p className="ark-cart-secure-note">
                <ShieldCheck size={16} />
                Secure checkout · Safe and reliable
              </p>
            </section>

            <section className="ark-cart-promo">
              <h3><PackageCheck size={19} /> Made for your space</h3>
              <p>
                Need help choosing a finish or quantity? Our team can help
                with product and delivery enquiries.
              </p>
              <Link to="/contact">
                Contact our team <ArrowRight size={15} />
              </Link>
            </section>

            <section className="ark-cart-why">
              <h3>Why ARK MARBLES?</h3>
              <div>
                <span><Gem size={19} /></span>
                <p><strong>Premium materials</strong><small>Selected natural stone</small></p>
              </div>
              <div>
                <span><Truck size={19} /></span>
                <p><strong>Delivery assistance</strong><small>Help with order arrangements</small></p>
              </div>
              <div>
                <span><ShieldCheck size={19} /></span>
                <p><strong>Secure checkout</strong><small>A clear checkout process</small></p>
              </div>
            </section>
          </aside>
        </div>

        <footer className="ark-cart-footer-note">
          <Check size={15} /> Exceptional materials for extraordinary spaces.
        </footer>
      </div>
    </main>
  );
}
