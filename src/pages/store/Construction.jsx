import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Grid2X2,
  List,
  Heart,
  ArrowRight,
  ShieldCheck,
  Truck,
  Layers,
  Headset,
  PackageCheck,
  Boxes,
  PaintBucket,
  Wrench,
  BrickWall,
  Hammer,
  RefreshCw,
} from "lucide-react";

import { supabase } from "../../lib/supabase";
import useWishlist from "../../hooks/useWishlist";
import "./Construction.css";

const FALLBACK_IMAGES = {
  cement: "/images/construction/cement.jpg",
  steel: "/images/construction/ymt-rod.jpg",
  bricks: "/images/construction/red-brick.jpg",
  blocks: "/images/construction/red-brick.jpg",
  aggregates: "/images/construction/cement.jpg",
  plumbing: "/images/construction/pvc-pipe.jpg",
  adhesives: "/images/construction/tile-adhesive.jpg",
  paints: "/images/construction/tile-adhesive.jpg",
  others: "/images/construction/tile-adhesive.jpg",
};

const CATEGORIES = [
  { id: "all", label: "All Products", icon: Grid2X2 },
  { id: "cement", label: "Cement", icon: PackageCheck },
  { id: "steel", label: "Steel & TMT", icon: Layers },
  { id: "bricks", label: "Bricks & Blocks", icon: BrickWall },
  { id: "aggregates", label: "Aggregates", icon: Boxes },
  { id: "plumbing", label: "Plumbing", icon: Wrench },
  { id: "adhesives", label: "Adhesives", icon: Hammer },
  { id: "paints", label: "Paints", icon: PaintBucket },
  { id: "others", label: "Others", icon: Layers },
];

const CONSTRUCTION_PATTERN =
  /\b(construction|cement|tmt|steel|iron rod|brick|bricks|block|blocks|aggregate|aggregates|sand|gravel|pipe|pipes|plumbing|pvc|adhesive|grout|waterproofing|hardware|paint|primer|putty|electrical)\b/i;

function productName(product) {
  return String(
    product?.name ||
    product?.title ||
    product?.product_name ||
    product?.marble_name ||
    "Construction Material"
  );
}

function productCategory(product) {
  return String(
    product?.category_name ||
    product?.category ||
    product?.type ||
    product?.material ||
    ""
  );
}

function searchText(product) {
  return [
    productName(product),
    productCategory(product),
    product?.description,
    product?.brand,
    product?.color,
  ].filter(Boolean).join(" ").toLowerCase();
}

function isConstructionProduct(product) {
  return CONSTRUCTION_PATTERN.test(searchText(product));
}

function matchesCategory(product, category) {
  if (category === "all") return true;
  const text = searchText(product);

  const patterns = {
    cement: /\bcement\b/,
    steel: /\b(steel|tmt|iron rod|reinforcement)\b/,
    bricks: /\b(brick|bricks|block|blocks)\b/,
    aggregates: /\b(aggregate|aggregates|sand|gravel|stone chips|crushed stone)\b/,
    plumbing: /\b(pipe|pipes|plumbing|pvc|fittings|valve)\b/,
    adhesives: /\b(adhesive|tile glue|grout|waterproofing)\b/,
    paints: /\b(paint|primer|putty|coating|emulsion)\b/,
    others: /\b(hardware|electrical|tools|construction)\b/,
  };

  return patterns[category]?.test(text) || false;
}

function productPrice(product) {
  const candidates = [
    product?.price_per_unit,
    product?.selling_price,
    product?.unit_price,
    product?.price,
    product?.rate,
  ];

  for (const value of candidates) {
    if (value === undefined || value === null || value === "") continue;
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return null;
}

function productUnit(product) {
  const unit =
    product?.unit ||
    product?.price_unit ||
    product?.unit_of_measure ||
    product?.selling_unit;

  if (unit) return String(unit).replace(/^\/\s*/, "");

  const text = searchText(product);
  if (/cement|adhesive|grout|waterproofing/.test(text)) return "Bag";
  if (/steel|tmt|iron rod/.test(text)) return "Kg";
  if (/brick|block|pipe|plumbing/.test(text)) return "Piece";
  if (/aggregate|sand|gravel/.test(text)) return "Ton";
  if (/paint|primer|putty/.test(text)) return "Litre";
  return "Piece";
}

function formatPrice(value) {
  if (value === null) return "Price on request";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function productImage(product) {
  const fromDatabase =
    product?.image_url ||
    product?.image ||
    product?.thumbnail_url ||
    (Array.isArray(product?.images) ? product.images[0] : "");

  if (fromDatabase) return fromDatabase;

  const text = searchText(product);
  if (/cement/.test(text)) return FALLBACK_IMAGES.cement;
  if (/steel|tmt|iron rod/.test(text)) return FALLBACK_IMAGES.steel;
  if (/brick/.test(text)) return FALLBACK_IMAGES.bricks;
  if (/block/.test(text)) return FALLBACK_IMAGES.blocks;
  if (/aggregate|sand|gravel/.test(text)) return FALLBACK_IMAGES.aggregates;
  if (/pipe|plumbing|pvc/.test(text)) return FALLBACK_IMAGES.plumbing;
  if (/adhesive|grout|waterproofing/.test(text)) return FALLBACK_IMAGES.adhesives;
  if (/paint|primer|putty/.test(text)) return FALLBACK_IMAGES.paints;
  return FALLBACK_IMAGES.others;
}

function ConstructionProductCard({ product }) {
  const { toggleWishlist, isInWishlist } = useWishlist();
  const name = productName(product);
  const price = productPrice(product);
  const wished = isInWishlist(product.id);

  return (
    <article className="construction-product-card">
      <Link
        to={`/marbles/${product.id}`}
        className="construction-product-image"
        aria-label={`View ${name}`}
      >
        <img
          src={productImage(product)}
          alt={name}
          loading="lazy"
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = FALLBACK_IMAGES.others;
          }}
        />
      </Link>

      <button
        type="button"
        className={`construction-favorite ${wished ? "is-active" : ""}`}
        onClick={() => toggleWishlist(product)}
        aria-label={wished ? `Remove ${name} from wishlist` : `Add ${name} to wishlist`}
        aria-pressed={wished}
      >
        <Heart size={19} fill={wished ? "currentColor" : "none"} />
      </button>

      <div className="construction-product-content">
        <Link to={`/marbles/${product.id}`} className="construction-product-name">
          {name}
        </Link>
        <p className="construction-product-description">
          {product?.description || `${productCategory(product) || "Quality"} material for dependable construction work.`}
        </p>

        <div className="construction-product-bottom">
          <div className="construction-product-price">
            <strong>{formatPrice(price)}</strong>
            {price !== null && <span>/ {productUnit(product)}</span>}
          </div>
          <Link
            to={`/marbles/${product.id}`}
            className="construction-view-button"
            aria-label={`View ${name}`}
          >
            View Product <ArrowRight size={17} />
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function Construction() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sortBy, setSortBy] = useState("featured");
  const [layout, setLayout] = useState("grid");

  async function loadProducts() {
    setLoading(true);
    setError("");

    try {
      const { data, error: fetchError } = await supabase
        .from("marbles")
        .select("*");

      if (fetchError) throw fetchError;
      setProducts((data || []).filter(isConstructionProduct));
    } catch (err) {
      console.error("Construction products could not be loaded:", err);
      setError("Construction products could not be loaded. Please check your Supabase connection.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;

    async function initialLoad() {
      setLoading(true);
      setError("");
      try {
        const { data, error: fetchError } = await supabase
          .from("marbles")
          .select("*");
        if (fetchError) throw fetchError;
        if (active) setProducts((data || []).filter(isConstructionProduct));
      } catch (err) {
        console.error("Construction products could not be loaded:", err);
        if (active) setError("Construction products could not be loaded. Please check your Supabase connection.");
      } finally {
        if (active) setLoading(false);
      }
    }

    initialLoad();
    return () => { active = false; };
  }, []);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    const result = products.filter((product) => {
      const matchesQuery = !query || searchText(product).includes(query);
      return matchesQuery && matchesCategory(product, category);
    });

    if (sortBy === "name") {
      result.sort((a, b) => productName(a).localeCompare(productName(b)));
    } else if (sortBy === "price-low") {
      result.sort((a, b) => (productPrice(a) ?? Infinity) - (productPrice(b) ?? Infinity));
    } else if (sortBy === "price-high") {
      result.sort((a, b) => (productPrice(b) ?? -Infinity) - (productPrice(a) ?? -Infinity));
    }

    return result;
  }, [products, search, category, sortBy]);



  return (
    <main className="construction-page">
      {/* Full construction banner image; preserves its original aspect ratio. */}
      <section className="construction-hero">
        <img
          className="construction-hero-banner"
          src="/images/construction/construction-header.png"
          alt="Construction essentials and building materials"
        />
      </section>

      <section className="construction-collection" id="construction-collection">
        <div className="construction-heading">
          <div>
            <p className="construction-eyebrow">OUR COLLECTION</p>
            <h2>Construction Essentials</h2>
            <p>A complete range of high-quality construction materials, trusted for strength and performance.</p>
          </div>
          <div className="construction-count">
            <strong>{products.length}</strong>
            <span>PRODUCTS</span>
          </div>
        </div>

        <div className="construction-category-chips" aria-label="Filter construction products">
          {CATEGORIES.map(({ id, label, icon: Icon }) => (
            <button
              type="button"
              key={id}
              className={category === id ? "active" : ""}
              onClick={() => setCategory(id)}
            >
              <Icon size={17} />
              {label}
            </button>
          ))}
        </div>

        <div className="construction-toolbar">
          <label className="construction-search">
            <Search size={19} />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search construction materials..."
              aria-label="Search construction materials"
            />
          </label>

          <div className="construction-sort">
            <label htmlFor="construction-sort">Sort By:</label>
            <select id="construction-sort" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              <option value="featured">Featured</option>
              <option value="name">Name A–Z</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>

          <div className="construction-layout-switch" aria-label="Product layout">
            <button type="button" className={layout === "grid" ? "active" : ""} onClick={() => setLayout("grid")} aria-label="Grid view">
              <Grid2X2 size={20} />
            </button>
            <button type="button" className={layout === "list" ? "active" : ""} onClick={() => setLayout("list")} aria-label="List view">
              <List size={20} />
            </button>
          </div>
        </div>

        <div className="construction-results">
          Showing {filteredProducts.length} of {products.length} products
          {loading && <span> · Loading products…</span>}
        </div>

        {error ? (
          <div className="construction-state">
            <p>{error}</p>
            <button type="button" onClick={loadProducts}><RefreshCw size={16} /> Try Again</button>
          </div>
        ) : loading ? (
          <div className="construction-state">Loading construction products…</div>
        ) : filteredProducts.length > 0 ? (
          <div className={`construction-product-grid ${layout === "list" ? "list-view" : ""}`}>
            {filteredProducts.map((product) => (
              <ConstructionProductCard
                key={product.id}
                product={product}
              />
            ))}
          </div>
        ) : (
          <div className="construction-state">
            <h3>No construction products found</h3>
            <p>Try a different category or search term.</p>
            <button type="button" onClick={() => { setSearch(""); setCategory("all"); }}>
              Clear Filters
            </button>
          </div>
        )}

        <section className="construction-benefits">
          <article>
            <ShieldCheck size={34} />
            <div><strong>Trusted Quality</strong><span>Certified and reliable materials</span></div>
          </article>
          <article>
            <Truck size={36} />
            <div><strong>On-Time Delivery</strong><span>Committed to project timelines</span></div>
          </article>
          <article>
            <Layers size={36} />
            <div><strong>Wide Range</strong><span>All major construction materials</span></div>
          </article>
          <article>
            <Headset size={36} />
            <div><strong>Expert Support</strong><span>Guidance for material selection</span></div>
          </article>
        </section>
      </section>
    </main>
  );
}
