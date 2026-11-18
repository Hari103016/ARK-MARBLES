import { useState } from "react";
import { SlidersHorizontal, RotateCcw } from "lucide-react";

const COLORS = ["White", "Black", "Grey", "Beige", "Brown", "Green"];
const TYPES = ["Italian Marble", "Indian Marble", "Granite", "Onyx", "Travertine"];
const FINISHES = ["Polished", "Matte", "Honed", "Leather"];

export default function ProductFilters({
  onFilterChange,
  initialFilters = {},
}) {
  const [filters, setFilters] = useState({
    minPrice: initialFilters.minPrice ?? "",
    maxPrice: initialFilters.maxPrice ?? "",
    colors: initialFilters.colors ?? [],
    types: initialFilters.types ?? [],
    finishes: initialFilters.finishes ?? [],
    availability: initialFilters.availability ?? "all",
  });

  const [mobileOpen, setMobileOpen] = useState(false);

  const updateFilters = (updatedFilters) => {
    setFilters(updatedFilters);
    onFilterChange?.(updatedFilters);
  };

  const toggleOption = (key, value) => {
    const current = filters[key];

    const updated = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];

    updateFilters({ ...filters, [key]: updated });
  };

  const resetFilters = () => {
    const cleared = {
      minPrice: "",
      maxPrice: "",
      colors: [],
      types: [],
      finishes: [],
      availability: "all",
    };

    updateFilters(cleared);
  };

  const renderOptions = (title, key, options) => (
    <fieldset className="product-filter-group">
      <legend>{title}</legend>

      {options.map((option) => (
        <label className="product-filter-option" key={option}>
          <input
            type="checkbox"
            checked={filters[key].includes(option)}
            onChange={() => toggleOption(key, option)}
          />
          <span>{option}</span>
        </label>
      ))}
    </fieldset>
  );

  return (
    <aside className="product-filters">
      <div className="product-filters-header">
        <h2>
          <SlidersHorizontal size={19} />
          Filters
        </h2>

        <button
          type="button"
          className="product-filter-reset"
          onClick={resetFilters}
        >
          <RotateCcw size={15} />
          Clear all
        </button>

        <button
          type="button"
          className="product-filter-mobile-toggle"
          onClick={() => setMobileOpen((open) => !open)}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? "Hide filters" : "Show filters"}
        </button>
      </div>

      <div
        className={`product-filters-content${mobileOpen ? " is-open" : ""}`}
      >
        <fieldset className="product-filter-group">
          <legend>Price per sq. ft. (₹)</legend>

          <div className="product-filter-price">
            <label>
              <span className="sr-only">Minimum price</span>
              <input
                type="number"
                min="0"
                placeholder="Min"
                value={filters.minPrice}
                onChange={(event) =>
                  updateFilters({
                    ...filters,
                    minPrice: event.target.value,
                  })
                }
              />
            </label>

            <span>to</span>

            <label>
              <span className="sr-only">Maximum price</span>
              <input
                type="number"
                min="0"
                placeholder="Max"
                value={filters.maxPrice}
                onChange={(event) =>
                  updateFilters({
                    ...filters,
                    maxPrice: event.target.value,
                  })
                }
              />
            </label>
          </div>
        </fieldset>

        {renderOptions("Color", "colors", COLORS)}
        {renderOptions("Stone type", "types", TYPES)}
        {renderOptions("Finish", "finishes", FINISHES)}

        <fieldset className="product-filter-group">
          <legend>Availability</legend>

          {[
            { label: "All products", value: "all" },
            { label: "In stock", value: "available" },
            { label: "Out of stock", value: "unavailable" },
          ].map((option) => (
            <label className="product-filter-option" key={option.value}>
              <input
                type="radio"
                name="availability"
                value={option.value}
                checked={filters.availability === option.value}
                onChange={() =>
                  updateFilters({
                    ...filters,
                    availability: option.value,
                  })
                }
              />
              <span>{option.label}</span>
            </label>
          ))}
        </fieldset>
      </div>
    </aside>
  );
}