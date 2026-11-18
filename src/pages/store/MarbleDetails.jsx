

import { useEffect, useState } from "react";

import { Link, useNavigate, useParams } from "react-router-dom";

import {

  ArrowLeft,

  ArrowRight,

  ChevronLeft,

  ChevronRight,

  Gem,

  Heart,

  Layers,

  MessageCircle,

  Minus,

  Plus,

  Ruler,

  ShieldCheck,

  ShoppingBag,

  Truck,

} from "lucide-react";

import { supabase } from "../../lib/supabase";

import useWishlist from "../../hooks/useWishlist";

import Loader from "../../components/common/Loader";

import "./MarbleDetails.css";

const FALLBACK_IMAGE = "/images/hero-marble.jpg";

// Format price in Indian Rupees

function formatPrice(value) {

  const price = Number(value);

  return new Intl.NumberFormat("en-IN", {

    style: "currency",

    currency: "INR",

    minimumFractionDigits: 2,

    maximumFractionDigits: 2,

  }).format(Number.isFinite(price) ? price : 0);

}

// Get product name

function getName(product) {

  return (

    product?.name ||

    product?.title ||

    product?.marble_name ||

    "Product"

  );

}

// Convert product name into URL-friendly slug

function toProductSlug(value) {

  return String(value || "")

    .normalize("NFD")

    .replace(/[\u0300-\u036f]/g, "")

    .toLowerCase()

    .trim()

    .replace(/[^a-z0-9]+/g, "-")

    .replace(/^-+|-+$/g, "");

}

// Get category

function getCategory(product) {

  return String(

    product?.category_name ||

    product?.category ||

    "Collection"

  );

}

// Get product image

function getImage(product) {

  return (

    product?.image_url ||

    product?.image ||

    product?.thumbnail_url ||

    (Array.isArray(product?.images) ? product.images[0] : null) ||

    FALLBACK_IMAGE

  );

}

// Get selling unit

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

  if (/cement|adhesive|grout|waterproofing/.test(text)) {

    return "bag";

  }

  if (/tmt|steel rod|steel &/.test(text)) {

    return "kg";

  }

  if (/brick|block|pipe|plumbing/.test(text)) {

    return "piece";

  }

  if (

    /marble|granite|travertine|stone/.test(text) ||

    product?.price_per_sqft != null ||

    product?.price_per_sq_ft != null

  ) {

    return "sq. ft.";

  }

  return "piece";

}

// Get product price

function getPrice(product) {

  const candidates = [

    product?.price_per_unit,

    product?.selling_price,

    product?.price_per_sqft,

    product?.price_per_sq_ft,

    product?.price_per_square_foot,

    product?.price_per_sq_meter,

    product?.unit_price,

    product?.unitPrice,

    product?.pricePerSqft,

    product?.base_price,

    product?.rate,

    product?.price,

  ];

  const value = candidates.find(

    (candidate) =>

      candidate !== undefined &&

      candidate !== null &&

      candidate !== ""

  );

  if (value === undefined) return null;

  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed >= 0

    ? parsed

    : null;

}

// Check whether the product is a construction material

function isConstruction(product) {

  return /cement|steel|tmt|brick|block|plumbing|pipe|construction essentials/i.test(

    `${getName(product)} ${getCategory(product)}`

  );

}

export default function MarbleDetails() {

  const { id } = useParams();

  const navigate = useNavigate();

  const { toggleWishlist, isInWishlist } = useWishlist();

  const [product, setProduct] = useState(null);

  const [relatedProducts, setRelatedProducts] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [selectedImage, setSelectedImage] = useState("");

  const [quantity, setQuantity] = useState(1);

  const [buying, setBuying] = useState(false);

  // Load product details

  useEffect(() => {

    let active = true;

    async function loadProduct() {

      setLoading(true);

      setError("");

      setProduct(null);

      setRelatedProducts([]);

      setSelectedImage("");

      try {

        const numericId = Number(id);

        let foundProduct = null;

        // First try loading using the Supabase database ID

        if (

          id &&

          Number.isSafeInteger(numericId) &&

          numericId > 0

        ) {

          const { data, error: fetchError } = await supabase

            .from("marbles")

            .select("*")

            .eq("id", numericId)

            .maybeSingle();

          if (fetchError) throw fetchError;

          foundProduct = data;

        } else {

          // Support URLs such as /marbles/carrara-white

          const { data, error: fetchError } = await supabase

            .from("marbles")

            .select("*");

          if (fetchError) throw fetchError;

          const requestedSlug = toProductSlug(id);

          foundProduct =

            (data || []).find(

              (item) =>

                (toProductSlug(getName(item)) === requestedSlug ||
                  toProductSlug(getName(item)).startsWith(`${requestedSlug}-`))

            ) || null;

        }

        if (!foundProduct) {

          throw new Error("Product not found.");

        }

        if (active) {

          setProduct(foundProduct);

          setSelectedImage(getImage(foundProduct));

          setQuantity(1);

        }

      } catch (err) {

        console.error("Product loading error:", err);

        if (active) {

          setError(

            err?.message || "Unable to load this product."

          );

        }

      } finally {

        if (active) {

          setLoading(false);

        }

      }

    }

    if (id) {

      loadProduct();

    } else {

      setError("Product ID is missing.");

      setLoading(false);

    }

    return () => {

      active = false;

    };

  }, [id]);

  // Load related products

  useEffect(() => {

    if (!product?.id) {

      setRelatedProducts([]);

      return undefined;

    }

    let active = true;

    async function loadRelated() {

      try {

        const { data, error: relatedError } = await supabase

          .from("marbles")

          .select("*")

          .neq("id", product.id)

          .limit(5);

        if (!active) return;

        if (relatedError) {

          console.warn(

            "Unable to load related products:",

            relatedError.message

          );

          setRelatedProducts([]);

        } else {

          setRelatedProducts(Array.isArray(data) ? data : []);

        }

      } catch (err) {

        console.warn("Related products error:", err);

        if (active) {

          setRelatedProducts([]);

        }

      }

    }

    loadRelated();

    return () => {

      active = false;

    };

  }, [product?.id]);

  // Loading screen

  if (loading) {

    return (

      <main className="marble-details-page">

        <div className="md-state">

          <Loader message="Preparing your product details..." />

        </div>

      </main>

    );

  }

  // Product not found

  if (!product) {

    return (

      <main className="marble-details-page">

        <section className="md-state">

          <h1>Product unavailable</h1>

          <p>

            {error || "This product could not be found."}

          </p>

          <Link

            to="/marbles"

            className="md-primary-button"

          >

            <ArrowLeft size={17} />

            Back to Collection

          </Link>

        </section>

      </main>

    );

  }

  const name = getName(product);

  const category = getCategory(product);

  const unit = getUnit(product);

  const price = getPrice(product);

  const construction = isConstruction(product);

  const description =

    product.description ||

    (construction

      ? "Quality construction materials selected for your project."

      : "Natural stone selected for timeless beauty and elegant interiors.");

  // Product gallery images

  const images = [

    product.image_url,

    product.image,

    product.thumbnail_url,

    ...(Array.isArray(product.images) ? product.images : []),

  ].filter(

    (image, index, array) =>

      typeof image === "string" &&

      image.trim() &&

      array.indexOf(image) === index

  );

  if (!images.length) {

    images.push(FALLBACK_IMAGE);

  }

  // Buy Now action

  function handleBuyNow() {

    if (buying) return;

    if (price === null) {

      setError(

        "This product is available on request. Please enquire on WhatsApp for a confirmed price before checkout."

      );

      return;

    }

    setBuying(true);

    setError("");

    navigate("/checkout", {

      state: {

        checkoutMode: "buy-now",

        buyNowItem: {

          ...product,

          quantity,

        },

      },

    });

  }

  // WhatsApp enquiry

  const whatsappMessage = encodeURIComponent(

    `Hello ARK MARBLES, I would like to enquire about ${name}. Quantity: ${quantity} ${unit}. Please share availability and pricing.`

  );

  const whatsappUrl = `https://wa.me/?text=${whatsappMessage}`;

  // Gallery navigation

  function nextImage() {

    const current = Math.max(

      0,

      images.indexOf(selectedImage)

    );

    setSelectedImage(

      images[(current + 1) % images.length]

    );

  }

  function previousImage() {

    const current = Math.max(

      0,

      images.indexOf(selectedImage)

    );

    setSelectedImage(

      images[

        (current - 1 + images.length) % images.length

      ]

    );

  }

  return (

    <main className="marble-details-page">

      <div className="marble-details-container">

        {/* Breadcrumb */}

        <nav

          className="md-breadcrumb"

          aria-label="Breadcrumb"

        >

          <Link to="/marbles">

            <ArrowLeft size={15} />

            Back to Collection

          </Link>

          <span>/</span>

          <span>{name}</span>

        </nav>

        {/* Product details */}

        <section className="md-product-layout">

          {/* Image gallery */}

          <div className="md-gallery">

            <div className="md-main-image">

              <img

                src={selectedImage || images[0]}

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

                {Math.max(

                  0,

                  images.indexOf(selectedImage)

                ) + 1}{" "}

                / {images.length}

              </span>

              <button

                type="button"

                className={`md-image-wishlist ${

                  isInWishlist(product.id) ? "is-active" : ""

                }`}

                onClick={() => toggleWishlist(product)}

                aria-label="Toggle wishlist"

              >

                <Heart

                  size={20}

                  fill={

                    isInWishlist(product.id)

                      ? "currentColor"

                      : "none"

                  }

                />

              </button>

              <span className="md-image-label">

                <span />

                ARK MARBLES COLLECTION

              </span>

            </div>

            {/* Thumbnail images */}

            <div className="md-thumbnail-list">

              {images.map((image, index) => (

                <button

                  key={`${image}-${index}`}

                  type="button"

                  className={`md-thumbnail ${

                    selectedImage === image

                      ? "is-selected"

                      : ""

                  }`}

                  onClick={() => setSelectedImage(image)}

                  aria-label={`View image ${index + 1}`}

                >

                  <img

                    src={image}

                    alt={`${name} ${index + 1}`}

                  />

                </button>

              ))}

            </div>

            <p className="md-image-caption">

              {construction

                ? "Reliable materials. Built for your project."

                : "Natural stone. Distinctive by nature."}

            </p>

          </div>

          {/* Product information */}

          <div className="md-product-info">

            <p className="md-eyebrow">

              {construction

                ? "QUALITY CONSTRUCTION MATERIALS"

                : "PREMIUM NATURAL STONE"}

            </p>

            <h1>{name}</h1>

            <p className="md-product-tagline">

              {product.tagline ||

                "Bold Elegance for Timeless Spaces"}

            </p>

            <p className="md-description">

              {description}

            </p>

            {/* Price */}

            <div className="md-price-row md-lux-price-row">

              <div className="md-price-group md-lux-price-group">

                <span className="md-price-label">

                  Our price

                </span>

                <strong>

                  {price === null

                    ? "Price on request"

                    : formatPrice(price)}

                </strong>

                {price !== null && (

                  <span className="md-price-unit">

                    / {unit}

                  </span>

                )}

              </div>

            </div>

            <p className="md-price-note md-lux-price-note">

              Final pricing may vary by slab size, thickness,

              finish and quantity.

            </p>

            {/* Specifications */}

            <div className="md-specifications md-specifications-lux md-product-specs">

              <div>

                <Layers size={22} />

                <span>

                  Category

                  <strong>{category}</strong>

                </span>

              </div>

              <div>

                <Gem size={22} />

                <span>

                  Colour

                  <strong>

                    {product.color || "Not specified"}

                  </strong>

                </span>

              </div>

              <div>

                <Layers size={22} />

                <span>

                  Finish

                  <strong>

                    {product.finish || "Polished"}

                  </strong>

                </span>

              </div>

              <div>

                <Ruler size={22} />

                <span>

                  Thickness

                  <strong>

                    {product.thickness || "Not specified"}

                  </strong>

                </span>

              </div>

            </div>

            {/* Quantity */}

            <div className="md-quantity-section">

              <label htmlFor="md-quantity">

                Enquiry quantity (

                {unit === "sq. ft." ? "Sq. Ft." : unit})

              </label>

              <div className="md-quantity-control">

                <button

                  type="button"

                  onClick={() =>

                    setQuantity((value) =>

                      Math.max(1, value - 1)

                    )

                  }

                  disabled={quantity <= 1}

                  aria-label="Decrease quantity"

                >

                  <Minus size={15} />

                </button>

                <output

                  id="md-quantity"

                  aria-live="polite"

                >

                  {quantity}

                </output>

                <button

                  type="button"

                  onClick={() =>

                    setQuantity((value) => value + 1)

                  }

                  aria-label="Increase quantity"

                >

                  <Plus size={15} />

                </button>

              </div>

            </div>

            {/* Actions */}

            <div className="md-detail-actions">

              <button

                type="button"

                className="md-buy-now-button"

                onClick={handleBuyNow}

                disabled={buying || price === null}

                title={

                  price === null

                    ? "Enquire for pricing before checkout"

                    : "Buy this marble now"

                }

              >

                <ShoppingBag size={18} />

                {buying ? "Please wait..." : "Buy Now"}

                <ArrowRight size={18} />

              </button>

              <a

                className="md-whatsapp-button"

                href={whatsappUrl}

                target="\_blank"

                rel="noreferrer"

              >

                <MessageCircle size={18} />

                Enquire on WhatsApp

              </a>

              <button

                type="button"

                className="md-wishlist-button"

                onClick={() => toggleWishlist(product)}

                aria-pressed={isInWishlist(product.id)}

              >

                <Heart

                  size={18}

                  fill={

                    isInWishlist(product.id)

                      ? "currentColor"

                      : "none"

                  }

                />

                {isInWishlist(product.id)

                  ? "Added to Wishlist"

                  : "Add to Wishlist"}

              </button>

            </div>

            {error && (

              <p className="md-inline-error" role="alert">

                {error}

              </p>

            )}

            {/* Service information */}

            <div className="md-service-panel">

              <div className="md-service-item">

                <span className="md-service-icon">

                  <ShieldCheck size={21} />

                </span>

                <div>

                  <strong>Quality Selection</strong>

                  <p>

                    Carefully selected natural stone

                  </p>

                </div>

              </div>

              <div className="md-service-item">

                <span className="md-service-icon">

                  <Truck size={21} />

                </span>

                <div>

                  <strong>Delivery Assistance</strong>

                  <p>

                    Contact our team for delivery details

                  </p>

                </div>

              </div>

            </div>

          </div>

        </section>

        {/* Related products */}

        <section className="md-related-section">

          <div className="md-related-heading">

            <h2>

              <span />

              {construction

                ? "Related Materials"

                : "Related Marbles"}

            </h2>

            <Link to="/marbles">

              View All <ArrowRight size={17} />

            </Link>

          </div>

          {relatedProducts.length > 0 ? (

            <div className="md-related-grid">

              {relatedProducts.map((item) => {

                const itemName = getName(item);

                const itemPrice = getPrice(item);

                return (

                  <Link

                    to={`/marbles/${item.id}`}

                    className="md-related-card"

                    key={item.id}

                  >

                    <div className="md-related-image">

                      <img

                        src={getImage(item)}

                        alt={itemName}

                        loading="lazy"

                        onError={(event) => {

                          event.currentTarget.onerror = null;

                          event.currentTarget.src =

                            FALLBACK_IMAGE;

                        }}

                      />

                      <span>

                        <Heart size={16} />

                      </span>

                    </div>

                    <strong>{itemName}</strong>

                    <p>

                      {itemPrice === null

                        ? "Price on enquiry"

                        : formatPrice(itemPrice)}{" "}

                      <small>/ {getUnit(item)}</small>

                    </p>

                  </Link>

                );

              })}

            </div>

          ) : (

            <p className="md-related-empty">

              Discover more premium materials in our

              collection.

            </p>

          )}

        </section>

      </div>

    </main>

  );

}
