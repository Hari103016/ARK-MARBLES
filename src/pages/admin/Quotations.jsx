import React, { useMemo, useState } from "react";
import "./Quotations.css";

const initialData = [
  {
    id: "QT-2026-001",
    customer: "Ravi Kumar",
    phone: "9876543210",
    date: "2026-10-08",
    validUntil: "2026-10-22",
    items: 3,
    amount: 84500,
    status: "Sent",
    notes: "Premium white marble for living room",
  },
  {
    id: "QT-2026-002",
    customer: "Sri Lakshmi Constructions",
    phone: "9848012345",
    date: "2026-10-07",
    validUntil: "2026-10-21",
    items: 5,
    amount: 162750,
    status: "Accepted",
    notes: "Flooring material for villa project",
  },
  {
    id: "QT-2026-003",
    customer: "Anil Reddy",
    phone: "9988766554",
    date: "2026-10-05",
    validUntil: "2026-10-12",
    items: 2,
    amount: 39200,
    status: "Draft",
    notes: "Kitchen countertop",
  },
];

const money = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

const formatDate = (date) => {
  if (!date) return "—";
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const emptyForm = () => ({
  customer: "",
  phone: "",
  date: new Date().toISOString().slice(0, 10),
  validUntil: "",
  items: "1",
  amount: "",
  notes: "",
});

export default function Quotations() {
  const [quotations, setQuotations] = useState(initialData);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState("");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return quotations.filter((q) => {
      const matchesSearch =
        !query ||
        [q.id, q.customer, q.phone, q.notes].some((value) =>
          String(value || "").toLowerCase().includes(query)
        );

      return matchesSearch && (filter === "All" || q.status === filter);
    });
  }, [quotations, search, filter]);

  const totalValue = quotations.reduce(
    (sum, q) => sum + Number(q.amount || 0),
    0
  );

  const acceptedValue = quotations
    .filter((q) => q.status === "Accepted")
    .reduce((sum, q) => sum + Number(q.amount || 0), 0);

  const pendingCount = quotations.filter((q) =>
    ["Draft", "Sent"].includes(q.status)
  ).length;

  const updateForm = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const createQuotation = (event) => {
    event.preventDefault();

    const amount = Number(form.amount);

    if (
      !form.customer.trim() ||
      !form.date ||
      !form.validUntil ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      setMessage("Please complete all required fields.");
      return;
    }

    if (form.validUntil < form.date) {
      setMessage("Validity date cannot be before the quotation date.");
      return;
    }

    const newQuotation = {
      ...form,
      id: `QT-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`,
      customer: form.customer.trim(),
      phone: form.phone.trim(),
      items: Math.max(1, Number(form.items) || 1),
      amount,
      status: "Draft",
    };

    setQuotations((current) => [newQuotation, ...current]);
    setShowForm(false);
    setForm(emptyForm());
    setMessage("Quotation created successfully.");
  };

  const updateStatus = (id, status) => {
    setQuotations((current) =>
      current.map((q) => (q.id === id ? { ...q, status } : q))
    );

    setSelected((current) =>
      current && current.id === id ? { ...current, status } : current
    );
  };

  const deleteQuotation = (id) => {
    if (!window.confirm("Are you sure you want to delete this quotation?")) {
      return;
    }

    setQuotations((current) => current.filter((q) => q.id !== id));
    setSelected(null);
    setMessage("Quotation deleted.");
  };

  const exportCsv = () => {
    const headers = [
      "Quotation ID",
      "Customer",
      "Phone",
      "Date",
      "Valid Until",
      "Items",
      "Amount",
      "Status",
    ];

    const rows = filtered.map((q) => [
      q.id,
      q.customer,
      q.phone,
      q.date,
      q.validUntil,
      q.items,
      q.amount,
      q.status,
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map(
            (value) =>
              `"${String(value ?? "").replace(/"/g, '""')}"`
          )
          .join(",")
      )
      .join("\r\n");

    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" })
    );

    const link = document.createElement("a");
    link.href = url;
    link.download = "ark-marbles-quotations.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="aq-page">
      <header className="aq-header">
        <div>
          <div className="aq-eyebrow">ARK MARBLES / SALES</div>
          <h1>Quotations</h1>
          <p>Create and manage customer price quotations.</p>
        </div>

        <button
          className="aq-button aq-primary"
          type="button"
          onClick={() => {
            setForm(emptyForm());
            setMessage("");
            setShowForm(true);
          }}
        >
          <span>＋</span> New Quotation
        </button>
      </header>

      {message && (
        <div className="aq-message" role="status">
          {message}
          <button
            type="button"
            aria-label="Dismiss message"
            onClick={() => setMessage("")}
          >
            ×
          </button>
        </div>
      )}

      <section className="aq-stats">
        <article className="aq-stat">
          <span>Total quotations</span>
          <strong>{quotations.length}</strong>
          <small>All quotation records</small>
        </article>

        <article className="aq-stat">
          <span>Total quoted value</span>
          <strong>{money(totalValue)}</strong>
          <small>Combined quotation amount</small>
        </article>

        <article className="aq-stat">
          <span>Accepted value</span>
          <strong>{money(acceptedValue)}</strong>
          <small>Accepted quotations</small>
        </article>

        <article className="aq-stat">
          <span>Awaiting action</span>
          <strong>{pendingCount}</strong>
          <small>Draft or sent quotations</small>
        </article>
      </section>

      <section className="aq-panel">
        <div className="aq-panel-heading">
          <div>
            <h2>Quotation Register</h2>
            <p>Search records, view details, and manage statuses.</p>
          </div>

          <button
            className="aq-button aq-secondary"
            type="button"
            onClick={exportCsv}
          >
            ↓ Export CSV
          </button>
        </div>

        <div className="aq-toolbar">
          <input
            className="aq-search"
            type="search"
            placeholder="Search quotation, customer, phone..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search quotations"
          />

          <select
            className="aq-filter"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            aria-label="Filter by status"
          >
            {["All", "Draft", "Sent", "Accepted", "Rejected", "Expired"].map(
              (status) => (
                <option key={status} value={status}>
                  {status === "All" ? "All statuses" : status}
                </option>
              )
            )}
          </select>
        </div>

        <div className="aq-table-wrap">
          <table className="aq-table">
            <thead>
              <tr>
                <th>Quotation ID</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Valid Until</th>
                <th>Items</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((q) => (
                <tr key={q.id}>
                  <td>
                    <button
                      type="button"
                      className="aq-link"
                      onClick={() => setSelected(q)}
                    >
                      {q.id}
                    </button>
                  </td>

                  <td>
                    <strong className="aq-customer">{q.customer}</strong>
                    <small className="aq-phone">{q.phone || "No phone"}</small>
                  </td>

                  <td>{formatDate(q.date)}</td>
                  <td>{formatDate(q.validUntil)}</td>
                  <td>{q.items}</td>
                  <td className="aq-amount">{money(q.amount)}</td>

                  <td>
                    <span
                      className={`aq-status aq-status-${q.status.toLowerCase()}`}
                    >
                      {q.status}
                    </span>
                  </td>

                  <td>
                    <div className="aq-actions">
                      <button
                        type="button"
                        className="aq-action"
                        title="View quotation"
                        aria-label={`View ${q.id}`}
                        onClick={() => setSelected(q)}
                      >
                        ↗
                      </button>

                      <button
                        type="button"
                        className="aq-action aq-delete"
                        title="Delete quotation"
                        aria-label={`Delete ${q.id}`}
                        onClick={() => deleteQuotation(q.id)}
                      >
                        ×
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="aq-empty">
                    <strong>No quotations found</strong>
                    <span>Try another search or status filter.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer className="aq-footer">
          <span>
            Showing <strong>{filtered.length}</strong> of{" "}
            <strong>{quotations.length}</strong> quotations
          </span>
          <span>Currency: INR (₹)</span>
        </footer>
      </section>

      {showForm && (
        <div
          className="aq-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowForm(false);
          }}
        >
          <section
            className="aq-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="aq-create-title"
          >
            <div className="aq-modal-heading">
              <div>
                <span>SALES DOCUMENT</span>
                <h2 id="aq-create-title">Create Quotation</h2>
              </div>
              <button
                type="button"
                className="aq-close"
                onClick={() => setShowForm(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <form onSubmit={createQuotation}>
              <div className="aq-form-grid">
                <label className="aq-field aq-wide">
                  Customer Name *
                  <input
                    name="customer"
                    value={form.customer}
                    onChange={updateForm}
                    placeholder="Enter customer or company name"
                    required
                  />
                </label>

                <label className="aq-field">
                  Phone Number
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={updateForm}
                    placeholder="Enter phone number"
                  />
                </label>

                <label className="aq-field">
                  Number of Items *
                  <input
                    name="items"
                    type="number"
                    min="1"
                    step="1"
                    value={form.items}
                    onChange={updateForm}
                    required
                  />
                </label>

                <label className="aq-field">
                  Quotation Date *
                  <input
                    name="date"
                    type="date"
                    value={form.date}
                    onChange={updateForm}
                    required
                  />
                </label>

                <label className="aq-field">
                  Valid Until *
                  <input
                    name="validUntil"
                    type="date"
                    min={form.date}
                    value={form.validUntil}
                    onChange={updateForm}
                    required
                  />
                </label>

                <label className="aq-field aq-wide">
                  Total Amount (₹) *
                  <input
                    name="amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.amount}
                    onChange={updateForm}
                    placeholder="Enter total quotation amount"
                    required
                  />
                </label>

                <label className="aq-field aq-wide">
                  Notes
                  <textarea
                    name="notes"
                    value={form.notes}
                    onChange={updateForm}
                    rows="3"
                    placeholder="Marble type, project details, delivery notes..."
                  />
                </label>
              </div>

              <div className="aq-modal-actions">
                <button
                  type="button"
                  className="aq-button aq-secondary"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="aq-button aq-primary">
                  Create Quotation
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {selected && (
        <div
          className="aq-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelected(null);
          }}
        >
          <section
            className="aq-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="aq-detail-title"
          >
            <div className="aq-modal-heading">
              <div>
                <span>QUOTATION DETAILS</span>
                <h2 id="aq-detail-title">{selected.id}</h2>
              </div>
              <button
                type="button"
                className="aq-close"
                onClick={() => setSelected(null)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="aq-detail-customer">
              <strong>{selected.customer}</strong>
              <span>{selected.phone || "No phone provided"}</span>
            </div>

            <div className="aq-detail-grid">
              <div>
                <span>Quotation Date</span>
                <strong>{formatDate(selected.date)}</strong>
              </div>
              <div>
                <span>Valid Until</span>
                <strong>{formatDate(selected.validUntil)}</strong>
              </div>
              <div>
                <span>Number of Items</span>
                <strong>{selected.items}</strong>
              </div>
              <div>
                <span>Total Amount</span>
                <strong>{money(selected.amount)}</strong>
              </div>
            </div>

            <div className="aq-notes">
              <span>Notes</span>
              <p>{selected.notes || "No notes added."}</p>
            </div>

            <label className="aq-field aq-status-field">
              Update Status
              <select
                value={selected.status}
                onChange={(event) =>
                  updateStatus(selected.id, event.target.value)
                }
              >
                {["Draft", "Sent", "Accepted", "Rejected", "Expired"].map(
                  (status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  )
                )}
              </select>
            </label>

            <div className="aq-modal-actions">
              <button
                type="button"
                className="aq-button aq-secondary"
                onClick={() => setSelected(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="aq-button aq-primary"
                onClick={() => {
                  setSelected(null);
                  setMessage("Quotation status updated.");
                }}
              >
                Done
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}