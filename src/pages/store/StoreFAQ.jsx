import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Gem,
  ArrowLeft,
  ArrowRight,
  Search,
  ChevronDown,
  HelpCircle,
  ShoppingBag,
  CreditCard,
  Truck,
  PackageCheck,
  ShieldCheck,
  MessageCircle,
} from "lucide-react";

const faqSections = [
  {
    title: "Products & Materials",
    icon: <Gem size={19} />,
    questions: [
      {
        question: "What types of stone products can I explore?",
        answer:
          "You can explore the product categories available in the ARK MARBLES store, such as marble, granite, quartz, tiles, and other stone surfaces. Actual availability depends on your product catalogue.",
      },
      {
        question: "How can I check product specifications?",
        answer:
          "Open a product's details page to review the available description, price, images, and specifications. Contact the business if any important information is missing.",
      },
      {
        question: "Can I request a particular colour or finish?",
        answer:
          "You can send an enquiry describing your preferred colour, finish, dimensions, and intended application. Availability and any special-order arrangements must be confirmed by the business.",
      },
      {
        question: "Can natural stone have variations in appearance?",
        answer:
          "Yes. Natural stone can vary in colour, veining, texture, and pattern. Ask to inspect the actual material or available samples before making a final selection.",
      },
    ],
  },
  {
    title: "Orders & Shopping",
    icon: <ShoppingBag size={19} />,
    questions: [
      {
        question: "How do I add a product to my cart?",
        answer:
          "Browse the store, open a product, and select Add to Cart. You can then review your selected products on the cart page and adjust quantities before continuing.",
      },
      {
        question: "How do I place an order?",
        answer:
          "Review your cart and continue to checkout. Order placement will work only when the checkout page is connected to a functioning order service and the required database configuration.",
      },
      {
        question: "Can I change or cancel an order?",
        answer:
          "Contact the business as soon as possible with your order reference. Whether an order can be changed or cancelled depends on its status and the business's applicable policy.",
      },
      {
        question: "Where can I find my previous orders?",
        answer:
          "Use the order history page if it is enabled for your account. Your order history will be available only after the website's order service is connected and storing order records.",
      },
    ],
  },
  {
    title: "Payments & Pricing",
    icon: <CreditCard size={19} />,
    questions: [
      {
        question: "How are product prices displayed?",
        answer:
          "Prices are displayed according to the product information configured in the store. Check the listed unit carefully, and confirm the final quantity and total before ordering.",
      },
      {
        question: "Are delivery charges included in the product price?",
        answer:
          "Not necessarily. Delivery charges may depend on the order, quantity, destination, and delivery arrangements. Confirm the final amount with the business before payment.",
      },
      {
        question: "Which payment methods are accepted?",
        answer:
          "The payment methods depend on the options configured by the business. Do not assume that online payment, cash on delivery, or any particular payment provider is active until it has been implemented and tested.",
      },
    ],
  },
  {
    title: "Delivery & Support",
    icon: <Truck size={19} />,
    questions: [
      {
        question: "How can I check delivery availability?",
        answer:
          "Contact the business with your delivery location, required products, and quantity. Delivery coverage and transportation arrangements must be confirmed before placing an order.",
      },
      {
        question: "How can I contact ARK MARBLES?",
        answer:
          "Visit the Contact page to find the available enquiry options. The business phone number, email address, and WhatsApp number must be configured with actual business details.",
      },
      {
        question: "What should I do if a product arrives damaged?",
        answer:
          "Photograph the product and packaging, keep your order details, and contact the business promptly. The resolution will depend on the applicable delivery and damage policy.",
      },
    ],
  },
];

export default function StoreFAQ() {
  const [openItems, setOpenItems] = useState(["0-0"]);
  const [search, setSearch] = useState("");

  const toggleQuestion = (id) => {
    setOpenItems((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id]
    );
  };

  const filteredSections = faqSections
    .map((section, sectionIndex) => ({
      ...section,
      originalIndex: sectionIndex,
      questions: section.questions
        .map((item, questionIndex) => ({
          ...item,
          originalIndex: questionIndex,
        }))
        .filter((item) =>
          `${item.question} ${item.answer}`
            .toLowerCase()
            .includes(search.trim().toLowerCase())
        ),
    }))
    .filter((section) => section.questions.length > 0);

  const totalResults = filteredSections.reduce(
    (total, section) => total + section.questions.length,
    0
  );

  return (
    <main className="ark-faq-page">
      <style>{`
        .ark-faq-page {
          min-height: 100vh;
          background: #f7f7f5;
          color: #202a36;
          font-family: Inter, Arial, sans-serif;
        }

        .ark-faq-page * {
          box-sizing: border-box;
        }

        .ark-faq-container {
          width: min(1000px, calc(100% - 40px));
          margin: 0 auto;
        }

        .ark-faq-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 23px 0;
          border-bottom: 1px solid #e6e4de;
        }

        .ark-faq-brand {
          display: flex;
          align-items: center;
          gap: 11px;
          color: #183a63;
          text-decoration: none;
        }

        .ark-faq-brand-icon {
          display: grid;
          place-items: center;
          width: 43px;
          height: 43px;
          border-radius: 5px;
          background: #183a63;
          color: #e5c58c;
        }

        .ark-faq-brand h1 {
          margin: 0;
          font-size: 17px;
          letter-spacing: 1.7px;
        }

        .ark-faq-brand p {
          margin: 4px 0 0;
          color: #858c96;
          font-size: 9px;
          letter-spacing: 1.4px;
        }

        .ark-faq-back {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #526079;
          text-decoration: none;
          font-size: 12px;
          font-weight: 600;
        }

        .ark-faq-hero {
          padding: 65px 0 45px;
          text-align: center;
        }

        .ark-faq-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 18px;
          color: #a17b44;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 2.4px;
          text-transform: uppercase;
        }

        .ark-faq-hero h2 {
          margin: 0;
          color: #183a63;
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(36px, 5vw, 52px);
          font-weight: 400;
          line-height: 1.2;
        }

        .ark-faq-hero h2 span {
          color: #a17b44;
          font-style: italic;
        }

        .ark-faq-hero p {
          max-width: 600px;
          margin: 18px auto 0;
          color: #77808d;
          font-size: 12px;
          line-height: 1.9;
        }

        .ark-faq-search {
          display: flex;
          align-items: center;
          gap: 12px;
          width: min(600px, 100%);
          min-height: 52px;
          margin: 30px auto 0;
          padding: 0 17px;
          border: 1px solid #e1e4e9;
          border-radius: 6px;
          background: #fff;
          color: #87909e;
          box-shadow: 0 5px 20px rgba(24, 58, 99, 0.035);
        }

        .ark-faq-search input {
          width: 100%;
          border: 0;
          outline: 0;
          background: transparent;
          color: #202a36;
          font-family: inherit;
          font-size: 12px;
        }

        .ark-faq-search input::placeholder {
          color: #9ba2ac;
        }

        .ark-faq-content {
          padding-bottom: 65px;
        }

        .ark-faq-results {
          margin-bottom: 20px;
          color: #858c96;
          font-size: 11px;
        }

        .ark-faq-section {
          margin-bottom: 25px;
        }

        .ark-faq-section-title {
          display: flex;
          align-items: center;
          gap: 11px;
          margin: 0 0 14px;
          color: #183a63;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 23px;
          font-weight: 400;
        }

        .ark-faq-section-icon {
          display: grid;
          place-items: center;
          width: 38px;
          height: 38px;
          border-radius: 5px;
          background: #e9eef6;
          color: #183a63;
        }

        .ark-faq-list {
          overflow: hidden;
          border: 1px solid #e6e5e0;
          border-radius: 7px;
          background: #fff;
        }

        .ark-faq-item + .ark-faq-item {
          border-top: 1px solid #eeece7;
        }

        .ark-faq-question {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          width: 100%;
          padding: 19px 21px;
          border: 0;
          background: #fff;
          color: #344054;
          text-align: left;
          font-family: inherit;
          font-size: 12px;
          font-weight: 700;
          line-height: 1.7;
          cursor: pointer;
        }

        .ark-faq-question:hover {
          background: #fbfaf7;
        }

        .ark-faq-question span:first-child {
          overflow-wrap: anywhere;
        }

        .ark-faq-chevron {
          flex-shrink: 0;
          color: #a17b44;
          transition: transform 180ms ease;
        }

        .ark-faq-chevron.open {
          transform: rotate(180deg);
        }

        .ark-faq-answer {
          padding: 0 21px 21px;
          color: #77808d;
          font-size: 12px;
          line-height: 1.9;
        }

        .ark-faq-empty {
          padding: 45px 20px;
          border: 1px solid #e6e5e0;
          border-radius: 7px;
          background: #fff;
          color: #77808d;
          text-align: center;
          font-size: 12px;
          line-height: 1.8;
        }

        .ark-faq-support {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 25px;
          padding: 30px;
          background: #183a63;
          color: #fff;
        }

        .ark-faq-support-content {
          display: flex;
          align-items: flex-start;
          gap: 15px;
        }

        .ark-faq-support-icon {
          display: grid;
          place-items: center;
          width: 45px;
          height: 45px;
          flex-shrink: 0;
          background: rgba(255, 255, 255, 0.1);
          color: #e5c58c;
        }

        .ark-faq-support h3 {
          margin: 0 0 8px;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 22px;
          font-weight: 400;
        }

        .ark-faq-support p {
          margin: 0;
          color: #d0d8e4;
          font-size: 11px;
          line-height: 1.8;
        }

        .ark-faq-contact-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 44px;
          padding: 0 17px;
          background: #e5c58c;
          color: #183a63;
          text-decoration: none;
          font-size: 11px;
          font-weight: 800;
          white-space: nowrap;
        }

        .ark-faq-footer {
          padding: 25px 0;
          border-top: 1px solid #e6e4de;
          color: #9299a3;
          font-size: 10px;
          text-align: center;
        }

        @media (max-width: 650px) {
          .ark-faq-container {
            width: calc(100% - 28px);
          }

          .ark-faq-hero {
            padding: 45px 0 35px;
          }

          .ark-faq-question {
            padding: 17px 14px;
          }

          .ark-faq-answer {
            padding: 0 14px 17px;
          }

          .ark-faq-support {
            align-items: flex-start;
            flex-direction: column;
            padding: 24px;
          }

          .ark-faq-contact-link {
            width: 100%;
          }
        }
      `}</style>

      <div className="ark-faq-container">
        <header className="ark-faq-header">
          <Link to="/store" className="ark-faq-brand">
            <span className="ark-faq-brand-icon">
              <Gem size={24} />
            </span>

            <span>
              <h1>ARK MARBLES</h1>
              <p>PREMIUM STONE COLLECTIONS</p>
            </span>
          </Link>

          <Link to="/store" className="ark-faq-back">
            <ArrowLeft size={16} />
            Back to Store
          </Link>
        </header>

        <section className="ark-faq-hero">
          <div className="ark-faq-eyebrow">
            <HelpCircle size={15} />
            Help Centre
          </div>

          <h2>
            Frequently Asked
            <br />
            <span>Questions</span>
          </h2>

          <p>
            Find answers to common questions about our product
            collections, shopping process, payments, and delivery.
          </p>

          <label className="ark-faq-search">
            <Search size={19} />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search questions and answers..."
              aria-label="Search frequently asked questions"
            />
          </label>
        </section>

        <section className="ark-faq-content">
          <div className="ark-faq-results">
            {totalResults} question(s) found
          </div>

          {filteredSections.length === 0 ? (
            <div className="ark-faq-empty">
              No matching questions found.
              <br />
              Try a different search term or contact our team.
            </div>
          ) : (
            filteredSections.map((section) => (
              <section
                className="ark-faq-section"
                key={section.title}
              >
                <h3 className="ark-faq-section-title">
                  <span className="ark-faq-section-icon">
                    {section.icon}
                  </span>
                  {section.title}
                </h3>

                <div className="ark-faq-list">
                  {section.questions.map((item) => {
                    const id = `${section.originalIndex}-${item.originalIndex}`;
                    const isOpen = openItems.includes(id);

                    return (
                      <article className="ark-faq-item" key={id}>
                        <button
                          type="button"
                          className="ark-faq-question"
                          onClick={() => toggleQuestion(id)}
                          aria-expanded={isOpen}
                        >
                          <span>{item.question}</span>

                          <ChevronDown
                            size={18}
                            className={`ark-faq-chevron ${
                              isOpen ? "open" : ""
                            }`}
                          />
                        </button>

                        {isOpen && (
                          <div className="ark-faq-answer">
                            {item.answer}
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              </section>
            ))
          )}
        </section>

        <section className="ark-faq-support">
          <div className="ark-faq-support-content">
            <div className="ark-faq-support-icon">
              <MessageCircle size={23} />
            </div>

            <div>
              <h3>Still have questions?</h3>
              <p>
                Send us your product or order enquiry through our
                contact page.
              </p>
            </div>
          </div>

          <Link to="/contact" className="ark-faq-contact-link">
            Contact Us
            <ArrowRight size={16} />
          </Link>
        </section>

        <footer className="ark-faq-footer">
          © {new Date().getFullYear()} ARK MARBLES · Premium Stone Collections
        </footer>
      </div>
    </main>
  );
}