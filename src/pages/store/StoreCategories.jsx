import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Gem,
  ArrowLeft,
  ArrowRight,
  Layers3,
  Search,
  Grid2X2,
  AlertCircle,
} from "lucide-react";

const sampleCategories = [
  {
    name: "Marble",
    description: "Elegant natural marble for premium interiors.",
    count: "Explore collection",
    image:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Granite",
    description: "Durable stone surfaces for kitchens and projects.",
    count: "Explore collection",
    image:
      "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Quartz",
    description: "Contemporary surfaces for modern spaces.",
    count: "Explore collection",
    image:
      "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Tiles",
    description: "Stylish flooring and wall finishes.",
    count: "Explore collection",
    image:
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Travertine",
    description: "Natural textures with timeless character.",
    count: "Explore collection",
    image:
      "https://images.unsplash.com/photo-1600607687644-c7171b42498f?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Onyx",
    description: "Distinctive stone patterns for statement spaces.",
    count: "Explore collection",
    image:
      "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=900&q=80",
  },
];

export default function StoreCategories() {
  const [categories, setCategories] = useState(sampleCategories);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadCategories() {
      try {
        const { default: supabase } = await import("../../lib/supabase");

        const { data, error: queryError } = await supabase
          .from("categories")
          .select("*")
          .order("name", { ascending: true });

        if (queryError) throw queryError;

        if (active && Array.isArray(data) && data.length > 0) {
          setCategories(
            data.map((category, index) => ({
              ...category,
              name: category.name || category.title || "Category",
              description:
                category.description ||
                "Explore our stone and surface collection.",
              image:
                category.image_url ||
                category.image ||
                sampleCategories[index % sampleCategories.length].image,
              count: "Explore collection",
            }))
          );
          setError("");
        }
      } catch {
        if (active) {
          // Keep the sample categories visible if the database
          // table is not available or has not been configured.
        }
      }
    }

    loadCategories();

    return () => {
      active = false;
    };
  }, []);

  const filteredCategories = categories.filter((category) =>
    `${category.name} ${category.description}`
      .toLowerCase()
      .includes(search.toLowerCase().trim())
  );

  return (
    <main className="ark-categories-page">
      <style>{`
        .ark-categories-page {
          min-height: 100vh;
          background: #f7f7f5;
          color: #202a36;
          font-family: Inter, Arial, sans-serif;
        }

        .ark-categories-page * {
          box-sizing: border-box;
        }

        .ark-categories-container {
          width: min(1180px, calc(100% - 40px));
          margin: 0 auto;
        }

        .ark-categories-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 24px 0;
          border-bottom: 1px solid #e7e5df;
        }

        .ark-categories-brand {
          display: flex;
          align-items: center;
          gap: 11px;
          color: #17395f;
          text-decoration: none;
        }

        .ark-categories-brand-mark {
          display: grid;
          place-items: center;
          width: 43px;
          height: 43px;
          background: #17395f;
          color: #e7c994;
          border-radius: 5px;
        }

        .ark-categories-brand h1 {
          margin: 0;
          font-size: 17px;
          letter-spacing: 1.8px;
        }

        .ark-categories-brand p {
          margin: 4px 0 0;
          color: #878a8e;
          font-size: 9px;
          letter-spacing: 1.4px;
        }

        .ark-categories-nav {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .ark-categories-nav a {
          color: #596272;
          text-decoration: none;
          font-size: 12px;
          font-weight: 600;
        }

        .ark-categories-nav a:hover {
          color: #17395f;
        }

        .ark-categories-back {
          display: inline-flex;
          align-items: center;
          gap: 7px;
        }

        .ark-categories-hero {
          padding: 65px 0 43px;
          text-align: center;
        }

        .ark-categories-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 17px;
          color: #a27b45;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 2.5px;
          text-transform: uppercase;
        }

        .ark-categories-hero h2 {
          margin: 0;
          color: #183a63;
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(35px, 5vw, 55px);
          font-weight: 400;
          line-height: 1.15;
        }

        .ark-categories-hero h2 span {
          color: #a17b44;
          font-style: italic;
        }

        .ark-categories-hero p {
          max-width: 600px;
          margin: 19px auto 0;
          color: #777f8c;
          font-size: 13px;
          line-height: 1.9;
        }

        .ark-categories-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin: 8px 0 25px;
          flex-wrap: wrap;
        }

        .ark-categories-toolbar h3 {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 0;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 22px;
          font-weight: 400;
        }

        .ark-categories-total {
          color: #8b9098;
          font-family: Inter, Arial, sans-serif;
          font-size: 11px;
        }

        .ark-categories-search {
          display: flex;
          align-items: center;
          gap: 10px;
          width: min(300px, 100%);
          height: 43px;
          padding: 0 13px;
          border: 1px solid #e1e3e7;
          border-radius: 5px;
          background: #fff;
          color: #7c8490;
        }

        .ark-categories-search input {
          width: 100%;
          border: 0;
          outline: 0;
          background: transparent;
          color: #202a36;
          font-family: inherit;
          font-size: 12px;
        }

        .ark-categories-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 23px;
          padding-bottom: 70px;
        }

        .ark-category-card {
          overflow: hidden;
          border: 1px solid #e9e7e1;
          background: #fff;
          transition: transform 180ms ease, box-shadow 180ms ease;
        }

        .ark-category-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 15px 35px rgba(25, 39, 57, 0.09);
        }

        .ark-category-image {
          position: relative;
          height: 235px;
          overflow: hidden;
          background: #e8e5de;
        }

        .ark-category-image img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
          transition: transform 300ms ease;
        }

        .ark-category-card:hover .ark-category-image img {
          transform: scale(1.045);
        }

        .ark-category-image-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            180deg,
            transparent 45%,
            rgba(0, 0, 0, 0.35)
          );
        }

        .ark-category-image-label {
          position: absolute;
          bottom: 16px;
          left: 18px;
          color: #fff;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1.6px;
          text-transform: uppercase;
        }

        .ark-category-body {
          padding: 22px;
        }

        .ark-category-body h4 {
          margin: 0 0 10px;
          color: #183a63;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 25px;
          font-weight: 400;
        }

        .ark-category-body p {
          min-height: 42px;
          margin: 0;
          color: #7c8490;
          font-size: 11px;
          line-height: 1.8;
        }

        .ark-category-link {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-top: 20px;
          padding-top: 15px;
          border-top: 1px solid #eeece7;
          color: #a17b44;
          text-decoration: none;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .ark-category-link svg {
          transition: transform 180ms ease;
        }

        .ark-category-link:hover svg {
          transform: translateX(4px);
        }

        .ark-categories-empty {
          grid-column: 1 / -1;
          padding: 55px 20px;
          border: 1px solid #e9e7e1;
          background: #fff;
          text-align: center;
          color: #7c8490;
          font-size: 13px;
        }

        .ark-categories-cta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 25px;
          margin-bottom: 65px;
          padding: 35px;
          background: #183a63;
          color: white;
        }

        .ark-categories-cta h3 {
          margin: 0 0 9px;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 27px;
          font-weight: 400;
        }

        .ark-categories-cta p {
          margin: 0;
          color: #d0d8e4;
          font-size: 11px;
          line-height: 1.8;
        }

        .ark-categories-cta a {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          min-height: 44px;
          padding: 0 19px;
          background: #e5c58c;
          color: #183a63;
          text-decoration: none;
          font-size: 11px;
          font-weight: 800;
          white-space: nowrap;
        }

        .ark-categories-footer {
          padding: 25px 0;
          border-top: 1px solid #e7e5df;
          color: #9299a3;
          font-size: 10px;
          text-align: center;
        }

        @media (max-width: 850px) {
          .ark-categories-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .ark-categories-nav {
            gap: 15px;
          }

          .ark-category-image {
            height: 210px;
          }
        }

        @media (max-width: 560px) {
          .ark-categories-container {
            width: calc(100% - 28px);
          }

          .ark-categories-nav a:not(.ark-categories-back) {
            display: none;
          }

          .ark-categories-hero {
            padding: 45px 0 35px;
          }

          .ark-categories-grid {
            grid-template-columns: minmax(0, 1fr);
            gap: 17px;
          }

          .ark-category-image {
            height: 235px;
          }

          .ark-categories-cta {
            align-items: flex-start;
            flex-direction: column;
            padding: 25px;
          }

          .ark-categories-toolbar {
            align-items: flex-start;
            flex-direction: column;
          }

          .ark-categories-search {
            width: 100%;
          }
        }
      `}</style>

      <div className="ark-categories-container">
        <header className="ark-categories-header">
          <Link to="/store" className="ark-categories-brand">
            <span className="ark-categories-brand-mark">
              <Gem size={24} />
            </span>
            <span>
              <h1>ARK MARBLES</h1>
              <p>PREMIUM STONE COLLECTIONS</p>
            </span>
          </Link>

          <nav className="ark-categories-nav">
            <Link to="/store">Home</Link>
            <Link to="/store#collection">Products</Link>
            <Link to="/cart">Cart</Link>
            <Link to="/store" className="ark-categories-back">
              <ArrowLeft size={14} />
              Back to Store
            </Link>
          </nav>
        </header>

        <section className="ark-categories-hero">
          <div className="ark-categories-eyebrow">
            <Layers3 size={15} />
            Discover Our Collections
          </div>

          <h2>
            Materials for
            <br />
            <span>Exceptional Spaces</span>
          </h2>

          <p>
            Explore our range of stone surfaces and finishes, selected
            to bring quality, character, and lasting style to your
            residential and commercial projects.
          </p>
        </section>

        <section>
          <div className="ark-categories-toolbar">
            <h3>
              Browse Categories
              <span className="ark-categories-total">
                ({filteredCategories.length})
              </span>
            </h3>

            <label className="ark-categories-search">
              <Search size={17} />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search stone categories..."
                aria-label="Search categories"
              />
            </label>
          </div>

          <div className="ark-categories-grid">
            {filteredCategories.length === 0 ? (
              <div className="ark-categories-empty">
                <AlertCircle
                  size={24}
                  style={{ marginBottom: 10 }}
                />
                <p>No categories match your search.</p>
              </div>
            ) : (
              filteredCategories.map((category, index) => (
                <article
                  className="ark-category-card"
                  key={category.id ?? category.name ?? index}
                >
                  <div className="ark-category-image">
                    <img
                      src={category.image}
                      alt={category.name}
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                    />
                    <div className="ark-category-image-overlay" />
                    <span className="ark-category-image-label">
                      ARK Collections
                    </span>
                  </div>

                  <div className="ark-category-body">
                    <h4>{category.name}</h4>
                    <p>{category.description}</p>

                    <Link
                      to={`/store?category=${encodeURIComponent(
                        category.name
                      )}#collection`}
                      className="ark-category-link"
                    >
                      Explore Collection
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="ark-categories-cta">
          <div>
            <h3>Need help choosing the right stone?</h3>
            <p>
              Explore our products and compare the available finishes
              for your next project.
            </p>
          </div>

          <Link to="/store#collection">
            View All Products
            <ArrowRight size={16} />
          </Link>
        </section>

        <footer className="ark-categories-footer">
          © {new Date().getFullYear()} ARK MARBLES · Premium Stone Collections
        </footer>
      </div>
    </main>
  );
}