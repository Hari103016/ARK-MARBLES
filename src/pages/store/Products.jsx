
import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";

import { getMarbles } from "../../services/marbleService";
import MarbleCard from "../../components/common/store/MarbleCard";

import "./Products.css";

export default function Products() {
  const [marbles, setMarbles] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProducts() {
      try {
        setLoading(true);
        setError("");

        const products = await getMarbles();

        if (active) {
          setMarbles(products);
        }
      } catch (err) {
        if (active) {
          setError(err.message || "Unable to load products.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      active = false;
    };
  }, []);

  const categories = useMemo(() => {
    const names = marbles
      .map((marble) => marble.category)
      .filter(Boolean);

    return ["All", ...new Set(names)];
  }, [marbles]);

  const filteredMarbles = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    return marbles.filter((marble) => {
      const matchesCategory =
        category === "All" || marble.category === category;

      const matchesSearch =
        !searchTerm ||
        String(marble.name ?? "").toLowerCase().includes(searchTerm) ||
        String(marble.description ?? "").toLowerCase().includes(searchTerm) ||
        String(marble.color ?? "").toLowerCase().includes(searchTerm);

      return matchesCategory && matchesSearch;
    });
  }, [marbles, search, category]);

  function clearFilters() {
    setSearch("");
    setCategory("All");
  }

  return (
    <main className="products-page">
      <section className="products-hero">
        <span className="products-eyebrow">ARK MARBLES COLLECTION</span>
        <h1>Explore Our Stone Collection</h1>
        <p>
          Discover premium marble and natural stone for your
          home, commercial space, or next project.
        </p>
      </section>

      <section className="products-container">
        <div className="products-toolbar">
          <div className="products-search">
            <Search size={19} aria-hidden="true" />

            <input
              type="search"
              placeholder="Search marble by name, color..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search marble products"
            />

            {search && (
              <button
                type="button"
                className="products-clear-search"
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                <X size={17} />
              </button>
            )}
          </div>

          <div className="products-filter-label">
            <SlidersHorizontal size={17} />
            <span>Category</span>
          </div>

          <select
            className="products-category-select"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            aria-label="Filter by category"
          >
            {categories.map((name) => (
              <option key={name} value={name}>
                {name === "All" ? "All Categories" : name}
              </option>
            ))}
          </select>

          {(search || category !== "All") && (
            <button
              type="button"
              className="products-reset-button"
              onClick={clearFilters}
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="products-results-heading">
          <div>
            <h2>
              {category === "All" ? "All Marbles" : category}
            </h2>

            <p>
              {loading
                ? "Loading collection..."
                : `${filteredMarbles.length} ${
                    filteredMarbles.length === 1 ? "product" : "products"
                  } found`}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="products-message" role="status">
            Loading our marble collection...
          </div>
        ) : error ? (
          <div className="products-message products-error" role="alert">
            <p>{error}</p>

            <button
              type="button"
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </div>
        ) : filteredMarbles.length > 0 ? (
          <div className="products-grid">
            {filteredMarbles.map((marble) => (
              <MarbleCard key={marble.id} marble={marble} />
            ))}
          </div>
        ) : (
          <div className="products-message">
            <h3>No products found</h3>
            <p>Try another search term or select a different category.</p>

            <button
              type="button"
              className="products-reset-button"
              onClick={clearFilters}
            >
              Clear filters
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
