import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

export default function CategoryCard({ category }) {
  if (!category) return null;

  const id = category.id;
  const name =
    category.name || category.title || "Stone Collection";

  const image =
    category.image_url ||
    category.image ||
    category.thumbnail_url ||
    "/images/hero-marble.jpg";

  const description =
    category.description ||
    "Explore our premium natural stone collection.";

  const destination = id
    ? `/marbles?category=${encodeURIComponent(id)}`
    : `/categories`;

  return (
    <article className="category-card">
      <Link
        to={destination}
        className="category-card-image"
        aria-label={`Explore ${name}`}
      >
        <img
          src={image}
          alt={name}
          loading="lazy"
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = "/images/hero-marble.jpg";
          }}
        />

        <span className="category-card-arrow">
          <ArrowUpRight size={20} />
        </span>
      </Link>

      <div className="category-card-content">
        <h3>
          <Link to={destination}>{name}</Link>
        </h3>

        <p>{description}</p>

        <Link to={destination} className="category-card-link">
          Explore Collection
          <ArrowUpRight size={16} />
        </Link>
      </div>
    </article>
  );
}