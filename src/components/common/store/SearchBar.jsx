import { useState } from "react";
import { Search, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function SearchBar({
  initialValue = "",
  placeholder = "Search marble, granite, and natural stone...",
  onSearch,
  className = "",
}) {
  const [query, setQuery] = useState(initialValue);
  const navigate = useNavigate();

  const handleSubmit = (event) => {
    event.preventDefault();

    const searchTerm = query.trim();

    if (onSearch) {
      onSearch(searchTerm);
      return;
    }

    if (searchTerm) {
      navigate(`/marbles?search=${encodeURIComponent(searchTerm)}`);
    } else {
      navigate("/marbles");
    }
  };

  const clearSearch = () => {
    setQuery("");

    if (onSearch) {
      onSearch("");
    }
  };

  return (
    <form
      className={`search-bar ${className}`.trim()}
      role="search"
      onSubmit={handleSubmit}
    >
      <Search size={20} aria-hidden="true" />

      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={placeholder}
        aria-label="Search marble products"
      />

      {query && (
        <button
          type="button"
          className="search-bar-clear"
          onClick={clearSearch}
          aria-label="Clear search"
        >
          <X size={18} />
        </button>
      )}

      <button type="submit" className="button-primary">
        Search
      </button>
    </form>
  );
}