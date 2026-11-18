import { Link } from "react-router-dom";
import {
  Gem,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Award,
  Palette,
  Headset,
  CheckCircle2,
} from "lucide-react";

export default function StoreAbout() {
  const features = [
    {
      icon: <Gem size={25} />,
      title: "Premium Materials",
      description:
        "Explore marble, granite, and other stone surfaces for residential and commercial projects.",
    },
    {
      icon: <ShieldCheck size={25} />,
      title: "Quality Focus",
      description:
        "Make informed choices with product details and specifications available for review.",
    },
    {
      icon: <Palette size={25} />,
      title: "Distinctive Designs",
      description:
        "Discover natural patterns, elegant finishes, and surfaces suited to different design styles.",
    },
    {
      icon: <Headset size={25} />,
      title: "Customer Support",
      description:
        "Get assistance with product selection, availability, and order-related questions.",
    },
  ];

  const benefits = [
    "A range of stone and surface categories",
    "Product details to support your selection",
    "A convenient online shopping experience",
    "Assistance with product and delivery enquiries",
  ];

  return (
    <main className="ark-about-page">
      <style>{`
        .ark-about-page {
          min-height: 100vh;
          background: #f8f7f4;
          color: #202a36;
          font-family: Inter, Arial, sans-serif;
        }

        .ark-about-page * {
          box-sizing: border-box;
        }

        .ark-about-container {
          width: min(1160px, calc(100% - 40px));
          margin: 0 auto;
        }

        .ark-about-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 23px 0;
          border-bottom: 1px solid #e8e5df;
        }

        .ark-about-brand {
          display: flex;
          align-items: center;
          gap: 11px;
          color: #17395f;
          text-decoration: none;
        }

        .ark-about-brand-icon {
          display: grid;
          place-items: center;
          width: 44px;
          height: 44px;
          border-radius: 5px;
          background: #17395f;
          color: #e5c58c;
        }

        .ark-about-brand h1 {
          margin: 0;
          font-size: 17px;
          letter-spacing: 1.7px;
        }

        .ark-about-brand p {
          margin: 4px 0 0;
          color: #858c96;
          font-size: 9px;
          letter-spacing: 1.4px;
        }

        .ark-about-back {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #526079;
          text-decoration: none;
          font-size: 12px;
          font-weight: 600;
        }

        .ark-about-back:hover {
          color: #a17b44;
        }

        .ark-about-hero {
          position: relative;
          display: flex;
          align-items: center;
          min-height: 420px;
          margin-top: 28px;
          padding: 55px;
          overflow: hidden;
          background:
            linear-gradient(
              90deg,
              rgba(14, 31, 51, 0.94) 0%,
              rgba(14, 31, 51, 0.78) 55%,
              rgba(14, 31, 51, 0.22) 100%
            ),
            url("https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1800&q=85")
            center / cover;
        }

        .ark-about-hero-content {
          position: relative;
          z-index: 1;
          max-width: 650px;
        }

        .ark-about-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 22px;
          color: #e5c58c;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 2.5px;
          text-transform: uppercase;
        }

        .ark-about-hero h2 {
          margin: 0;
          color: #fff;
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(38px, 5vw, 62px);
          font-weight: 400;
          line-height: 1.12;
        }

        .ark-about-hero h2 span {
          color: #e5c58c;
          font-style: italic;
        }

        .ark-about-hero p {
          max-width: 510px;
          margin: 22px 0 0;
          color: #d6dce5;
          font-size: 13px;
          line-height: 2;
        }

        .ark-about-primary-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          min-height: 48px;
          margin-top: 28px;
          padding: 0 22px;
          background: #e5c58c;
          color: #183a63;
          text-decoration: none;
          font-size: 11px;
          font-weight: 800;
          transition: background 180ms ease;
        }

        .ark-about-primary-link:hover {
          background: #f0d8a9;
        }

        .ark-about-intro {
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: center;
          gap: 65px;
          padding: 85px 0;
        }

        .ark-about-section-label {
          display: block;
          margin-bottom: 16px;
          color: #a17b44;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 2px;
          text-transform: uppercase;
        }

        .ark-about-intro h2,
        .ark-about-features-heading h2,
        .ark-about-commitment h2 {
          margin: 0;
          color: #183a63;
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(30px, 3.5vw, 43px);
          font-weight: 400;
          line-height: 1.25;
        }

        .ark-about-intro h2 span {
          color: #a17b44;
          font-style: italic;
        }

        .ark-about-intro-copy p {
          margin: 20px 0 0;
          color: #727c8a;
          font-size: 12px;
          line-height: 2;
        }

        .ark-about-benefits {
          display: flex;
          flex-direction: column;
          gap: 18px;
          padding: 28px;
          border: 1px solid #e7e4dc;
          background: #fff;
        }

        .ark-about-benefit {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          color: #4d5868;
          font-size: 12px;
          line-height: 1.7;
        }

        .ark-about-benefit svg {
          flex-shrink: 0;
          margin-top: 1px;
          color: #a17b44;
        }

        .ark-about-features {
          padding: 75px 0;
          background: #f0eee8;
        }

        .ark-about-features-heading {
          max-width: 650px;
          margin: 0 auto 40px;
          text-align: center;
        }

        .ark-about-features-heading p {
          margin: 17px 0 0;
          color: #77808d;
          font-size: 12px;
          line-height: 1.9;
        }

        .ark-about-features-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 18px;
        }

        .ark-about-feature-card {
          min-height: 225px;
          padding: 25px 21px;
          border: 1px solid #e2dfd7;
          background: #fff;
          transition: transform 180ms ease;
        }

        .ark-about-feature-card:hover {
          transform: translateY(-4px);
        }

        .ark-about-feature-icon {
          display: grid;
          place-items: center;
          width: 49px;
          height: 49px;
          margin-bottom: 23px;
          background: #edf1f6;
          color: #183a63;
        }

        .ark-about-feature-card h3 {
          margin: 0 0 11px;
          color: #183a63;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 20px;
          font-weight: 400;
        }

        .ark-about-feature-card p {
          margin: 0;
          color: #7b8490;
          font-size: 11px;
          line-height: 1.9;
        }

        .ark-about-commitment {
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: center;
          gap: 55px;
          padding: 85px 0;
        }

        .ark-about-commitment-image {
          min-height: 370px;
          background:
            url("https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1100&q=85")
            center / cover;
        }

        .ark-about-commitment-copy p {
          margin: 20px 0 0;
          color: #727c8a;
          font-size: 12px;
          line-height: 2;
        }

        .ark-about-commitment-link {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          margin-top: 25px;
          color: #183a63;
          text-decoration: none;
          font-size: 11px;
          font-weight: 800;
        }

        .ark-about-commitment-link:hover {
          color: #a17b44;
        }

        .ark-about-cta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 25px;
          margin-bottom: 65px;
          padding: 40px;
          background: #183a63;
          color: #fff;
        }

        .ark-about-cta h2 {
          margin: 0 0 10px;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 29px;
          font-weight: 400;
        }

        .ark-about-cta p {
          margin: 0;
          color: #d0d8e4;
          font-size: 11px;
          line-height: 1.8;
        }

        .ark-about-footer {
          padding: 25px 0;
          border-top: 1px solid #e8e5df;
          color: #9299a3;
          font-size: 10px;
          text-align: center;
        }

        @media (max-width: 900px) {
          .ark-about-features-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .ark-about-intro,
          .ark-about-commitment {
            gap: 30px;
          }

          .ark-about-hero {
            padding: 40px;
          }
        }

        @media (max-width: 600px) {
          .ark-about-container {
            width: calc(100% - 28px);
          }

          .ark-about-hero {
            min-height: 420px;
            padding: 28px;
            background-position: center;
          }

          .ark-about-intro,
          .ark-about-commitment {
            grid-template-columns: minmax(0, 1fr);
            padding: 55px 0;
          }

          .ark-about-benefits {
            padding: 22px;
          }

          .ark-about-features {
            padding: 55px 0;
          }

          .ark-about-features-grid {
            grid-template-columns: minmax(0, 1fr);
          }

          .ark-about-feature-card {
            min-height: auto;
          }

          .ark-about-commitment-image {
            min-height: 270px;
          }

          .ark-about-cta {
            align-items: flex-start;
            flex-direction: column;
            padding: 28px;
          }
        }
      `}</style>

      <div className="ark-about-container">
        <header className="ark-about-header">
          <Link to="/store" className="ark-about-brand">
            <span className="ark-about-brand-icon">
              <Gem size={24} />
            </span>

            <span>
              <h1>ARK MARBLES</h1>
              <p>PREMIUM STONE COLLECTIONS</p>
            </span>
          </Link>

          <Link to="/store" className="ark-about-back">
            <ArrowLeft size={16} />
            Back to Store
          </Link>
        </header>

        <section className="ark-about-hero">
          <div className="ark-about-hero-content">
            <div className="ark-about-eyebrow">
              <Gem size={16} />
              About ARK MARBLES
            </div>

            <h2>
              Natural Beauty.
              <br />
              <span>Timeless Spaces.</span>
            </h2>

            <p>
              Discover stone surfaces that bring character, elegance,
              and lasting style to the spaces you create. ARK MARBLES
              helps you explore materials for a wide range of design
              and construction projects.
            </p>

            <Link
              to="/store#collection"
              className="ark-about-primary-link"
            >
              Explore Our Collection
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>

        <section className="ark-about-intro">
          <div className="ark-about-intro-copy">
            <span className="ark-about-section-label">
              Our Approach
            </span>

            <h2>
              Stone that brings
              <br />
              <span>your vision to life.</span>
            </h2>

            <p>
              Choosing the right stone is an important part of creating
              a beautiful and functional space. From flooring and wall
              finishes to kitchen surfaces and architectural details,
              the material you select can shape the entire design.
            </p>

            <p>
              Our online store is designed to help you discover
              available categories, review product information, and
              shortlist surfaces for your project.
            </p>
          </div>

          <div className="ark-about-benefits">
            {benefits.map((benefit) => (
              <div className="ark-about-benefit" key={benefit}>
                <CheckCircle2 size={19} />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="ark-about-features">
        <div className="ark-about-container">
          <div className="ark-about-features-heading">
            <span className="ark-about-section-label">
              The ARK Difference
            </span>

            <h2>Designed Around Your Needs</h2>

            <p>
              Explore a shopping experience focused on product
              discovery, design possibilities, and helpful customer
              information.
            </p>
          </div>

          <div className="ark-about-features-grid">
            {features.map((feature) => (
              <article
                className="ark-about-feature-card"
                key={feature.title}
              >
                <div className="ark-about-feature-icon">
                  {feature.icon}
                </div>

                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <div className="ark-about-container">
        <section className="ark-about-commitment">
          <div className="ark-about-commitment-image" />

          <div className="ark-about-commitment-copy">
            <span className="ark-about-section-label">
              Made for Your Project
            </span>

            <h2>
              Find the right surface
              <br />
              for your space.
            </h2>

            <p>
              Every project has its own requirements. Consider the
              appearance, intended use, maintenance needs, and
              specifications of each material before making your
              selection.
            </p>

            <p>
              Product availability, dimensions, pricing, and delivery
              arrangements should be confirmed before placing an order.
            </p>

            <Link
              to="/store#collection"
              className="ark-about-commitment-link"
            >
              Browse Products
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>

        <section className="ark-about-cta">
          <div>
            <h2>Ready to explore our collections?</h2>
            <p>
              Browse stone surfaces and discover options for your next
              residential or commercial project.
            </p>
          </div>

          <Link
            to="/store#collection"
            className="ark-about-primary-link"
          >
            Shop Collections
            <ArrowRight size={16} />
          </Link>
        </section>

        <footer className="ark-about-footer">
          © {new Date().getFullYear()} ARK MARBLES · Premium Stone Collections
        </footer>
      </div>
    </main>
  );
}