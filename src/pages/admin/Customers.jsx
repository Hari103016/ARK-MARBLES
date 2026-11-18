import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import {
  Users, UserRound, Search, RefreshCw, Download, Eye, X, Trash2, ShieldAlert,
  ShoppingBag, IndianRupee, CalendarDays, Mail, Phone, MapPin, UserPlus,
  ChevronLeft, ChevronRight, AlertCircle, CheckCircle2, Clock, Wallet,
  CreditCard, Pencil, RotateCcw, Plus, Upload, Bell, ExternalLink
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import "./Customers.css";

const PAGE_SIZE = 5;
const money = (value) => new Intl.NumberFormat("en-IN", {
  style: "currency", currency: "INR", maximumFractionDigits: 0,
}).format(Number(value) || 0);
const clean = (value) => String(value ?? "").trim();
const lower = (value) => clean(value).toLowerCase();
const dateValue = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};
const formatDate = (value) => {
  const date = dateValue(value);
  return date ? date.toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  }) : "—";
};
const initials = (name) => clean(name || "C").split(/\s+/).slice(0, 2)
  .map((part) => part[0]?.toUpperCase() || "").join("");
const customerName = (row) => row.full_name || row.name || row.username || "Unnamed Customer";
const customerEmail = (row) => row.email || row.email_address || "—";
const customerPhone = (row) => row.phone || row.phone_number || row.mobile || row.mobile_number || "—";
const customerLocation = (row) =>
  [row.city, row.state, row.country].filter(Boolean).join(", ") || row.address || "—";
const orderCustomerId = (row) => row.customer_id || row.user_id || row.profile_id || row.user?.id || null;
const orderAmount = (row) => Number(
  row.total_amount ?? row.grand_total ?? row.final_amount ?? row.amount ?? row.total ?? row.subtotal ?? 0
) || 0;
const paymentCustomerId = (row) => row.customer_id || row.user_id || row.profile_id || row.user?.id || null;
const paymentAmount = (row) => Number(
  row.amount ?? row.payment_amount ?? row.paid_amount ?? row.total_amount ?? 0
) || 0;
const paymentStatus = (row) => lower(row.payment_status || row.status || row.payment_state);
const isPaidPayment = (row) => ["paid", "success", "successful", "completed", "captured"].includes(paymentStatus(row));
const isPendingPayment = (row) => ["pending", "unpaid", "partially_paid", "partial", "due", "failed"].includes(paymentStatus(row));
const profileStatus = (row) => {
  if (typeof row.is_active === "boolean") return row.is_active ? "Active" : "Inactive";
  return ["inactive", "blocked", "disabled", "suspended"].includes(lower(row.status)) ? "Inactive" : "Active";
};
const getRegistrationDate = (row) => row.created_at || row.registered_at || row.updated_at || null;
const startOfDay = (date) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};
const csvCell = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

export default function Customers() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paymentWarning, setPaymentWarning] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showAddInfo, setShowAddInfo] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [deletingCustomer, setDeletingCustomer] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleteSuccess, setDeleteSuccess] = useState("");

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    setError("");
    setPaymentWarning("");
    try {
      const [profilesResult, ordersResult, paymentsResult] = await Promise.all([
        supabase.from("profiles").select("*"),
        supabase.from("orders").select("*"),
        supabase.from("payments").select("*"),
      ]);
      if (profilesResult.error) throw profilesResult.error;
      setCustomers((profilesResult.data || []).filter((row) => lower(row.role) === "customer"));
      if (ordersResult.error) {
        console.warn("Orders could not be loaded:", ordersResult.error);
        setOrders([]);
        setPaymentWarning("Order information is unavailable. Check admin SELECT access to the orders table.");
      } else setOrders(ordersResult.data || []);
      if (paymentsResult.error) {
        console.warn("Payments could not be loaded:", paymentsResult.error);
        setPayments([]);
        setPaymentWarning("Payment details are unavailable. Check that the payments table exists and admins can read it.");
      } else setPayments(paymentsResult.data || []);
    } catch (err) {
      console.error("Customers load error:", err);
      setError(err.message || "Unable to load customer records.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCustomers(); }, [loadCustomers]);

  const rows = useMemo(() => customers.map((profile) => {
    const customerOrders = orders.filter((order) => String(orderCustomerId(order)) === String(profile.id));
    const customerPayments = payments.filter((payment) => String(paymentCustomerId(payment)) === String(profile.id));
    const paidFromPayments = customerPayments.filter(isPaidPayment).reduce((sum, item) => sum + paymentAmount(item), 0);
    const pendingFromPayments = customerPayments.filter(isPendingPayment).reduce((sum, item) => sum + paymentAmount(item), 0);
    const orderTotal = customerOrders
      .filter((order) => !["cancelled", "canceled", "refunded"].includes(lower(order.status)))
      .reduce((sum, order) => sum + orderAmount(order), 0);
    const paidFromOrders = customerOrders.reduce((sum, order) => {
      const status = lower(order.payment_status || order.payment_state);
      return ["paid", "completed", "success", "successful"].includes(status) ? sum + orderAmount(order) : sum;
    }, 0);
    const explicitDue = customerOrders.reduce((sum, order) => {
      const due = order.pending_amount ?? order.balance_amount ?? order.due_amount ?? order.amount_due;
      return sum + (Number(due) > 0 ? Number(due) : 0);
    }, 0);
    const paid = paidFromPayments || paidFromOrders;
    const pending = pendingFromPayments || explicitDue || Math.max(0, orderTotal - paid);
    const paymentState = pending > 0 ? (paid > 0 ? "Partial" : "Pending")
      : (orderTotal > 0 || paid > 0 ? "Paid" : "No Orders");
    return {
      ...profile,
      displayName: customerName(profile),
      displayEmail: customerEmail(profile),
      displayPhone: customerPhone(profile),
      displayLocation: customerLocation(profile),
      displayStatus: profileStatus(profile),
      joinedDate: getRegistrationDate(profile),
      orderCount: customerOrders.length,
      totalOrderValue: orderTotal,
      paidAmount: paid,
      pendingAmount: pending,
      paymentState,
      customerOrders,
      customerPayments,
    };
  }), [customers, orders, payments]);

  const today = startOfDay(new Date());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const filtered = useMemo(() => {
    const query = lower(search);
    return rows.filter((row) => {
      const matchesSearch = !query || [
        row.displayName, row.displayEmail, row.displayPhone, row.id, row.displayLocation,
      ].some((value) => lower(value).includes(query));
      const joined = dateValue(row.joinedDate);
      let matchesDate = true;
      if (dateFilter === "today") matchesDate = !!joined && joined >= today;
      if (dateFilter === "yesterday") matchesDate = !!joined && joined >= yesterday && joined < today;
      if (dateFilter === "7days") matchesDate = !!joined && joined >= sevenDaysAgo;
      if (dateFilter === "month") matchesDate = !!joined && joined >= monthStart;
      const matchesStatus = statusFilter === "all" || lower(row.displayStatus) === statusFilter;
      const matchesPayment = paymentFilter === "all"
        || (paymentFilter === "pending" && row.pendingAmount > 0)
        || (paymentFilter === "paid" && row.paymentState === "Paid")
        || (paymentFilter === "partial" && row.paymentState === "Partial");
      return matchesSearch && matchesDate && matchesStatus && matchesPayment;
    }).sort((a, b) => (dateValue(b.joinedDate)?.getTime() || 0) - (dateValue(a.joinedDate)?.getTime() || 0));
  }, [rows, search, dateFilter, statusFilter, paymentFilter]);

  const activeCount = rows.filter((row) => row.displayStatus === "Active").length;
  const newThisMonth = rows.filter((row) => {
    const joined = dateValue(row.joinedDate);
    return joined && joined >= monthStart;
  }).length;
  const pendingCustomers = rows.filter((row) => row.pendingAmount > 0).length;
  const totalPending = rows.reduce((sum, row) => sum + row.pendingAmount, 0);
  const totalPaid = rows.reduce((sum, row) => sum + row.paidAmount, 0);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  useEffect(() => { setPage(1); }, [search, statusFilter, paymentFilter, dateFilter]);

  useEffect(() => {
    if (selectedCustomer) {
      const fresh = rows.find((row) => String(row.id) === String(selectedCustomer.id));
      if (fresh) setSelectedCustomer(fresh);
    }
  }, [rows, selectedCustomer?.id]);

  const resetFilters = () => {
    setSearch("");
    setDateFilter("all");
    setStatusFilter("all");
    setPaymentFilter("all");
    setPage(1);
  };

  const exportCSV = () => {
    const data = [
      ["Customer ID", "Name", "Email", "Phone", "Location", "Joined", "Orders", "Order Value", "Paid", "Pending", "Payment Status", "Account Status"],
      ...filtered.map((row) => [
        row.id, row.displayName, row.displayEmail, row.displayPhone, row.displayLocation,
        formatDate(row.joinedDate), row.orderCount, row.totalOrderValue,
        row.paidAmount, row.pendingAmount, row.paymentState, row.displayStatus,
      ]),
    ];
    const csv = data.map((line) => line.map(csvCell).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "ark-marbles-customers.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const confirmDeleteCustomer = async () => {
    if (!customerToDelete || deletingCustomer) return;
    setDeletingCustomer(true);
    setDeleteError("");
    try {
      const { data, error: deleteErrorResult } = await supabase.from("profiles")
        .delete().eq("id", customerToDelete.id).select("id").maybeSingle();
      if (deleteErrorResult) throw deleteErrorResult;
      if (!data?.id) throw new Error("No profile was deleted. Check the customer record and your Supabase RLS DELETE policy.");
      const { data: refreshed, error: refreshError } = await supabase.from("profiles").select("*");
      if (refreshError) throw refreshError;
      setCustomers((refreshed || []).filter((row) => lower(row.role) === "customer"));
      setSelectedCustomer((current) => current?.id === customerToDelete.id ? null : current);
      setDeleteSuccess(`${customerToDelete.displayName} was deleted successfully.`);
      setCustomerToDelete(null);
    } catch (err) {
      console.error("Customer delete error:", err);
      setDeleteError(err.message || "Unable to delete this customer profile.");
    } finally {
      setDeletingCustomer(false);
    }
  };

  const openCustomer = (row) => setSelectedCustomer(row);

  return (
    <main className="ark-customers">
      {deleteSuccess && (
        <div className="customers-toast" role="status">
          <CheckCircle2 size={18} /><span>{deleteSuccess}</span>
          <button onClick={() => setDeleteSuccess("")} aria-label="Dismiss"><X size={16} /></button>
        </div>
      )}

      <div className="customers-page">
        <section className="customers-hero">
          <div className="customers-hero-icon"><Users size={34} /></div>
          <div className="customers-hero-copy">
            <span className="customers-kicker">CUSTOMER RELATIONSHIP MANAGEMENT</span>
            <h1>Customers Management</h1>
            <p>View, manage and track all your customers, their orders and transactions.</p>
          </div>
          <div className="customers-hero-actions">
            <button className="customer-btn customer-btn-primary" onClick={() => setShowAddInfo(true)}><Plus size={18} /> Add Customer</button>
            <button className="customer-btn customer-btn-outline" onClick={exportCSV} disabled={!filtered.length}><Download size={17} /> Export</button>
            <button className="customer-btn customer-btn-outline" onClick={loadCustomers} disabled={loading}><Upload size={17} /> Refresh</button>
          </div>
        </section>

        {error && <div className="customer-alert customer-alert-error"><AlertCircle size={18} /><span>{error}</span><button onClick={loadCustomers}>Retry</button></div>}
        {paymentWarning && <div className="customer-alert customer-alert-warning"><AlertCircle size={17} /><span>{paymentWarning}</span></div>}

        <section className="customers-metrics">
          <article className="customer-metric">
            <div className="metric-icon metric-gold"><Users size={29} /></div>
            <div className="metric-content"><span>Total Customers</span><strong>{loading ? "—" : rows.length.toLocaleString("en-IN")}</strong><small>All registered customers</small></div>
          </article>
          <article className="customer-metric">
            <div className="metric-icon metric-green"><UserRound size={29} /></div>
            <div className="metric-content"><span>Active Customers</span><strong>{loading ? "—" : activeCount.toLocaleString("en-IN")}</strong><small>Currently active accounts</small></div>
          </article>
          <article className="customer-metric">
            <div className="metric-icon metric-amber"><UserPlus size={29} /></div>
            <div className="metric-content"><span>New This Month</span><strong>{loading ? "—" : newThisMonth}</strong><small>Customers joined this month</small></div>
          </article>
          <article className="customer-metric">
            <div className="metric-icon metric-red"><Wallet size={29} /></div>
            <div className="metric-content"><span>Total Outstanding</span><strong className="metric-red-text">{loading ? "—" : money(totalPending)}</strong><small>{pendingCustomers} customers with dues</small></div>
          </article>
          <article className="customer-metric">
            <div className="metric-icon metric-green"><CreditCard size={29} /></div>
            <div className="metric-content"><span>Total Paid</span><strong className="metric-green-text">{loading ? "—" : money(totalPaid)}</strong><small>Received payments</small></div>
          </article>
        </section>

        <section className="customers-workspace">
          <div className="customers-list-panel">
            <div className="customer-panel-heading">
              <div className="customer-panel-title-icon"><Users size={27} /></div>
              <div><h2>Customer List</h2><p>All customers with their details, orders and payment status.</p></div>
              <span className="customer-total-pill">{filtered.length.toLocaleString("en-IN")} records</span>
            </div>

            <div className="customer-filters">
              <label className="customer-search"><Search size={19} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name, phone, email or ID..." />{search && <button onClick={() => setSearch("")} aria-label="Clear search"><X size={16} /></button>}</label>
              <select aria-label="Account status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="all">All Status</option><option value="active">Active</option><option value="inactive">Inactive</option>
              </select>
              <select aria-label="Payment status" value={paymentFilter} onChange={(event) => setPaymentFilter(event.target.value)}>
                <option value="all">All Payment Status</option><option value="pending">Pending</option><option value="partial">Partial</option><option value="paid">Paid</option>
              </select>
              <select aria-label="Registration date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)}>
                <option value="all">All Dates</option><option value="today">Today</option><option value="yesterday">Yesterday</option><option value="7days">Last 7 Days</option><option value="month">This Month</option>
              </select>
              <button className="customer-reset" onClick={resetFilters}><RotateCcw size={16} /> Reset</button>
            </div>

            <div className="customers-table-wrap">
              <table className="customers-table">
                <thead><tr>
                  <th>#</th><th>Customer</th><th>Phone</th><th>Email</th><th>Orders</th><th>Total Spent</th><th>Outstanding</th><th>Status</th><th>Joined</th><th>Actions</th>
                </tr></thead>
                <tbody>
                  {loading ? <tr><td colSpan="10" className="customer-empty"><RefreshCw className="customer-spin" size={24} /> Loading customers...</td></tr>
                    : visibleRows.length ? visibleRows.map((row, index) => (
                      <tr key={row.id} className={selectedCustomer?.id === row.id ? "customer-row-selected" : ""} onClick={() => openCustomer(row)}>
                        <td>{(currentPage - 1) * PAGE_SIZE + index + 1}</td>
                        <td><div className="customer-person"><div className="customer-avatar">{initials(row.displayName)}</div><strong>{row.displayName}</strong></div></td>
                        <td className="customer-table-contact">{row.displayPhone}</td>
                        <td className="customer-table-email">{row.displayEmail}</td>
                        <td>{row.orderCount}</td>
                        <td className="customer-money">{money(row.totalOrderValue)}</td>
                        <td className={row.pendingAmount > 0 ? "customer-due" : "customer-money"}>{money(row.pendingAmount)}</td>
                        <td><span className={`customer-status ${row.displayStatus.toLowerCase()}`}>{row.displayStatus}</span></td>
                        <td>{formatDate(row.joinedDate)}</td>
                        <td><div className="customer-actions">
                          <button title="View details" aria-label={`View ${row.displayName}`} onClick={(event) => { event.stopPropagation(); openCustomer(row); }}><Eye size={17} /></button>
                          <button title="Edit customer details" aria-label={`Open ${row.displayName} details`} onClick={(event) => { event.stopPropagation(); navigate(`/admin/customers/${row.id}`); }}><Pencil size={16} /></button>
                          <button className="customer-delete-action" title="Delete customer" aria-label={`Delete ${row.displayName}`} onClick={(event) => { event.stopPropagation(); setDeleteError(""); setCustomerToDelete(row); }}><Trash2 size={16} /></button>
                        </div></td>
                      </tr>
                    )) : <tr><td colSpan="10" className="customer-empty"><Users size={28} /><strong>No customers found</strong><span>Try changing your search or filters.</span></td></tr>}
                </tbody>
              </table>
            </div>

            <div className="customer-pagination">
              <span>Showing <b>{filtered.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0} to {Math.min(currentPage * PAGE_SIZE, filtered.length)}</b> of <b>{filtered.length.toLocaleString("en-IN")}</b> customers</span>
              <div><span>Rows per page: 5</span><button disabled={currentPage === 1} onClick={() => setPage((n) => Math.max(1, n - 1))}><ChevronLeft size={17} /></button><b>{currentPage}</b><span>of {totalPages}</span><button disabled={currentPage === totalPages} onClick={() => setPage((n) => Math.min(totalPages, n + 1))}><ChevronRight size={17} /></button></div>
            </div>
          </div>

          <aside className="customer-details-panel">
            <div className="customer-details-heading"><UserRound size={25} /><h2>Customer Details</h2>{selectedCustomer && <button onClick={() => navigate(`/admin/customers/${selectedCustomer.id}`)} title="Edit customer"><Pencil size={17} /></button>}</div>
            {selectedCustomer ? (
              <div className="customer-details-content">
                <div className="customer-profile-top">
                  <div className="customer-avatar customer-avatar-xl">{initials(selectedCustomer.displayName)}</div>
                  <div className="customer-profile-name"><h3>{selectedCustomer.displayName}</h3><span>Customer ID : {String(selectedCustomer.id).slice(0, 12)}</span></div>
                  <span className={`customer-status ${selectedCustomer.displayStatus.toLowerCase()}`}>{selectedCustomer.displayStatus}</span>
                </div>
                <div className="customer-contact-list">
                  <div><Phone size={17} /><span>{selectedCustomer.displayPhone}</span></div>
                  <div><Mail size={17} /><span>{selectedCustomer.displayEmail}</span></div>
                  <div><MapPin size={18} /><span>{selectedCustomer.displayLocation}</span></div>
                  <div><CalendarDays size={17} /><span>Joined {formatDate(selectedCustomer.joinedDate)}</span></div>
                </div>
                <div className="customer-detail-stats">
                  <div><ShoppingBag size={22} /><span>Total Orders</span><strong>{selectedCustomer.orderCount}</strong></div>
                  <div><IndianRupee size={22} /><span>Total Spent</span><strong>{money(selectedCustomer.totalOrderValue)}</strong></div>
                  <div><Clock size={22} /><span>Outstanding</span><strong className="customer-due">{money(selectedCustomer.pendingAmount)}</strong></div>
                </div>
                <div className="customer-payment-summary"><span>Payment Status</span><strong className={`payment-label ${selectedCustomer.paymentState.toLowerCase().replace(/\s+/g, "-")}`}>{selectedCustomer.paymentState}</strong><div><span>Paid amount</span><b>{money(selectedCustomer.paidAmount)}</b></div><div><span>Pending amount</span><b className="customer-due">{money(selectedCustomer.pendingAmount)}</b></div></div>
                <div className="customer-detail-buttons">
                  <button onClick={() => navigate(`/admin/orders?customer=${encodeURIComponent(selectedCustomer.id)}`)}><ShoppingBag size={17} /> View Orders</button>
                  <button onClick={() => navigate(`/admin/payments?customer=${encodeURIComponent(selectedCustomer.id)}`)}><CreditCard size={17} /> View Payments</button>
                </div>
              </div>
            ) : (
              <div className="customer-no-selection"><div><UserRound size={34} /></div><h3>Select a customer</h3><p>Choose a customer from the list to view their contact information, orders and payment summary.</p></div>
            )}
          </aside>
        </section>
        <div className="customers-footnote"><strong>ARK MARBLES</strong><span>Customer Management</span><span>{loading ? "Loading records..." : `${rows.length.toLocaleString("en-IN")} customer records loaded`}</span></div>
      </div>

      {customerToDelete && createPortal(
        <div className="customer-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !deletingCustomer) { setCustomerToDelete(null); setDeleteError(""); } }}>
          <section className="customer-confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="delete-customer-title">
            <button className="customer-modal-close" onClick={() => { setCustomerToDelete(null); setDeleteError(""); }} disabled={deletingCustomer}><X size={19} /></button>
            <div className="customer-delete-icon"><Trash2 size={25} /></div><span className="customers-kicker">ARK MARBLES / CUSTOMER DATABASE</span>
            <h2 id="delete-customer-title">Delete Customer?</h2>
            <p>This removes the public customer profile record. The Supabase Auth account is not deleted by this browser action.</p>
            <div className="customer-delete-person"><div className="customer-avatar">{initials(customerToDelete.displayName)}</div><div><b>{customerToDelete.displayName}</b><span>{customerToDelete.displayEmail}</span></div></div>
            {deleteError && <div className="customer-alert customer-alert-error"><AlertCircle size={16} />{deleteError}</div>}
            <div className="customer-modal-actions"><button onClick={() => setCustomerToDelete(null)} disabled={deletingCustomer}>Keep Customer</button><button className="danger" onClick={confirmDeleteCustomer} disabled={deletingCustomer}>{deletingCustomer ? "Deleting..." : "Delete Customer"}</button></div>
          </section>
        </div>, document.body
      )}

      {showAddInfo && (
        <div className="customer-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setShowAddInfo(false)}>
          <section className="customer-confirm-modal customer-info-modal" role="dialog" aria-modal="true" aria-labelledby="add-customer-title">
            <button className="customer-modal-close" onClick={() => setShowAddInfo(false)}><X size={19} /></button>
            <div className="customer-add-icon"><UserPlus size={27} /></div><span className="customers-kicker">ARK MARBLES</span>
            <h2 id="add-customer-title">Add New Customer</h2>
            <p>Customer accounts are created through your website registration and authentication process. Once a customer registers, their profile appears here automatically.</p>
            <p>This page reads customer accounts from the <b>profiles</b> table. It does not create Supabase Auth accounts directly.</p>
            <div className="customer-modal-actions"><button className="customer-primary-action" onClick={() => setShowAddInfo(false)}>Got It</button></div>
          </section>
        </div>
      )}
    </main>
  );
}
