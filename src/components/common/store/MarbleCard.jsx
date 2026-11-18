
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Heart } from "lucide-react";

import useWishlist from "../../../hooks/useWishlist";
import "./MarbleCard.css";

const FALLBACK_IMAGE = "/images/hero-marble.jpg";

// LOCAL MARBLE PNG IMAGES
const MARBLE_IMAGES = {
  "calacatta gold marble": "/images/marbles/calacatta-gold.png",
  "carrara white marble": "/images/marbles/carrara-white.png",
  "nero marquina marble": "/images/marbles/Nero%20Marquina%20Marble.png",
  "honey onyx marble": "/images/marbles/Honey%20Onyx%20Marble.png",
  "verde alpi marble": "/images/marbles/Verde%20Alpi%20Marble.png",
  "blue crystal marble": "/images/marbles/Blue%20Crystal%20Marble.png",
  "grey emperador marble": "/images/marbles/Grey%20Emperador%20Marble.png",
  "emperador brown marble": "/images/marbles/Emperador%20Brown%20Marble.png",
  "burgundy wave marble": "/images/marbles/Burgundy%20Wave%20Marble.png",
  "black & white fusion marble": "/images/marbles/Black%20%26%20White%20Fusion%20Marble.png",
  "emerald fusion marble": "/images/marbles/Emerald%20Fusion%20Marble.png",
  "blue river fusion marble": "/images/marbles/Blue%20River%20Fusion%20Marble.png",
};

const PRODUCT_IMAGES = {
  steel: "/images/construction/ymt-rod.jpg",
  cement: "/images/construction/cement.jpg",
  brick: "/images/construction/red-brick.jpg",
  pipe: "/images/construction/pvc-pipe.jpg",
  adhesive: "/images/construction/tile-adhesive.jpg",
};

function getProductName(product) {
  return (
    product?.name ||
    product?.title ||
    product?.marble_name ||
    product?.product_name ||
    "Product"
  );
}

function getProductImage(product) {
  const name = getProductName(product).trim().toLowerCase();

  // Construction product images
  if (name.includes("tmt") || name.includes("steel rod") || name.includes("steel")) {
    return PRODUCT_IMAGES.steel;
  }

  if (name.includes("cement")) return PRODUCT_IMAGES.cement;

  if (name.includes("brick") || name.includes("block")) {
    return PRODUCT_IMAGES.brick;
  }

  if (name.includes("pipe") || name.includes("plumbing")) {
    return PRODUCT_IMAGES.pipe;
  }

  if (name.includes("adhesive")) {
    return PRODUCT_IMAGES.adhesive;
  }

  // Use the correct local PNG for each marble
  if (MARBLE_IMAGES[name]) {
    return MARBLE_IMAGES[name];
  }

  const images = Array.isArray(product?.images)
    ? product.images
    : [];

  return (
    product?.image_url ||
    product?.image ||
    product?.thumbnail_url ||
    images[0] ||
    FALLBACK_IMAGE
  );
}

function getProductPrice(product) {
  const fields = [
    product?.price_per_unit,
    product?.selling_price,
    product?.price_per_sqft,
    product?.price_per_sq_ft,
    product?.price_per_square_foot,
    product?.price_per_sq_meter,
    product?.unit_price,
    product?.base_price,
    product?.rate,
    product?.price,
  ];

  for (const value of fields) {
    if (value === null || value === undefined || value === "") continue;

    const price = Number(value);

    if (Number.isFinite(price) && price > 0) {
      return price;
    }
  }

  return 0;
}

function formatPrice(value) {
  if (!Number.isFinite(value) || value <= 0) {
    return "Price on request";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function getProductUnit(product) {
  const explicitUnit =
    product?.unit ||
    product?.price_unit ||
    product?.unit_of_measure ||
    product?.selling_unit;

  if (explicitUnit) return String(explicitUnit).trim();

  const name = getProductName(product).toLowerCase();

  const category = String(
    product?.category_name || product?.category || product?.type || ""
  ).toLowerCase();

  if (
    name.includes("cement") ||
    name.includes("adhesive") ||
    name.includes("grout") ||
    name.includes("waterproofing")
  ) return "bag";

  if (
    name.includes("tmt") ||
    name.includes("steel rod") ||
    category.includes("steel")
  ) return "kg";

  if (
    name.includes("brick") ||
    name.includes("block") ||
    name.includes("pipe") ||
    category.includes("plumbing")
  ) return "piece";

  if (
    category.includes("marble") ||
    category.includes("granite") ||
    category.includes("stone") ||
    name.includes("marble") ||
    name.includes("granite") ||
    product?.price_per_sqft != null ||
    product?.price_per_sq_ft != null
  ) return "sq. ft.";

  return "piece";
}

export default function MarbleCard({ marble }) {
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [imageSrc, setImageSrc] = useState(
    marble ? getProductImage(marble) : FALLBACK_IMAGE
  );

  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageSrc(marble ? getProductImage(marble) : FALLBACK_IMAGE);
    setImageFailed(false);
  }, [marble]);

  if (!marble) return null;

  const id = marble.id;
  const name = getProductName(marble);

  const description =
    marble.description ||
    marble.origin ||
    "Quality materials selected for your project.";

  const price = getProductPrice(marble);
  const unit = getProductUnit(marble);
  const inWishlist = isInWishlist(id);
  const detailsUrl = `/marbles/${id}`;

  function handleWishlist(event) {
    event.preventDefault();
    event.stopPropagation();
    toggleWishlist(marble);
  }

  function handleImageError() {
    if (imageFailed) return;

    setImageFailed(true);

    if (imageSrc !== FALLBACK_IMAGE) {
      setImageSrc(FALLBACK_IMAGE);
    } else {
      setImageSrc("");
    }
  }

  return (
    <article className="marble-card">
      <div className="marble-card-image">
        <Link
          to={detailsUrl}
          className="marble-card-image-link"
          aria-label={`View ${name} details`}
        >
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={name}
              loading="lazy"
              decoding="async"
              width="480"
              height="360"
              onError={handleImageError}
            />
          ) : (
            <div className="marble-card-image-placeholder">
              <span>ARK MARBLES</span>
              <small>{name}</small>
            </div>
          )}
        </Link>

        <button
          type="button"
          className={`marble-card-wishlist${inWishlist ? " active" : ""}`}
          onClick={handleWishlist}
          aria-label={
            inWishlist
              ? `Remove ${name} from wishlist`
              : `Add ${name} to wishlist`
          }
          aria-pressed={inWishlist}
        >
          <Heart
            size={18}
            strokeWidth={1.8}
            fill={inWishlist ? "currentColor" : "none"}
          />
        </button>
      </div>

      <div className="marble-card-content">
        <p className="marble-card-description">{description}</p>

        <div className="marble-card-title-price">
          <h3 className="marble-card-title">
            <Link to={detailsUrl}>{name}</Link>
          </h3>

          <div className="marble-card-price">
            {price > 0 ? (
              <>
                <strong>{formatPrice(price)}</strong>
                <span>/ {unit}</span>
              </>
            ) : (
              <strong className="marble-card-price-request">
                Price on request
              </strong>
            )}
          </div>
        </div>

        <div className="marble-card-divider" />

        <div className="marble-card-actions">
          <Link
            to={detailsUrl}
            className="marble-card-view-product"
            aria-label={`View ${name} product details`}
          >
            <span>View Product</span>
            <ArrowRight size={17} />
          </Link>
        </div>
      </div>
    </article>
  );
}
