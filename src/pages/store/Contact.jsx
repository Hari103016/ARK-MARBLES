
import { useState } from "react";

import {
  Phone,
  Mail,
  MapPin,
  Clock,
  FileText,
  UserRound,
  Layers,
  Tag,
  Grid2X2,
  Building2,
  Pencil,
  Send,
} from "lucide-react";

import "./Contact.css";

export default function Contact() {
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    category: "",
    product: "",
    quantity: "",
    projectType: "",
    requirements: "",
  });

  const [submitted, setSubmitted] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setSubmitted(false);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    // Temporary frontend submission.
    // Connect this handler to Supabase before using it live.
    console.log("Quote Request:", formData);

    setSubmitted(true);

    setFormData({
      fullName: "",
      phone: "",
      category: "",
      product: "",
      quantity: "",
      projectType: "",
      requirements: "",
    });
  };

  return (
    <main className="ark-contact-page">

      {/* PAGE HEADING */}
      <section className="ark-contact-heading">
        <h1>
          Get in Touch with <span>ARK MARBLES</span>
        </h1>

        <p>
          Have a question, need expert advice or want a price quotation?
          <br />
          Our team is here to help you with marbles and construction materials.
        </p>
      </section>

      {/* MAIN CONTENT */}
      <section className="ark-contact-container">

        {/* CONTACT INFORMATION */}
        <aside className="ark-contact-info">

          <div className="ark-info-item">
            <div className="ark-info-icon">
              <Phone size={29} />
            </div>

            <div className="ark-info-content">
              <h3>Call Us</h3>
              <a href="tel:+919876543210">+91 98765 43210</a>
              <a href="tel:+919123456789">+91 91234 56789</a>
            </div>
          </div>

          <div className="ark-info-item">
            <div className="ark-info-icon">
              <Mail size={29} />
            </div>

            <div className="ark-info-content">
              <h3>Email Us</h3>
              <a href="mailto:sales@arkmarbles.com">
                sales@arkmarbles.com
              </a>
            </div>
          </div>

          <div className="ark-info-item">
            <div className="ark-info-icon">
              <MapPin size={29} />
            </div>

            <div className="ark-info-content">
              <h3>Our Location</h3>
              <p>
                Main Road, Mylavaram,
                <br />
                NTR District, Andhra Pradesh – 521230
              </p>
            </div>
          </div>

          <div className="ark-info-item">
            <div className="ark-info-icon">
              <Clock size={29} />
            </div>

            <div className="ark-info-content">
              <h3>Business Hours</h3>
              <p>Mon – Sat : 9:00 AM – 7:00 PM</p>
              <p>Sunday : 10:00 AM – 5:00 PM</p>
            </div>
          </div>

          {/* SOCIAL MEDIA */}
          <div className="ark-social-section">
            <h3>Follow Us</h3>

            <div className="ark-social-links">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="facebook"
                aria-label="Facebook"
              >
                f
              </a>

              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="instagram"
                aria-label="Instagram"
              >
                ◎
              </a>

              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="youtube"
                aria-label="YouTube"
              >
                ▶
              </a>

              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="linkedin"
                aria-label="LinkedIn"
              >
                in
              </a>
            </div>
          </div>

        </aside>

        {/* REQUEST QUOTE FORM */}
        <section className="ark-quote-card" id="quote">

          <div className="ark-quote-heading">
            <FileText
              size={48}
              className="ark-quote-heading-icon"
            />

            <div>
              <h2>
                Request a <span>Quote</span>
              </h2>

              <p>
                Tell us your requirements and our team will get back
                to you with the best quotation.
              </p>
            </div>
          </div>

          {submitted && (
            <div className="ark-form-success" role="status">
              Your quote request has been submitted successfully.
              Our team will contact you soon.
            </div>
          )}

          <form
            className="ark-quote-form"
            onSubmit={handleSubmit}
          >

            <div className="ark-form-grid">

              {/* NAME */}
              <div className="ark-form-group">
                <label htmlFor="fullName">
                  Full Name <span>*</span>
                </label>

                <div className="ark-input-wrapper">
                  <UserRound size={21} />

                  <input
                    id="fullName"
                    type="text"
                    name="fullName"
                    placeholder="Enter your full name"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* PHONE */}
              <div className="ark-form-group">
                <label htmlFor="phone">
                  Phone Number <span>*</span>
                </label>

                <div className="ark-input-wrapper">
                  <Phone size={21} />

                  <input
                    id="phone"
                    type="tel"
                    name="phone"
                    placeholder="Enter phone number"
                    value={formData.phone}
                    onChange={handleChange}
                    pattern="[0-9+ -]{10,15}"
                    required
                  />
                </div>
              </div>

              {/* CATEGORY */}
              <div className="ark-form-group">
                <label htmlFor="category">
                  Product Category <span>*</span>
                </label>

                <div className="ark-input-wrapper">
                  <Layers size={21} />

                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                  >
                    <option value="" disabled>
                      Select category
                    </option>
                    <option value="Marbles">Marbles</option>
                    <option value="Tiles">Tiles</option>
                    <option value="Granite">Granite</option>
                    <option value="Cement">Cement</option>
                    <option value="Steel">Steel</option>
                    <option value="Pipes">Pipes</option>
                    <option value="Bricks">Bricks</option>
                    <option value="Sanitaryware">Sanitaryware</option>
                    <option value="Paints">Paints</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* PRODUCT */}
              <div className="ark-form-group">
                <label htmlFor="product">
                  Product / Material <span>*</span>
                </label>

                <div className="ark-input-wrapper">
                  <Tag size={21} />

                  <input
                    id="product"
                    type="text"
                    name="product"
                    placeholder="e.g., Italian Marble, Tiles, Cement"
                    value={formData.product}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* QUANTITY */}
              <div className="ark-form-group">
                <label htmlFor="quantity">
                  Required Quantity <span>*</span>
                </label>

                <div className="ark-input-wrapper">
                  <Grid2X2 size={21} />

                  <input
                    id="quantity"
                    type="text"
                    name="quantity"
                    placeholder="e.g., 100 Sq.Ft / 50 Bags"
                    value={formData.quantity}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* PROJECT TYPE */}
              <div className="ark-form-group">
                <label htmlFor="projectType">
                  Project Type
                </label>

                <div className="ark-input-wrapper">
                  <Building2 size={21} />

                  <select
                    id="projectType"
                    name="projectType"
                    value={formData.projectType}
                    onChange={handleChange}
                  >
                    <option value="">Select project type</option>
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Industrial">Industrial</option>
                    <option value="Renovation">Renovation</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

            </div>

            {/* ADDITIONAL REQUIREMENTS */}
            <div className="ark-form-group ark-full-width">
              <label htmlFor="requirements">
                Additional Requirements
              </label>

              <div className="ark-textarea-wrapper">
                <Pencil size={20} />

                <textarea
                  id="requirements"
                  name="requirements"
                  placeholder="Describe your requirements, size, finish, delivery location, etc..."
                  value={formData.requirements}
                  onChange={handleChange}
                  rows={4}
                />
              </div>
            </div>

            {/* SUBMIT */}
            <button
              type="submit"
              className="ark-submit-quote"
            >
              <Send size={22} />
              <span>Submit Quote Request</span>
            </button>

          </form>
        </section>

      </section>
    </main>
  );
}
