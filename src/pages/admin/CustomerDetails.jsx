
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Pencil, MessageSquare, Download, ShoppingCart, FileText,
  CreditCard, UserRound, Mail, Phone, MapPin, CalendarDays,
  ShoppingBag, IndianRupee, CheckCircle2, AlertTriangle, Wallet,
  Percent, Clock3, Activity, Home, NotebookPen, FolderOpen, Eye,
  Plus, X, RefreshCw, Receipt, ChevronRight, Upload
} from "lucide-react";

import { supabase } from "../../lib/supabase";
import "./CustomerDetails.css";

const money = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Number(n) || 0);

const first = (...values) =>
  values.find((x) => x !== null && x !== undefined && x !== "");

const dt = (value) => {
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

const nameOf = (c) =>
  first(c?.full_name, c?.name, c?.username, "Customer");

const phoneOf = (c) =>
  first(c?.phone, c?.phone_number, c?.mobile, c?.mobile_number, "");

const emailOf = (c) =>
  first(c?.email, c?.email_address, "");

const amountOf = (x) =>
  Number(first(
    x.total_amount,
    x.grand_total,
    x.final_amount,
    x.amount,
    x.total,
    x.subtotal,
    0
  )) || 0;

const paidOf = (x) =>
  Number(first(
    x.paid_amount,
    x.amount_paid,
    x.amount,
    x.payment_amount,
    0
  )) || 0;

const statusOf = (x) =>
  String(first(
    x.payment_status,
    x.payment_state,
    x.status,
    "pending"
  )).toLowerCase();

const initials = (value) =>
  String(value || "C")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((x) => x[0]?.toUpperCase() || "")
    .join("");

function Status({ value }) {
  const s = String(value || "Unknown")
    .toLowerCase()
    .replace(/[_-]/g, " ");

  const cls = [
    "paid", "delivered", "completed", "success",
    "successful", "active", "captured"
  ].includes(s)
    ? "good"
    : ["pending", "processing", "partial", "confirmed"].includes(s)
    ? "warn"
    : [
        "failed", "cancelled", "canceled",
        "refunded", "inactive"
      ].includes(s)
    ? "bad"
    : "neutral";

  return (
    <span className={`cd-status ${cls}`}>
      {s.replace(/\b\w/g, (c) => c.toUpperCase())}
    </span>
  );
}

function TrendChart({ values }) {
  const max = Math.max(...values, 1);

  const pts = values
    .map(
      (v, i) =>
        `${18 + (i * 344) / Math.max(values.length - 1, 1)},${122 - (v / max) * 96}`
    )
    .join(" ");

  return (
    <svg
      className="cd-chart"
      viewBox="0 0 380 145"
      role="img"
      aria-label="Purchase trend"
    >
      {[26, 58, 90, 122].map((y) => (
        <line
          key={y}
          x1="18"
          x2="362"
          y1={y}
          y2={y}
          className="cd-grid"
        />
      ))}

      <polyline points={pts} className="cd-line" />

      {values.map((v, i) => (
        <circle
          key={i}
          cx={18 + (i * 344) / Math.max(values.length - 1, 1)}
          cy={122 - (v / max) * 96}
          r="4"
          className="cd-dot"
        />
      ))}
    </svg>
  );
}

export default function CustomerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [notes, setNotes] = useState([]);

  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const [editOpen, setEditOpen] = useState(false);

  const emptyEditForm = {
    full_name: "",
    phone: "",
    alternate_phone: "",
    email: "",
    customer_type: "Individual",
    customer_category: "Regular",
    is_active: true,
    date_of_birth: "",
    gender: "",
    address: "",
    shipping_address: "",
    city: "",
    district: "",
    state: "Andhra Pradesh",
    postal_code: "",
    shipping_city: "",
    shipping_district: "",
    shipping_state: "Andhra Pradesh",
    shipping_postal_code: "",
    same_as_billing: true,
    credit_limit: "0",
    opening_balance: "0",
    payment_terms: "Immediate",
    preferred_payment_method: "UPI",
    discount_percent: "0",
    tax_type: "GST",
    internal_remarks: ""
  };

  const [editForm, setEditForm] = useState(emptyEditForm);

  // LOAD CUSTOMER AND RELATED DATA
  const load = useCallback(async () => {
    if (!id) {
      setError("Customer ID is missing from the URL.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Customer profile
      const profile = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (profile.error) throw profile.error;

      if (!profile.data) {
        throw new Error("Customer profile was not found.");
      }

      setCustomer(profile.data);

      // These filters use the actual columns in your database.
      const [o, p, a, n] = await Promise.all([
        supabase
          .from("orders")
          .select("*")
          .eq("customer_id", id)
          .order("created_at", { ascending: false }),

        supabase
          .from("payments")
          .select("*")
          .eq("customer_id", id)
          .order("created_at", { ascending: false }),

        supabase
          .from("addresses")
          .select("*")
          .eq("user_id", id)
          .order("created_at", { ascending: false }),

        supabase
          .from("customer_notes")
          .select("*")
          .eq("customer_id", id)
          .order("created_at", { ascending: false })
      ]);

      if (o.error) console.error("Orders error:", o.error);
      if (p.error) console.error("Payments error:", p.error);
      if (a.error) console.error("Addresses error:", a.error);
      if (n.error) console.error("Notes error:", n.error);

      setOrders(o.error ? [] : o.data || []);
      setPayments(p.error ? [] : p.data || []);
      setAddresses(a.error ? [] : a.data || []);
      setNotes(n.error ? [] : n.data || []);

    } catch (e) {
      console.error("Customer details loading error:", e);
      setError(e.message || "Unable to load customer details.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // CUSTOMER TOTALS
  const totals = useMemo(() => {
    const spent = orders.reduce(
      (s, x) => s + amountOf(x),
      0
    );

    const paid = payments
      .filter((x) =>
        ["paid", "success", "successful", "completed", "captured"]
          .includes(statusOf(x))
      )
      .reduce((s, x) => s + paidOf(x), 0);

    const paidFromOrders = orders.reduce(
      (s, x) =>
        ["paid", "completed", "success", "successful"].includes(
          String(first(x.payment_status, x.payment_state, "")).toLowerCase()
        )
          ? s + amountOf(x)
          : s,
      0
    );

    const finalPaid = paid || paidFromOrders;

    const dueFromOrders = orders.reduce(
      (s, x) =>
        s + Math.max(
          0,
          Number(first(
            x.pending_amount,
            x.balance_amount,
            x.due_amount,
            x.amount_due,
            0
          )) || 0
        ),
      0
    );

    const pending = dueFromOrders || Math.max(0, spent - finalPaid);

    return {
      spent,
      paid: finalPaid,
      pending,
      health: spent
        ? Math.max(
            0,
            Math.min(
              100,
              Math.round(((spent - pending) / spent) * 100)
            )
          )
        : 100
    };
  }, [orders, payments]);

  // SIX-MONTH PURCHASE TREND
  const trend = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => {
        const d = new Date();
        d.setDate(1);
        d.setMonth(d.getMonth() - (5 - i));

        const list = orders.filter((x) => {
          const date = new Date(
            first(x.created_at, x.order_date, x.date, "")
          );

          return (
            !Number.isNaN(date.getTime()) &&
            date.getMonth() === d.getMonth() &&
            date.getFullYear() === d.getFullYear()
          );
        });

        return {
          label: d.toLocaleDateString("en-IN", {
            month: "short"
          }),
          value: list.reduce((s, x) => s + amountOf(x), 0)
        };
      }),
    [orders]
  );

  const customerName = nameOf(customer);
  const phone = phoneOf(customer);
  const email = emailOf(customer);

  const address = [
    customer?.address,
    customer?.city,
    customer?.state,
    first(customer?.postal_code, customer?.pincode),
    customer?.country
  ].filter(Boolean).join(", ") || "Address not added";

  const creditLimit = Number(customer?.credit_limit) || 0;
  const availableCredit = Math.max(
    0,
    creditLimit - totals.pending
  );

  const latestOrder = orders[0]
    ? first(
        orders[0].created_at,
        orders[0].order_date,
        orders[0].date
      )
    : null;

  const tabs = [
    ["overview", "Overview", Home],
    ["orders", "Orders", ShoppingCart],
    ["payments", "Payments", CreditCard],
    ["outstanding", "Outstanding", Wallet],
    ["addresses", "Addresses", MapPin],
    ["notes", "Notes", NotebookPen],
    ["documents", "Documents", FolderOpen],
    ["activity", "Activity Log", Activity]
  ];

  // WHATSAPP
  const whatsapp = () => {
    if (!phone) {
      setToast("No phone number is saved for this customer.");
      return;
    }

    window.open(
      `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(
        `Hello ${customerName}, this is ARK MARBLES.`
      )}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  // EDIT CUSTOMER
  const openEditCustomer = async () => {
    setEditForm({
      ...emptyEditForm,

      full_name: customer?.full_name || "",
      phone: customer?.phone || "",
      alternate_phone: customer?.alternate_phone || "",
      email: "",

      customer_type: customer?.customer_type || "Individual",
      customer_category: customer?.customer_category || "Regular",
      is_active: customer?.is_active !== false,

      date_of_birth: customer?.date_of_birth || "",
      gender: customer?.gender || "",

      address: customer?.address || "",
      shipping_address:
        customer?.shipping_address || customer?.address || "",

      city: customer?.city || "",
      district: customer?.district || "",
      state: customer?.state || "Andhra Pradesh",
      postal_code: customer?.postal_code || customer?.pincode || "",

      shipping_city: customer?.shipping_city || customer?.city || "",
      shipping_district:
        customer?.shipping_district || customer?.district || "",
      shipping_state:
        customer?.shipping_state || customer?.state || "Andhra Pradesh",
      shipping_postal_code:
        customer?.shipping_postal_code ||
        customer?.postal_code ||
        "",

      same_as_billing:
        !customer?.shipping_address ||
        customer?.shipping_address === customer?.address,

      credit_limit: String(customer?.credit_limit ?? 0),
      opening_balance: String(customer?.opening_balance ?? 0),
      payment_terms: customer?.payment_terms || "Immediate",
      preferred_payment_method:
        customer?.preferred_payment_method || "UPI",
      discount_percent: String(customer?.discount_percent ?? 0),
      tax_type: customer?.tax_type || "GST",
      internal_remarks: customer?.internal_remarks || ""
    });

    setEditOpen(true);

    // Auth email is fetched through your existing Edge Function.
    try {
      const { data, error: emailError } =
        await supabase.functions.invoke(
          "admin-update-customer",
          {
            body: {
              action: "get",
              customer_id: id
            }
          }
        );

      if (emailError) throw emailError;
      if (data?.error) throw new Error(data.error);

      setEditForm((old) => ({
        ...old,
        email: data?.email || ""
      }));

    } catch (e) {
      console.warn("Could not load customer Auth email:", e);
      setToast(`Could not load customer email: ${e.message}`);
    }
  };

  // SAVE CUSTOMER
  const saveCustomer = async (e) => {
    e.preventDefault();

    if (!editForm.full_name.trim()) {
      setToast("Customer name is required.");
      return;
    }

    setSaving(true);

    try {
      const { data, error: updateError } =
        await supabase.functions.invoke(
          "admin-update-customer",
          {
            body: {
              customer_id: id,
              ...editForm,

              full_name: editForm.full_name.trim(),
              phone: editForm.phone.trim(),
              email: editForm.email.trim(),
              address: editForm.address.trim(),

              credit_limit: Number(editForm.credit_limit) || 0,
              opening_balance:
                Number(editForm.opening_balance) || 0,
              discount_percent:
                Number(editForm.discount_percent) || 0,

              is_active: editForm.is_active
            }
          }
        );

      if (updateError) throw updateError;
      if (data?.error) throw new Error(data.error);

      setEditOpen(false);
      setToast("Customer details updated successfully.");

      await load();

    } catch (e) {
      console.error("Customer update failed:", e);
      setToast(`Could not update customer: ${e.message || "Unknown error"}`);
    } finally {
      setSaving(false);
    }
  };

  // SAVE CUSTOMER NOTE
  const saveNote = async () => {
    if (!note.trim()) return;

    setSaving(true);

    try {
      const {
        data: { user },
        error: authError
      } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user) throw new Error("Please sign in again.");

      const { data, error: insertError } = await supabase
        .from("customer_notes")
        .insert({
          customer_id: id,
          created_by: user.id,
          note: note.trim()
        })
        .select("*")
        .single();

      if (insertError) throw insertError;

      setNotes((old) => [data, ...old]);
      setNote("");
      setNoteOpen(false);
      setToast("Customer note saved successfully.");

    } catch (e) {
      console.error("Save customer note error:", e);
      setToast(`Could not save note: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  // EXPORT CUSTOMER STATEMENT
  const exportStatement = () => {
    const data = [
      [
        "Order ID",
        "Date",
        "Amount",
        "Payment Status",
        "Order Status"
      ],
      ...orders.map((x) => [
        first(x.order_number, x.id),
        dt(x.created_at),
        amountOf(x),
        first(x.payment_status, "—"),
        first(x.status, "—")
      ])
    ];

    const csv = data
      .map((row) =>
        row
          .map(
            (v) =>
              `"${String(v ?? "").replace(/"/g, '""')}"`
          )
          .join(",")
      )
      .join("\r\n");

    const url = URL.createObjectURL(
      new Blob(["\uFEFF", csv], {
        type: "text/csv;charset=utf-8;"
      })
    );

    const a = document.createElement("a");
    a.href = url;
    a.download = `customer-${id}-statement.csv`;
    a.click();

    URL.revokeObjectURL(url);
  };

  // REUSABLE ORDER TABLE
  const orderTable = (list) => (
    <div className="cd-table-wrap">
      <table className="cd-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Date</th>
            <th>Items</th>
            <th>Amount</th>
            <th>Payment</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {list.length ? (
            list.map((x) => (
              <tr key={x.id}>
                <td>{first(x.order_number, x.id)}</td>
                <td>{dt(x.created_at)}</td>
                <td>{first(x.item_count, x.total_items, x.quantity, "—")}</td>
                <td className="cd-amount">
                  {money(amountOf(x))}
                </td>
                <td>
                  <Status value={first(x.payment_status, "Pending")} />
                </td>
                <td>
                  <Status value={first(x.status, "Processing")} />
                </td>
                <td>
                  <button
                    className="cd-icon-btn"
                    onClick={() =>
                      navigate(`/admin/orders/${x.id}`)
                    }
                    title="View order"
                  >
                    <Eye size={16} />
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" className="cd-empty">
                No orders found for this customer.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  // LOADING STATE
  if (loading) {
    return (
      <main className="customer-details-page">
        <div className="cd-message">
          <RefreshCw className="cd-spin" size={30} />
          Loading customer details...
        </div>
      </main>
    );
  }

  // ERROR STATE
  if (error || !customer) {
    return (
      <main className="customer-details-page">
        <div className="cd-message">
          <AlertTriangle size={28} />
          <h2>Unable to open customer</h2>
          <p>{error || "Customer record not found."}</p>
          <button
            className="cd-button cd-button-gold"
            onClick={() => navigate("/admin/customers")}
          >
            Back to Customers
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="customer-details-page">
      <div className="cd-shell">

        {/* PAGE HEADING */}
        <section className="cd-heading">
          <div>
            <div className="cd-breadcrumb">
              <span onClick={() => navigate("/admin/customers")}>
                Customers
              </span>
              <ChevronRight size={14} />
              <strong>Customer Details</strong>
            </div>

            <h1>Customer 360° View</h1>
            <p>
              Complete overview of customer profile, business,
              orders, payments and interactions.
            </p>
          </div>

          <div className="cd-heading-actions">
            <button
              className="cd-button"
              onClick={() => navigate("/admin/customers")}
            >
              <ArrowLeft size={16} />
              Back to Customers
            </button>

            <button
              className="cd-button"
              onClick={openEditCustomer}
            >
              <Pencil size={15} />
              Edit Customer
            </button>

            <button className="cd-button" onClick={whatsapp}>
              <MessageSquare size={15} />
              Send Message
            </button>

            <button
              className="cd-button cd-button-gold"
              onClick={exportStatement}
            >
              <Download size={16} />
              Generate Statement
            </button>
          </div>
        </section>

        {/* CUSTOMER PROFILE AND MAIN CONTENT */}
        <section className="cd-layout">

          {/* PROFILE CARD */}
          <aside className="cd-profile-card">
            <div className="cd-avatar">
              {initials(customerName)}
            </div>

            <div className="cd-profile-main">
              <h2>{customerName}</h2>

              <span className="cd-id">
                CUST-{String(customer.id).slice(0, 10)}
              </span>

              <Status
                value={
                  customer.is_active === false
                    ? "Inactive"
                    : "Active"
                }
              />

              <small>
                Member since:{" "}
                {dt(first(customer.created_at, customer.updated_at))}
              </small>
            </div>

            <div className="cd-tags">
              <span className="tag-purple">☆ Regular Buyer</span>
              <span className="tag-gold">
                ▦ {first(customer.customer_type, customer.type, "Customer")}
              </span>
              <span className="tag-green">
                ✓ {creditLimit > 0 ? "Credit Allowed" : "Customer"}
              </span>
            </div>

            <div className="cd-contact">
              <div>
                <Phone />
                {phone || "Phone not added"}
              </div>

              <div>
                <Mail />
                {email || "Email not added"}
              </div>

              <div>
                <MapPin />
                {address}
              </div>
            </div>

            <div className="cd-credit">
              <div>
                <span>
                  <UserRound />
                  Customer Type
                </span>
                <b>
                  {first(customer.customer_type, customer.type, "Regular Buyer")}
                </b>
              </div>

              <div>
                <span>
                  <CreditCard />
                  Credit Limit
                </span>
                <b>{money(creditLimit)}</b>
              </div>

              <div>
                <span>
                  <Wallet />
                  Available Credit
                </span>
                <b>{money(availableCredit)}</b>
              </div>

              <div>
                <span>
                  <CalendarDays />
                  Payment Terms
                </span>
                <b>{first(customer.payment_terms, "—")}</b>
              </div>
            </div>
          </aside>

          {/* MAIN CUSTOMER CONTENT */}
          <div className="cd-main">

            {/* KPI CARDS */}
            <div className="cd-kpis">
              {[
                [ShoppingCart, orders.length, "Total Orders", ""],
                [IndianRupee, money(totals.spent), "Total Spent", ""],
                [CheckCircle2, money(totals.paid), "Paid Amount", "green"],
                [AlertTriangle, money(totals.pending), "Pending Amount", "red"],
                [
                  Percent,
                  orders.length
                    ? `${Math.round(
                        (orders.filter((x) =>
                          ["returned", "refunded"].includes(statusOf(x))
                        ).length /
                          orders.length) *
                          100
                      )}%`
                    : "0%",
                  "Return Rate",
                  ""
                ],
                [
                  CalendarDays,
                  latestOrder ? dt(latestOrder) : "—",
                  "Last Order",
                  ""
                ]
              ].map(([Icon, value, label, color]) => (
                <div className="cd-kpi" key={label}>
                  <div className={`cd-kpi-icon ${color}`}>
                    <Icon size={22} />
                  </div>
                  <div>
                    <strong>{value}</strong>
                    <span>{label}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* CUSTOMER TABS */}
            <div className="cd-tabs">
              {tabs.map(([key, label, Icon]) => (
                <button
                  key={key}
                  className={`cd-tab ${tab === key ? "active" : ""}`}
                  onClick={() => setTab(key)}
                >
                  <Icon size={17} />
                  {label}
                </button>
              ))}
            </div>

            {/* OVERVIEW */}
            {tab === "overview" && (
              <div className="cd-overview">

                <section className="cd-card cd-trend">
                  <h3>
                    <Activity />
                    Purchase Trend
                  </h3>

                  <div className="cd-chart-labels">
                    <span>
                      {money(Math.max(...trend.map((x) => x.value), 0))}
                    </span>
                    <span>₹0</span>
                  </div>

                  <TrendChart values={trend.map((x) => x.value)} />

                  <div className="cd-months">
                    {trend.map((x, i) => (
                      <span key={`${x.label}-${i}`}>{x.label}</span>
                    ))}
                  </div>
                </section>

                <section className="cd-card cd-insights">
                  <h3>
                    <CheckCircle2 />
                    Customer Insights
                  </h3>

                  <div className="cd-insight-body">
                    <div
                      className="cd-ring"
                      style={{ "--health": `${totals.health}%` }}
                    >
                      <div>
                        <b>{totals.health}%</b>
                        <small>Payment Health</small>
                      </div>
                    </div>

                    <div className="cd-insight-list">
                      <span>
                        <CheckCircle2 />
                        {totals.paid
                          ? "Good Payment History"
                          : "No payment history yet"}
                      </span>

                      <span>
                        <CheckCircle2 />
                        {customer.is_active === false
                          ? "Inactive Customer"
                          : "Active Customer"}
                      </span>

                      <span>
                        <AlertTriangle />
                        {totals.pending
                          ? "Payment Pending"
                          : "No Payments Pending"}
                      </span>

                      <span>
                        <CheckCircle2 />
                        {creditLimit > 0
                          ? "Credit Limit Configured"
                          : "No Credit Limit Set"}
                      </span>
                    </div>
                  </div>
                </section>

                {/* QUICK ACTIONS */}
                <section className="cd-card cd-actions">
                  <h3>
                    <Activity />
                    Quick Actions
                  </h3>

                  <div className="cd-action-grid">
                    <button onClick={() => navigate("/admin/orders")}>
                      <ShoppingBag />
                      Create Order
                    </button>

                    <button onClick={() => navigate("/admin/payments")}>
                      <CreditCard />
                      Record Payment
                    </button>

                    <button onClick={() => setTab("addresses")}>
                      <MapPin />
                      View Addresses
                    </button>

                    <button onClick={() => setNoteOpen(true)}>
                      <NotebookPen />
                      Add Note
                    </button>

                    <button onClick={() => setTab("documents")}>
                      <Upload />
                      Documents
                    </button>

                    <button onClick={whatsapp}>
                      <MessageSquare />
                      Send WhatsApp
                    </button>
                  </div>
                </section>

                {/* RECENT ORDERS */}
                <section className="cd-card cd-recent">
                  <div className="cd-card-head">
                    <h3>
                      <ShoppingCart />
                      Recent Orders
                    </h3>

                    <button onClick={() => setTab("orders")}>
                      View All Orders
                      <ChevronRight />
                    </button>
                  </div>

                  {orderTable(orders.slice(0, 5))}
                </section>

                {/* LATEST ACTIVITY */}
                <section className="cd-card cd-activity">
                  <div className="cd-card-head">
                    <h3>
                      <Clock3 />
                      Latest Activity
                    </h3>

                    <button onClick={() => setTab("activity")}>
                      View All
                      <ChevronRight />
                    </button>
                  </div>

                  <div className="cd-timeline">
                    {orders.slice(0, 3).map((x) => (
                      <div key={`o${x.id}`}>
                        <i className="order-dot">
                          <ShoppingCart />
                        </i>
                        <span>
                          <b>
                            Order {first(x.order_number, x.id)} placed
                          </b>
                          <small>{dt(x.created_at)}</small>
                        </span>
                      </div>
                    ))}

                    {payments.slice(0, 3).map((x) => (
                      <div key={`p${x.id}`}>
                        <i className="pay-dot">
                          <CreditCard />
                        </i>
                        <span>
                          <b>
                            Payment of {money(paidOf(x))} recorded
                          </b>
                          <small>
                            {dt(first(x.paid_at, x.created_at))}
                          </small>
                        </span>
                      </div>
                    ))}

                    {!orders.length && !payments.length && (
                      <p className="cd-muted">
                        No activity records available yet.
                      </p>
                    )}
                  </div>
                </section>
              </div>
            )}

            {/* ORDERS */}
            {tab === "orders" && (
              <section className="cd-card cd-tab-panel">
                <div className="cd-card-head">
                  <h3>
                    <ShoppingCart />
                    All Orders
                  </h3>
                  <span>{orders.length} Orders</span>
                </div>

                {orderTable(orders)}
              </section>
            )}

            {/* PAYMENTS */}
            {tab === "payments" && (
              <section className="cd-card cd-tab-panel">
                <div className="cd-card-head">
                  <h3>
                    <CreditCard />
                    Payment History
                  </h3>
                  <span>{payments.length} Payments</span>
                </div>

                <div className="cd-table-wrap">
                  <table className="cd-table">
                    <thead>
                      <tr>
                        <th>Payment ID</th>
                        <th>Date</th>
                        <th>Method</th>
                        <th>Reference</th>
                        <th>Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>

                    <tbody>
                      {payments.length ? (
                        payments.map((x) => (
                          <tr key={x.id}>
                            <td>{x.id}</td>
                            <td>{dt(first(x.paid_at, x.created_at))}</td>
                            <td>{first(x.payment_method, "—")}</td>
                            <td>
                              {first(x.transaction_reference, "—")}
                            </td>
                            <td className="cd-amount">
                              {money(paidOf(x))}
                            </td>
                            <td>
                              <Status value={statusOf(x)} />
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="cd-empty">
                            No payment records found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* OUTSTANDING */}
            {tab === "outstanding" && (
              <section className="cd-card cd-tab-panel">
                <div className="cd-card-head">
                  <h3>
                    <Wallet />
                    Outstanding Payments
                  </h3>
                  <b className="cd-due">{money(totals.pending)}</b>
                </div>

                <div className="cd-due-banner">
                  <AlertTriangle />
                  <span>
                    <b>Outstanding balance</b>
                    <small>
                      Calculated from order balance fields or
                      total order amount less recorded payments.
                    </small>
                  </span>
                </div>

                <div className="cd-table-wrap">
                  <table className="cd-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Date</th>
                        <th>Order Amount</th>
                        <th>Payment Status</th>
                        <th>Balance</th>
                      </tr>
                    </thead>

                    <tbody>
                      {orders.filter((x) =>
                        !["paid", "completed", "success", "successful"]
                          .includes(
                            String(x.payment_status || "").toLowerCase()
                          )
                      ).length ? (
                        orders
                          .filter((x) =>
                            !["paid", "completed", "success", "successful"]
                              .includes(
                                String(x.payment_status || "").toLowerCase()
                              )
                          )
                          .map((x) => (
                            <tr key={x.id}>
                              <td>{first(x.order_number, x.id)}</td>
                              <td>{dt(x.created_at)}</td>
                              <td>{money(amountOf(x))}</td>
                              <td>
                                <Status value={first(x.payment_status, "Pending")} />
                              </td>
                              <td className="cd-due">
                                {money(
                                  first(
                                    x.pending_amount,
                                    x.balance_amount,
                                    x.due_amount,
                                    x.amount_due,
                                    amountOf(x)
                                  )
                                )}
                              </td>
                            </tr>
                          ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="cd-empty">
                            No outstanding orders detected.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* ADDRESSES */}
            {tab === "addresses" && (
              <section className="cd-card cd-tab-panel">
                <div className="cd-card-head">
                  <h3>
                    <MapPin />
                    Saved Addresses
                  </h3>
                  <span>{addresses.length} Addresses</span>
                </div>

                {addresses.length ? (
                  <div className="cd-address-grid">
                    {addresses.map((x) => (
                      <article key={x.id}>
                        <MapPin />
                        <div>
                          <b>
                            {first(x.recipient_name, customerName)}
                          </b>

                          <p>
                            {[
                              x.address_line1,
                              x.address_line2,
                              x.city,
                              x.state,
                              x.postal_code,
                              x.country
                            ].filter(Boolean).join(", ") ||
                              "Address details unavailable"}
                          </p>

                          <small>
                            {first(x.label, "Saved Address")}
                            {x.is_default ? " · Default Address" : ""}
                          </small>

                          {x.phone && <small>Phone: {x.phone}</small>}
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="cd-empty-state">
                    <MapPin />
                    <b>No saved addresses found</b>
                    <small>
                      Customer addresses will appear here when available.
                    </small>
                  </div>
                )}
              </section>
            )}

            {/* NOTES */}
            {tab === "notes" && (
              <section className="cd-card cd-tab-panel">
                <div className="cd-card-head">
                  <h3>
                    <NotebookPen />
                    Customer Notes
                  </h3>

                  <button
                    className="cd-add-btn"
                    onClick={() => setNoteOpen(true)}
                  >
                    <Plus />
                    Add Note
                  </button>
                </div>

                {notes.length ? (
                  notes.map((x) => (
                    <article className="cd-note" key={x.id}>
                      <NotebookPen />
                      <div>
                        <p>{first(x.note, x.content, x.description, "Note")}</p>
                        <small>{dt(x.created_at)}</small>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="cd-empty-state">
                    <NotebookPen />
                    <b>No customer notes yet</b>
                    <small>
                      Add an internal note to track customer conversations.
                    </small>
                    <button
                      className="cd-button cd-button-gold"
                      onClick={() => setNoteOpen(true)}
                    >
                      <Plus />
                      Add Note
                    </button>
                  </div>
                )}
              </section>
            )}

            {/* DOCUMENTS */}
            {tab === "documents" && (
              <section className="cd-card cd-tab-panel">
                <div className="cd-card-head">
                  <h3>
                    <FolderOpen />
                    Customer Documents
                  </h3>
                </div>

                <div className="cd-empty-state">
                  <FolderOpen />
                  <b>Document section</b>
                  <small>
                    Connect a customer documents table or Supabase
                    Storage bucket to list uploaded files here.
                  </small>
                </div>
              </section>
            )}

            {/* ACTIVITY LOG */}
            {tab === "activity" && (
              <section className="cd-card cd-tab-panel">
                <div className="cd-card-head">
                  <h3>
                    <Activity />
                    Customer Activity Log
                  </h3>
                </div>

                <div className="cd-timeline cd-full-timeline">
                  {orders.map((x) => (
                    <div key={`o${x.id}`}>
                      <i className="order-dot">
                        <ShoppingCart />
                      </i>
                      <span>
                        <b>
                          Order {first(x.order_number, x.id)} created
                        </b>
                        <small>{dt(x.created_at)}</small>
                      </span>
                    </div>
                  ))}

                  {payments.map((x) => (
                    <div key={`p${x.id}`}>
                      <i className="pay-dot">
                        <CreditCard />
                      </i>
                      <span>
                        <b>
                          Payment {money(paidOf(x))} — {statusOf(x)}
                        </b>
                        <small>
                          {dt(first(x.paid_at, x.created_at))}
                        </small>
                      </span>
                    </div>
                  ))}

                  {!orders.length && !payments.length && (
                    <p className="cd-muted">
                      No activity records available.
                    </p>
                  )}
                </div>
              </section>
            )}

          </div>
        </section>
      </div>

      {/* EDIT CUSTOMER MODAL */}
      {editOpen && (
        <div
          className="cd-modal-bg cd-edit-bg"
          onMouseDown={(e) =>
            e.target === e.currentTarget &&
            !saving &&
            setEditOpen(false)
          }
        >
          <form className="cd-edit-modal" onSubmit={saveCustomer}>

            <header className="cd-edit-header">
              <div>
                <Pencil />
                <div>
                  <h2>Edit Customer</h2>
                  <p>
                    Update customer profile, contact, address,
                    credit and payment details.
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="cd-icon-btn"
                onClick={() => setEditOpen(false)}
                disabled={saving}
              >
                <X />
              </button>
            </header>

            <div className="cd-edit-body">

              <aside className="cd-edit-sidebar">
                <div className="cd-edit-avatar">
                  {initials(editForm.full_name)}
                </div>

                <h3>{editForm.full_name || "Customer Name"}</h3>

                <small>
                  CUST-{String(customer.id).slice(0, 10).toUpperCase()}
                </small>

                <Status
                  value={editForm.is_active ? "Active" : "Inactive"}
                />

                <nav>
                  <a href="#edit-basic">♙　Basic Information</a>
                  <a href="#edit-address">⌖　Address Details</a>
                  <a href="#edit-credit">▤　Credit & Payment</a>
                  <a href="#edit-orders">▥　Order & Amounts</a>
                  <a href="#edit-preferences">⚒　Preferences</a>
                  <a href="#edit-account">⚙　Account Settings</a>
                </nav>
              </aside>

              <div className="cd-edit-content">

                {/* BASIC INFORMATION */}
                <section className="cd-edit-section" id="edit-basic">
                  <h3>
                    <UserRound />
                    Basic Information
                    <span>
                      Customer ID: {String(customer.id).slice(0, 10).toUpperCase()}
                    </span>
                  </h3>

                  <div className="cd-edit-grid four">
                    <label>
                      Full Name *
                      <input
                        required
                        value={editForm.full_name}
                        onChange={(e) =>
                          setEditForm((v) => ({
                            ...v,
                            full_name: e.target.value
                          }))
                        }
                      />
                    </label>

                    <label>
                      Customer Type *
                      <select
                        value={editForm.customer_type}
                        onChange={(e) =>
                          setEditForm((v) => ({
                            ...v,
                            customer_type: e.target.value
                          }))
                        }
                      >
                        <option>Individual</option>
                        <option>Business</option>
                        <option>Contractor</option>
                        <option>Dealer</option>
                        <option>Architect</option>
                      </select>
                    </label>

                    <label>
                      Customer Category *
                      <select
                        value={editForm.customer_category}
                        onChange={(e) =>
                          setEditForm((v) => ({
                            ...v,
                            customer_category: e.target.value
                          }))
                        }
                      >
                        <option>Regular</option>
                        <option>VIP</option>
                        <option>Wholesale</option>
                        <option>Retail</option>
                      </select>
                    </label>

                    <label>
                      Customer Status *
                      <select
                        value={editForm.is_active ? "active" : "inactive"}
                        onChange={(e) =>
                          setEditForm((v) => ({
                            ...v,
                            is_active: e.target.value === "active"
                          }))
                        }
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </label>

                    <label>
                      Phone Number *
                      <input
                        required
                        value={editForm.phone}
                        onChange={(e) =>
                          setEditForm((v) => ({
                            ...v,
                            phone: e.target.value
                          }))
                        }
                        placeholder="+91 XXXXX XXXXX"
                      />
                    </label>

                    <label>
                      Alternate Phone
                      <input
                        value={editForm.alternate_phone}
                        onChange={(e) =>
                          setEditForm((v) => ({
                            ...v,
                            alternate_phone: e.target.value
                          }))
                        }
                      />
                    </label>

                    <label className="span2">
                      Email Address *
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) =>
                          setEditForm((v) => ({
                            ...v,
                            email: e.target.value
                          }))
                        }
                        required
                      />
                    </label>

                    <label>
                      Date of Birth
                      <input
                        type="date"
                        value={editForm.date_of_birth}
                        onChange={(e) =>
                          setEditForm((v) => ({
                            ...v,
                            date_of_birth: e.target.value
                          }))
                        }
                      />
                    </label>

                    <label>
                      Gender
                      <select
                        value={editForm.gender}
                        onChange={(e) =>
                          setEditForm((v) => ({
                            ...v,
                            gender: e.target.value
                          }))
                        }
                      >
                        <option value="">Not specified</option>
                        <option>Male</option>
                        <option>Female</option>
                        <option>Other</option>
                      </select>
                    </label>

                    <label>
                      Registered On
                      <input value={dt(customer.created_at)} readOnly />
                    </label>
                  </div>
                </section>

                {/* ADDRESS DETAILS */}
                <div className="cd-edit-two-col">
                  <section className="cd-edit-section" id="edit-address">
                    <h3>
                      <MapPin />
                      Address Details

                      <label className="cd-same-check">
                        <input
                          type="checkbox"
                          checked={editForm.same_as_billing}
                          onChange={(e) =>
                            setEditForm((v) => ({
                              ...v,
                              same_as_billing: e.target.checked,
                              shipping_address: e.target.checked
                                ? v.address
                                : v.shipping_address,
                              shipping_city: e.target.checked
                                ? v.city
                                : v.shipping_city,
                              shipping_district: e.target.checked
                                ? v.district
                                : v.shipping_district,
                              shipping_state: e.target.checked
                                ? v.state
                                : v.shipping_state,
                              shipping_postal_code: e.target.checked
                                ? v.postal_code
                                : v.shipping_postal_code
                            }))
                          }
                        />
                        Same as Billing Address
                      </label>
                    </h3>

                    <div className="cd-edit-grid two">
                      <label>
                        Billing Address *
                        <textarea
                          rows="2"
                          required
                          value={editForm.address}
                          onChange={(e) =>
                            setEditForm((v) => ({
                              ...v,
                              address: e.target.value,
                              ...(v.same_as_billing
                                ? { shipping_address: e.target.value }
                                : {})
                            }))
                          }
                        />
                      </label>

                      <label>
                        Shipping Address *
                        <textarea
                          rows="2"
                          required
                          disabled={editForm.same_as_billing}
                          value={editForm.shipping_address}
                          onChange={(e) =>
                            setEditForm((v) => ({
                              ...v,
                              shipping_address: e.target.value
                            }))
                          }
                        />
                      </label>

                      <label>
                        City *
                        <input
                          required
                          value={editForm.city}
                          onChange={(e) =>
                            setEditForm((v) => ({
                              ...v,
                              city: e.target.value,
                              ...(v.same_as_billing
                                ? { shipping_city: e.target.value }
                                : {})
                            }))
                          }
                        />
                      </label>

                      <label>
                        District *
                        <input
                          required
                          value={editForm.district}
                          onChange={(e) =>
                            setEditForm((v) => ({
                              ...v,
                              district: e.target.value,
                              ...(v.same_as_billing
                                ? { shipping_district: e.target.value }
                                : {})
                            }))
                          }
                        />
                      </label>

                      <label>
                        State *
                        <input
                          required
                          value={editForm.state}
                          onChange={(e) =>
                            setEditForm((v) => ({
                              ...v,
                              state: e.target.value,
                              ...(v.same_as_billing
                                ? { shipping_state: e.target.value }
                                : {})
                            }))
                          }
                        />
                      </label>

                      <label>
                        PIN Code *
                        <input
                          required
                          maxLength="6"
                          value={editForm.postal_code}
                          onChange={(e) =>
                            setEditForm((v) => ({
                              ...v,
                              postal_code: e.target.value,
                              ...(v.same_as_billing
                                ? { shipping_postal_code: e.target.value }
                                : {})
                            }))
                          }
                        />
                      </label>
                    </div>
                  </section>

                  {/* CREDIT AND PAYMENT */}
                  <section className="cd-edit-section" id="edit-credit">
                    <h3>
                      <Wallet />
                      Credit & Payment Details
                    </h3>

                    <div className="cd-edit-grid two">
                      <label>
                        Credit Limit (₹) *
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editForm.credit_limit}
                          onChange={(e) =>
                            setEditForm((v) => ({
                              ...v,
                              credit_limit: e.target.value
                            }))
                          }
                        />
                      </label>

                      <label>
                        Opening Balance (₹)
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editForm.opening_balance}
                          onChange={(e) =>
                            setEditForm((v) => ({
                              ...v,
                              opening_balance: e.target.value
                            }))
                          }
                        />
                      </label>

                      <label>
                        Payment Terms *
                        <select
                          value={editForm.payment_terms}
                          onChange={(e) =>
                            setEditForm((v) => ({
                              ...v,
                              payment_terms: e.target.value
                            }))
                          }
                        >
                          <option>Immediate</option>
                          <option>7 Days</option>
                          <option>15 Days</option>
                          <option>30 Days</option>
                          <option>45 Days</option>
                          <option>60 Days</option>
                        </select>
                      </label>

                      <label>
                        Preferred Payment Method
                        <select
                          value={editForm.preferred_payment_method}
                          onChange={(e) =>
                            setEditForm((v) => ({
                              ...v,
                              preferred_payment_method: e.target.value
                            }))
                          }
                        >
                          <option>UPI</option>
                          <option>Cash</option>
                          <option>Bank Transfer</option>
                          <option>Card</option>
                          <option>Cheque</option>
                        </select>
                      </label>

                      <label>
                        Discount (%)
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={editForm.discount_percent}
                          onChange={(e) =>
                            setEditForm((v) => ({
                              ...v,
                              discount_percent: e.target.value
                            }))
                          }
                        />
                      </label>

                      <label>
                        Tax Type
                        <select
                          value={editForm.tax_type}
                          onChange={(e) =>
                            setEditForm((v) => ({
                              ...v,
                              tax_type: e.target.value
                            }))
                          }
                        >
                          <option>GST</option>
                          <option>Non-GST</option>
                          <option>Composition</option>
                        </select>
                      </label>
                    </div>
                  </section>
                </div>

                {/* ORDER SUMMARY */}
                <div className="cd-edit-two-col bottom">
                  <section className="cd-edit-section" id="edit-orders">
                    <h3>
                      <ShoppingCart />
                      Order & Amounts Summary
                    </h3>

                    <div className="cd-edit-stats">
                      <article>
                        <small>Total Orders</small>
                        <b>{orders.length}</b>
                      </article>

                      <article>
                        <small>Total Purchase</small>
                        <b>{money(totals.spent)}</b>
                      </article>

                      <article>
                        <small>Total Paid</small>
                        <b className="green">{money(totals.paid)}</b>
                      </article>

                      <article>
                        <small>Outstanding</small>
                        <b className="red">{money(totals.pending)}</b>
                      </article>
                    </div>

                    <p className="cd-edit-readonly">
                      Amounts are calculated from saved orders
                      and payment records.
                    </p>
                  </section>

                  <section
                    className="cd-edit-section"
                    id="edit-preferences"
                  >
                    <h3>
                      <NotebookPen />
                      Additional Information
                    </h3>

                    <label>
                      Internal Remarks / Notes
                      <textarea
                        rows="4"
                        value={editForm.internal_remarks}
                        onChange={(e) =>
                          setEditForm((v) => ({
                            ...v,
                            internal_remarks: e.target.value
                          }))
                        }
                        placeholder="Add internal customer remarks..."
                      />
                    </label>
                  </section>
                </div>

                <section
                  className="cd-edit-section cd-edit-account"
                  id="edit-account"
                >
                  <h3>
                    <RefreshCw />
                    Account Settings
                  </h3>

                  <p>
                    Customer account status is controlled by
                    the Customer Status field above.
                    Customer ID and registration date cannot be edited.
                  </p>
                </section>

              </div>
            </div>

            <footer className="cd-edit-footer">
              <button
                type="button"
                className="cd-delete-customer"
                onClick={() =>
                  setToast(
                    "Customer deletion is disabled here to protect order and payment history."
                  )
                }
              >
                Delete Customer
              </button>

              <div>
                <button
                  type="button"
                  className="cd-button"
                  onClick={openEditCustomer}
                  disabled={saving}
                >
                  <RefreshCw />
                  Reset Form
                </button>

                <button
                  type="button"
                  className="cd-button"
                  onClick={() => setEditOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="cd-button cd-button-gold"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "✓ Save Changes"}
                </button>
              </div>
            </footer>
          </form>
        </div>
      )}

      {/* TOAST MESSAGE */}
      {toast && (
        <div className="cd-toast">
          <span>{toast}</span>
          <button onClick={() => setToast("")}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* ADD CUSTOMER NOTE MODAL */}
      {noteOpen && (
        <div
          className="cd-modal-bg"
          onMouseDown={(e) =>
            e.target === e.currentTarget && setNoteOpen(false)
          }
        >
          <section className="cd-note-modal">
            <div className="cd-card-head">
              <h3>Add Customer Note</h3>

              <button
                className="cd-icon-btn"
                onClick={() => setNoteOpen(false)}
              >
                <X />
              </button>
            </div>

            <textarea
              rows="5"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Enter an internal note about this customer..."
            />

            <div className="cd-modal-actions">
              <button
                className="cd-button"
                onClick={() => setNoteOpen(false)}
              >
                Cancel
              </button>

              <button
                className="cd-button cd-button-gold"
                disabled={!note.trim() || saving}
                onClick={saveNote}
              >
                {saving ? "Saving..." : "Save Note"}
              </button>
            </div>
          </section>
        </div>
      )}

    </main>
  );
}
