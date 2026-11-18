import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Gem,
  ArrowLeft,
  ArrowRight,
  MapPin,
  Phone,
  Mail,
  Clock,
  MessageCircle,
  Send,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export default function StoreContact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "Product Enquiry",
    message: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess(false);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError("Please complete your name, email address, and message.");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(form.email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    const phone = form.phone.trim();

    if (phone && !/^[+()\d\s-]{7,20}$/.test(phone)) {
      setError("Please enter a valid phone number.");
      return;
    }

    const subject = encodeURIComponent(
      `ARK MARBLES Enquiry: ${form.subject}`
    );

    const body = encodeURIComponent(
      `Name: ${form.name.trim()}\n` +
      `Email: ${form.email.trim()}\n` +
      `Phone: ${phone || "Not provided"}\n` +
      `Subject: ${form.subject}\n\n` +
      `Message:\n${form.message.trim()}`
    );

    // Replace this address with your actual business email.
    const businessEmail = "your-business-email@example.com";

    if (businessEmail === "your-business-email@example.com") {
      setError(
        "The contact form is ready, but the business email must be configured before enquiries can be sent."
      );
      return;
    }

    window.location.href =
      `mailto:${businessEmail}?subject=${subject}&body=${body}`;

    setSuccess(true);
  };

  const handleWhatsApp = () => {
    // Replace this placeholder with your business WhatsApp number.
    const businessWhatsApp = "";

    if (!businessWhatsApp.trim()) {
      setError(
        "Add your business WhatsApp number in StoreContact.jsx to enable WhatsApp enquiries."
      );
      return;
    }

    const message = encodeURIComponent(
      "Hello ARK MARBLES, I would like to enquire about your marble and stone products."
    );

    window.open(
      `https://wa.me/${businessWhatsApp.replace(/\D/g, "")}?text=${message}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const contactCards = [
    {
      icon: <Phone size={22} />,
      title: "Phone Support",
      description: "Speak with our team about products and availability.",
      detail: "Add your business phone number",
    },
    {
      icon: <Mail size={22} />,
      title: "Email Enquiries",
      description: "Send product questions and project requirements.",
      detail: "Configure your business email",
    },
    {
      icon: <Clock size={22} />,
      title: "Business Hours",
      description: "Contact us during your published business hours.",
      detail: "Add your actual working hours",
    },
  ];

  return (
    <main className="ark-contact-page">
      <style>{`
        .ark-contact-page {
          min-height: 100vh;
          background: #f7f7f5;
          color: #202a36;
          font-family: Inter, Arial, sans-serif;
        }

        .ark-contact-page * {
          box-sizing: border-box;
        }

        .ark-contact-container {
          width: min(1160px, calc(100% - 40px));
          margin: 0 auto;
        }

        .ark-contact-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 23px 0;
          border-bottom: 1px solid #e6e4de;
        }

        .ark-contact-brand {
          display: flex;
          align-items: center;
          gap: 11px;
          color: #183a63;
          text-decoration: none;
        }

        .ark-contact-brand-icon {
          display: grid;
          place-items: center;
          width: 43px;
          height: 43px;
          border-radius: 5px;
          background: #183a63;
          color: #e5c58c;
        }

        .ark-contact-brand h1 {
          margin: 0;
          font-size: 17px;
          letter-spacing: 1.7px;
        }

        .ark-contact-brand p {
          margin: 4px 0 0;
          color: #858c96;
          font-size: 9px;
          letter-spacing: 1.4px;
        }

        .ark-contact-back {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #526079;
          text-decoration: none;
          font-size: 12px;
          font-weight: 600;
        }

        .ark-contact-hero {
          padding: 65px 0 45px;
          text-align: center;
        }

        .ark-contact-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 17px;
          color: #a17b44;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 2.4px;
          text-transform: uppercase;
        }

        .ark-contact-hero h2 {
          margin: 0;
          color: #183a63;
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(36px, 5vw, 54px);
          font-weight: 400;
          line-height: 1.2;
        }

        .ark-contact-hero h2 span {
          color: #a17b44;
          font-style: italic;
        }

        .ark-contact-hero p {
          max-width: 600px;
          margin: 18px auto 0;
          color: #77808d;
          font-size: 12px;
          line-height: 1.9;
        }

        .ark-contact-cards {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
          margin-bottom: 40px;
        }

        .ark-contact-card {
          padding: 25px;
          border: 1px solid #e7e5df;
          background: #fff;
        }

        .ark-contact-card-icon {
          display: grid;
          place-items: center;
          width: 46px;
          height: 46px;
          margin-bottom: 18px;
          background: #edf1f6;
          color: #183a63;
        }

        .ark-contact-card h3 {
          margin: 0 0 10px;
          color: #183a63;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 21px;
          font-weight: 400;
        }

        .ark-contact-card p {
          min-height: 38px;
          margin: 0 0 15px;
          color: #7b8490;
          font-size: 11px;
          line-height: 1.8;
        }

        .ark-contact-card-detail {
          color: #a17b44;
          font-size: 10px;
          font-weight: 700;
          overflow-wrap: anywhere;
        }

        .ark-contact-main {
          display: grid;
          grid-template-columns: minmax(0, 1.1fr) minmax(300px, 0.9fr);
          align-items: stretch;
          gap: 25px;
          margin-bottom: 70px;
        }

        .ark-contact-form-panel {
          padding: 34px;
          border: 1px solid #e7e5df;
          background: #fff;
        }

        .ark-contact-form-panel h3,
        .ark-contact-info-panel h3 {
          margin: 0 0 10px;
          color: #183a63;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 27px;
          font-weight: 400;
        }

        .ark-contact-form-intro {
          margin: 0 0 25px;
          color: #7b8490;
          font-size: 11px;
          line-height: 1.8;
        }

        .ark-contact-form {
          display: flex;
          flex-direction: column;
          gap: 17px;
        }

        .ark-contact-form-row {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 15px;
        }

        .ark-contact-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 0;
        }

        .ark-contact-field label {
          color: #465267;
          font-size: 11px;
          font-weight: 700;
        }

        .ark-contact-field input,
        .ark-contact-field select,
        .ark-contact-field textarea {
          width: 100%;
          min-width: 0;
          padding: 13px;
          border: 1px solid #e0e4ea;
          border-radius: 4px;
          outline: none;
          background: #fff;
          color: #202a36;
          font-family: inherit;
          font-size: 12px;
          transition: border-color 150ms ease;
        }

        .ark-contact-field input:focus,
        .ark-contact-field select:focus,
        .ark-contact-field textarea:focus {
          border-color: #183a63;
        }

        .ark-contact-field textarea {
          min-height: 135px;
          resize: vertical;
          line-height: 1.7;
        }

        .ark-contact-submit {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          min-height: 48px;
          border: 0;
          border-radius: 4px;
          background: #183a63;
          color: #fff;
          font-family: inherit;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .ark-contact-submit:hover {
          background: #244e7d;
        }

        .ark-contact-info-panel {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 34px;
          background: #183a63;
          color: #fff;
        }

        .ark-contact-info-panel .ark-contact-eyebrow {
          color: #e5c58c;
        }

        .ark-contact-info-panel h3 {
          color: #fff;
          font-size: 31px;
          line-height: 1.3;
        }

        .ark-contact-info-panel > p {
          margin: 10px 0 26px;
          color: #d0d8e4;
          font-size: 12px;
          line-height: 1.9;
        }

        .ark-contact-info-item {
          display: flex;
          align-items: flex-start;
          gap: 13px;
          width: 100%;
          margin-bottom: 23px;
        }

        .ark-contact-info-item-icon {
          display: grid;
          place-items: center;
          width: 40px;
          height: 40px;
          flex-shrink: 0;
          background: rgba(255, 255, 255, 0.09);
          color: #e5c58c;
        }

        .ark-contact-info-item h4 {
          margin: 2px 0 7px;
          color: #fff;
          font-size: 12px;
        }

        .ark-contact-info-item p {
          margin: 0;
          color: #d0d8e4;
          font-size: 11px;
          line-height: 1.8;
          overflow-wrap: anywhere;
        }

        .ark-contact-whatsapp {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          width: 100%;
          min-height: 47px;
          margin-top: auto;
          padding: 12px;
          border: 1px solid rgba(229, 197, 140, 0.6);
          background: #e5c58c;
          color: #183a63;
          font-family: inherit;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
        }

        .ark-contact-alert {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          margin-bottom: 18px;
          padding: 13px;
          border-radius: 5px;
          background: #fff0f0;
          color: #b42318;
          font-size: 11px;
          line-height: 1.7;
          overflow-wrap: anywhere;
        }

        .ark-contact-success {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          margin-bottom: 18px;
          padding: 13px;
          border-radius: 5px;
          background: #eaf8f0;
          color: #187747;
          font-size: 11px;
          line-height: 1.7;
        }

        .ark-contact-footer {
          padding: 25px 0;
          border-top: 1px solid #e6e4de;
          color: #9299a3;
          font-size: 10px;
          text-align: center;
        }

        @media (max-width: 850px) {
          .ark-contact-main {
            grid-template-columns: minmax(0, 1fr);
          }

          .ark-contact-info-panel {
            min-height: 430px;
          }
        }

        @media (max-width: 600px) {
          .ark-contact-container {
            width: calc(100% - 28px);
          }

          .ark-contact-hero {
            padding: 45px 0 32px;
          }

          .ark-contact-cards {
            grid-template-columns: minmax(0, 1fr);
          }

          .ark-contact-card p {
            min-height: auto;
          }

          .ark-contact-form-panel,
          .ark-contact-info-panel {
            padding: 23px;
          }

          .ark-contact-form-row {
            grid-template-columns: minmax(0, 1fr);
          }
        }
      `}</style>

      <div className="ark-contact-container">
        <header className="ark-contact-header">
          <Link to="/store" className="ark-contact-brand">
            <span className="ark-contact-brand-icon">
              <Gem size={24} />
            </span>

            <span>
              <h1>ARK MARBLES</h1>
              <p>PREMIUM STONE COLLECTIONS</p>
            </span>
          </Link>

          <Link to="/store" className="ark-contact-back">
            <ArrowLeft size={16} />
            Back to Store
          </Link>
        </header>

        <section className="ark-contact-hero">
          <div className="ark-contact-eyebrow">
            <MessageCircle size={15} />
            Contact Our Team
          </div>

          <h2>
            Let's Talk About
            <br />
            <span>Your Next Project</span>
          </h2>

          <p>
            Have questions about marble, granite, product specifications,
            or availability? Send us your enquiry and configure the
            business contact details below before publishing this page.
          </p>
        </section>

        <section className="ark-contact-cards">
          {contactCards.map((card) => (
            <article className="ark-contact-card" key={card.title}>
              <div className="ark-contact-card-icon">
                {card.icon}
              </div>

              <h3>{card.title}</h3>
              <p>{card.description}</p>
              <div className="ark-contact-card-detail">
                {card.detail}
              </div>
            </article>
          ))}
        </section>

        <section className="ark-contact-main">
          <div className="ark-contact-form-panel">
            <h3>Send an Enquiry</h3>

            <p className="ark-contact-form-intro">
              Complete the form with your details and project requirements.
            </p>

            {error && (
              <div className="ark-contact-alert" role="alert">
                <AlertCircle size={17} />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="ark-contact-success" role="status">
                <CheckCircle2 size={17} />
                <span>
                  Your email application has been opened. Complete the
                  sending process in your email application.
                </span>
              </div>
            )}

            <form className="ark-contact-form" onSubmit={handleSubmit}>
              <div className="ark-contact-form-row">
                <div className="ark-contact-field">
                  <label htmlFor="contact-name">Full Name *</label>
                  <input
                    id="contact-name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    autoComplete="name"
                    maxLength={100}
                    required
                  />
                </div>

                <div className="ark-contact-field">
                  <label htmlFor="contact-phone">Phone Number</label>
                  <input
                    id="contact-phone"
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                    autoComplete="tel"
                    maxLength={20}
                  />
                </div>
              </div>

              <div className="ark-contact-field">
                <label htmlFor="contact-email">Email Address *</label>
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  autoComplete="email"
                  maxLength={150}
                  required
                />
              </div>

              <div className="ark-contact-field">
                <label htmlFor="contact-subject">Enquiry Type</label>
                <select
                  id="contact-subject"
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                >
                  <option>Product Enquiry</option>
                  <option>Price Enquiry</option>
                  <option>Product Availability</option>
                  <option>Bulk Order</option>
                  <option>Delivery Enquiry</option>
                  <option>Other</option>
                </select>
              </div>

              <div className="ark-contact-field">
                <label htmlFor="contact-message">Your Message *</label>
                <textarea
                  id="contact-message"
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Tell us about the product or project you are interested in..."
                  maxLength={3000}
                  required
                />
              </div>

              <button type="submit" className="ark-contact-submit">
                Prepare Email Enquiry
                <Send size={16} />
              </button>
            </form>
          </div>

          <aside className="ark-contact-info-panel">
            <div className="ark-contact-eyebrow">
              <Gem size={15} />
              Get in Touch
            </div>

            <h3>
              We would be happy
              <br />
              to hear from you.
            </h3>

            <p>
              Contact information should be updated with your real
              business details before this website goes live.
            </p>

            <div className="ark-contact-info-item">
              <div className="ark-contact-info-item-icon">
                <MapPin size={20} />
              </div>
              <div>
                <h4>Business Address</h4>
                <p>Add your showroom or business address.</p>
              </div>
            </div>

            <div className="ark-contact-info-item">
              <div className="ark-contact-info-item-icon">
                <Phone size={20} />
              </div>
              <div>
                <h4>Phone Number</h4>
                <p>Add your official customer support number.</p>
              </div>
            </div>

            <div className="ark-contact-info-item">
              <div className="ark-contact-info-item-icon">
                <Mail size={20} />
              </div>
              <div>
                <h4>Email Address</h4>
                <p>Add your official business email address.</p>
              </div>
            </div>

            <button
              type="button"
              className="ark-contact-whatsapp"
              onClick={handleWhatsApp}
            >
              <MessageCircle size={17} />
              Enquire on WhatsApp
            </button>
          </aside>
        </section>

        <footer className="ark-contact-footer">
          © {new Date().getFullYear()} ARK MARBLES · Premium Stone Collections
        </footer>
      </div>
    </main>
  );
}