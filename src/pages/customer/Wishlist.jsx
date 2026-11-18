
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Heart,
  ShoppingCart,
  Trash2,
  Gem,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  Package,
  RefreshCw,
} from "lucide-react";

import { supabase } from "../../lib/supabase";
import { useWishlistContext } from "../../context/WishlistContext.jsx";
import { useCartContext } from "../../context/CartContext.jsx";
import "./Wishlist.css";

function getId(product) {
  return product?.id ?? product?.product_id ?? product?.marble_id ?? null;
}

function getName(product) {
  return product?.name || product?.title || product?.product_name || "Marble";
}

function getImage(product) {
  return (
    product?.image_url ||
    product?.image ||
    product?.thumbnail ||
    (Array.isArray(product?.images) ? product.images[0] : "") ||
    ""
  );
}

function getPrice(product) {
  const value = Number(
    product?.price_per_sqft ??
      product?.price ??
      product?.sale_price ??
      product?.amount ??
      0
  );

  return Number.isFinite(value) && value >= 0 ? value : 0;
}

function formatPrice(price) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(price);
}

function getAvailability(product) {
  const status = String(product?.status || "").trim().toLowerCase();

  if (
    product?.is_available === false ||
    ["sold", "unavailable", "out_of_stock", "out of stock", "inactive"].includes(status)
  ) {
    return { available: false, label: "Unavailable" };
  }

  const stockValue =
    product?.stock_quantity != null
      ? product.stock_quantity
      : product?.stock;

  if (stockValue != null) {
    const stock = Number(stockValue);

    if (!Number.isFinite(stock) || stock <= 0) {
      return { available: false, label: "Out of stock" };
    }
  }

  return { available: true, label: "Available" };
}

export default function Wishlist() {
  const {
    items = [],
    removeFromWishlist,
    clearWishlist,
  } = useWishlistContext();

  const { addToCart } = useCartContext();

  const [liveProducts, setLiveProducts] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [message, setMessage] = useState(null);
  const [addingId, setAddingId] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const refreshProducts = useCallback(async () => {
    if (items.length === 0) {
      setLiveProducts({});
      setLoadError("");
      setRefreshing(false);
      return;
    }

    const ids = [
      ...new Set(
        items
          .map(getId)
          .filter((id) => id != null)
          .map(String)
      ),
    ];

    if (ids.length === 0) {
      setLoadError("Saved products have no valid product IDs.");
      return;
    }

    setRefreshing(true);
    setLoadError("");

    try {
      // The IDs in the current project are from public.marbles.
      // Fetch the current product records instead of trusting stale
      // price, image, and stock values stored in localStorage.
      const { data, error } = await supabase
        .from("marbles")
        .select("*")
        .in("id", ids);

      if (error) throw error;

      const productMap = {};

      for (const product of data || []) {
        productMap[String(product.id)] = product;
      }

      setLiveProducts(productMap);

      const missingIds = ids.filter((id) => !productMap[id]);

      if (missingIds.length > 0) {
        setLoadError(
          "Some saved products could not be found in the current marble catalogue. Remove unavailable entries or check their product IDs."
        );
      }
    } catch (error) {
      console.error("Unable to refresh wishlist products:", error);
      setLoadError(
        "Current product information could not be loaded. Cart actions are disabled until stock can be verified."
      );
    } finally {
      setRefreshing(false);
    }
  }, [items]);

  useEffect(() => {
    refreshProducts();
  }, [refreshProducts]);

  const displayItems = useMemo(
    () =>
      items.map((saved) => {
        const id = getId(saved);
        const live = id == null ? null : liveProducts[String(id)];

        // The live database row takes precedence over saved values.
        // This prevents stale localStorage stock and price from
        // overriding current Supabase values.
        return {
          ...saved,
          ...(live || {}),
          id: id ?? live?.id,
          _databaseProductFound: Boolean(live),
        };
      }),
    [items, liveProducts]
  );

  function showMessage(type, text) {
    setMessage({ type, text });
  }

  function handleRemove(product) {
    const id = getId(product);

    if (id == null) {
      showMessage("error", "Unable to identify this product.");
      return;
    }

    removeFromWishlist(id);
    showMessage("success", `${getName(product)} removed from your wishlist.`);
  }

  async function handleAddToCart(product) {
    const id = getId(product);

    if (id == null) {
      showMessage("error", "Unable to identify this product.");
      return;
    }

    if (!product._databaseProductFound) {
      showMessage("error", "Refresh product details before adding this item to the cart.");
      await refreshProducts();
      return;
    }

    // Re-read the selected product before adding it. This reduces
    // the chance of acting on stock data that changed since page load.
    setAddingId(String(id));
    setMessage(null);

    try {
      const { data: currentProduct, error } = await supabase
        .from("marbles")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;

      if (!currentProduct) {
        showMessage("error", "This product is no longer in the catalogue.");
        await refreshProducts();
        return;
      }

      const availability = getAvailability(currentProduct);

      if (!availability.available) {
        showMessage("error", "This marble is currently out of stock or unavailable.");
        await refreshProducts();
        return;
      }

      addToCart(currentProduct, 1);
      showMessage("success", `${getName(currentProduct)} added to your cart.`);
      await refreshProducts();
    } catch (error) {
      console.error("Unable to add wishlist product to cart:", error);
      showMessage(
        "error",
        error.message || "Unable to verify this product. Please try again."
      );
    } finally {
      setAddingId(null);
    }
  }

  function handleClearWishlist() {
    clearWishlist();
    setShowClearConfirm(false);
    showMessage("success", "Your wishlist has been cleared.");
  }

  return (
    <main className="wishlist-page">
      <div className="wishlist-container">
        <header className="wishlist-topbar">
          <Link to="/" className="wishlist-back-link">
            <ArrowLeft size={17} />
            <span>Continue Shopping</span>
          </Link>

          <Link to="/" className="wishlist-brand" aria-label="ARK MARBLES home">
            <span className="wishlist-brand-icon">
              <Gem size={21} />
            </span>
            <span>ARK MARBLES</span>
          </Link>
        </header>

        <section className="wishlist-heading">
          <div>
            <span className="wishlist-eyebrow">YOUR PERSONAL COLLECTION</span>
            <h1>My Wishlist</h1>
            <p>
              Keep your favourite marble designs together and find them
              whenever you need them.
            </p>
          </div>

          <div className="wishlist-heading-actions">
            <div className="wishlist-count">
              <Heart size={19} />
              <span>
                {items.length} {items.length === 1 ? "item" : "items"} saved
              </span>
            </div>

            {items.length > 0 && (
              <button
                type="button"
                className="wishlist-refresh-button"
                onClick={refreshProducts}
                disabled={refreshing}
              >
                <RefreshCw
                  size={15}
                  className={refreshing ? "wishlist-spinning" : ""}
                />
                {refreshing ? "Refreshing..." : "Refresh products"}
              </button>
            )}
          </div>
        </section>

        {message && (
          <div
            className={`wishlist-message ${
              message.type === "success" ? "is-success" : "is-error"
            }`}
            role={message.type === "error" ? "alert" : "status"}
          >
            {message.type === "success" ? (
              <CheckCircle2 size={18} />
            ) : (
              <AlertCircle size={18} />
            )}

            <span>{message.text}</span>

            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={() => setMessage(null)}
            >
              ×
            </button>
          </div>
        )}

        {loadError && (
          <div className="wishlist-load-warning" role="status">
            <AlertCircle size={18} />
            <span>{loadError}</span>
            <button type="button" onClick={refreshProducts} disabled={refreshing}>
              Retry
            </button>
          </div>
        )}

        {items.length === 0 ? (
          <section className="wishlist-empty">
            <div className="wishlist-empty-icon">
              <Heart size={35} />
            </div>

            <span className="wishlist-eyebrow">NOTHING SAVED YET</span>
            <h2>Your wishlist is waiting</h2>
            <p>
              Explore our marble collection and save the designs you love.
              They will appear here for easy access.
            </p>

            <Link to="/marbles" className="wishlist-primary-button">
              Explore Marbles
              <ArrowUpRight size={17} />
            </Link>
          </section>
        ) : (
          <>
            <div className="wishlist-toolbar">
              <span>Saved designs</span>

              <button
                type="button"
                className="wishlist-clear-button"
                onClick={() => setShowClearConfirm(true)}
              >
                <Trash2 size={15} />
                Clear Wishlist
              </button>
            </div>

            {refreshing && Object.keys(liveProducts).length === 0 && (
              <div className="wishlist-loading">
                <RefreshCw size={20} className="wishlist-spinning" />
                <span>Checking current product details...</span>
              </div>
            )}

            <section className="wishlist-grid">
              {displayItems.map((product, index) => {
                const id = getId(product) ?? index;
                const name = getName(product);
                const image = getImage(product);
                const price = getPrice(product);
                const availability = getAvailability(product);
                const isAdding = addingId === String(id);
                const verified = product._databaseProductFound;

                return (
                  <article className="wishlist-card" key={String(id)}>
                    <Link
                      to={`/marbles/${encodeURIComponent(String(id))}`}
                      className="wishlist-card-image"
                      aria-label={`View ${name} details`}
                    >
                      {image ? (
                        <img
                          src={image}
                          alt={name}
                          loading="lazy"
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                            event.currentTarget.nextElementSibling?.classList.add(
                              "is-visible"
                            );
                          }}
                        />
                      ) : null}

                      <div
                        className={`wishlist-image-placeholder ${
                          image ? "has-image" : "is-visible"
                        }`}
                      >
                        <Gem size={46} />
                        <span>MARBLE IMAGE UNAVAILABLE</span>
                      </div>

                      <span
                        className={`wishlist-availability ${
                          !verified
                            ? "is-pending"
                            : availability.available
                              ? "is-available"
                              : "is-unavailable"
                        }`}
                      >
                        <span className="wishlist-status-dot" />
                        {!verified
                          ? "Checking stock"
                          : availability.label}
                      </span>
                    </Link>

                    <button
                      type="button"
                      className="wishlist-remove-icon"
                      aria-label={`Remove ${name} from wishlist`}
                      title="Remove from wishlist"
                      onClick={() => handleRemove(product)}
                    >
                      <Heart size={18} fill="currentColor" />
                    </button>

                    <div className="wishlist-card-content">
                      <div className="wishlist-product-category">
                        {product.category || "Marble Collection"}
                      </div>

                      <h2>{name}</h2>

                      {product.color && (
                        <p className="wishlist-product-detail">
                          Colour: {product.color}
                        </p>
                      )}

                      {product.finish && (
                        <p className="wishlist-product-detail">
                          Finish: {product.finish}
                        </p>
                      )}

                      <div className="wishlist-price-row">
                        <span className="wishlist-price">
                          {formatPrice(price)}
                        </span>

                        {product.price_per_sqft != null && (
                          <span className="wishlist-price-unit">/ sq. ft.</span>
                        )}
                      </div>

                      <div className="wishlist-card-actions">
                        <button
                          type="button"
                          className="wishlist-cart-button"
                          disabled={
                            !verified ||
                            !availability.available ||
                            refreshing ||
                            isAdding
                          }
                          onClick={() => handleAddToCart(product)}
                        >
                          <ShoppingCart size={16} />
                          {isAdding
                            ? "Verifying..."
                            : !verified
                              ? "Verify Product"
                              : availability.available
                                ? "Add to Cart"
                                : "Unavailable"}
                        </button>

                        <Link
                          to={`/marbles/${encodeURIComponent(String(id))}`}
                          className="wishlist-details-button"
                          aria-label={`View ${name} details`}
                          title="View product details"
                        >
                          <ArrowUpRight size={18} />
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>
          </>
        )}

        <footer className="wishlist-footer">
          <Package size={17} />
          <span>Your favourite marble designs, all in one place.</span>
        </footer>
      </div>

      {showClearConfirm && (
        <div
          className="wishlist-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowClearConfirm(false);
            }
          }}
        >
          <section
            className="wishlist-confirm-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="wishlist-confirm-title"
          >
            <div className="wishlist-confirm-icon">
              <Trash2 size={24} />
            </div>

            <h2 id="wishlist-confirm-title">Clear your wishlist?</h2>
            <p>
              This removes all saved products from your wishlist. You can
              add them again later from the marble collection.
            </p>

            <div className="wishlist-confirm-actions">
              <button
                type="button"
                className="wishlist-cancel-button"
                onClick={() => setShowClearConfirm(false)}
              >
                Keep Items
              </button>

              <button
                type="button"
                className="wishlist-confirm-delete"
                onClick={handleClearWishlist}
              >
                Clear Wishlist
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
