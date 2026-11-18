
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Gem,
  Heart,
  Layers,
  MessageCircle,
  Minus,
  Plus,
  Ruler,
  Share2,
  ShieldCheck,
  ShoppingCart,
  Truck,
} from "lucide-react";

import { supabase } from "../../lib/supabase";
import { useCartContext } from "../../context/CartContext";
import useWishlist from "../../hooks/useWishlist";
import Loader from "../../components/common/Loader";
import "./ConstructionDetails.css";

const FALLBACK_IMAGE = "/images/hero-marble.jpg";

function getName(product) {
  return (
    product?.name ||
    product?.title ||
    product?.marble_name ||
    product?.product_name ||
    "Construction Material"
  );
}

function getCategory(product) {
  return String(
    product?.category_name ||
      product?.category ||
      product?.type ||
      "Construction Materials"
  );
}

function getPrice(product) {
  const values = [
    product?.price_per_unit,
    product?.selling_price,
    product?.price_per_sqft,
    product?.price_per_sq_ft,
    product?.price_per_square_foot,
    product?.unit_price,
    product?.base_price,
    product?.rate,
    product?.price,
  ];

  for (const value of values) {
    if (value === null || value === undefined || value === "") continue;

    const number = Number(value);

    if (Number.isFinite(number) && number >= 0) {
      return number;
    }
  }

  return null;
}

function getImages(product) {
  const values = [
    product?.image_url,
    product?.image,
    product?.thumbnail_url,
    ...(Array.isArray(product?.images) ? product.images : []),
  ];

  const images = values.filter(
    (image, index, array) =>
      typeof image === "string" &&
      image.trim().length > 0 &&
      array.indexOf(image) === index
  );

  return images.length ? images : [FALLBACK_IMAGE];
}

function getUnit(product) {
  const explicit =
    product?.unit ||
    product?.price_unit ||
    product?.unit_of_measure ||
    product?.selling_unit;

  if (explicit) {
    return String(explicit).replace(/^\/\s*/, "").trim();
  }

  const text = `${getName(product)} ${getCategory(product)}`.toLowerCase();

  if (/cement|adhesive|grout|waterproofing/.test(text)) return "bag";
  if (/steel|tmt|iron rod/.test(text)) return "kg";
  if (/brick|block|pipe|plumbing/.test(text)) return "piece";

  return "piece";
}

function formatPrice(value) {
  if (value === null || value === undefined) {
    return "Price on request";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function isConstructionProduct(product) {
  const text = [
    product?.category,
    product?.category_name,
    product?.type,
    product?.name,
    product?.title,
    product?.product_name,
  ]
    .filter(Boolean)
    .join(" ");

  return /construction|cement|steel|tmt|brick|block|pipe|plumbing|adhesive|grout|hardware|waterproofing|sand|aggregate/i.test(
    text
  );
}

export default function ConstructionDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { addToCart } = useCartContext();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [selectedImage, setSelectedImage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [added, setAdded] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadProduct() {
      setLoading(true);
      setError("");
      setProduct(null);

      const numericId = Number(id);

      if (!Number.isSafeInteger(numericId) || numericId <= 0) {
        setError("Invalid construction product ID.");
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from("marbles")
          .select("*")
          .eq("id", numericId)
          .maybeSingle();

        if (fetchError) throw fetchError;

        if (!data) {
          throw new Error("Construction product not found.");
        }

        if (active) {
          setProduct(data);
          setSelectedImage(getImages(data)[0]);
          setQuantity(1);
          setAdded(false);
        }
      } catch (err) {
        if (active) {
          setError(
            err?.message || "Unable to load this construction product."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProduct();

    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    let active = true;

    async function loadRelatedProducts() {
      try {
        const { data, error: relatedError } = await supabase
          .from("marbles")
          .select("*")
          .limit(100);

        if (relatedError) throw relatedError;

        if (!active) return;

        const filtered = (data || [])
          .filter((item) => String(item.id) !== String(id))
          .filter(isConstructionProduct)
          .slice(0, 5);

        setRelatedProducts(filtered);
      } catch (err) {
        console.error("Related construction products:", err.message);

        if (active) setRelatedProducts([]);
      }
    }

    loadRelatedProducts();

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <main className="marble-details-page">
        <div className="md-state">
          <Loader message="Preparing your product details..." />
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="marble-details-page">
        <section className="md-state">
          <h1>Product unavailable</h1>
          <p>{error || "This construction product could not be found."}</p>

          <Link to="/construction" className="md-primary-button">
            <ArrowLeft size={17} />
            Back to Construction
          </Link>
        </section>
      </main>
    );
  }

  const name = getName(product);
  const category = getCategory(product);
  const price = getPrice(product);
  const unit = getUnit(product);
  const images = getImages(product);
  const total = price === null ? null : price * quantity;
  const activeImage = selectedImage || images[0];

  const wishlistActive = Boolean(isInWishlist(product.id));

  function previousImage() {
    const current = Math.max(0, images.indexOf(activeImage));

    setSelectedImage(
      images[(current - 1 + images.length) % images.length]
    );
  }

  function nextImage() {
    const current = Math.max(0, images.indexOf(activeImage));

    setSelectedImage(images[(current + 1) % images.length]);
  }

  function handleAddToCart(action = "cart") {
    if (adding) return;

    if (price === null) {
      setError(
        "This product has no recognized price. Update its price in inventory first."
      );
      return;
    }

    setAdding(true);
    setError("");

    try {
      addToCart(product, quantity);

      setAdded(true);

      if (action === "buy") {
        navigate("/checkout");
      }
    } catch (err) {
      console.error("Unable to add product to cart:", err);
      setError("Unable to add this product to your cart.");
    } finally {
      setAdding(false);
    }
  }

  function handleShare() {
    const url = window.location.href;

    if (navigator.share) {
      navigator
        .share({
          title: name,
          text: `Discover ${name} at ARK MARBLES.`,
          url,
        })
        .catch((err) => {
          if (err.name !== "AbortError") {
            console.error("Share failed:", err);
          }
        });
    } else if (navigator.clipboard) {
      navigator.clipboard
        .writeText(url)
        .then(() => window.alert("Product link copied."));
    }
  }

  function handleEnquiry() {
    const message = [
      "Hello ARK MARBLES, I would like to enquire about a construction material.",
      `Product: ${name}`,
      `Quantity: ${quantity} ${unit}`,
      `Price: ${total === null ? "Please quote" : formatPrice(total)}`,
      `Product link: ${window.location.href}`,
    ].join("\n");

    window.open(
      `https://wa.me/?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  return (
    <main className="marble-details-page">
      <div className="marble-details-container">
        {/* BREADCRUMB */}
        <nav className="md-breadcrumb" aria-label="Breadcrumb">
          <Link to="/construction">
            <ArrowLeft size={15} />
            Back to Collection
          </Link>

          <span>/</span>
          <span>{name}</span>
        </nav>

        <section className="md-product-layout">
          {/* LEFT: PRODUCT IMAGE GALLERY */}
          <div className="md-gallery">
            <div className="md-main-image">
              <img
                src={activeImage}
                alt={name}
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = FALLBACK_IMAGE;
                }}
              />

              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    className="md-gallery-arrow md-gallery-prev"
                    onClick={previousImage}
                    aria-label="Previous image"
                  >
                    <ChevronLeft size={24} />
                  </button>

                  <button
                    type="button"
                    className="md-gallery-arrow md-gallery-next"
                    onClick={nextImage}
                    aria-label="Next image"
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              )}

              <span className="md-image-counter">
                {Math.max(0, images.indexOf(activeImage)) + 1} / {images.length}
              </span>

              <button
                type="button"
                className={`md-image-wishlist ${
                  wishlistActive ? "is-active" : ""
                }`}
                onClick={() => toggleWishlist(product)}
                aria-label="Toggle wishlist"
              >
                <Heart
                  size={20}
                  fill={wishlistActive ? "currentColor" : "none"}
                />
              </button>

              <span className="md-image-label">
                <span />
                ARK MARBLES COLLECTION
              </span>
            </div>

            {/* THUMBNAILS: SAME CLASS NAMES AS MARBLE DETAILS */}
            <div className="md-thumbnail-list">
              {images.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  className={`md-thumbnail ${
                    activeImage === image ? "is-selected" : ""
                  }`}
                  onClick={() => setSelectedImage(image)}
                  aria-label={`View image ${index + 1}`}
                >
                  <img
                    src={image}
                    alt={`${name} ${index + 1}`}
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = FALLBACK_IMAGE;
                    }}
                  />
                </button>
              ))}
            </div>

            <p className="md-image-caption">
              Reliable materials. Built for your project.
            </p>
          </div>

          {/* RIGHT: PRODUCT DETAILS */}
          <div className="md-product-info">
            <p className="md-eyebrow">PREMIUM CONSTRUCTION MATERIALS</p>

            <h1>{name}</h1>

            <p className="md-product-tagline">
              {product.tagline || "Quality Materials for Every Project"}
            </p>

            <p className="md-description">
              {product.description ||
                `${name} is selected for dependable construction and finishing work. Contact ARK MARBLES for product availability and bulk requirements.`}
            </p>

            {/* PRICE AND ENQUIRY */}
            <div className="md-price-row">
              <div className="md-price-group">
                <span className="md-price-label">Total price</span>

                <strong>
                  {total === null ? "Price on request" : formatPrice(total)}
                </strong>

                <span className="md-price-unit">
                  {price === null
                    ? "Contact us for pricing"
                    : `${formatPrice(price)} per ${unit}`}
                </span>
              </div>

              <button
                type="button"
                className="md-stock md-enquiry-link"
                onClick={handleEnquiry}
              >
                <MessageCircle size={17} />
                Available for Enquiry
              </button>
            </div>

            <p className="md-price-note">
              {price === null
                ? "Contact our team for current pricing."
                : `${formatPrice(price)} × ${quantity} ${unit}. Pricing may vary based on quantity and requirements.`}
            </p>

            {/* SPECIFICATIONS */}
            <div className="md-specifications md-specifications-lux">
              <div>
                <Layers size={25} />
                <span>
                  Category
                  <strong>{category}</strong>
                </span>
              </div>

              <div>
                <Ruler size={25} />
                <span>
                  Unit
                  <strong>{unit}</strong>
                </span>
              </div>

              <div>
                <Gem size={25} />
                <span>
                  Finish
                  <strong>{product.finish || "Quality Selection"}</strong>
                </span>
              </div>

              <div>
                <Truck size={25} />
                <span>
                  Origin
                  <strong>
                    {product.origin ||
                      product.country_of_origin ||
                      "Contact for details"}
                  </strong>
                </span>
              </div>
            </div>

            {/* QUANTITY */}
            <div className="md-quantity-section">
              <label htmlFor="construction-quantity">
                Quantity ({unit})
              </label>

              <div className="md-quantity-control">
                <button
                  type="button"
                  onClick={() => {
                    setQuantity((value) => Math.max(1, value - 1));
                    setAdded(false);
                  }}
                  disabled={quantity <= 1}
                  aria-label="Decrease quantity"
                >
                  <Minus size={15} />
                </button>

                <output id="construction-quantity" aria-live="polite">
                  {quantity}
                </output>

                <button
                  type="button"
                  onClick={() => {
                    setQuantity((value) => value + 1);
                    setAdded(false);
                  }}
                  aria-label="Increase quantity"
                >
                  <Plus size={15} />
                </button>
              </div>
            </div>

            {/* WISHLIST AND SHARE */}
            <div className="md-product-utility">
              <button
                type="button"
                onClick={() => toggleWishlist(product)}
              >
                <Heart
                  size={17}
                  fill={wishlistActive ? "currentColor" : "none"}
                />
                {wishlistActive ? "Wishlisted" : "Add to Wishlist"}
              </button>

              <button type="button" onClick={handleShare}>
                <Share2 size={17} />
                Share
              </button>
            </div>

            {/* CART AND BUY NOW */}
            <div className="md-purchase-actions">
              <button
                type="button"
                className="md-add-to-cart"
                onClick={() => handleAddToCart("cart")}
                disabled={adding || price === null}
              >
                <ShoppingCart size={18} />
                {adding ? "Adding..." : "Add to Cart"}
              </button>

              <button
                type="button"
                className="md-buy-now"
                onClick={() => handleAddToCart("buy")}
                disabled={adding || price === null}
              >
                Buy Now
                <ArrowRight size={17} />
              </button>
            </div>

            {error && (
              <p className="md-error-message" role="alert">
                {error}
              </p>
            )}

            {added && (
              <p className="md-cart-success" role="status">
                <CheckCircle2 size={17} />
                Added to your cart successfully.
                <Link to="/cart">View Cart</Link>
              </p>
            )}

            {/* SERVICE BENEFITS */}
            <div className="md-product-assurances">
              <div>
                <ShieldCheck size={25} />
                <span>
                  <strong>Quality Selection</strong>
                  <small>Carefully selected materials</small>
                </span>
              </div>

              <div>
                <Truck size={25} />
                <span>
                  <strong>Delivery Assistance</strong>
                  <small>Contact our team for details</small>
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* RELATED CONSTRUCTION PRODUCTS */}
        <section className="md-related-section">
          <div className="md-related-heading">
            <h2>
              <span />
              Related Construction Materials
            </h2>

            <Link to="/construction">
              View All <ArrowRight size={16} />
            </Link>
          </div>

          {relatedProducts.length > 0 ? (
            <div className="md-related-grid">
              {relatedProducts.map((item) => (
                <Link
                  to={`/construction/${item.id}`}
                  className="md-related-card"
                  key={item.id}
                >
                  <div className="md-related-image">
                    <img
                      src={getImages(item)[0]}
                      alt={getName(item)}
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = FALLBACK_IMAGE;
                      }}
                    />
                  </div>

                  <strong>{getName(item)}</strong>

                  <p>
                    {formatPrice(getPrice(item))}
                    <small> / {getUnit(item)}</small>
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="md-related-empty">
              Explore our construction collection for more materials.
            </p>
          )}
        </section>

        {/* CONTACT SECTION */}
        <section className="md-project-cta">
          <h2>Materials for your next project</h2>

          <p>
            Need bulk quantities or a project-specific quote? Our team can
            help you find the right construction materials.
          </p>

          <Link to="/contact">
            Contact ARK MARBLES <ArrowRight size={16} />
          </Link>
        </section>
      </div>
    </main>
  );
}
