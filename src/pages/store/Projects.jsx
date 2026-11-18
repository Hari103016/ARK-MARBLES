
import { Link } from "react-router-dom";

import {
  ArrowUpRight,
  MapPin,
} from "lucide-react";

import "./Projects.css";

const projects = [
  {
    id: 1,
    title: "Luxury Hotel Lobby",
    category: "Commercial Interior",
    location: "Design Concept",
    description:
      "An elegant hotel lobby featuring premium marble flooring, a statement reception desk and warm gold lighting.",
    image: "/images/projects/project-1.png",
  },
  {
    id: 2,
    title: "Luxury Villa Living Room",
    category: "Residential",
    location: "Design Concept",
    description:
      "A sophisticated living space with marble flooring, a feature wall and contemporary architectural finishes.",
    image: "/images/projects/project-2.png",
  },
  {
    id: 3,
    title: "Premium Marble Bathroom",
    category: "Bathroom Design",
    location: "Design Concept",
    description:
      "A luxurious bathroom with marble wall cladding, elegant brass fittings and a modern vanity.",
    image: "/images/projects/project-3.png",
  },
  {
    id: 4,
    title: "Modern Marble Kitchen",
    category: "Kitchen Design",
    location: "Design Concept",
    description:
      "A contemporary kitchen featuring a marble waterfall island, premium countertops and refined finishes.",
    image: "/images/projects/project-4.png",
  },
  {
    id: 5,
    title: "Luxury Dining Interior",
    category: "Residential",
    location: "Design Concept",
    description:
      "An elegant dining area with a statement marble table, polished flooring and sophisticated lighting.",
    image: "/images/projects/project-5.png",
  },
  {
    id: 6,
    title: "Premium Bedroom Interior",
    category: "Bedroom Design",
    location: "Design Concept",
    description:
      "A refined bedroom featuring marble flooring, a dramatic feature wall and warm ambient lighting.",
    image: "/images/projects/project-6.png",
  },
  {
    id: 7,
    title: "Designer TV Lounge",
    category: "Living Room",
    location: "Design Concept",
    description:
      "A contemporary entertainment space with a full-height marble TV wall and illuminated display shelves.",
    image: "/images/projects/project-7.png",
  },
];

export default function Projects() {
  return (
    <main className="ark-projects-page">

      {/* HERO SECTION */}

      <section className="ark-projects-hero">

        <div className="ark-projects-hero-content">

          <span className="ark-eyebrow">
            OUR WORK • OUR QUALITY
          </span>

          <h1>
            Spaces Designed
            <br />
            with <span>Excellence.</span>
          </h1>

          <p>
            Explore inspiring luxury interiors, premium marble
            surfaces and contemporary architectural designs.
            Discover the possibilities with ARK MARBLES.
          </p>

          <div className="ark-projects-hero-actions">

            <a
              href="#project-gallery"
              className="ark-gold-button"
            >
              Explore Projects
              <ArrowUpRight size={18} />
            </a>

            <Link
              to="/contact#quote"
              className="ark-outline-button"
            >
              Start Your Project
            </Link>

          </div>

        </div>

        {/* HERO IMAGE */}

        <div className="ark-projects-hero-image">

          <img
            src="/images/projects/project-1.png"
            alt="Luxury marble hotel lobby concept"
            fetchPriority="high"
          />

          <div className="ark-projects-image-overlay">
            <span>ARK MARBLES</span>
            <p>Premium Spaces. Timeless Elegance.</p>
          </div>

        </div>

      </section>

      {/* INTRODUCTION */}

      <section className="ark-projects-intro">

        <div>

          <span className="ark-eyebrow">
            OUR PORTFOLIO
          </span>

          <h2>
            Creating Spaces That
            <br />
            <span>Make an Impression</span>
          </h2>

        </div>

        <p>
          From elegant living spaces to modern kitchens and
          commercial interiors, explore premium marble
          applications and inspiring design concepts.
        </p>

      </section>

      {/* PROJECT GALLERY */}

      <section
        className="ark-project-gallery"
        id="project-gallery"
      >

        <div className="ark-section-heading">

          <div>

            <span className="ark-eyebrow">
              DESIGN INSPIRATION
            </span>

            <h2>Our Projects</h2>

          </div>

          <span className="ark-project-count">
            {String(projects.length).padStart(2, "0")} PROJECTS
          </span>

        </div>

        <div className="ark-project-grid">

          {projects.map((project) => (

            <article
              className="ark-project-card"
              key={project.id}
            >

              {/* PROJECT IMAGE */}

              <div className="ark-project-image">

                <img
                  src={project.image}
                  alt={project.title}
                  loading="lazy"
                />

                <span className="ark-project-category">
                  {project.category}
                </span>

                <Link
                  to="/contact#quote"
                  className="ark-project-open"
                  aria-label={`Enquire about ${project.title}`}
                >
                  <ArrowUpRight size={21} />
                </Link>

              </div>

              {/* PROJECT DETAILS */}

              <div className="ark-project-details">

                <div className="ark-project-location">
                  <MapPin size={14} />
                  {project.location}
                </div>

                <h3>{project.title}</h3>

                <p>{project.description}</p>

                <Link
                  to="/contact#quote"
                  className="ark-project-link"
                >
                  Enquire About a Similar Project
                  <ArrowUpRight size={16} />
                </Link>

              </div>

            </article>

          ))}

        </div>

      </section>

      {/* BOTTOM CTA */}

      <section className="ark-project-cta">

        <div>

          <span className="ark-eyebrow">
            HAVE A PROJECT IN MIND?
          </span>

          <h2>
            Let's Create Something
            <span> Exceptional.</span>
          </h2>

          <p>
            Tell us about your project and let us help
            you choose the right materials.
          </p>

        </div>

        <Link
          to="/contact#quote"
          className="ark-gold-button"
        >
          Request a Quote
          <ArrowUpRight size={18} />
        </Link>

      </section>

    </main>
  );
}
