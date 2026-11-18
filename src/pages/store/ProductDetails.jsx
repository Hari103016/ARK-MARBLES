
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Heart, ShoppingBag, ShieldCheck } from "lucide-react";

import { getMarbleById } from "../../services/marbleService";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import "././ProductDetails.css";

export default function ProductDetails() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [marble, setMarble] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProduct() {
      setLoading(true);
      setError("");
      setMessage("");
      setMarble(null);
      setQuantity(1);

      try {
        const product = await getMarbleById(id);

        if (active) {
          setMarble(product);
        }
      } catch (err) {
        if (active) {
          setError(err.message || "Unable to load this product.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProduct();

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return <div className="product-details-message">Loading product...</div>;
  }

  if (error || !marble) {
    return (
      <div className="product-details-message">
        <h2>Product unavailable</h2>
        <p>{error || "This marble could not be found."}</p>
        <Link to="/products">Back to collection</Link>
      </div>
    );
  }

  const price = Number(marble.price_per_sqft ?? marble.price ?? 0);
  const stock = Number(marble.stock_quantity ?? marble.stock ?? 0);
  const available =
    marble.is_available !== false &&
    marble.status !== "sold_out" &&
    stock > 0;

  const wishlisted = isInWishlist(marble.id);

  function handleAddToCart() {
    if (!available || quantity > stock) {
      setMessage("The requested quantity is not available.");
      return;
    }

    try {
      addToCart(marble, quantity);
      setMessage("Added to your cart.");
    } catch (err) {
      setMessage(err.message || "Unable to add this product to your cart.");
    }
  }

  function handleWishlist() {
    try {
      toggleWishlist(marble);
      setMessage(
        wishlisted ? "Removed from wishlist." : "Added to wishlist."
      );
    } catch (err) {
      setMessage(err.message || "Unable to update wishlist.");
    }
  }

  return (
    <main className="product-details-page">
      <div className="product-details-container">
        <Link to="/products" className="product-details-back">
          <ArrowLeft size={17} />
          Back to collection
        </Link>

        <div className="product-details-layout">
          <div className="product-details-image">
            <img
              src={marble.image_url || "/images/hero-marble.jpg"}
              alt={marble.name}
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = "/images/hero-marble.jpg";
              }}
            />

            {marble.category && (
              <span className="product-details-category">
                {marble.category}
              </span>
            )}
          </div>

          <section className="product-details-info">
            <span className="product-details-eyebrow">
              ARK MARBLES COLLECTION
            </span>

            <h1>{marble.name}</h1>

            <p className="product-details-description">
              {marble.description ||
                "Explore this natural stone for your next project."}
            </p>

            <div className="product-details-price">
              <strong>
                {new Intl.NumberFormat("en-IN", {
                  style: "currency",
                  currency: "INR",
                  maximumFractionDigits: 2,
                }).format(price)}
              </strong>
              <span>per sq. ft.</span>
            </div>

            <div className="product-details-stock">
              <span
                className={
                  available
                    ? "product-stock-dot is-available"
                    : "product-stock-dot is-unavailable"
                }
              />
              {available ? "Available" : "Currently unavailable"}
            </div>

            <div className="product-details-specifications">
              {marble.color && (
                <div>
                  <span>Color</span>
                  <strong>{marble.color}</strong>
                </div>
              )}

              {marble.finish && (
                <div>
                  <span>Finish</span>
                  <strong>{marble.finish}</strong>
                </div>
              )}

              {marble.thickness && (
                <div>
                  <span>Thickness</span>
                  <strong>{marble.thickness}</strong>
                </div>
              )}
            </div>

            <div className="product-details-quantity">
              <label htmlFor="marble-quantity">Quantity</label>

              <div className="product-quantity-control">
                <button
                  type="button"
                  disabled={quantity <= 1}
                  onClick={() => setQuantity((value) => value - 1)}
                  aria-label="Decrease quantity"
                >
                  −
                </button>

                <input
                  id="marble-quantity"
                  type="number"
                  min="1"
                  max={stock || 1}
                  step="1"
                  value={quantity}
                  onChange={(event) => {
                    const next = Number(event.target.value);

                    if (Number.isSafeInteger(next) && next >= 1) {
                      setQuantity(Math.min(next, stock || 1));
                    }
                  }}
                />

                <button
                  type="button"
                  disabled={!available || quantity >= stock}
                  onClick={() =>
                    setQuantity((value) => Math.min(value + 1, stock))
                  }
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            </div>

            <div className="product-details-actions">
              <button
                type="button"
                className="product-add-cart"
                onClick={handleAddToCart}
                disabled={!available || quantity > stock}
              >
                <ShoppingBag size={18} />
                Add to Cart
              </button>

              <button
                type="button"
                className="product-wishlist-button"
                onClick={handleWishlist}
                aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
              >
                <Heart
                  size={19}
                  fill={wishlisted ? "currentColor" : "none"}
                />
              </button>
            </div>

            {message && (
              <p className="product-details-feedback" role="status">
                {message}
              </p>
            )}

            <div className="product-details-assurance">
              <ShieldCheck size={19} />
              <span>Contact our team for project quantities and quotations.</span>
            </div>

            <Link to="/quotations" className="product-quote-link">
              Request a project quotation →
            </Link>
          </section>
        </div>
      </div>
    </main>
  );
}
