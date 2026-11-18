import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Gem,
  Heart,
  ShoppingBag,
  Trash2,
  ArrowLeft,
  ArrowRight,
  ShoppingCart,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const WISHLIST_KEY = "ark-marble-wishlist";
const CART_KEY = "ark-marble-cart";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

function readWishlist() {
  try {
    const data = JSON.parse(localStorage.getItem(WISHLIST_KEY) || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function readCart() {
  try {
    const data = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    return Array.isArray(data)
      ? data
      : Array.isArray(data.items)
        ? data.items
        : [];
  } catch {
    return [];
  }
}

export default function StoreWishlist() {
  const [items, setItems] = useState([]);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setItems(readWishlist());
  }, []);

  const saveWishlist = (updated) => {
    try {
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(updated));
      setItems(updated);
      setError("");
    } catch {
      setError("Unable to save your wishlist. Please try again.");
    }
  };

  const removeItem = (id) => {
    saveWishlist(
      items.filter((item) => String(item.id) !== String(id))
    );
    setNotice("Product removed from your wishlist.");
  };

  const addToCart = (item) => {
    try {
      const cart = readCart();
      const existing = cart.find(
        (product) => String(product.id) === String(item.id)
      );

      let updatedCart;

      if (existing) {
        updatedCart = cart.map((product) =>
          String(product.id) === String(item.id)
            ? {
                ...product,
                quantity: Number(product.quantity || product.qty || 1) + 1,
              }
            : product
        );
      } else {
        updatedCart = [
          ...cart,
          {
            ...item,
            quantity: 1,
            price: Number(item.price ?? item.selling_price ?? 0),
          },
        ];
      }

      localStorage.setItem(CART_KEY, JSON.stringify(updatedCart));
      setNotice(`${item.name || "Product"} added to your cart.`);
      setError("");
    } catch {
      setError("Unable to add this product to your cart.");
    }
  };

  const clearWishlist = () => {
    saveWishlist([]);
    setNotice("Your wishlist has been cleared.");
  };

  return (
    <main className="ark-wishlist-page">
      <style>{`
        .ark-wishlist-page {
          min-height: 100vh;
          padding: 30px 20px 65px;
          background: #f6f7f9;
          color: #202a36;
          font-family: Inter, Arial, sans-serif;
        }

        .ark-wishlist-page * {
          box-sizing: border-box;
        }

        .ark-wishlist-container {
          width: min(1120px, 100%);
          margin: 0 auto;
        }

        .ark-wishlist-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          flex-wrap: wrap;
          margin-bottom: 42px;
        }

        .ark-wishlist-brand {
          display: flex;
          align-items: center;
          gap: 11px;
          color: #183a63;
          text-decoration: none;
        }

        .ark-wishlist-brand-mark {
          display: grid;
          place-items: center;
          width: 43px;
          height: 43px;
          border-radius: 5px;
          background: #183a63;
          color: #e5c58c;
        }

        .ark-wishlist-brand h1 {
          margin: 0;
          font-size: 18px;
          letter-spacing: 1.6px;
        }

        .ark-wishlist-brand p {
          margin: 4px 0 0;
          color: #858c96;
          font-size: 9px;
          letter-spacing: 1.5px;
        }

        .ark-wishlist-back {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #526079;
          text-decoration: none;
          font-size: 12px;
          font-weight: 600;
        }

        .ark-wishlist-heading {
          margin-bottom: 30px;
        }

        .ark-wishlist-heading h2 {
          display: flex;
          align-items: center;
          gap: 13px;
          margin: 0 0 10px;
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(30px, 4vw, 42px);
          font-weight: 400;
        }

        .ark-wishlist-heading h2 svg {
          color: #b28a50;
        }

        .ark-wishlist-heading p {
          margin: 0;
          color: #7d8490;
          font-size: 12px;
          line-height: 1.8;
        }

        .ark-wishlist-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 25px;
          height: 25px;
          padding: 0 7px;
          border-radius: 20px;
          background: #e9eef6;
          color: #183a63;
          font-family: Inter, Arial, sans-serif;
          font-size: 11px;
          font-weight: 700;
        }

        .ark-wishlist-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          margin-bottom: 18px;
          color: #778195;
          font-size: 11px;
        }

        .ark-wishlist-clear {
          border: 0;
          background: transparent;
          color: #b42318;
          font-family: inherit;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
        }

        .ark-wishlist-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 20px;
        }

        .ark-wishlist-card {
          overflow: hidden;
          border: 1px solid #e6e9ef;
          border-radius: 10px;
          background: #fff;
          transition: transform 180ms ease, box-shadow 180ms ease;
        }

        .ark-wishlist-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 30px rgba(24, 58, 99, 0.08);
        }

        .ark-wishlist-image {
          position: relative;
          display: grid;
          place-items: center;
          height: 225px;
          overflow: hidden;
          background: #e9e6df;
          color: #9a948a;
        }

        .ark-wishlist-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .ark-wishlist-remove {
          position: absolute;
          top: 12px;
          right: 12px;
          display: grid;
          place-items: center;
          width: 36px;
          height: 36px;
          border: 1px solid #eee;
          border-radius: 50%;
          background: #fff;
          color: #b42318;
          cursor: pointer;
        }

        .ark-wishlist-card-body {
          padding: 19px;
        }

        .ark-wishlist-category {
          margin-bottom: 8px;
          color: #a17b44;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1.4px;
          text-transform: uppercase;
        }

        .ark-wishlist-card h3 {
          margin: 0 0 9px;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 21px;
          font-weight: 400;
          overflow-wrap: anywhere;
        }

        .ark-wishlist-description {
          min-height: 35px;
          margin: 0 0 17px;
          color: #828a98;
          font-size: 11px;
          line-height: 1.7;
        }

        .ark-wishlist-price {
          margin-bottom: 18px;
          color: #183a63;
          font-size: 19px;
          font-weight: 800;
        }

        .ark-wishlist-price small {
          color: #8790a0;
          font-size: 10px;
          font-weight: 400;
        }

        .ark-wishlist-actions {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 43px;
          gap: 9px;
        }

        .ark-wishlist-cart-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 43px;
          border: 0;
          border-radius: 5px;
          background: #183a63;
          color: #fff;
          font-family: inherit;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
        }

        .ark-wishlist-cart-button:hover {
          background: #244e7d;
        }

        .ark-wishlist-view {
          display: grid;
          place-items: center;
          border: 1px solid #dfe4eb;
          border-radius: 5px;
          color: #183a63;
          text-decoration: none;
        }

        .ark-wishlist-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 340px;
          padding: 30px;
          border: 1px solid #e6e9ef;
          border-radius: 10px;
          background: white;
          text-align: center;
        }

        .ark-wishlist-empty-icon {
          display: grid;
          place-items: center;
          width: 75px;
          height: 75px;
          margin-bottom: 20px;
          border-radius: 50%;
          background: #f8edf0;
          color: #b35d72;
        }

        .ark-wishlist-empty h3 {
          margin: 0 0 10px;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 25px;
          font-weight: 400;
        }

        .ark-wishlist-empty p {
          max-width: 400px;
          margin: 0;
          color: #788399;
          font-size: 12px;
          line-height: 1.8;
        }

        .ark-wishlist-shop {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          min-height: 44px;
          margin-top: 22px;
          padding: 0 20px;
          background: #183a63;
          color: #fff;
          text-decoration: none;
          font-size: 12px;
          font-weight: 700;
        }

        .ark-wishlist-alert {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          margin-bottom: 20px;
          padding: 13px 15px;
          border-radius: 7px;
          background: #fff0f0;
          color: #b42318;
          font-size: 12px;
          line-height: 1.7;
        }

        .ark-wishlist-notice {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 20px;
          padding: 13px 15px;
          border-radius: 7px;
          background: #eaf8f0;
          color: #187747;
          font-size: 12px;
        }

        .ark-wishlist-footer {
          margin-top: 45px;
          color: #9299a3;
          font-size: 10px;
          text-align: center;
        }

        @media (max-width: 900px) {
          .ark-wishlist-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 560px) {
          .ark-wishlist-page {
            padding: 20px 12px 40px;
          }

          .ark-wishlist-grid {
            grid-template-columns: minmax(0, 1fr);
          }

          .ark-wishlist-image {
            height: 245px;
          }

          .ark-wishlist-card-body {
            padding: 17px;
          }
        }
      `}</style>

      <div className="ark-wishlist-container">
        <header className="ark-wishlist-header">
          <Link to="/store" className="ark-wishlist-brand">
            <span className="ark-wishlist-brand-mark">
              <Gem size={24} />
            </span>

            <span>
              <h1>ARK MARBLES</h1>
              <p>PREMIUM STONE COLLECTIONS</p>
            </span>
          </Link>

          <Link to="/store" className="ark-wishlist-back">
            <ArrowLeft size={16} />
            Continue Shopping
          </Link>
        </header>

        <section className="ark-wishlist-heading">
          <h2>
            My Wishlist
            <span className="ark-wishlist-count">{items.length}</span>
          </h2>
          <p>
            Keep track of your favourite marble and stone collections.
          </p>
        </section>

        {error && (
          <div className="ark-wishlist-alert" role="alert">
            <AlertCircle size={17} />
            <span>{error}</span>
          </div>
        )}

        {notice && (
          <div className="ark-wishlist-notice" role="status">
            <CheckCircle2 size={17} />
            <span>{notice}</span>
          </div>
        )}

        {items.length === 0 ? (
          <section className="ark-wishlist-empty">
            <div className="ark-wishlist-empty-icon">
              <Heart size={34} />
            </div>

            <h3>Your wishlist is waiting</h3>

            <p>
              Save products you like so you can easily find and review
              them when you are ready to make a purchase.
            </p>

            <Link to="/store#collection" className="ark-wishlist-shop">
              Browse Collections
              <ArrowRight size={16} />
            </Link>
          </section>
        ) : (
          <>
            <div className="ark-wishlist-toolbar">
              <span>{items.length} saved product(s)</span>

              <button
                type="button"
                className="ark-wishlist-clear"
                onClick={clearWishlist}
              >
                Clear Wishlist
              </button>
            </div>

            <section className="ark-wishlist-grid">
              {items.map((item, index) => {
                const image =
                  item.image_url ||
                  item.image ||
                  item.imageUrl ||
                  "";

                const productId = item.id ?? item.product_id ?? index;
                const price = Number(
                  item.price ?? item.selling_price ?? 0
                );

                return (
                  <article
                    className="ark-wishlist-card"
                    key={productId}
                  >
                    <div className="ark-wishlist-image">
                      {image ? (
                        <img
                          src={image}
                          alt={item.name || "Marble product"}
                        />
                      ) : (
                        <Gem size={48} strokeWidth={1} />
                      )}

                      <button
                        type="button"
                        className="ark-wishlist-remove"
                        onClick={() => removeItem(productId)}
                        aria-label={`Remove ${item.name || "product"}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="ark-wishlist-card-body">
                      <div className="ark-wishlist-category">
                        {item.category || "Stone Collection"}
                      </div>

                      <h3>{item.name || "Marble Product"}</h3>

                      <p className="ark-wishlist-description">
                        {item.description ||
                          "Explore this premium stone product for your interior and architectural projects."}
                      </p>

                      <div className="ark-wishlist-price">
                        {formatCurrency(price)}
                        <small> / {item.unit || "sq. ft."}</small>
                      </div>

                      <div className="ark-wishlist-actions">
                        <button
                          type="button"
                          className="ark-wishlist-cart-button"
                          onClick={() => addToCart(item)}
                        >
                          <ShoppingCart size={15} />
                          Add to Cart
                        </button>

                        <Link
                          to={`/store/product/${productId}`}
                          className="ark-wishlist-view"
                          aria-label={`View ${item.name || "product"}`}
                          title="View product"
                        >
                          <ShoppingBag size={17} />
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>
          </>
        )}

        <footer className="ark-wishlist-footer">
          © {new Date().getFullYear()} ARK MARBLES · Premium Stone Collections
        </footer>
      </div>
    </main>
  );
}