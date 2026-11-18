
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Grid2X2,
  List,
  ArrowRight,
  RotateCcw,
  Heart,
  Layers,
  Gem,
  Leaf,
} from "lucide-react";

import { supabase } from "../../lib/supabase";
import "./Marbles.css";

/* =========================================
   ARK MARBLES — PRODUCT COLLECTION
   Uses your existing local marble images.
========================================= */

const MARBLE_PRODUCTS = [
  {
    id: "calacatta-gold",
    name: "Calacatta Gold Marble",
    category: "White Marble",
    color: "White and gold",
    finish: "Polished",
    description: "Ivory-white marble with expressive golden veining.",
    image_url: "/images/marbles/calacatta-gold.png",
  },
  {
    id: "carrara-white",
    name: "Carrara White Marble",
    category: "White Marble",
    color: "White and grey",
    finish: "Polished",
    description: "Classic white marble with soft grey movement.",
    image_url: "/images/marbles/carrara-white.png",
  },
  {
    id: "nero-marquina",
    name: "Nero Marquina Marble",
    category: "Black Marble",
    color: "Black and white",
    finish: "Polished",
    description: "Deep black marble with striking light veining.",
    image_url: "/images/marbles/Nero Marquina Marble.png",
  },
  {
    id: "honey-onyx",
    name: "Honey Onyx Marble",
    category: "Onyx Marble",
    color: "Honey and cream",
    finish: "Polished",
    description: "Warm honey-toned onyx with layered natural patterns.",
    image_url: "/images/marbles/Honey Onyx Marble.png",
  },
  {
    id: "verde-alpi",
    name: "Verde Alpi Marble",
    category: "Green Marble",
    color: "Emerald green",
    finish: "Polished",
    description: "Rich green stone with contrasting natural veining.",
    image_url: "/images/marbles/Verde Alpi Marble.png",
  },
  {
    id: "blue-crystal",
    name: "Blue Crystal Marble",
    category: "Blue Marble",
    color: "Blue and gold",
    finish: "Polished",
    description: "Blue-toned statement stone with bright mineral patterns.",
    image_url: "/images/marbles/Blue Crystal Marble.png",
  },
  {
    id: "grey-emperador",
    name: "Grey Emperador Marble",
    category: "Grey Marble",
    color: "Grey",
    finish: "Polished",
    description: "Sophisticated grey stone with subtle contrasting veins.",
    image_url: "/images/marbles/Grey Emperador Marble.png",
  },
  {
    id: "emperador-brown",
    name: "Emperador Brown Marble",
    category: "Brown Marble",
    color: "Brown and cream",
    finish: "Polished",
    description: "Rich brown marble with warm cream veining.",
    image_url: "/images/marbles/Emperador Brown Marble.png",
  },
  {
    id: "burgundy-wave",
    name: "Burgundy Wave Marble",
    category: "Red Marble",
    color: "Burgundy and cream",
    finish: "Polished",
    description: "Bold burgundy pattern with flowing contrasting bands.",
    image_url: "/images/marbles/Burgundy Wave Marble.png",
  },
  {
    id: "black-white-fusion",
    name: "Black & White Fusion Marble",
    category: "Fusion Marble",
    color: "Black, white and gold",
    finish: "Polished",
    description: "High-contrast fusion pattern with dramatic movement.",
    image_url: "/images/marbles/Black & White Fusion Marble.png",
  },
  {
    id: "emerald-fusion",
    name: "Emerald Fusion Marble",
    category: "Green Marble",
    color: "Emerald, ivory and gold",
    finish: "Polished",
    description: "Emerald and ivory tones with distinctive gold accents.",
    image_url: "/images/marbles/Emerald Fusion Marble.png",
  },
  {
    id: "blue-river-fusion",
    name: "Blue River Fusion Marble",
    category: "Blue Marble",
    color: "Blue, ivory and gold",
    finish: "Polished",
    description: "Flowing blue pattern across an ivory stone surface.",
    image_url: "/images/marbles/Blue River Fusion Marble.png",
  },
];

const CATEGORIES = [
  "All Marbles",
  "Marbles",
  "White Marble",
  "Black Marble",
  "Onyx Marble",
  "Green Marble",
  "Grey Marble",
  "Brown Marble",
  "Red Marble",
  "Blue Marble",
  "Fusion Marble",
];

const CONSTRUCTION_KEYWORDS =
  /\b(cement|tmt|steel|brick|bricks|blocks|pvc|pipes|plumbing|adhesive|paint|grout)\b/i;

function normalizeName(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]/g, "");
}

function getProductPrice(product) {
  const pricePerSqft = Number(product.price_per_sqft);
  const regularPrice = Number(product.price);

  const value =
    Number.isFinite(pricePerSqft) && pricePerSqft > 0
      ? pricePerSqft
      : regularPrice;

  return Number.isFinite(value) && value > 0 ? value : 0;
}

function formatPrice(price) {
  if (!price) return "Price on request";

  return `₹${price.toLocaleString("en-IN")} / sq. ft.`;
}

function isConstructionProduct(product) {
  return CONSTRUCTION_KEYWORDS.test(
    `${product.name || ""} ${product.category || ""}`
  );
}

export default function Marbles() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Marbles");
  const [sortBy, setSortBy] = useState("featured");
  const [layout, setLayout] = useState("grid");

  const [products, setProducts] = useState(MARBLE_PRODUCTS);
  const [loading, setLoading] = useState(true);

  /* =========================================
     LOAD PRICES FROM SUPABASE
  ========================================= */

  useEffect(() => {
    let active = true;

    async function loadMarbles() {
      try {
        const { data, error } = await supabase
          .from("marbles")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;

        if (!active) return;

        // Show all visible marble products saved in Supabase.
        // Construction products and hidden products are excluded.
        const marbleRows = (data || []).filter((item) => {
          const isConstruction = isConstructionProduct(item);
          const isVisible =
            item.is_available !== false &&
            String(item.status || "available").toLowerCase() !== "hidden";

          return !isConstruction && isVisible;
        });

        const updatedProducts = marbleRows.map((row) => {
          const matchingLocalProduct = MARBLE_PRODUCTS.find(
            (product) =>
              normalizeName(product.name) === normalizeName(row.name)
          );

          return {
            ...matchingLocalProduct,
            ...row,
            id: row.id,
            name: row.name,
            category:
              matchingLocalProduct?.category || row.category || "Marbles",
            description:
              row.description ||
              matchingLocalProduct?.description ||
              "Premium natural stone for luxury interiors.",
            image_url:
              row.image_url ||
              matchingLocalProduct?.image_url ||
              "",
            color:
              row.color ||
              matchingLocalProduct?.color ||
              "",
            finish:
              row.finish ||
              matchingLocalProduct?.finish ||
              "Polished",
            price: row.price,
            price_per_sqft: row.price_per_sqft,
            is_available: row.is_available,
            status: row.status,
          };
        });

        if (active) {
          setProducts(updatedProducts);
        }
      } catch (error) {
        console.error("Unable to load marble products:", error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadMarbles();

    return () => {
      active = false;
    };
  }, []);

  /* =========================================
     SEARCH, CATEGORY AND SORT
  ========================================= */

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    const result = products.filter((product) => {
      const matchesCategory =
        category === "All Marbles" ||
        product.category === category;

      const searchableText = [
        product.name,
        product.category,
        product.color,
        product.finish,
        product.description,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !query || searchableText.includes(query);

      return matchesCategory && matchesSearch;
    });

    if (sortBy === "name") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    if (sortBy === "price-low") {
      result.sort(
        (a, b) => getProductPrice(a) - getProductPrice(b)
      );
    }

    if (sortBy === "price-high") {
      result.sort(
        (a, b) => getProductPrice(b) - getProductPrice(a)
      );
    }

    return result;
  }, [products, search, category, sortBy]);

  function clearFilters() {
    setSearch("");
    setCategory("All Marbles");
    setSortBy("featured");
  }

  return (
    <main className="lux-marble-page">

      {/* World-class marble collection hero image */}
      <section
        className="ark-marble-image-hero"
        aria-label="A curated collection of world-class marbles"
      >
        <img
          src="/images/marbles/world-class-marbles.png"
          alt="ARK Marbles — a curated collection of world-class marble slabs in a luxury showroom"
          fetchpriority="high"
        />
      </section>

      {/* =====================================
          COLLECTION
      ===================================== */}

      <section
        className="lux-collection"
        id="marble-collection"
      >

        <div className="lux-collection-heading">

          <div>
            <p className="lux-eyebrow">FIND YOUR FINISH</p>
            <h2>
              Explore the <span>collection</span>
            </h2>
            <p>
              Browse a considered range of colours,
              textures and natural patterns.
            </p>
          </div>

          <div className="lux-design-count">
            <strong>{filteredProducts.length}</strong>
            <span>DESIGNS</span>
          </div>

        </div>

        {/* Category filters */}

        <div className="lux-categories">
          {CATEGORIES.map((item) => (
            <button
              key={item}
              type="button"
              className={
                category === item ? "active" : ""
              }
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>

        {/* Toolbar */}

        <div className="lux-toolbar">

          <label className="lux-search">
            <Search size={19} />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by marble, colour, finish or pattern..."
              aria-label="Search marble collection"
            />
          </label>

          <div className="lux-sort">
            <span>Sort by:</span>

            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              aria-label="Sort products"
            >
              <option value="featured">Featured</option>
              <option value="name">Name A–Z</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>

          <div className="lux-layout-buttons">
            <button
              type="button"
              className={layout === "grid" ? "active" : ""}
              onClick={() => setLayout("grid")}
              aria-label="Grid view"
            >
              <Grid2X2 size={19} />
            </button>

            <button
              type="button"
              className={layout === "list" ? "active" : ""}
              onClick={() => setLayout("list")}
              aria-label="List view"
            >
              <List size={19} />
            </button>
          </div>

        </div>

        <div className="lux-results-info">
          Showing {filteredProducts.length} of {products.length} designs
          {loading && <span> · Updating prices...</span>}
        </div>

        {/* Product cards */}

        {filteredProducts.length > 0 ? (

          <div
            className={`lux-product-grid ${
              layout === "list" ? "list-view" : ""
            }`}
          >

            {filteredProducts.map((product) => {
              const price = getProductPrice(product);

              return (
                <article
                  className="lux-product-card"
                  key={product.id}
                >
                  <Link
                    to={`/marbles/${product.id}`}
                    className="lux-product-image"
                    aria-label={`View ${product.name}`}
                  >
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                          event.currentTarget.parentElement.classList.add(
                            "lux-image-missing"
                          );
                        }}
                      />
                    ) : (
                      <div
                        className="lux-image-missing"
                        aria-label="Product image unavailable"
                      >
                        <Gem size={34} />
                      </div>
                    )}

                    <span
                      className="lux-card-heart"
                      aria-hidden="true"
                    >
                      <Heart size={25} />
                    </span>

                    <span className="lux-image-category">
                      <Gem size={15} />
                      PREMIUM MARBLE
                    </span>
                  </Link>

                  <div className="lux-product-info">
                    <h3 className="lux-card-title">
                      {product.name}
                    </h3>

                    <p className="lux-product-description">
                      {product.description}
                    </p>

                    <div className="lux-card-features">
                      <div>
                        <Layers size={25} />
                        <span>
                          {product.finish || "Polished"} Finish
                        </span>
                      </div>

                      <div>
                        <Gem size={25} />
                        <span>Premium Grade</span>
                      </div>

                      <div>
                        <Leaf size={25} />
                        <span>Natural Stone</span>
                      </div>
                    </div>

                    <div className="lux-card-price-row">
                      <strong className="lux-product-price">
                        {formatPrice(price)}
                      </strong>

                      <span
                        className={`lux-card-stock ${
                          product.is_available === false ||
                          ["out_of_stock", "hidden", "sold"].includes(
                            product.status?.toLowerCase()
                          )
                            ? "out-of-stock"
                            : ""
                        }`}
                      >
                        <i />

                        {product.is_available === false ||
                        ["out_of_stock", "hidden", "sold"].includes(
                          product.status?.toLowerCase()
                        )
                          ? "Unavailable"
                          : "In Stock"}
                      </span>
                    </div>

                    <Link
                      to={`/marbles/${product.id}`}
                      className="lux-details-button"
                    >
                      View Details
                      <ArrowRight size={23} />
                    </Link>
                  </div>
                </article>
              );
            })}

          </div>

        ) : (

          <div className="lux-empty">
            <h3>No marble designs found</h3>
            <p>Try another search term or category.</p>

            <button
              type="button"
              onClick={clearFilters}
              className="lux-button"
            >
              <RotateCcw size={16} />
              View all marbles
            </button>
          </div>

        )}

      </section>

    </main>
  );
}
