
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  MessageSquare,
  Clock,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Package,
  FileText,
  ChevronDown,
  ChevronUp,
  Gem,
} from "lucide-react";

import { supabase } from "../../lib/supabase";
import "./MyEnquiries.css";

function formatDate(value) {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function money(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function displayStatus(status) {
  const value = String(status || "Pending").trim();
  const normalized = value.toLowerCase();

  let className = "enquiry-status-pending";
  let Icon = Clock;

  if (
    ["approved", "accepted", "responded", "completed", "quoted"].includes(
      normalized
    )
  ) {
    className = "enquiry-status-success";
    Icon = CheckCircle2;
  } else if (
    ["rejected", "cancelled", "canceled", "closed"].includes(normalized)
  ) {
    className = "enquiry-status-closed";
    Icon = AlertCircle;
  } else if (
    ["processing", "in progress", "in_progress", "reviewing"].includes(
      normalized
    )
  ) {
    className = "enquiry-status-progress";
    Icon = RefreshCw;
  }

  return {
    label: value.replaceAll("_", " "),
    className,
    Icon,
  };
}

function firstValue(record, keys) {
  for (const key of keys) {
    const value = record?.[key];

    if (value !== null && value !== undefined && value !== "") {
      return value;
    }
  }

  return null;
}

function quotationAmount(quotation, items) {
  const savedTotal = firstValue(quotation, [
    "total_amount",
    "total_price",
    "total",
    "quoted_amount",
    "estimated_total",
  ]);

  if (savedTotal !== null) {
    return Number(savedTotal) || 0;
  }

  return items.reduce((sum, item) => {
    const quantity = Number(item.quantity) || 1;
    const price = Number(
      firstValue(item, ["unit_price", "price_per_unit", "price", "unit_amount"])
    ) || 0;

    return sum + quantity * price;
  }, 0);
}

export default function MyEnquiries() {
  const [quotations, setQuotations] = useState([]);
  const [itemsByQuotation, setItemsByQuotation] = useState({});
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadEnquiries = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        setQuotations([]);
        setItemsByQuotation({});
        setError("Please log in to view your enquiries.");
        return;
      }

      const { data, error: quotationError } = await supabase
        .from("quotations")
        .select("*")
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false });

      if (quotationError) throw quotationError;

      const rows = data || [];
      setQuotations(rows);

      if (!rows.length) {
        setItemsByQuotation({});
        return;
      }

      const quotationIds = rows.map((quotation) => quotation.id);

      const { data: itemRows, error: itemError } = await supabase
        .from("quotation_items")
        .select("*")
        .in("quotation_id", quotationIds);

      if (itemError) throw itemError;

      const grouped = {};

      for (const item of itemRows || []) {
        const key = String(item.quotation_id);

        if (!grouped[key]) grouped[key] = [];

        grouped[key].push(item);
      }

      setItemsByQuotation(grouped);
    } catch (err) {
      console.error("Unable to load customer enquiries:", err);
      setError(err.message || "Unable to load your enquiries.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEnquiries();
  }, [loadEnquiries]);

  const toggleExpanded = (id) => {
    setExpanded((current) => ({
      ...current,
      [id]: !current[id],
    }));
  };

  return (
    <main className="my-enquiries-page">
      <div className="my-enquiries-container">
        <header className="my-enquiries-heading">
          <div>
            <span className="my-enquiries-eyebrow">
              PERSONAL ENQUIRY CENTRE
            </span>
            <h1>My Enquiries</h1>
            <p>
              Review your marble enquiries and quotation requests in one place.
            </p>
          </div>

          <div className="my-enquiries-count">
            <MessageSquare size={20} />
            <span>
              {quotations.length}{" "}
              {quotations.length === 1 ? "enquiry" : "enquiries"}
            </span>
          </div>
        </header>

        {error && (
          <div className="my-enquiries-alert" role="alert">
            <AlertCircle size={18} />
            <span>{error}</span>
            <button type="button" onClick={loadEnquiries}>
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="my-enquiries-state">
            <RefreshCw className="my-enquiries-spin" size={25} />
            <p>Loading your enquiries...</p>
          </div>
        ) : error && quotations.length === 0 ? (
          <div className="my-enquiries-state">
            <AlertCircle size={38} />
            <h2>Enquiries could not be loaded</h2>
            <p>Check your connection and try again.</p>
            <button
              type="button"
              className="my-enquiries-primary"
              onClick={loadEnquiries}
            >
              Try Again
            </button>
          </div>
        ) : quotations.length === 0 ? (
          <div className="my-enquiries-state">
            <div className="my-enquiries-empty-icon">
              <MessageSquare size={34} />
            </div>
            <h2>No enquiries yet</h2>
            <p>
              Your quotation requests will appear here after you submit them.
            </p>
            <Link to="/marbles" className="my-enquiries-primary">
              Explore Marbles <ArrowRight size={17} />
            </Link>
          </div>
        ) : (
          <section className="my-enquiries-list">
            {quotations.map((quotation) => {
              const id = String(quotation.id);
              const items = itemsByQuotation[id] || [];
              const status = displayStatus(quotation.status);
              const number =
                quotation.quotation_number || id.slice(0, 8).toUpperCase();

              const message = firstValue(quotation, [
                "customer_message",
                "message",
                "description",
                "notes",
                "customer_note",
              ]);

              const response = firstValue(quotation, [
                "admin_response",
                "response",
                "admin_note",
                "reply",
                "remarks",
              ]);

              const isExpanded = Boolean(expanded[id]);

              return (
                <article className="my-enquiry-card" key={id}>
                  <div className="my-enquiry-card-header">
                    <div className="my-enquiry-reference">
                      <span>QUOTATION REFERENCE</span>
                      <strong>{number}</strong>
                    </div>

                    <span className={`my-enquiry-status ${status.className}`}>
                      <status.Icon size={15} />
                      {status.label}
                    </span>
                  </div>

                  <div className="my-enquiry-meta">
                    <div>
                      <span>Submitted on</span>
                      <strong>{formatDate(quotation.created_at)}</strong>
                    </div>

                    <div>
                      <span>Products</span>
                      <strong>{items.length}</strong>
                    </div>

                    <div>
                      <span>Estimated amount</span>
                      <strong className="my-enquiry-amount">
                        {money(quotationAmount(quotation, items))}
                      </strong>
                    </div>
                  </div>

                  {items.length > 0 && (
                    <div className="my-enquiry-product-preview">
                      {items.slice(0, 2).map((item, index) => (
                        <div
                          className="my-enquiry-product"
                          key={item.id || `${id}-${index}`}
                        >
                          <span className="my-enquiry-product-icon">
                            <Gem size={17} />
                          </span>
                          <span className="my-enquiry-product-name">
                            {item.product_name || item.name || "Marble Product"}
                          </span>
                          <span className="my-enquiry-product-quantity">
                            Qty: {Number(item.quantity) || 1}
                          </span>
                        </div>
                      ))}

                      {items.length > 2 && (
                        <p className="my-enquiry-more">
                          +{items.length - 2} more products
                        </p>
                      )}
                    </div>
                  )}

                  {isExpanded && (
                    <div className="my-enquiry-expanded">
                      {message && (
                        <div className="my-enquiry-detail-block">
                          <h3>
                            <MessageSquare size={16} /> Your message
                          </h3>
                          <p>{String(message)}</p>
                        </div>
                      )}

                      {response && (
                        <div className="my-enquiry-response">
                          <h3>
                            <CheckCircle2 size={16} /> Team response
                          </h3>
                          <p>{String(response)}</p>
                        </div>
                      )}

                      {items.length > 0 && (
                        <div className="my-enquiry-detail-block">
                          <h3>
                            <Package size={16} /> Requested products
                          </h3>

                          {items.map((item, index) => (
                            <div
                              className="my-enquiry-item-row"
                              key={item.id || `${id}-detail-${index}`}
                            >
                              <span>
                                {item.product_name || item.name || "Marble Product"}
                              </span>
                              <span>Qty: {Number(item.quantity) || 1}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {!message && !response && items.length === 0 && (
                        <p className="my-enquiry-no-details">
                          No additional message or product details were saved
                          for this request.
                        </p>
                      )}
                    </div>
                  )}

                  <div className="my-enquiry-card-footer">
                    <span>
                      <FileText size={15} />
                      Quotation request
                    </span>

                    <button
                      type="button"
                      className="my-enquiry-view-button"
                      onClick={() => toggleExpanded(id)}
                      aria-expanded={isExpanded}
                    >
                      {isExpanded ? "Hide details" : "View details"}
                      {isExpanded ? (
                        <ChevronUp size={16} />
                      ) : (
                        <ChevronDown size={16} />
                      )}
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        <footer className="my-enquiries-footer">
          <Gem size={16} />
          <span>ARK MARBLES · Your marble enquiries, organised.</span>
        </footer>
      </div>
    </main>
  );
}
