import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Gem,
  Search,
  ShoppingCart,
  UserRound,
  ArrowRight,
  ShieldCheck,
  Truck,
  Award,
  Headphones,
  Menu,
  X,
  Heart,
  Layers3,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

const CATEGORIES = [
  "All Products",
  "Marble",
  "Granite",
  "Tiles",
  "Quartz",
];

const SAMPLE_PRODUCTS = [
  {
    id: "sample-1",
    name: "Italian White Marble",
    category: "Marble",
    description: "Elegant white surface with subtle grey veining.",
    price: 185,
    unit: "sq. ft.",
    color: "#e8e6e1",
    tag: "BESTSELLER",
  },
  {
    id: "sample-2",
    name: "Black Galaxy Granite",
    category: "Granite",
    description: "Deep black finish with shimmering mineral flecks.",
    price: 120,
    unit: "sq. ft.",
    color: "#34363b",
    tag: "POPULAR",
  },
  {
    id: "sample-3",
    name: "Premium Beige Marble",
    category: "Marble",
    description: "Warm neutral tones for timeless interiors.",
    price: 145,
    unit: "sq. ft.",
    color: "#d6c6a9",
    tag: "",
  },
  {
    id: "sample-4",
    name: "Calacatta Quartz",
    category: "Quartz",
    description: "A refined white surface with dramatic veining.",
    price: 240,
    unit: "sq. ft.",
    color: "#efede7",
    tag: "PREMIUM",
  },
  {
    id: "sample-5",
    name: "Absolute Black Granite",
    category: "Granite",
    description: "A sleek, dark finish for modern spaces.",
    price: 135,
    unit: "sq. ft.",
    color: "#242529",
    tag: "",
  },
  {
    id: "sample-6",
    name: "Designer Floor Tiles",
    category: "Tiles",
    description: "Contemporary tiles for stylish flooring.",
    price: 75,
    unit: "sq. ft.",
    color: "#c9c6bd",
    tag: "NEW",
  },
];

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

function getCartCount() {
  try {
    const possibleKeys = [
      "ark-marble-cart",
      "cart",
      "arkCart",
    ];

    for (const key of possibleKeys) {
      const raw = localStorage.getItem(key);

      if (!raw) continue;

      const parsed = JSON.parse(raw);

      if (Array.isArray(parsed)) {
        return parsed.reduce(
          (sum, item) =>
            sum + Number(item.quantity ?? item.qty ?? 1),
          0
        );
      }

      if (Array.isArray(parsed.items)) {
        return parsed.items.reduce(
          (sum, item) =>
            sum + Number(item.quantity ?? item.qty ?? 1),
          0
        );
      }
    }
  } catch {
    return 0;
  }

  return 0;
}

function ProductCard({ product, onAddToCart }) {
  const [added, setAdded] = useState(false);

  const imageUrl =
    product.image_url ||
    product.image ||
    product.imageUrl ||
    "";

  return (
    <article className="ark-store-product-card">
      <div
        className="ark-store-product-image"
        style={{ background: product.color || "#e8e6e1" }}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            loading="lazy"
          />
        ) : (
          <div className="ark-store-stone-placeholder">
            <Gem size={52} strokeWidth={1.1} />
            <span>ARK MARBLES</span>
          </div>
        )}

        {product.tag && (
          <span className="ark-store-product-tag">
            {product.tag}
          </span>
        )}

        <button
          type="button"
          className="ark-store-quick-add"
          onClick={() => {
            onAddToCart(product);
            setAdded(true);
            setTimeout(() => setAdded(false), 1600);
          }}
          aria-label={`Add ${product.name} to cart`}
        >
          {added ? <Sparkles size={17} /> : <ShoppingCart size={17} />}
        </button>
      </div>

      <div className="ark-store-product-info">
        <span className="ark-store-product-category">
          {product.category || "Stone Collection"}
        </span>

        <h3>{product.name}</h3>

        <p className="ark-store-product-description">
          {product.description || "Premium surface for your space."}
        </p>

        <div className="ark-store-product-bottom">
          <div>
            <strong>{formatCurrency(product.price)}</strong>
            <span> / {product.unit || "sq. ft."}</span>
          </div>

          <button
            type="button"
            className="ark-store-add-button"
            onClick={() => {
              onAddToCart(product);
              setAdded(true);
              setTimeout(() => setAdded(false), 1600);
            }}
          >
            {added ? "Added" : "Add to Cart"}
          </button>
        </div>
      </div>
    </article>
  );
}

export default function StoreHome() {
  const [products, setProducts] = useState(SAMPLE_PRODUCTS);
  const [selectedCategory, setSelectedCategory] =
    useState("All Products");
  const [search, setSearch] = useState("");
  const [cartCount, setCartCount] = useState(getCartCount);
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadStore() {
      try {
        const { data: authData } = await supabase.auth.getUser();

        if (active) {
          setUser(authData?.user || null);
        }

        // Read the existing products table only if it exists and has
        // compatible columns. Demo products remain visible on failure.
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .limit(24);

        if (!error && Array.isArray(data) && data.length > 0 && active) {
          const mapped = data.map((product) => ({
            ...product,
            name:
              product.name ||
              product.product_name ||
              product.title ||
              "Marble Product",
            price: Number(
              product.price ??
                product.selling_price ??
                product.sale_price ??
                0
            ),
            category:
              product.category_name ||
              product.category ||
              "Marble",
          }));

          setProducts(mapped);
        }
      } catch {
        // Keep the sample collection available if database loading fails.
      } finally {
        if (active) setLoading(false);
      }
    }

    loadStore();

    return () => {
      active = false;
    };
  }, []);

  const filteredProducts = products.filter((product) => {
    const category = String(product.category || "").toLowerCase();

    const matchesCategory =
      selectedCategory === "All Products" ||
      category.includes(selectedCategory.toLowerCase());

    const matchesSearch = [
      product.name,
      product.category,
      product.description,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  const addToCart = (product) => {
    try {
      const key = "ark-marble-cart";
      const raw = localStorage.getItem(key);
      const existing = raw ? JSON.parse(raw) : [];

      const cart = Array.isArray(existing)
        ? existing
        : Array.isArray(existing.items)
          ? existing.items
          : [];

      const productId = String(product.id);

      const existingIndex = cart.findIndex(
        (item) => String(item.id || item.product_id) === productId
      );

      let updatedCart;

      if (existingIndex >= 0) {
        updatedCart = cart.map((item, index) =>
          index === existingIndex
            ? {
                ...item,
                quantity: Number(item.quantity ?? item.qty ?? 1) + 1,
              }
            : item
        );
      } else {
        updatedCart = [
          ...cart,
          {
            id: product.id,
            product_id: product.id,
            name: product.name,
            price: Number(product.price) || 0,
            image_url: product.image_url || product.image || "",
            category: product.category || "",
            quantity: 1,
            unit: product.unit || "sq. ft.",
          },
        ];
      }

      localStorage.setItem(key, JSON.stringify(updatedCart));

      setCartCount(
        updatedCart.reduce(
          (sum, item) =>
            sum + Number(item.quantity ?? item.qty ?? 1),
          0
        )
      );

      setNotice(`${product.name} added to your cart.`);
    } catch {
      setNotice("Unable to update the cart. Please try again.");
    }
  };

  return (
    <main className="ark-store-page">
      <style>{`
        .ark-store-page {
          min-height: 100vh;
          background: #fff;
          color: #20262e;
          font-family: Inter, Arial, sans-serif;
        }

        .ark-store-page * {
          box-sizing: border-box;
        }

        .ark-store-container {
          width: min(1200px, calc(100% - 48px));
          margin: 0 auto;
        }

        .ark-store-announcement {
          padding: 10px 16px;
          background: #183a63;
          color: #f2dfbb;
          text-align: center;
          font-size: 11px;
          letter-spacing: 1.1px;
        }

        .ark-store-header {
          position: relative;
          z-index: 20;
          border-bottom: 1px solid #ece9e3;
          background: #fff;
        }

        .ark-store-header-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: 86px;
          gap: 28px;
        }

        .ark-store-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #183a63;
          text-decoration: none;
          flex-shrink: 0;
        }

        .ark-store-logo-mark {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 45px;
          height: 45px;
          border-radius: 4px;
          background: #183a63;
          color: #e5c58c;
        }

        .ark-store-logo h1 {
          margin: 0;
          font-size: 20px;
          font-weight: 800;
          letter-spacing: 2px;
        }

        .ark-store-logo p {
          margin: 5px 0 0;
          color: #8b8b87;
          font-size: 9px;
          letter-spacing: 2px;
        }

        .ark-store-nav {
          display: flex;
          align-items: center;
          gap: 28px;
        }

        .ark-store-nav a {
          color: #4b515b;
          text-decoration: none;
          font-size: 12px;
          font-weight: 600;
          transition: color 0.2s;
        }

        .ark-store-nav a:hover {
          color: #b18a4a;
        }

        .ark-store-header-actions {
          display: flex;
          align-items: center;
          gap: 17px;
        }

        .ark-store-icon-link {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #283548;
          text-decoration: none;
        }

        .ark-store-cart-count {
          position: absolute;
          top: -9px;
          right: -10px;
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 18px;
          height: 18px;
          padding: 0 4px;
          border-radius: 20px;
          background: #b18a4a;
          color: white;
          font-size: 10px;
          font-weight: 700;
        }

        .ark-store-mobile-menu {
          display: none;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border: 1px solid #e4e7ec;
          border-radius: 7px;
          background: white;
          color: #183a63;
        }

        .ark-store-hero {
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          min-height: 490px;
          background:
            radial-gradient(ellipse at 85% 20%, rgba(196, 173, 136, 0.22), transparent 36%),
            linear-gradient(115deg, #f5f1e9 0%, #e9e1d4 48%, #d4c5af 100%);
        }

        .ark-store-hero::after {
          position: absolute;
          top: -80px;
          right: -70px;
          width: 520px;
          height: 650px;
          border: 1px solid rgba(255, 255, 255, 0.45);
          border-radius: 48%;
          content: "";
          transform: rotate(-23deg);
        }

        .ark-store-hero-inner {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          align-items: center;
          gap: 35px;
          padding-top: 60px;
          padding-bottom: 60px;
        }

        .ark-store-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 24px;
          color: #9a743d;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 2.5px;
        }

        .ark-store-eyebrow::before {
          width: 30px;
          height: 1px;
          background: #b18a4a;
          content: "";
        }

        .ark-store-hero h2 {
          max-width: 590px;
          margin: 0;
          color: #202a36;
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(42px, 5.2vw, 66px);
          font-weight: 400;
          letter-spacing: -1.8px;
          line-height: 1.08;
        }

        .ark-store-hero h2 em {
          color: #9c7845;
          font-weight: 400;
        }

        .ark-store-hero-copy {
          max-width: 455px;
          margin: 23px 0 30px;
          color: #686b6b;
          font-size: 14px;
          line-height: 1.9;
        }

        .ark-store-hero-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .ark-store-primary-link,
        .ark-store-secondary-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          min-height: 49px;
          padding: 0 22px;
          text-decoration: none;
          font-size: 12px;
          font-weight: 700;
          transition: transform 0.2s, background 0.2s;
        }

        .ark-store-primary-link {
          background: #183a63;
          color: white;
        }

        .ark-store-primary-link:hover {
          background: #244e7d;
          transform: translateY(-2px);
        }

        .ark-store-secondary-link {
          border: 1px solid #b7ad9c;
          color: #29384a;
        }

        .ark-store-secondary-link:hover {
          background: rgba(255, 255, 255, 0.5);
        }

        .ark-store-hero-art {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 330px;
        }

        .ark-store-stone-stack {
          position: relative;
          width: min(100%, 390px);
          height: 290px;
          transform: rotate(-8deg);
        }

        .ark-store-stone-slab {
          position: absolute;
          width: 75%;
          height: 70%;
          border: 1px solid rgba(255, 255, 255, 0.6);
          box-shadow: 0 22px 45px rgba(58, 48, 34, 0.16);
        }

        .ark-store-stone-slab-one {
          top: 6%;
          left: 11%;
          background:
            linear-gradient(115deg, transparent 35%, rgba(139, 131, 119, 0.17) 36%, transparent 37%),
            linear-gradient(20deg, #d7d2c8, #f4f0e7 50%, #d1cbbf);
          transform: translate(24px, 25px);
        }

        .ark-store-stone-slab-two {
          top: 15%;
          left: 9%;
          background:
            linear-gradient(150deg, transparent 30%, rgba(116, 110, 102, 0.25) 31%, transparent 32%),
            linear-gradient(30deg, #f7f3e9, #d8d3c9 58%, #ece8df);
          transform: translate(-8px, -8px);
        }

        .ark-store-stone-slab-three {
          top: 22%;
          left: 18%;
          background:
            linear-gradient(120deg, transparent 40%, rgba(132, 120, 104, 0.22) 41%, transparent 42%),
            linear-gradient(30deg, #cbb99d, #e4d7c2 45%, #b8a58b);
          transform: translate(12px, 12px);
        }

        .ark-store-hero-art-caption {
          position: absolute;
          right: 0;
          bottom: 0;
          padding: 13px 17px;
          border: 1px solid rgba(255, 255, 255, 0.65);
          background: rgba(255, 255, 255, 0.52);
          color: #36404a;
          font-size: 10px;
          letter-spacing: 1.5px;
          backdrop-filter: blur(10px);
        }

        .ark-store-benefits {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          border-bottom: 1px solid #eeeae3;
          background: white;
        }

        .ark-store-benefit {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          min-height: 105px;
          padding: 20px;
          border-right: 1px solid #eeeae3;
        }

        .ark-store-benefit:last-child {
          border-right: none;
        }

        .ark-store-benefit-icon {
          color: #a47e43;
        }

        .ark-store-benefit h3 {
          margin: 0 0 6px;
          color: #293548;
          font-size: 12px;
        }

        .ark-store-benefit p {
          margin: 0;
          color: #89909a;
          font-size: 10px;
          line-height: 1.6;
        }

        .ark-store-collection {
          padding-top: 90px;
          padding-bottom: 95px;
        }

        .ark-store-section-heading {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 24px;
          margin-bottom: 34px;
        }

        .ark-store-section-eyebrow {
          margin: 0 0 13px;
          color: #a17b44;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 2.4px;
        }

        .ark-store-section-heading h2 {
          margin: 0;
          color: #202a36;
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(31px, 4vw, 43px);
          font-weight: 400;
          letter-spacing: -0.8px;
        }

        .ark-store-section-heading > p {
          max-width: 370px;
          margin: 0;
          color: #7d8490;
          font-size: 12px;
          line-height: 1.8;
        }

        .ark-store-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 18px;
          margin-bottom: 27px;
          flex-wrap: wrap;
        }

        .ark-store-category-list {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .ark-store-category-button {
          min-height: 38px;
          padding: 0 15px;
          border: 1px solid #e5e6e8;
          border-radius: 2px;
          background: white;
          color: #626b78;
          font-family: inherit;
          font-size: 11px;
          cursor: pointer;
        }

        .ark-store-category-button.active {
          border-color: #183a63;
          background: #183a63;
          color: white;
        }

        .ark-store-search {
          position: relative;
          width: min(100%, 260px);
        }

        .ark-store-search svg {
          position: absolute;
          top: 50%;
          left: 12px;
          color: #89909a;
          transform: translateY(-50%);
        }

        .ark-store-search input {
          width: 100%;
          height: 39px;
          padding: 0 12px 0 37px;
          border: 1px solid #e5e6e8;
          border-radius: 2px;
          outline: none;
          background: #fff;
          font-family: inherit;
          font-size: 11px;
        }

        .ark-store-search input:focus {
          border-color: #183a63;
        }

        .ark-store-product-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 24px;
        }

        .ark-store-product-card {
          min-width: 0;
          border: 1px solid #ece9e3;
          background: white;
          transition: box-shadow 0.25s, transform 0.25s;
        }

        .ark-store-product-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 34px rgba(28, 39, 51, 0.08);
        }

        .ark-store-product-image {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 245px;
          overflow: hidden;
        }

        .ark-store-product-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.4s;
        }

        .ark-store-product-card:hover .ark-store-product-image img {
          transform: scale(1.04);
        }

        .ark-store-stone-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          width: 100%;
          height: 100%;
          color: rgba(53, 57, 60, 0.5);
          background:
            linear-gradient(135deg, rgba(255,255,255,0.35), transparent 50%),
            repeating-linear-gradient(115deg, transparent 0 52px, rgba(255,255,255,0.22) 53px 55px, transparent 56px 100px);
        }

        .ark-store-stone-placeholder span {
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 2px;
        }

        .ark-store-product-tag {
          position: absolute;
          top: 14px;
          left: 14px;
          padding: 7px 9px;
          background: white;
          color: #183a63;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1px;
        }

        .ark-store-quick-add {
          position: absolute;
          right: 13px;
          bottom: 13px;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border: none;
          background: white;
          color: #183a63;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(0,0,0,0.1);
        }

        .ark-store-product-info {
          padding: 22px 19px 19px;
        }

        .ark-store-product-category {
          color: #a17b44;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1.8px;
          text-transform: uppercase;
        }

        .ark-store-product-info h3 {
          margin: 10px 0 9px;
          color: #283344;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 20px;
          font-weight: 400;
          overflow-wrap: anywhere;
        }

        .ark-store-product-description {
          min-height: 38px;
          margin: 0 0 20px;
          color: #838a94;
          font-size: 11px;
          line-height: 1.8;
        }

        .ark-store-product-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          padding-top: 15px;
          border-top: 1px solid #efede8;
          flex-wrap: wrap;
        }

        .ark-store-product-bottom strong {
          color: #183a63;
          font-size: 15px;
        }

        .ark-store-product-bottom span {
          color: #858c96;
          font-size: 10px;
        }

        .ark-store-add-button {
          min-height: 36px;
          padding: 0 12px;
          border: 1px solid #183a63;
          background: white;
          color: #183a63;
          font-family: inherit;
          font-size: 10px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
        }

        .ark-store-add-button:hover {
          background: #183a63;
          color: white;
        }

        .ark-store-no-results {
          grid-column: 1 / -1;
          padding: 65px 20px;
          border: 1px solid #ece9e3;
          color: #7d8490;
          text-align: center;
          font-size: 13px;
          line-height: 1.8;
        }

        .ark-store-loading {
          grid-column: 1 / -1;
          padding: 55px 20px;
          color: #7d8490;
          text-align: center;
          font-size: 12px;
        }

        .ark-store-promo {
          position: relative;
          overflow: hidden;
          padding: 70px 0;
          background: #183a63;
          color: white;
        }

        .ark-store-promo::after {
          position: absolute;
          top: -100px;
          right: -70px;
          width: 380px;
          height: 380px;
          border: 1px solid rgba(229, 197, 140, 0.18);
          border-radius: 50%;
          box-shadow: 0 0 0 40px rgba(229, 197, 140, 0.04), 0 0 0 80px rgba(229, 197, 140, 0.03);
          content: "";
        }

        .ark-store-promo-inner {
          position: relative;
          z-index: 1;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 30px;
        }

        .ark-store-promo .ark-store-section-eyebrow {
          color: #e5c58c;
        }

        .ark-store-promo h2 {
          max-width: 650px;
          margin: 0;
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(30px, 4vw, 44px);
          font-weight: 400;
          line-height: 1.25;
        }

        .ark-store-promo p {
          max-width: 530px;
          margin: 17px 0 0;
          color: #d1dbe7;
          font-size: 12px;
          line-height: 1.9;
        }

        .ark-store-promo .ark-store-primary-link {
          flex-shrink: 0;
          background: #e5c58c;
          color: #183a63;
        }

        .ark-store-footer {
          padding: 54px 0 25px;
          background: #f8f6f1;
        }

        .ark-store-footer-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr 1fr 1fr;
          gap: 35px;
          padding-bottom: 40px;
        }

        .ark-store-footer-brand p {
          max-width: 280px;
          margin: 17px 0 0;
          color: #7d8490;
          font-size: 11px;
          line-height: 1.9;
        }

        .ark-store-footer h3 {
          margin: 0 0 18px;
          color: #283344;
          font-size: 12px;
        }

        .ark-store-footer-links {
          display: flex;
          flex-direction: column;
          gap: 13px;
        }

        .ark-store-footer-links a {
          color: #737b87;
          text-decoration: none;
          font-size: 11px;
        }

        .ark-store-footer-links a:hover {
          color: #183a63;
        }

        .ark-store-footer-bottom {
          display: flex;
          justify-content: space-between;
          gap: 15px;
          padding-top: 21px;
          border-top: 1px solid #e5e1d8;
          color: #90949a;
          font-size: 10px;
          flex-wrap: wrap;
        }

        .ark-store-notice {
          position: fixed;
          right: 24px;
          bottom: 24px;
          z-index: 100;
          display: flex;
          align-items: center;
          gap: 10px;
          max-width: calc(100vw - 32px);
          padding: 15px 18px;
          border: 1px solid #dce9df;
          background: #f0faf3;
          color: #1b6840;
          box-shadow: 0 10px 30px rgba(0,0,0,0.12);
          font-size: 12px;
        }

        @media (max-width: 950px) {
          .ark-store-nav {
            gap: 16px;
          }

          .ark-store-header-inner {
            gap: 17px;
          }

          .ark-store-hero-inner {
            grid-template-columns: 1fr 0.8fr;
          }

          .ark-store-benefit {
            padding: 15px 10px;
          }

          .ark-store-benefit h3 {
            font-size: 11px;
          }

          .ark-store-product-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .ark-store-footer-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 700px) {
          .ark-store-container {
            width: calc(100% - 32px);
          }

          .ark-store-header-inner {
            min-height: 74px;
          }

          .ark-store-logo h1 {
            font-size: 17px;
          }

          .ark-store-logo p {
            font-size: 8px;
          }

          .ark-store-nav {
            position: absolute;
            top: 100%;
            right: 0;
            left: 0;
            display: none;
            align-items: stretch;
            flex-direction: column;
            gap: 0;
            padding: 10px 16px 17px;
            border-bottom: 1px solid #ece9e3;
            background: white;
          }

          .ark-store-nav.open {
            display: flex;
          }

          .ark-store-nav a {
            padding: 13px 5px;
            border-bottom: 1px solid #f0eee9;
          }

          .ark-store-mobile-menu {
            display: flex;
          }

          .ark-store-header-actions {
            gap: 14px;
          }

          .ark-store-hero {
            min-height: 0;
          }

          .ark-store-hero-inner {
            grid-template-columns: 1fr;
            gap: 0;
            padding-top: 60px;
            padding-bottom: 35px;
          }

          .ark-store-hero h2 {
            font-size: clamp(43px, 10vw, 58px);
          }

          .ark-store-hero-art {
            min-height: 260px;
            margin-top: 12px;
          }

          .ark-store-stone-stack {
            max-width: 330px;
            height: 250px;
          }

          .ark-store-hero-art-caption {
            right: 5px;
            bottom: 0;
          }

          .ark-store-benefits {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .ark-store-benefit {
            justify-content: flex-start;
            min-height: 88px;
            padding: 16px;
            border-bottom: 1px solid #eeeae3;
          }

          .ark-store-benefit:nth-child(2) {
            border-right: none;
          }

          .ark-store-benefit:nth-child(3),
          .ark-store-benefit:nth-child(4) {
            border-bottom: none;
          }

          .ark-store-collection {
            padding-top: 62px;
            padding-bottom: 65px;
          }

          .ark-store-section-heading {
            align-items: flex-start;
            flex-direction: column;
            gap: 15px;
          }

          .ark-store-controls {
            align-items: stretch;
            flex-direction: column;
          }

          .ark-store-category-list {
            gap: 7px;
          }

          .ark-store-category-button {
            padding: 0 10px;
          }

          .ark-store-search {
            width: 100%;
          }

          .ark-store-product-image {
            height: 210px;
          }

          .ark-store-product-info {
            padding: 17px 13px;
          }

          .ark-store-product-info h3 {
            font-size: 17px;
          }

          .ark-store-product-bottom {
            align-items: flex-start;
            flex-direction: column;
          }

          .ark-store-add-button {
            width: 100%;
          }

          .ark-store-promo {
            padding: 52px 0;
          }

          .ark-store-promo-inner {
            align-items: flex-start;
            flex-direction: column;
          }
        }

        @media (max-width: 430px) {
          .ark-store-logo {
            gap: 8px;
          }

          .ark-store-logo-mark {
            width: 36px;
            height: 36px;
          }

          .ark-store-logo h1 {
            font-size: 14px;
            letter-spacing: 1.4px;
          }

          .ark-store-logo p {
            letter-spacing: 1px;
          }

          .ark-store-header-actions {
            gap: 11px;
          }

          .ark-store-product-grid {
            grid-template-columns: 1fr;
          }

          .ark-store-product-image {
            height: 245px;
          }

          .ark-store-product-bottom {
            align-items: center;
            flex-direction: row;
          }

          .ark-store-add-button {
            width: auto;
          }

          .ark-store-footer-grid {
            grid-template-columns: 1fr 1fr;
            gap: 27px 20px;
          }

          .ark-store-footer-brand {
            grid-column: 1 / -1;
          }
        }
      `}</style>

      <div className="ark-store-announcement">
        TIMELESS STONE. EXCEPTIONAL SPACES. &nbsp; | &nbsp; ARK MARBLES
      </div>

      <header className="ark-store-header">
        <div className="ark-store-container ark-store-header-inner">
          <Link to="/store" className="ark-store-logo">
            <span className="ark-store-logo-mark">
              <Gem size={25} />
            </span>

            <span>
              <h1>ARK MARBLES</h1>
              <p>PREMIUM STONE COLLECTIONS</p>
            </span>
          </Link>

          <nav
            className={`ark-store-nav ${mobileMenuOpen ? "open" : ""}`}
          >
            <a href="#home" onClick={() => setMobileMenuOpen(false)}>
              Home
            </a>
            <a
              href="#collection"
              onClick={() => setMobileMenuOpen(false)}
            >
              Collection
            </a>
            <a
              href="#benefits"
              onClick={() => setMobileMenuOpen(false)}
            >
              Why ARK
            </a>
            <a
              href="#contact"
              onClick={() => setMobileMenuOpen(false)}
            >
              Contact
            </a>
          </nav>

          <div className="ark-store-header-actions">
            <Link
              to="/cart"
              className="ark-store-icon-link"
              aria-label="Shopping cart"
            >
              <ShoppingCart size={21} />
              {cartCount > 0 && (
                <span className="ark-store-cart-count">
                  {cartCount}
                </span>
              )}
            </Link>

            <Link
              to={user ? "/customer-profile" : "/login"}
              className="ark-store-icon-link"
              aria-label="My account"
            >
              <UserRound size={21} />
            </Link>

            <button
              type="button"
              className="ark-store-mobile-menu"
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      <section className="ark-store-hero" id="home">
        <div className="ark-store-container ark-store-hero-inner">
          <div>
            <span className="ark-store-eyebrow">
              THE ART OF NATURAL STONE
            </span>

            <h2>
              Surfaces that
              <br />
              define <em>elegance.</em>
            </h2>

            <p className="ark-store-hero-copy">
              Discover carefully selected marble, granite, quartz, and
              tiles designed to bring lasting beauty to your home and
              commercial spaces.
            </p>

            <div className="ark-store-hero-actions">
              <a href="#collection" className="ark-store-primary-link">
                Explore Collection
                <ArrowRight size={16} />
              </a>

              <a href="#contact" className="ark-store-secondary-link">
                Get in Touch
              </a>
            </div>
          </div>

          <div className="ark-store-hero-art" aria-label="Stone slab illustration">
            <div className="ark-store-stone-stack">
              <div className="ark-store-stone-slab ark-store-stone-slab-one" />
              <div className="ark-store-stone-slab ark-store-stone-slab-two" />
              <div className="ark-store-stone-slab ark-store-stone-slab-three" />
            </div>

            <div className="ark-store-hero-art-caption">
              NATURAL BEAUTY · LASTING QUALITY
            </div>
          </div>
        </div>
      </section>

      <section className="ark-store-benefits" id="benefits">
        <div className="ark-store-benefit">
          <Award className="ark-store-benefit-icon" size={25} />
          <div>
            <h3>Premium Selection</h3>
            <p>Curated stone collections</p>
          </div>
        </div>

        <div className="ark-store-benefit">
          <ShieldCheck className="ark-store-benefit-icon" size={25} />
          <div>
            <h3>Quality Focused</h3>
            <p>Carefully selected materials</p>
          </div>
        </div>

        <div className="ark-store-benefit">
          <Truck className="ark-store-benefit-icon" size={25} />
          <div>
            <h3>Delivery Support</h3>
            <p>Discuss delivery options</p>
          </div>
        </div>

        <div className="ark-store-benefit">
          <Headphones className="ark-store-benefit-icon" size={25} />
          <div>
            <h3>Personal Assistance</h3>
            <p>Help choosing the right stone</p>
          </div>
        </div>
      </section>

      <section className="ark-store-collection" id="collection">
        <div className="ark-store-container">
          <div className="ark-store-section-heading">
            <div>
              <p className="ark-store-section-eyebrow">
                OUR COLLECTION
              </p>
              <h2>Find your perfect surface</h2>
            </div>

            <p>
              Explore surfaces for kitchens, flooring, bathrooms, walls,
              and statement interiors.
            </p>
          </div>

          <div className="ark-store-controls">
            <div className="ark-store-category-list">
              {CATEGORIES.map((category) => (
                <button
                  type="button"
                  key={category}
                  className={`ark-store-category-button ${
                    selectedCategory === category ? "active" : ""
                  }`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="ark-store-search">
              <Search size={16} />

              <input
                type="search"
                placeholder="Search stone collections..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Search stone collections"
              />
            </div>
          </div>

          <div className="ark-store-product-grid">
            {loading ? (
              <div className="ark-store-loading">
                Loading collections...
              </div>
            ) : filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={addToCart}
                />
              ))
            ) : (
              <div className="ark-store-no-results">
                <Layers3
                  size={28}
                  style={{ marginBottom: 12 }}
                />
                <br />
                No products match your search.
                <br />
                Try another keyword or category.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="ark-store-promo">
        <div className="ark-store-container ark-store-promo-inner">
          <div>
            <p className="ark-store-section-eyebrow">
              NEED HELP CHOOSING?
            </p>

            <h2>
              The right stone makes
              <br />
              every space memorable.
            </h2>

            <p>
              Tell us about your project and the surface you need.
              Our team can help you explore suitable options.
            </p>
          </div>

          <a href="#contact" className="ark-store-primary-link">
            Contact Our Team
            <ArrowRight size={16} />
          </a>
        </div>
      </section>

      <footer className="ark-store-footer" id="contact">
        <div className="ark-store-container">
          <div className="ark-store-footer-grid">
            <div className="ark-store-footer-brand">
              <Link to="/store" className="ark-store-logo">
                <span className="ark-store-logo-mark">
                  <Gem size={24} />
                </span>

                <span>
                  <h1>ARK MARBLES</h1>
                  <p>PREMIUM STONE COLLECTIONS</p>
                </span>
              </Link>

              <p>
                Premium surfaces for considered spaces. Discover
                marble, granite, quartz, and tile collections for
                residential and commercial projects.
              </p>
            </div>

            <div>
              <h3>Explore</h3>
              <div className="ark-store-footer-links">
                <a href="#collection">All Products</a>
                <a href="#collection">Marble</a>
                <a href="#collection">Granite</a>
                <a href="#collection">Quartz</a>
                <a href="#collection">Tiles</a>
              </div>
            </div>

            <div>
              <h3>My Account</h3>
              <div className="ark-store-footer-links">
                <Link to={user ? "/customer-profile" : "/login"}>
                  My Profile
                </Link>
                <Link to="/orders">My Orders</Link>
                <Link to="/customer-addresses">My Addresses</Link>
                <Link to="/cart">Shopping Cart</Link>
              </div>
            </div>

            <div>
              <h3>Customer Support</h3>
              <div className="ark-store-footer-links">
                <a href="#contact">Contact Us</a>
                <a href="#collection">Product Enquiries</a>
                <a href="#benefits">Our Services</a>
              </div>
            </div>
          </div>

          <div className="ark-store-footer-bottom">
            <span>
              © {new Date().getFullYear()} ARK MARBLES. All rights
              reserved.
            </span>

            <span>Designed for quality. Built for lasting beauty.</span>
          </div>
        </div>
      </footer>

      {notice && (
        <div className="ark-store-notice" role="status">
          <ShoppingCart size={17} />
          <span>{notice}</span>

          <button
            type="button"
            onClick={() => setNotice("")}
            style={{
              border: 0,
              background: "transparent",
              color: "inherit",
              cursor: "pointer",
              marginLeft: 8,
            }}
            aria-label="Dismiss notification"
          >
            <X size={15} />
          </button>

          <Link
            to="/cart"
            style={{
              color: "inherit",
              fontWeight: 800,
              textDecoration: "underline",
              whiteSpace: "nowrap",
            }}
          >
            View Cart
          </Link>
        </div>
      )}
    </main>
  );
}