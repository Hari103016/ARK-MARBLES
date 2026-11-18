import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Gem,
  Heart,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Truck,
  LoaderCircle,
  AlertCircle,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

const SAMPLE_PRODUCTS = [
  {
    id: "sample-1",
    name: "Italian White Marble",
    category: "Marble",
    description:
      "Elegant white marble with subtle grey veining. A refined choice for premium flooring, feature walls, and sophisticated interiors.",
    price: 185,
    unit: "sq. ft.",
    color: "#e8e6e1",
    features: ["Elegant natural appearance", "Premium interior finish", "Suitable for flooring and walls"],
  },
  {
    id: "sample-2",
    name: "Black Galaxy Granite",
    category: "Granite",
    description:
      "Deep black granite with shimmering mineral flecks, designed to complement contemporary kitchens and architectural spaces.",
    price: 120,
    unit: "sq. ft.",
    color: "#34363b",
    features: ["Dark polished appearance", "Contemporary design", "Suitable for kitchen surfaces"],
  },
  {
    id: "sample-3",
    name: "Premium Beige Marble",
    category: "Marble",
    description:
      "Warm beige tones create a welcoming, timeless appearance for residential and commercial interiors.",
    price: 145,
    unit: "sq. ft.",
    color: "#d6c6a9",
    features: ["Warm neutral colour", "Classic interior style", "Versatile design"],
  },
  {
    id: "sample-4",
    name: "Calacatta Quartz",
    category: "Quartz",
    description:
      "A sophisticated white surface with dramatic veining for distinctive kitchens, counters, and feature interiors.",
    price: 240,
    unit: "sq. ft.",
    color: "#efede7",
    features: ["Distinctive veining", "Premium contemporary look", "Suitable for selected interior applications"],
  },
  {
    id: "sample-5",
    name: "Absolute Black Granite",
    category: "Granite",
    description:
      "A sleek, dark stone option for customers seeking a clean and understated design.",
    price: 135,
    unit: "sq. ft.",
    color: "#242529",
    features: ["Minimal dark appearance", "Modern styling", "Versatile design"],
  },
  {
    id: "sample-6",
    name: "Designer Floor Tiles",
    category: "Tiles",
    description:
      "Contemporary floor tiles for customers looking for a coordinated and stylish interior finish.",
    price: 75,
    unit: "sq. ft.",
    color: "#c9c6bd",
    features: ["Contemporary appearance", "Flooring applications", "Coordinated interior design"],
  },
];

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

function readCart() {
  try {
    const raw =
      localStorage.getItem("ark-marble-cart") ||
      localStorage.getItem("cart") ||
      localStorage.getItem("arkCart");

    if (!raw) return [];

    const parsed = JSON.parse(raw);

    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed.items)) return parsed.items;

    return [];
  } catch {
    return [];
  }
}

export default function StoreProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [allProducts, setAllProducts] = useState(SAMPLE_PRODUCTS);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [activeImage, setActiveImage] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadProduct() {
      setLoading(true);
      setError("");

      try {
        const { data, error: queryError } = await supabase
          .from("products")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (queryError) {
          throw queryError;
        }

        if (data) {
          const mapped = {
            ...data,
            name:
              data.name ||
              data.product_name ||
              data.title ||
              "Marble Product",
            category:
              data.category_name ||
              data.category ||
              "Marble",
            price: Number(
              data.price ??
                data.selling_price ??
                data.sale_price ??
                0
            ),
            description:
              data.description ||
              "Explore this product from the ARK MARBLES collection.",
            unit: data.unit || "sq. ft.",
            image_url:
              data.image_url ||
              data.image ||
              data.imageUrl ||
              "",
          };

          if (active) {
            setProduct(mapped);
          }
        } else {
          const sample = SAMPLE_PRODUCTS.find(
            (item) => String(item.id) === String(id)
          );

          if (active) {
            if (sample) {
              setProduct(sample);
            } else {
              setError("This product could not be found.");
            }
          }
        }

        const { data: productList, error: listError } = await supabase
          .from("products")
          .select("*")
          .limit(12);

        if (
          !listError &&
          Array.isArray(productList) &&
          productList.length > 0 &&
          active
        ) {
          setAllProducts(
            productList.map((item) => ({
              ...item,
              name:
                item.name ||
                item.product_name ||
                item.title ||
                "Marble Product",
              category:
                item.category_name ||
                item.category ||
                "Marble",
              price: Number(
                item.price ??
                  item.selling_price ??
                  item.sale_price ??
                  0
              ),
              image_url:
                item.image_url ||
                item.image ||
                item.imageUrl ||
                "",
            }))
          );
        }
      } catch {
        const sample = SAMPLE_PRODUCTS.find(
          (item) => String(item.id) === String(id)
        );

        if (active) {
          if (sample) {
            setProduct(sample);
          } else {
            setError(
              "Unable to load this product. Check your products table and database connection."
            );
          }
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    setQuantity(1);
    setActiveImage(0);
    loadProduct();

    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    setCartCount(
      readCart().reduce(
        (sum, item) =>
          sum + Number(item.quantity ?? item.qty ?? 1),
        0
      )
    );
  }, []);

  const addToCart = () => {
    if (!product) return;

    setAdding(true);
    setError("");
    setNotice("");

    try {
      const cart = readCart();
      const productId = String(product.id);

      const existingIndex = cart.findIndex(
        (item) =>
          String(item.product_id ?? item.id) === productId
      );

      let updatedCart;

      if (existingIndex >= 0) {
        updatedCart = cart.map((item, index) =>
          index === existingIndex
            ? {
                ...item,
                quantity:
                  Number(item.quantity ?? item.qty ?? 1) + quantity,
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
            image_url:
              product.image_url ||
              product.image ||
              "",
            category: product.category || "",
            quantity,
            unit: product.unit || "sq. ft.",
          },
        ];
      }

      localStorage.setItem(
        "ark-marble-cart",
        JSON.stringify(updatedCart)
      );

      const count = updatedCart.reduce(
        (sum, item) =>
          sum + Number(item.quantity ?? item.qty ?? 1),
        0
      );

      setCartCount(count);
      setNotice(`${product.name} added to your cart.`);
    } catch {
      setError("Unable to update your cart. Please try again.");
    } finally {
      setAdding(false);
    }
  };

  const relatedProducts = allProducts
    .filter(
      (item) =>
        String(item.id) !== String(product?.id) &&
        item.category === product?.category
    )
    .slice(0, 3);

  if (loading) {
    return (
      <main className="ark-product-loading">
        <LoaderCircle size={32} className="ark-product-spinner" />
        <p>Loading product details...</p>

        <style>{`
          .ark-product-loading {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 14px;
            color: #667085;
            font-family: Inter, Arial, sans-serif;
          }

          .ark-product-spinner {
            animation: ark-product-rotate 1s linear infinite;
          }

          @keyframes ark-product-rotate {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="ark-product-not-found">
        <style>{`
          .ark-product-not-found {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 24px;
            color: #263247;
            font-family: Inter, Arial, sans-serif;
            text-align: center;
          }

          .ark-product-not-found p {
            max-width: 450px;
            color: #788399;
            line-height: 1.8;
          }

          .ark-product-back-link {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            margin-top: 14px;
            padding: 13px 18px;
            background: #183a63;
            color: white;
            text-decoration: none;
            font-size: 13px;
          }
        `}</style>

        <Gem size={42} />
        <h1>Product Not Found</h1>
        <p>{error || "The requested product is unavailable."}</p>

        <Link to="/store" className="ark-product-back-link">
          <ArrowLeft size={16} />
          Back to Store
        </Link>
      </main>
    );
  }

  const imageUrl =
    product.image_url ||
    product.image ||
    product.imageUrl ||
    "";

  return (
    <main className="ark-product-page">
      <style>{`
        .ark-product-page {
          min-height: 100vh;
          background: #fff;
          color: #202a36;
          font-family: Inter, Arial, sans-serif;
        }

        .ark-product-page * {
          box-sizing: border-box;
        }

        .ark-product-container {
          width: min(1160px, calc(100% - 48px));
          margin: 0 auto;
        }

        .ark-product-header {
          border-bottom: 1px solid #ece9e3;
          background: white;
        }

        .ark-product-header-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: 78px;
          gap: 20px;
        }

        .ark-product-brand {
          display: flex;
          align-items: center;
          gap: 11px;
          color: #183a63;
          text-decoration: none;
        }

        .ark-product-brand-mark {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 42px;
          height: 42px;
          border-radius: 4px;
          background: #183a63;
          color: #e5c58c;
        }

        .ark-product-brand h1 {
          margin: 0;
          font-size: 18px;
          letter-spacing: 1.7px;
        }

        .ark-product-brand p {
          margin: 4px 0 0;
          color: #858c96;
          font-size: 9px;
          letter-spacing: 1.5px;
        }

        .ark-product-header-actions {
          display: flex;
          align-items: center;
          gap: 19px;
        }

        .ark-product-header-link {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #344054;
          text-decoration: none;
        }

        .ark-product-cart-count {
          position: absolute;
          top: -8px;
          right: -9px;
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 17px;
          height: 17px;
          padding: 0 4px;
          border-radius: 20px;
          background: #b18a4a;
          color: white;
          font-size: 10px;
          font-weight: 700;
        }

        .ark-product-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          padding-top: 25px;
          padding-bottom: 25px;
          color: #858c96;
          font-size: 11px;
          flex-wrap: wrap;
        }

        .ark-product-breadcrumb a {
          color: #657187;
          text-decoration: none;
        }

        .ark-product-breadcrumb a:hover {
          color: #183a63;
        }

        .ark-product-main {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 0.9fr);
          align-items: start;
          gap: 65px;
          padding-bottom: 75px;
        }

        .ark-product-gallery {
          min-width: 0;
        }

        .ark-product-main-image {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 460px;
          overflow: hidden;
          background: #e8e6e1;
        }

        .ark-product-main-image img {
          width: 100%;
          height: 460px;
          object-fit: cover;
        }

        .ark-product-stone-art {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 460px;
          color: rgba(53, 57, 60, 0.45);
          background:
            linear-gradient(135deg, rgba(255,255,255,0.35), transparent 50%),
            repeating-linear-gradient(115deg, transparent 0 70px, rgba(255,255,255,0.25) 71px 73px, transparent 74px 140px);
        }

        .ark-product-image-badge {
          position: absolute;
          top: 18px;
          left: 18px;
          padding: 9px 12px;
          background: white;
          color: #183a63;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1.4px;
        }

        .ark-product-thumbnails {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
          margin-top: 12px;
        }

        .ark-product-thumbnail {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 82px;
          overflow: hidden;
          border: 1px solid #e5e7eb;
          background: #e8e6e1;
          color: #8c8c88;
          cursor: pointer;
        }

        .ark-product-thumbnail.active {
          border: 2px solid #183a63;
        }

        .ark-product-thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .ark-product-information {
          min-width: 0;
          padding-top: 7px;
        }

        .ark-product-category {
          color: #a17b44;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 2px;
          text-transform: uppercase;
        }

        .ark-product-title {
          margin: 15px 0 14px;
          color: #202a36;
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(32px, 4vw, 45px);
          font-weight: 400;
          letter-spacing: -0.8px;
          line-height: 1.18;
          overflow-wrap: anywhere;
        }

        .ark-product-description {
          margin: 0;
          color: #78818d;
          font-size: 13px;
          line-height: 1.9;
        }

        .ark-product-price {
          display: flex;
          align-items: baseline;
          gap: 8px;
          margin: 25px 0;
          padding-bottom: 24px;
          border-bottom: 1px solid #ece9e3;
          flex-wrap: wrap;
        }

        .ark-product-price strong {
          color: #183a63;
          font-size: 29px;
          font-weight: 800;
        }

        .ark-product-price span {
          color: #89909a;
          font-size: 12px;
        }

        .ark-product-availability {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 25px;
          color: #187747;
          font-size: 12px;
          font-weight: 600;
        }

        .ark-product-availability-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #2da568;
        }

        .ark-product-quantity-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 21px;
        }

        .ark-product-quantity-label {
          color: #344054;
          font-size: 12px;
          font-weight: 700;
        }

        .ark-product-quantity-control {
          display: flex;
          align-items: center;
          height: 42px;
          border: 1px solid #e0e4ea;
        }

        .ark-product-quantity-control button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border: 0;
          background: white;
          color: #344054;
          cursor: pointer;
        }

        .ark-product-quantity-control button:disabled {
          color: #b9c0ca;
          cursor: not-allowed;
        }

        .ark-product-quantity-control span {
          min-width: 34px;
          color: #202a36;
          font-size: 13px;
          text-align: center;
        }

        .ark-product-actions {
          display: grid;
          grid-template-columns: 1fr 50px;
          gap: 10px;
        }

        .ark-product-add-button,
        .ark-product-favorite-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          min-height: 51px;
          border: 1px solid #183a63;
          font-family: inherit;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
        }

        .ark-product-add-button {
          background: #183a63;
          color: white;
        }

        .ark-product-add-button:hover {
          background: #244e7d;
        }

        .ark-product-add-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .ark-product-favorite-button {
          background: white;
          color: #183a63;
        }

        .ark-product-favorite-button.active {
          background: #fff0f0;
          border-color: #f0c6c6;
          color: #c24141;
        }

        .ark-product-total {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          margin-top: 17px;
          color: #78818d;
          font-size: 12px;
        }

        .ark-product-total strong {
          color: #183a63;
        }

        .ark-product-error,
        .ark-product-notice {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          margin-top: 17px;
          padding: 12px;
          border-radius: 7px;
          font-size: 12px;
          line-height: 1.7;
          overflow-wrap: anywhere;
        }

        .ark-product-error {
          background: #fff0f0;
          color: #b42318;
        }

        .ark-product-notice {
          background: #eaf8f0;
          color: #187747;
        }

        .ark-product-error svg,
        .ark-product-notice svg {
          flex-shrink: 0;
          margin-top: 2px;
        }

        .ark-product-benefits {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
          margin-top: 30px;
          padding-top: 24px;
          border-top: 1px solid #ece9e3;
        }

        .ark-product-benefit {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          min-width: 0;
        }

        .ark-product-benefit svg {
          flex-shrink: 0;
          color: #a17b44;
        }

        .ark-product-benefit strong {
          display: block;
          margin-bottom: 5px;
          color: #344054;
          font-size: 10px;
        }

        .ark-product-benefit span {
          display: block;
          color: #89909a;
          font-size: 9px;
          line-height: 1.6;
        }

        .ark-product-features {
          margin-top: 30px;
          padding: 24px;
          border: 1px solid #ece9e3;
          background: #faf9f6;
        }

        .ark-product-features h3 {
          margin: 0 0 17px;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 21px;
          font-weight: 400;
        }

        .ark-product-feature-list {
          display: flex;
          flex-direction: column;
          gap: 13px;
        }

        .ark-product-feature {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          color: #687385;
          font-size: 11px;
          line-height: 1.7;
        }

        .ark-product-feature svg {
          flex-shrink: 0;
          margin-top: 1px;
          color: #a17b44;
        }

        .ark-product-related {
          padding: 65px 0 85px;
          border-top: 1px solid #ece9e3;
          background: #faf9f6;
        }

        .ark-product-related-heading {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 20px;
          margin-bottom: 28px;
        }

        .ark-product-related-heading p {
          margin: 0 0 11px;
          color: #a17b44;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 2px;
        }

        .ark-product-related-heading h2 {
          margin: 0;
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(28px, 4vw, 36px);
          font-weight: 400;
        }

        .ark-product-related-link {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: #183a63;
          text-decoration: none;
          font-size: 11px;
          font-weight: 700;
        }

        .ark-product-related-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 20px;
        }

        .ark-product-related-card {
          min-width: 0;
          border: 1px solid #ece9e3;
          background: white;
        }

        .ark-product-related-image {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 180px;
          overflow: hidden;
          color: rgba(53, 57, 60, 0.4);
        }

        .ark-product-related-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .ark-product-related-content {
          padding: 18px;
        }

        .ark-product-related-content h3 {
          margin: 0 0 10px;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 18px;
          font-weight: 400;
          overflow-wrap: anywhere;
        }

        .ark-product-related-content p {
          margin: 0;
          color: #183a63;
          font-size: 13px;
          font-weight: 700;
        }

        .ark-product-related-content a {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-top: 14px;
          color: #7a8492;
          text-decoration: none;
          font-size: 11px;
        }

        .ark-product-footer {
          padding: 25px 0;
          background: #183a63;
          color: #d3dbe6;
          text-align: center;
          font-size: 10px;
          letter-spacing: 0.4px;
        }

        @media (max-width: 850px) {
          .ark-product-main {
            grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
            gap: 30px;
          }

          .ark-product-main-image,
          .ark-product-main-image img,
          .ark-product-stone-art {
            min-height: 360px;
            height: 360px;
          }

          .ark-product-benefits {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 650px) {
          .ark-product-container {
            width: calc(100% - 30px);
          }

          .ark-product-header-inner {
            min-height: 70px;
          }

          .ark-product-brand h1 {
            font-size: 15px;
          }

          .ark-product-brand p {
            font-size: 8px;
          }

          .ark-product-main {
            grid-template-columns: 1fr;
            gap: 30px;
            padding-bottom: 50px;
          }

          .ark-product-main-image,
          .ark-product-main-image img,
          .ark-product-stone-art {
            min-height: 320px;
            height: 320px;
          }

          .ark-product-information {
            padding-top: 0;
          }

          .ark-product-title {
            font-size: 35px;
          }

          .ark-product-benefits {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .ark-product-related-grid {
            grid-template-columns: 1fr;
          }

          .ark-product-related-image {
            height: 220px;
          }

          .ark-product-related-heading {
            align-items: flex-start;
            flex-direction: column;
          }
        }

        @media (max-width: 380px) {
          .ark-product-benefits {
            grid-template-columns: 1fr;
          }

          .ark-product-header-actions {
            gap: 12px;
          }

          .ark-product-thumbnails {
            gap: 6px;
          }

          .ark-product-thumbnail {
            height: 65px;
          }
        }
      `}</style>

      <header className="ark-product-header">
        <div className="ark-product-container ark-product-header-inner">
          <Link to="/store" className="ark-product-brand">
            <span className="ark-product-brand-mark">
              <Gem size={24} />
            </span>

            <span>
              <h1>ARK MARBLES</h1>
              <p>PREMIUM STONE COLLECTIONS</p>
            </span>
          </Link>

          <div className="ark-product-header-actions">
            <Link
              to="/store"
              className="ark-product-header-link"
              aria-label="Continue shopping"
            >
              <ArrowLeft size={20} />
            </Link>

            <Link
              to="/cart"
              className="ark-product-header-link"
              aria-label="Shopping cart"
            >
              <ShoppingCart size={21} />

              {cartCount > 0 && (
                <span className="ark-product-cart-count">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      <div className="ark-product-container ark-product-breadcrumb">
        <Link to="/store">Home</Link>
        <ChevronRight size={13} />
        <Link to="/store#collection">Collection</Link>
        <ChevronRight size={13} />
        <span>{product.name}</span>
      </div>

      <section className="ark-product-container ark-product-main">
        <div className="ark-product-gallery">
          <div
            className="ark-product-main-image"
            style={{ background: product.color || "#e8e6e1" }}
          >
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={product.name}
              />
            ) : (
              <div className="ark-product-stone-art">
                <Gem size={90} strokeWidth={0.8} />
              </div>
            )}

            <span className="ark-product-image-badge">
              ARK MARBLES COLLECTION
            </span>
          </div>

          <div className="ark-product-thumbnails">
            {[0, 1, 2, 3].map((index) => (
              <button
                type="button"
                key={index}
                className={`ark-product-thumbnail ${
                  activeImage === index ? "active" : ""
                }`}
                onClick={() => setActiveImage(index)}
                aria-label={`Select product image ${index + 1}`}
              >
                {imageUrl ? (
                  <img src={imageUrl} alt="" />
                ) : (
                  <Gem size={25} strokeWidth={1} />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="ark-product-information">
          <span className="ark-product-category">
            {product.category || "Stone Collection"}
          </span>

          <h1 className="ark-product-title">{product.name}</h1>

          <p className="ark-product-description">
            {product.description}
          </p>

          <div className="ark-product-price">
            <strong>{formatCurrency(product.price)}</strong>
            <span>per {product.unit || "sq. ft."}</span>
          </div>

          <div className="ark-product-availability">
            <span className="ark-product-availability-dot" />
            Product information available
          </div>

          <div className="ark-product-quantity-row">
            <span className="ark-product-quantity-label">
              Quantity
            </span>

            <div className="ark-product-quantity-control">
              <button
                type="button"
                onClick={() =>
                  setQuantity((value) => Math.max(1, value - 1))
                }
                disabled={quantity <= 1}
                aria-label="Decrease quantity"
              >
                <Minus size={15} />
              </button>

              <span>{quantity}</span>

              <button
                type="button"
                onClick={() =>
                  setQuantity((value) => Math.min(999, value + 1))
                }
                disabled={quantity >= 999}
                aria-label="Increase quantity"
              >
                <Plus size={15} />
              </button>
            </div>
          </div>

          <div className="ark-product-actions">
            <button
              type="button"
              className="ark-product-add-button"
              onClick={addToCart}
              disabled={adding}
            >
              {adding ? (
                <LoaderCircle size={17} />
              ) : (
                <ShoppingCart size={17} />
              )}

              {adding ? "Adding..." : "Add to Cart"}
            </button>

            <button
              type="button"
              className={`ark-product-favorite-button ${
                isFavorite ? "active" : ""
              }`}
              onClick={() => setIsFavorite((value) => !value)}
              aria-label={
                isFavorite
                  ? "Remove from favourites"
                  : "Add to favourites"
              }
            >
              <Heart
                size={19}
                fill={isFavorite ? "currentColor" : "none"}
              />
            </button>
          </div>

          <div className="ark-product-total">
            <span>Estimated item total</span>
            <strong>
              {formatCurrency(
                Number(product.price || 0) * quantity
              )}
            </strong>
          </div>

          {error && (
            <div className="ark-product-error" role="alert">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {notice && (
            <div className="ark-product-notice" role="status">
              <Check size={16} />
              <span>{notice}</span>
              <Link
                to="/cart"
                style={{
                  marginLeft: "auto",
                  color: "inherit",
                  fontWeight: 800,
                  whiteSpace: "nowrap",
                }}
              >
                View Cart
              </Link>
            </div>
          )}

          <div className="ark-product-benefits">
            <div className="ark-product-benefit">
              <ShieldCheck size={20} />
              <div>
                <strong>Quality Focus</strong>
                <span>Selected materials</span>
              </div>
            </div>

            <div className="ark-product-benefit">
              <Truck size={20} />
              <div>
                <strong>Delivery Support</strong>
                <span>Ask about delivery</span>
              </div>
            </div>

            <div className="ark-product-benefit">
              <Gem size={20} />
              <div>
                <strong>Stone Collection</strong>
                <span>Explore more options</span>
              </div>
            </div>
          </div>

          {Array.isArray(product.features) &&
            product.features.length > 0 && (
              <section className="ark-product-features">
                <h3>Product Highlights</h3>

                <div className="ark-product-feature-list">
                  {product.features.map((feature, index) => (
                    <div className="ark-product-feature" key={index}>
                      <Check size={15} />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
        </div>
      </section>

      {relatedProducts.length > 0 && (
        <section className="ark-product-related">
          <div className="ark-product-container">
            <div className="ark-product-related-heading">
              <div>
                <p>DISCOVER MORE</p>
                <h2>Related Products</h2>
              </div>

              <Link
                to="/store#collection"
                className="ark-product-related-link"
              >
                View All Products
                <ArrowRight size={15} />
              </Link>
            </div>

            <div className="ark-product-related-grid">
              {relatedProducts.map((item) => {
                const relatedImage =
                  item.image_url || item.image || "";

                return (
                  <article
                    className="ark-product-related-card"
                    key={item.id}
                  >
                    <div
                      className="ark-product-related-image"
                      style={{
                        background: item.color || "#e8e6e1",
                      }}
                    >
                      {relatedImage ? (
                        <img
                          src={relatedImage}
                          alt={item.name}
                          loading="lazy"
                        />
                      ) : (
                        <Gem size={42} />
                      )}
                    </div>

                    <div className="ark-product-related-content">
                      <h3>{item.name}</h3>
                      <p>{formatCurrency(item.price)}</p>

                      <Link to={`/store/product/${item.id}`}>
                        View Details
                        <ArrowRight size={13} />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <footer className="ark-product-footer">
        © {new Date().getFullYear()} ARK MARBLES. All rights reserved.
      </footer>
    </main>
  );
}