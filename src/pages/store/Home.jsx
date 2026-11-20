
import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Search,
  Heart,
  ShoppingCart,
  ArrowRight,
  Truck,
  ShieldCheck,
  Headphones,
  Gem,
} from "lucide-react";

import { supabase } from "../../lib/supabase";
import "./Home.css";

const IMAGE = {
  hero: "/images/home/home-hero-background.png",
  marble: "/images/marbles/carrara-white.png",
  tiles: "/images/marbles/calacatta-gold.png",
  cement: "/images/construction/cement.jpg",
  bricks: "/images/construction/red-brick.jpg",
  pipes: "/images/construction/pvc-pipe.jpg",
  adhesive: "/images/construction/tile-adhesive.jpg",
  steel: "/images/construction/ymt-rod.jpg",
};

const fallbackProducts = [
  {
    id: "fallback-marble-1",
    name: "Calacatta Gold Marble",
    category: "marble",
    price: 1200,
    unit: "Sq.Ft",
    image: IMAGE.tiles,
    description: "Elegant ivory marble with beautiful golden veining.",
    path: "/marbles",
    status: "in stock",
  },
  {
    id: "fallback-marble-2",
    name: "Carrara White Marble",
    category: "marble",
    price: 1100,
    unit: "Sq.Ft",
    image: IMAGE.marble,
    description: "Classic white marble with natural grey patterns.",
    path: "/marbles",
    status: "in stock",
  },
  {
    id: "fallback-marble-3",
    name: "Nero Marquina Marble",
    category: "marble",
    price: 1300,
    unit: "Sq.Ft",
    image: "/images/marbles/Nero Marquina Marble.png",
    description: "Premium black marble with dramatic white veins.",
    path: "/marbles",
    status: "in stock",
  },
  {
    id: "fallback-marble-4",
    name: "Emerald Fusion Marble",
    category: "marble",
    price: 1400,
    unit: "Sq.Ft",
    image: "/images/marbles/Emerald Fusion Marble.png",
    description: "Premium emerald stone with elegant natural veins.",
    path: "/marbles",
    status: "in stock",
  },
  {
    id: "fallback-construction-1",
    name: "UltraTech Cement - 50 kg Bag",
    category: "construction",
    price: 380,
    unit: "Bag",
    image: IMAGE.cement,
    description: "Quality cement for residential and commercial construction.",
    path: "/construction",
    status: "in stock",
  },
  {
    id: "fallback-construction-2",
    name: "Red Clay Brick",
    category: "construction",
    price: 12,
    unit: "Piece",
    image: IMAGE.bricks,
    description: "Traditional clay bricks for building walls.",
    path: "/construction",
    status: "in stock",
  },
  {
    id: "fallback-construction-3",
    name: "PVC Plumbing Pipe",
    category: "construction",
    price: 180,
    unit: "Piece",
    image: IMAGE.pipes,
    description: "PVC pipes for residential plumbing installations.",
    path: "/construction",
    status: "in stock",
  },
  {
    id: "fallback-construction-4",
    name: "Tile Adhesive - 20 kg Bag",
    category: "construction",
    price: 450,
    unit: "Bag",
    image: IMAGE.adhesive,
    description: "Tile adhesive for fixing tiles to suitable surfaces.",
    path: "/construction",
    status: "in stock",
  },
];

const getText = (...values) =>
  values.find(
    (value) =>
      value !== null &&
      value !== undefined &&
      String(value).trim() !== ""
  );

const getCategory = (product = {}) => {
  const value = String(
    getText(
      product.category,
      product.product_type,
      product.type,
      product.material_type,
      ""
    )
  ).toLowerCase();

  const name = String(
    getText(
      product.name,
      product.title,
      product.product_name,
      ""
    )
  ).toLowerCase();

  if (
    value.includes("marble") ||
    value.includes("stone") ||
    name.includes("marble") ||
    name.includes("onyx") ||
    name.includes("granite")
  ) {
    return "marble";
  }

  return "construction";
};

const getFallbackImage = (product = {}) => {
  const name = String(
    getText(
      product.name,
      product.title,
      product.product_name,
      ""
    )
  ).toLowerCase();

  if (name.includes("cement")) return IMAGE.cement;
  if (name.includes("brick") || name.includes("block")) return IMAGE.bricks;
  if (name.includes("pipe") || name.includes("plumbing")) return IMAGE.pipes;
  if (name.includes("adhesive")) return IMAGE.adhesive;

  if (
    name.includes("steel") ||
    name.includes("rod") ||
    name.includes("tmt")
  ) {
    return IMAGE.steel;
  }

  if (name.includes("tile")) return IMAGE.tiles;

  if (name.includes("nero")) {
    return "/images/marbles/Nero Marquina Marble.png";
  }

  if (name.includes("emerald")) {
    return "/images/marbles/Emerald Fusion Marble.png";
  }

  if (name.includes("calacatta")) return IMAGE.tiles;

  return IMAGE.marble;
};

const normalizeProduct = (product = {}) => {
  const category = getCategory(product);

  const rawImage = getText(
    product.image_url,
    product.image,
    product.thumbnail_url,
    Array.isArray(product.images) ? product.images[0] : null
  );

  const rawPrice =
    category === "marble"
      ? getText(
          product.price_per_sqft,
          product.price,
          product.selling_price,
          0
        )
      : getText(
          product.price,
          product.selling_price,
          product.sale_price,
          0
        );

  const price =
    Number(String(rawPrice).replace(/[₹,\s]/g, "")) || 0;

  return {
    id: product.id || `product-${Math.random().toString(36).slice(2)}`,
    name: getText(
      product.name,
      product.title,
      product.product_name,
      "Product"
    ),
    category,
    price,
    unit: getText(
      product.unit,
      product.price_unit,
      category === "marble" ? "Sq.Ft" : "Piece"
    ),
    image: rawImage || getFallbackImage(product),
    description: getText(
      product.description,
      product.short_description,
      ""
    ),
    status: String(
      getText(product.status, product.stock_status, "in stock")
    ).toLowerCase(),
    path:
      category === "marble"
        ? `/marbles/${product.id}`
        : "/construction",
  };
};

const formatPrice = (price) =>
  new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(Number(price) || 0);

function ProductCard({ product }) {
  const [imageFailed, setImageFailed] = useState(false);

  const status = String(product?.status || "in stock").toLowerCase();
  const name = product?.name || "Product";
  const category = product?.category || "construction";
  const path = product?.path || "/construction";

  return (
    <article className="ark-home-product-card">
      <Link
        to={path}
        className="ark-home-product-image-link"
        aria-label={`View ${name}`}
      >
        <div className="ark-home-product-image-wrap">
          <img
            src={
              imageFailed
                ? getFallbackImage({ name })
                : product?.image || IMAGE.marble
            }
            alt={name}
            className="ark-home-product-image"
            loading="lazy"
            onError={() => setImageFailed(true)}
          />

          <span className="ark-home-product-tag">
            {category === "marble"
              ? "PREMIUM MARBLE"
              : "BUILDING MATERIAL"}
          </span>

          <span className="ark-home-heart" aria-hidden="true">
            <Heart size={19} />
          </span>
        </div>
      </Link>

      <div className="ark-home-product-details">
        <div className="ark-home-product-meta">
          <span>
            {category === "marble"
              ? "MARBLE COLLECTION"
              : "BUILDING MATERIALS"}
          </span>

          <span className="ark-home-stock">
            <i />
            {status.includes("out") ? "OUT OF STOCK" : "IN STOCK"}
          </span>
        </div>

        <h3>{name}</h3>

        <p className="ark-home-product-description">
          {product?.description ||
            (category === "marble"
              ? "Natural stone selected for elegant interiors and architecture."
              : "Quality building material for residential and commercial projects.")}
        </p>

        <div className="ark-home-product-price">
          ₹{formatPrice(product?.price)}
          <span> / {product?.unit || "Piece"}</span>
        </div>

        <Link to={path} className="ark-home-product-button">
          <ShoppingCart size={16} />
          View Product
          <ArrowRight size={16} />
        </Link>
      </div>
    </article>
  );
}

function ProductCollection({
  side,
  kicker,
  title,
  highlight,
  description,
  products,
  loading,
  emptyMessage,
  link,
  buttonText,
}) {
  return (
    <section
      id={
        side === "right"
          ? "ark-construction-collection"
          : "ark-marble-collection"
      }
      className={`ark-home-split-section ${
        side === "right" ? "construction-layout" : "marble-layout"
      }`}
    >
      <div className="ark-home-split-intro">
        <span className="ark-home-section-kicker">{kicker}</span>

        <h2>
          {title}
          <span>{highlight}</span>
        </h2>

        <p>{description}</p>

        <Link to={link} className="ark-home-view-all">
          {buttonText}
          <ArrowRight size={17} />
        </Link>
      </div>

      <div className="ark-home-products-grid">
        {loading ? (
          <div className="ark-home-message">Loading products...</div>
        ) : products.length > 0 ? (
          products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))
        ) : (
          <div className="ark-home-message">{emptyMessage}</div>
        )}
      </div>
    </section>
  );
}

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get("search") || "";

  const updateSearch = (value) => {
    const next = new URLSearchParams(searchParams);

    if (value.trim()) {
      next.set("search", value);
    } else {
      next.delete("search");
    }

    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    let active = true;

    const loadProducts = async () => {
      try {
        const { data, error } = await supabase
          .from("marbles")
          .select("*")
          .limit(100);

        if (error) throw error;

        if (active) {
          const visibleProducts = (data || [])
            .filter((item) => {
              const status = String(item?.status || "").toLowerCase();

              return (
                status !== "hidden" &&
                status !== "inactive" &&
                status !== "deleted" &&
                item?.is_available !== false
              );
            })
            .map(normalizeProduct);

          setProducts(
            visibleProducts.length
              ? visibleProducts
              : fallbackProducts
          );
        }
      } catch (error) {
        console.error("Unable to load homepage products:", error);

        if (active) {
          setProducts(fallbackProducts);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadProducts();

    return () => {
      active = false;
    };
  }, []);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return products;

    return products.filter((product) =>
      `${product?.name || ""} ${product?.category || ""} ${
        product?.description || ""
      }`
        .toLowerCase()
        .includes(term)
    );
  }, [products, search]);

  const marbleProducts = filteredProducts
    .filter((product) => product.category === "marble")
    .slice(0, 4);

  const constructionProducts = filteredProducts
    .filter((product) => product.category === "construction")
    .slice(0, 4);

  return (
    <main className="ark-home">
      <section className="ark-home-hero">
        <div className="ark-home-hero-content">
          <span className="ark-home-eyebrow">
            PREMIUM BUILDING SOLUTIONS
          </span>

          <h1>
            ARK <span>MARBLES</span>
          </h1>

          <h2>
            Luxury Marble &amp; Construction Materials for Your Dream Space
          </h2>

          <ul className="ark-home-hero-points">
            <li><Gem size={20} /> Premium Quality</li>
            <li><ShieldCheck size={20} /> Competitive Prices</li>
            <li><Truck size={20} /> Reliable Delivery</li>
          </ul>

          <div className="ark-home-hero-actions">
            <Link
              to="/marbles"
              className="ark-home-button ark-home-button-gold"
            >
              Shop Marbles <ArrowRight size={17} />
            </Link>

            <Link
              to="/construction"
              className="ark-home-button ark-home-button-outline"
            >
              Construction Materials <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>

      <section className="ark-home-search-section">
        <form
          className="ark-home-search"
          onSubmit={(event) => {
            event.preventDefault();

            document
              .getElementById("ark-marble-collection")
              ?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
          }}
        >
          <Search size={20} />

          <input
            type="search"
            placeholder="Search marbles, tiles, cement, pipes, bricks..."
            value={search}
            onChange={(event) => updateSearch(event.target.value)}
            aria-label="Search all products"
          />

          {search && (
            <button
              type="button"
              onClick={() => updateSearch("")}
            >
              Clear
            </button>
          )}
        </form>
      </section>

      <ProductCollection
        side="left"
        kicker="EXCLUSIVE COLLECTION"
        title="Popular"
        highlight="Marbles"
        description="Discover beautiful natural stone for your spaces."
        products={marbleProducts}
        loading={loading}
        emptyMessage="No marble products match your search."
        link="/marbles"
        buttonText="View All Marbles"
      />

      <ProductCollection
        side="right"
        kicker="PREMIUM BUILDING SOLUTIONS"
        title="Construction"
        highlight="Materials"
        description="Discover premium-quality construction materials for every stage of your dream project."
        products={constructionProducts}
        loading={loading}
        emptyMessage="No construction products match your search."
        link="/construction"
        buttonText="View All Materials"
      />

      <section className="ark-home-benefits">
        <div>
          <Gem />
          <strong>Premium Quality</strong>
          <span>Carefully selected materials</span>
        </div>

        <div>
          <ShieldCheck />
          <strong>Secure Payments</strong>
          <span>Safe and reliable checkout</span>
        </div>

        <div>
          <Truck />
          <strong>Fast Delivery</strong>
          <span>Reliable delivery support</span>
        </div>

        <div>
          <Headphones />
          <strong>Expert Support</strong>
          <span>Help for every project</span>
        </div>
      </section>
    </main>
  );
}
