import { useEffect, useMemo, useState } from "react";
import {
  CreditCard, Search, Download, RefreshCw, Plus, Eye, FileText, Phone,
  Mail, UserRound, CalendarDays, Wallet, CheckCircle2, Clock3,
  ArrowUpDown, X, ChevronLeft, ChevronRight, CircleAlert
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import "./Payments.css";

const PAGE_SIZE = 5;

const PAYMENT_METHODS = [
  "Cash on Delivery",
  "UPI",
  "Bank Transfer",
  "Card",
  "Cash"
];

const PAYMENT_STATUSES = [
  "pending",
  "paid",
  "partially_paid",
  "failed",
  "refunded"
];

const first = (...values) =>
  values.find((value) => value !== null && value !== undefined && value !== "");

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2
  })}`;

const dateTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
};

const dateOnly = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });
};

const statusLabel = (value) => ({
  paid: "Paid",
  pending: "Pending",
  partially_paid: "Partial",
  failed: "Failed",
  refunded: "Refunded"
}[String(value || "pending").toLowerCase()] || String(value || "Pending"));

const statusClass = (value) =>
  String(value || "pending").toLowerCase().replace(/[^a-z0-9]+/g, "-");

const orderNumber = (order) =>
  first(order.order_number, `ORD-${String(order.id).slice(-6)}`);

const paymentId = (order) =>
  `PAY-${String(order.id).slice(-6).toUpperCase()}`;

const methodLabel = (value) => ({
  cod: "Cash on Delivery",
  cash: "Cash",
  upi: "UPI",
  card: "Card",
  bank_transfer: "Bank Transfer"
}[String(value || "").toLowerCase()] || first(value, "Not specified"));

function downloadCsv(rows) {
  if (!rows.length) {
    window.alert("There are no payment records to export.");
    return;
  }

  const headers = [
    "Payment ID",
    "Order ID",
    "Customer",
    "Date",
    "Payment Method",
    "Amount",
    "Payment Status"
  ];

  const quote = (value) =>
    `"${String(value ?? "").replace(/"/g, '""')}"`;

  const body = rows.map((row) => [
    paymentId(row),
    orderNumber(row),
    row.customerName,
    row.created_at,
    methodLabel(row.payment_method),
    row.total_amount,
    statusLabel(row.payment_status)
  ].map(quote).join(","));

  const blob = new Blob(
    ["\uFEFF", [headers.map(quote).join(","), ...body].join("\r\n")],
    { type: "text/csv;charset=utf-8;" }
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `ark-marbles-payments-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();

  URL.revokeObjectURL(url);
}

export default function Payments() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [methodFilter, setMethodFilter] = useState("All Payment Types");
  const [dateFilter, setDateFilter] = useState("");

  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(null);
  const [showRecordModal, setShowRecordModal] = useState(false);

  const [recordForm, setRecordForm] = useState({
    orderId: "",
    paymentMethod: "Cash on Delivery"
  });

  async function fetchPayments() {
    setLoading(true);
    setError("");

    try {
      const { data: orderRows, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (orderError) throw orderError;

      const list = orderRows || [];

      const customerIds = [
        ...new Set(list.map((order) => order.customer_id).filter(Boolean))
      ];

      let profileMap = {};

      if (customerIds.length) {
        const { data: profileRows, error: profileError } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", customerIds);

        if (profileError) throw profileError;

        profileMap = Object.fromEntries(
          (profileRows || []).map((profile) => [profile.id, profile])
        );
      }

      const enriched = list.map((order) => {
        const address =
          order.shipping_address && typeof order.shipping_address === "object"
            ? order.shipping_address
            : {};

        const profile = profileMap[order.customer_id] || {};

        return {
          ...order,
          customerName: first(
            profile.full_name,
            address.fullName,
            "Customer"
          ),
          customerPhone: first(address.phone, "—"),
          customerEmail: first(address.email, "—")
        };
      });

      setOrders(enriched);

      setSelectedId((currentId) => {
        if (currentId && enriched.some((order) => order.id === currentId)) {
          return currentId;
        }

        return enriched[0]?.id ?? null;
      });
    } catch (err) {
      console.error("Payments load error:", err);
      setError(err.message || "Unable to load payment records.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPayments();
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return orders.filter((order) => {
      const haystack = [
        paymentId(order),
        orderNumber(order),
        order.customerName,
        order.customerPhone,
        order.customerEmail,
        methodLabel(order.payment_method)
      ].join(" ").toLowerCase();

      const status = String(order.payment_status || "pending").toLowerCase();
      const methodRaw = String(order.payment_method || "").toLowerCase();
      const method = ({ "cash on delivery": "cod", "bank transfer": "bank_transfer" })[methodRaw] || methodRaw;

      const parsedDate = order.created_at ? new Date(order.created_at) : null;
      const day = parsedDate && !Number.isNaN(parsedDate.getTime())
        ? `${parsedDate.getFullYear()}-${String(parsedDate.getMonth() + 1).padStart(2, "0")}-${String(parsedDate.getDate()).padStart(2, "0")}`
        : "";

      return (
        (!query || haystack.includes(query)) &&
        (statusFilter === "All Status" || status === statusFilter) &&
        (methodFilter === "All Payment Types" || method === methodFilter) &&
        (!dateFilter || day === dateFilter)
      );
    });
  }, [orders, search, statusFilter, methodFilter, dateFilter]);

  const selected =
    orders.find((order) => order.id === selectedId) || null;

  const totalAmount = orders.reduce(
    (sum, order) => sum + Number(order.total_amount || 0),
    0
  );

  const paidAmount = orders
    .filter((order) => String(order.payment_status).toLowerCase() === "paid")
    .reduce((sum, order) => sum + Number(order.total_amount || 0), 0);

  const pendingAmount = orders
    .filter((order) =>
      ["pending", "partially_paid"].includes(
        String(order.payment_status || "pending").toLowerCase()
      )
    )
    .reduce((sum, order) => sum + Number(order.total_amount || 0), 0);

  const paidCount = orders.filter(
    (order) => String(order.payment_status).toLowerCase() === "paid"
  ).length;

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);

  const pageRows = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const receiptNumber = (order) =>
    `RCPT-${String(order.id).slice(-6).toUpperCase()}`;

  function resetFilters() {
    setSearch("");
    setStatusFilter("All Status");
    setMethodFilter("All Payment Types");
    setDateFilter("");
    setPage(1);
  }

  async function markOrderPaid(event) {
    event.preventDefault();

    if (!recordForm.orderId || saving) return;

    setSaving(true);
    setError("");

    try {
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          payment_status: "paid",
          payment_method: recordForm.paymentMethod
        })
        .eq("id", recordForm.orderId);

      if (updateError) throw updateError;

      setShowRecordModal(false);

      setRecordForm({
        orderId: "",
        paymentMethod: "Cash on Delivery"
      });

      setNotice(
        "Order payment status marked as paid. This updates the order record; it does not create a separate gateway transaction."
      );

      await fetchPayments();
    } catch (err) {
      setError(err.message || "Could not update payment status.");
    } finally {
      setSaving(false);
    }
  }

  function printReceipt(order) {
    const address =
      order.shipping_address && typeof order.shipping_address === "object"
        ? order.shipping_address
        : {};

    const html = `
      <html>
        <head>
          <title>${receiptNumber(order)}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 36px;
              color: #222;
            }
            .top {
              display: flex;
              justify-content: space-between;
              border-bottom: 2px solid #b38a3e;
              padding-bottom: 18px;
            }
            h1 { margin: 0; color: #8b682b; }
            small { color: #666; }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 28px;
            }
            td {
              padding: 12px;
              border-bottom: 1px solid #ddd;
            }
            .total {
              font-size: 20px;
              font-weight: bold;
              text-align: right;
              margin-top: 25px;
            }
          </style>
        </head>
        <body>
          <div class="top">
            <div>
              <h1>ARK MARBLES</h1>
              <small>Premium Marble & Natural Stone</small>
            </div>
            <div>
              <h2>PAYMENT RECEIPT</h2>
              <b>${receiptNumber(order)}</b>
            </div>
          </div>

          <p>
            <b>Order:</b> ${orderNumber(order)}<br/>
            <b>Date:</b> ${dateTime(order.created_at)}
          </p>

          <p>
            <b>Customer:</b> ${order.customerName}<br/>
            <b>Phone:</b> ${address.phone || "—"}<br/>
            <b>Email:</b> ${address.email || "—"}
          </p>

          <table>
            <tr>
              <td>Order Amount</td>
              <td style="text-align:right">${money(order.total_amount)}</td>
            </tr>
            <tr>
              <td>Payment Method</td>
              <td style="text-align:right">${methodLabel(order.payment_method)}</td>
            </tr>
            <tr>
              <td>Payment Status</td>
              <td style="text-align:right">${statusLabel(order.payment_status)}</td>
            </tr>
          </table>

          <div class="total">
            Order Total: ${money(order.total_amount)}
          </div>

          <p style="margin-top:45px;color:#777">
            This receipt reflects the payment status recorded against the order.
          </p>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank", "width=800,height=900");

    if (!printWindow) {
      window.alert("Allow pop-ups to print the receipt.");
      return;
    }

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  return (
    <main className="ark-payments-page">
      <div className="ark-payments-shell">

        <header className="ark-payments-header">
          <div className="ark-payments-heading">
            <div className="ark-payments-heading-icon">
              <CreditCard size={25} />
            </div>

            <div>
              <span className="ark-payments-eyebrow">
                ARK MARBLES / FINANCE MANAGEMENT
              </span>

              <h1>Payments</h1>

              <p>
                Track customer payments, manage order payment status and generate receipts.
              </p>
            </div>
          </div>

          <div className="ark-payments-header-actions">
            <button
              className="ark-payments-btn outline"
              onClick={() => downloadCsv(filtered)}
            >
              <Download size={16} /> Export
            </button>

            <button
              className="ark-payments-btn outline"
              onClick={fetchPayments}
              disabled={loading}
            >
              <RefreshCw
                size={16}
                className={loading ? "ark-payments-spin" : ""}
              />
              Refresh
            </button>

            <button
              className="ark-payments-btn gold"
              onClick={() => setShowRecordModal(true)}
            >
              <Plus size={17} /> Record Payment
            </button>
          </div>
        </header>

        {notice && (
          <div className="ark-payments-notice">
            <CheckCircle2 size={16} />
            <span>{notice}</span>
            <button onClick={() => setNotice("")} aria-label="Dismiss">
              <X size={15} />
            </button>
          </div>
        )}

        {error && (
          <div className="ark-payments-error">
            <CircleAlert size={16} />
            <span>{error}</span>
            <button onClick={() => setError("")} aria-label="Dismiss">
              <X size={15} />
            </button>
          </div>
        )}

        <section className="ark-payments-stats">
          <article className="ark-payments-stat">
            <div className="stat-icon gold-icon">
              <Wallet size={21} />
            </div>
            <div>
              <span>Total Order Value</span>
              <strong>{money(totalAmount)}</strong>
              <small>Across all orders</small>
            </div>
          </article>

          <article className="ark-payments-stat">
            <div className="stat-icon green-icon">
              <CheckCircle2 size={21} />
            </div>
            <div>
              <span>Paid Amount</span>
              <strong>{money(paidAmount)}</strong>
              <small>
                {totalAmount
                  ? `${(paidAmount / totalAmount * 100).toFixed(1)}% of order value`
                  : "No paid orders yet"}
              </small>
            </div>
          </article>

          <article className="ark-payments-stat">
            <div className="stat-icon blue-icon">
              <Clock3 size={21} />
            </div>
            <div>
              <span>Pending Amount</span>
              <strong>{money(pendingAmount)}</strong>
              <small>Pending / partial orders</small>
            </div>
          </article>

          <article className="ark-payments-stat">
            <div className="stat-icon violet-icon">
              <ArrowUpDown size={21} />
            </div>
            <div>
              <span>Total Transactions</span>
              <strong>{orders.length}</strong>
              <small>Orders with payment status</small>
            </div>
          </article>

          <article className="ark-payments-stat">
            <div className="stat-icon rose-icon">
              <FileText size={21} />
            </div>
            <div>
              <span>Paid Orders</span>
              <strong>{paidCount}</strong>
              <small>Marked as paid</small>
            </div>
          </article>
        </section>

        <section className="ark-payments-layout">
          <div className="ark-payments-list-panel">

            <div className="ark-payments-panel-heading">
              <div>
                <span className="ark-payments-overline">PAYMENT CONTROL</span>
                <h2>Payment Transactions</h2>
                <p>Order payment records and receipt information.</p>
              </div>

              <span className="ark-payments-count">
                {filtered.length} Records
              </span>
            </div>

            <div className="ark-payments-filters">
              <label className="ark-payments-search">
                <Search size={17} />
                <input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search order, customer, phone..."
                />
              </label>

              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option>All Status</option>
                {PAYMENT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {statusLabel(status)}
                  </option>
                ))}
              </select>

              <select
                value={methodFilter}
                onChange={(e) => {
                  setMethodFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option>All Payment Types</option>
                {["cod", "upi", "bank_transfer", "card", "cash"].map((method) => (
                  <option key={method} value={method}>
                    {methodLabel(method)}
                  </option>
                ))}
              </select>

              <label className="ark-payments-date">
                <CalendarDays size={15} />
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => {
                    setDateFilter(e.target.value);
                    setPage(1);
                  }}
                />
              </label>

              <button className="ark-payments-reset" onClick={resetFilters}>
                <RefreshCw size={14} /> Reset
              </button>
            </div>

            <div className="ark-payments-table-wrap">
              <table className="ark-payments-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>PAYMENT ID</th>
                    <th>ORDER ID</th>
                    <th>CUSTOMER</th>
                    <th>DATE</th>
                    <th>PAYMENT TYPE</th>
                    <th>AMOUNT</th>
                    <th>STATUS</th>
                    <th>RECEIPT</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>

                <tbody>
                  {pageRows.map((order, index) => (
                    <tr
                      key={order.id}
                      className={selectedId === order.id ? "active-row" : ""}
                      onClick={() => setSelectedId(order.id)}
                    >
                      <td>
                        {(currentPage - 1) * PAGE_SIZE + index + 1}
                      </td>

                      <td className="payment-code">
                        {paymentId(order)}
                      </td>

                      <td>{orderNumber(order)}</td>

                      <td>
                        <div className="ark-payment-customer">
                          <span>
                            {order.customerName
                              .split(" ")
                              .map((part) => part[0])
                              .slice(0, 2)
                              .join("")
                              .toUpperCase()}
                          </span>
                          <b>{order.customerName}</b>
                        </div>
                      </td>

                      <td>{dateOnly(order.created_at)}</td>
                      <td>{methodLabel(order.payment_method)}</td>
                      <td className="payment-amount">
                        {money(order.total_amount)}
                      </td>

                      <td>
                        <span className={`ark-payment-status ${statusClass(order.payment_status)}`}>
                          {statusLabel(order.payment_status)}
                        </span>
                      </td>

                      <td>
                        <button
                          className="ark-payment-icon-btn"
                          title="Print receipt"
                          onClick={(e) => {
                            e.stopPropagation();
                            printReceipt(order);
                          }}
                        >
                          <FileText size={16} />
                        </button>
                      </td>

                      <td>
                        <button
                          className="ark-payment-icon-btn"
                          title="View details"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedId(order.id);
                          }}
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {!loading && pageRows.length === 0 && (
                <div className="ark-payments-empty">
                  <CreditCard size={30} />
                  <h3>No payment records found</h3>
                  <p>
                    {orders.length
                      ? "Try changing your search or filters."
                      : "Orders placed through your storefront will appear here."}
                  </p>
                </div>
              )}

              {loading && (
                <div className="ark-payments-empty">
                  <RefreshCw className="ark-payments-spin" size={25} />
                  <p>Loading payment records...</p>
                </div>
              )}
            </div>

            <footer className="ark-payments-table-footer">
              <span>
                Showing{" "}
                {filtered.length
                  ? (currentPage - 1) * PAGE_SIZE + 1
                  : 0}
                {" "}to{" "}
                {Math.min(currentPage * PAGE_SIZE, filtered.length)}
                {" "}of {filtered.length} records
              </span>

              <div>
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  aria-label="Previous page"
                >
                  <ChevronLeft size={16} />
                </button>

                <span>{currentPage} / {pageCount}</span>

                <button
                  disabled={currentPage >= pageCount}
                  onClick={() => setPage((p) => p + 1)}
                  aria-label="Next page"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </footer>
          </div>

          <aside className="ark-payment-detail-panel">
            <div className="ark-payment-detail-heading">
              <div>
                <span className="ark-payments-overline">
                  TRANSACTION OVERVIEW
                </span>
                <h2>Payment Details</h2>
              </div>
              <FileText size={20} />
            </div>

            {selected ? (
              <>
                <div className="ark-payment-detail-card">
                  <div className="detail-card-icon">
                    <CreditCard size={20} />
                  </div>

                  <div>
                    <strong>{paymentId(selected)}</strong>
                    <small>
                      Order: {orderNumber(selected)} · {dateTime(selected.created_at)}
                    </small>
                  </div>

                  <span className={`ark-payment-status ${statusClass(selected.payment_status)}`}>
                    {statusLabel(selected.payment_status)}
                  </span>
                </div>

                <div className="ark-payment-detail-rows">
                  <div>
                    <UserRound size={15} />
                    <span>Customer</span>
                    <b>{selected.customerName}</b>
                  </div>

                  <div>
                    <Phone size={15} />
                    <span>Phone</span>
                    <b>{first(selected.customerPhone, "—")}</b>
                  </div>

                  <div>
                    <Mail size={15} />
                    <span>Email</span>
                    <b>{first(selected.customerEmail, "—")}</b>
                  </div>

                  <div>
                    <Wallet size={15} />
                    <span>Order Amount</span>
                    <b>{money(selected.total_amount)}</b>
                  </div>

                  <div>
                    <CreditCard size={15} />
                    <span>Payment Type</span>
                    <b>{methodLabel(selected.payment_method)}</b>
                  </div>

                  <div>
                    <CalendarDays size={15} />
                    <span>Transaction Date</span>
                    <b>{dateTime(selected.created_at)}</b>
                  </div>

                  <div>
                    <FileText size={15} />
                    <span>Receipt No.</span>
                    <b>{receiptNumber(selected)}</b>
                  </div>
                </div>

                <div className="ark-payment-detail-actions">
                  <button
                    className="ark-payments-btn gold"
                    onClick={() => printReceipt(selected)}
                  >
                    <FileText size={15} /> View / Print Receipt
                  </button>

                  <button
                    className="ark-payments-btn outline"
                    onClick={() => downloadCsv([selected])}
                  >
                    <Download size={15} /> Export Record
                  </button>
                </div>
              </>
            ) : (
              <div className="ark-payment-detail-empty">
                <CreditCard size={28} />
                <h3>Select a payment</h3>
                <p>
                  Choose an order from the transaction list to view its payment information.
                </p>
              </div>
            )}
          </aside>
        </section>

        <footer className="ark-payments-footer">
          <span>© {new Date().getFullYear()} ARK MARBLES</span>
          <span>PREMIUM MARBLE & NATURAL STONE MANAGEMENT</span>
        </footer>
      </div>

      {showRecordModal && (
        <div
          className="ark-payment-modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setShowRecordModal(false);
            }
          }}
        >
          <section
            className="ark-payment-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="record-payment-title"
          >
            <header>
              <div>
                <span className="ark-payments-overline">
                  FINANCE MANAGEMENT
                </span>
                <h2 id="record-payment-title">Record Order Payment</h2>
              </div>

              <button
                onClick={() => setShowRecordModal(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </header>

            <form onSubmit={markOrderPaid}>
              <p className="ark-payment-modal-note">
                This action marks the selected order as fully paid and updates
                its payment method. It does not create a separate payment
                transaction or gateway charge.
              </p>

              <label>
                Select Pending Order

                <select
                  required
                  value={recordForm.orderId}
                  onChange={(e) =>
                    setRecordForm({
                      ...recordForm,
                      orderId: e.target.value
                    })
                  }
                >
                  <option value="">Choose an order</option>

                  {orders
                    .filter(
                      (order) =>
                        String(order.payment_status || "pending").toLowerCase() !== "paid"
                    )
                    .map((order) => (
                      <option key={order.id} value={order.id}>
                        {orderNumber(order)} · {order.customerName} · {money(order.total_amount)}
                      </option>
                    ))}
                </select>
              </label>

              <label>
                Payment Method

                <select
                  value={recordForm.paymentMethod}
                  onChange={(e) =>
                    setRecordForm({
                      ...recordForm,
                      paymentMethod: e.target.value
                    })
                  }
                >
                  {PAYMENT_METHODS.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </label>

              <footer>
                <button
                  type="button"
                  className="ark-payments-btn outline"
                  onClick={() => setShowRecordModal(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="ark-payments-btn gold"
                  disabled={saving}
                >
                  {saving ? (
                    "Saving..."
                  ) : (
                    <>
                      <CheckCircle2 size={16} /> Mark as Paid
                    </>
                  )}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}