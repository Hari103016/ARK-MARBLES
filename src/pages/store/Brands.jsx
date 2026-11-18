
import { Link } from "react-router-dom";

import {
  ArrowUpRight,
  Gem,
  Layers,
  Building2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import "./Brands.css";

const brandCategories = [
  {
    id: 1,
    number: "01",
    title: "Marble & Natural Stone",
    description:
      "Explore premium natural marble, granite and decorative stone collections.",
    icon: Gem,
    label: "STONE COLLECTION",
    image: "/images/brands/marble-natural-stone.png",
  },
  {
    id: 2,
    number: "02",
    title: "Tiles & Surfaces",
    description:
      "Discover elegant floor tiles, wall tiles and modern surface finishes.",
    icon: Layers,
    label: "TILES COLLECTION",
    image: "/images/brands/tiles-surfaces.png",
  },
  {
    id: 3,
    number: "03",
    title: "Construction Materials",
    description:
      "Quality materials for residential and commercial construction.",
    icon: Building2,
    label: "BUILDING MATERIALS",
    image: "/images/brands/construction-materials.png",
  },
];

const brandHighlights = [
  {
    icon: ShieldCheck,
    title: "Quality Selection",
    description:
      "Carefully selected products from trusted suppliers.",
  },
  {
    icon: Sparkles,
    title: "Premium Collections",
    description:
      "Materials selected for design, finish and durability.",
  },
  {
    icon: Gem,
    title: "Wide Variety",
    description:
      "Multiple materials and finishes for different projects.",
  },
];

export default function Brands() {
  return (
    <main className="ark-brands-page">

      {/* HERO SECTION */}

      <section className="ark-brands-hero">

        <div className="ark-brands-hero-content">

          <span className="ark-eyebrow">
            OUR BRANDS • OUR COLLECTIONS
          </span>

          <h1>
            Quality Brands.
            <br />
            <span>Exceptional Spaces.</span>
          </h1>

          <p>
            Explore the product collections and material categories
            available at ARK MARBLES for your home and construction projects.
          </p>

          <Link
            to="/contact#quote"
            className="ark-brand-gold-button"
          >
            Enquire About Products
            <ArrowUpRight size={18} />
          </Link>

        </div>

        {/* HERO IMAGE */}

        <div className="ark-brands-hero-image-wrapper">

          <img
            className="ark-brands-hero-image"
            src="/images/brands/brands-hero.png"
            alt="ARK MARBLES luxury marble showroom concept"
          />

          <div className="ark-brands-hero-image-caption">
            <span>ARK MARBLES</span>
            <p>Premium Marble & Stone Collections</p>
          </div>

        </div>

      </section>

      {/* INTRODUCTION */}

      <section className="ark-brands-intro">

        <div>
          <span className="ark-eyebrow">
            DISCOVER OUR RANGE
          </span>

          <h2>
            Find the Right Materials
            <br />
            for <span>Your Vision.</span>
          </h2>
        </div>

        <p>
          At ARK MARBLES, we bring together a selection of
          marble, tiles and construction materials to help
          you create spaces with lasting quality and style.
        </p>

      </section>

      {/* CATEGORY SECTION */}

      <section className="ark-brand-categories">

        <div className="ark-brand-section-heading">

          <div>
            <span className="ark-eyebrow">
              EXPLORE OUR COLLECTIONS
            </span>

            <h2>Product Categories</h2>
          </div>

        </div>

        <div className="ark-brand-category-grid">

          {brandCategories.map((category) => {

            const CategoryIcon = category.icon;

            return (
              <article
                className="ark-brand-category-card"
                key={category.id}
              >

                {/* CATEGORY IMAGE */}

                <div className="ark-brand-category-image">

                  <img
                    src={category.image}
                    alt={category.title}
                    loading="lazy"
                  />

                  <span className="ark-brand-number">
                    {category.number}
                  </span>

                  <div className="ark-brand-image-icon">
                    <CategoryIcon
                      size={25}
                      strokeWidth={1.6}
                    />
                  </div>

                </div>

                {/* CATEGORY CONTENT */}

                <div className="ark-brand-category-content">

                  <span className="ark-brand-label">
                    {category.label}
                  </span>

                  <h3>{category.title}</h3>

                  <p>{category.description}</p>

                  <Link
                    to="/contact#quote"
                    className="ark-brand-explore"
                  >
                    Enquire Now
                    <ArrowUpRight size={17} />
                  </Link>

                </div>

              </article>
            );

          })}

        </div>

      </section>

      {/* WHY ARK MARBLES */}

      <section className="ark-brand-highlights">

        <div className="ark-brand-highlight-heading">

          <span className="ark-eyebrow">
            THE ARK MARBLES DIFFERENCE
          </span>

          <h2>
            More Than Materials.
            <br />
            <span>A Better Experience.</span>
          </h2>

        </div>

        <div className="ark-brand-highlight-grid">

          {brandHighlights.map((item, index) => {

            const HighlightIcon = item.icon;

            return (
              <div
                className="ark-brand-highlight"
                key={index}
              >

                <div className="ark-brand-highlight-icon">
                  <HighlightIcon size={28} />
                </div>

                <h3>{item.title}</h3>

                <p>{item.description}</p>

              </div>
            );

          })}

        </div>

      </section>

      {/* BOTTOM CTA */}

      <section className="ark-brands-cta">

        <div>

          <span className="ark-eyebrow">
            NEED HELP CHOOSING?
          </span>

          <h2>
            Let's Find the Perfect
            <span> Materials.</span>
          </h2>

          <p>
            Contact our team for product details, availability
            and customised quotations.
          </p>

        </div>

        <Link
          to="/contact#quote"
          className="ark-brand-gold-button"
        >
          Request a Quote
          <ArrowUpRight size={18} />
        </Link>

      </section>

    </main>
  );
}
