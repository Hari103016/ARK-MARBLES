import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ShoppingCart, Search, RefreshCw, Download, Eye, Pencil, X, CalendarDays,
  IndianRupee, Clock3, CheckCircle2, Truck, Package, CircleAlert, Wallet,
  CreditCard, ChevronLeft, ChevronRight, MoreHorizontal, MapPin, Phone, Mail,
  UserRound, Printer, FileText, LoaderCircle, Plus, RotateCcw
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import "./Orders.css";

const PAGE_SIZE = 5;
const ORDER_STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];
const PAYMENT_STATUSES = ["pending", "paid", "partially_paid", "failed", "refunded"];

const firstValue = (...values) => values.find((value) => value !== null && value !== undefined && String(value).trim() !== "");
const titleCase = (value) => String(value || "pending").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
const currency = (value) => new Intl.NumberFormat("en-IN", {
  style: "currency", currency: "INR", maximumFractionDigits: 0,
}).format(Number(value) || 0);
const formatDate = (value, withTime = false) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", withTime
    ? { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }
    : { day: "2-digit", month: "short", year: "numeric" });
};
const orderNumber = (order) => firstValue(order.order_number, order.order_id, `ORD-${String(order.id).slice(0, 8)}`);
const totalOf = (order) => Number(firstValue(order.total_amount, order.grand_total, order.amount, order.total, 0)) || 0;
const statusKey = (value) => String(value || "pending").toLowerCase().replaceAll(" ", "_");
const customerName = (profile, order) => firstValue(
  profile?.full_name, profile?.name, profile?.username,
  order?.shipping_address?.fullName, order?.shipping_address?.full_name,
  order?.shipping_address?.name, "Customer"
);
const addressOf = (order) => {
  const address = order?.shipping_address;
  if (!address) return "Delivery address not added";
  if (typeof address === "string") return address;
  return [
    address.address, address.city, address.state, address.postalCode || address.postal_code,
  ].filter(Boolean).join(", ") || "Delivery address not added";
};
const phoneOf = (profile, order) => firstValue(profile?.phone, profile?.mobile, profile?.phone_number, order?.shipping_address?.phone, "—");
const emailOf = (profile, order) => firstValue(profile?.email, order?.shipping_address?.email, "—");
const safeText = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[char]));

function StatusPill({ value, kind = "order" }) {
  const key = statusKey(value);
  return <span className={`order-status ${kind === "payment" ? "payment" : "fulfilment"} status-${key}`}>{titleCase(value)}</span>;
}

function initials(name) {
  return String(name || "C").trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [itemsWarning, setItemsWarning] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  const loadOrders = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError("");
    setItemsWarning("");
    try {
      const [ordersResult, profilesResult, itemsResult] = await Promise.all([
        supabase.from("orders").select("*").order("created_at", { ascending: false }),
        supabase.from("profiles").select("*"),
        supabase.from("order_items").select("*"),
      ]);
      if (ordersResult.error) throw ordersResult.error;
      if (profilesResult.error) {
        console.warn("Customer profiles could not be loaded:", profilesResult.error);
        setProfiles([]);
      } else setProfiles(profilesResult.data || []);
      if (itemsResult.error) {
        console.warn("Order items could not be loaded:", itemsResult.error);
        setOrderItems([]);
        setItemsWarning("Order item details are unavailable. Check SELECT access to the order_items table.");
      } else setOrderItems(itemsResult.data || []);
      setOrders(ordersResult.data || []);
      if (silent) setNotice("Orders refreshed successfully.");
    } catch (err) {
      console.error("Orders load error:", err);
      setError(err.message || "Unable to load orders.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const profileMap = useMemo(() => new Map(profiles.map((profile) => [String(profile.id), profile])), [profiles]);
  const rows = useMemo(() => orders.map((order) => {
    const profile = profileMap.get(String(order.customer_id));
    const items = orderItems.filter((item) => String(item.order_id) === String(order.id));
    const quantity = items.reduce((sum, item) => sum + (Number(item.quantity ?? item.qty ?? 1) || 1), 0);
    const productSummary = items.map((item) => firstValue(item.product_name, item.name, item.product_snapshot?.name, "Marble Product")).filter(Boolean);
    return {
      ...order,
      displayNumber: orderNumber(order),
      displayCustomer: customerName(profile, order),
      displayPhone: phoneOf(profile, order),
      displayEmail: emailOf(profile, order),
      displayAddress: addressOf(order),
      displayDate: order.created_at || order.order_date || order.date,
      displayAmount: totalOf(order),
      displayStatus: statusKey(order.status),
      displayPayment: statusKey(order.payment_status || order.payment_state || "pending"),
      displayItemsCount: Number(firstValue(order.item_count, order.total_items, quantity, 0)) || 0,
      items,
      productSummary,
      profile,
    };
  }), [orders, profileMap, orderItems]);

  const today = new Date();
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startYesterday = new Date(startToday);
  startYesterday.setDate(startYesterday.getDate() - 1);
  const startWeek = new Date(startToday);
  startWeek.setDate(startWeek.getDate() - 6);
  const startMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesSearch = !query || [
        row.displayNumber, row.displayCustomer, row.displayPhone, row.displayEmail,
        row.displayStatus, row.displayPayment, row.id,
      ].some((value) => String(value ?? "").toLowerCase().includes(query));
      const matchesStatus = statusFilter === "all" || row.displayStatus === statusFilter;
      const matchesPayment = paymentFilter === "all" || row.displayPayment === paymentFilter;
      const date = row.displayDate ? new Date(row.displayDate) : null;
      let matchesDate = true;
      if (dateFilter === "today") matchesDate = !!date && date >= startToday;
      if (dateFilter === "yesterday") matchesDate = !!date && date >= startYesterday && date < startToday;
      if (dateFilter === "week") matchesDate = !!date && date >= startWeek;
      if (dateFilter === "month") matchesDate = !!date && date >= startMonth;
      return matchesSearch && matchesStatus && matchesPayment && matchesDate;
    });
  }, [rows, search, statusFilter, paymentFilter, dateFilter]);

  const totalOrders = rows.length;
  const pendingCount = rows.filter((row) => ["pending", "confirmed"].includes(row.displayStatus)).length;
  const inProgressCount = rows.filter((row) => ["processing", "shipped"].includes(row.displayStatus)).length;
  const completedCount = rows.filter((row) => ["delivered", "completed"].includes(row.displayStatus)).length;
  const cancelledCount = rows.filter((row) => ["cancelled", "canceled"].includes(row.displayStatus)).length;
  const selectedOrder = rows.find((row) => String(row.id) === String(selectedOrderId)) || null;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const totalValue = rows.reduce((sum, row) => sum + row.displayAmount, 0);

  useEffect(() => { setPage(1); }, [search, statusFilter, paymentFilter, dateFilter]);
  useEffect(() => {
    if (selectedOrderId && !rows.some((row) => String(row.id) === String(selectedOrderId))) setSelectedOrderId(null);
  }, [rows, selectedOrderId]);

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setPaymentFilter("all");
    setDateFilter("all");
    setPage(1);
  };

  const exportOrders = () => {
    if (!filtered.length) {
      setNotice("There are no matching orders to export.");
      return;
    }
    const header = ["Order Number", "Customer", "Phone", "Email", "Date", "Items", "Total", "Payment Status", "Order Status"];
    const data = filtered.map((row) => [
      row.displayNumber, row.displayCustomer, row.displayPhone, row.displayEmail,
      formatDate(row.displayDate), row.displayItemsCount, row.displayAmount,
      titleCase(row.displayPayment), titleCase(row.displayStatus),
    ]);
    const csvCell = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const csv = [header, ...data].map((line) => line.map(csvCell).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "ark-marbles-orders.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const updateOrder = async () => {
    if (!editingOrder || saving) return;
    setSaving(true);
    setNotice("");
    try {
      const { data, error: updateError } = await supabase.from("orders")
        .update({ status: editingOrder.status, payment_status: editingOrder.payment_status })
        .eq("id", editingOrder.id)
        .select("*")
        .single();
      if (updateError) throw updateError;
      setOrders((current) => current.map((order) => String(order.id) === String(data.id) ? data : order));
      setEditingOrder(null);
      setNotice(`Order ${orderNumber(data)} updated successfully.`);
    } catch (err) {
      console.error("Order update error:", err);
      setNotice(`Could not update order: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const printInvoice = (order) => {
    if (!order) return;
    const itemRows = order.items.map((item) => {
      const name = firstValue(item.product_name, item.name, item.product_snapshot?.name, "Marble Product");
      const qty = Number(item.quantity ?? item.qty ?? 1) || 1;
      const unit = Number(item.unit_price ?? item.price ?? 0) || 0;
      const line = Number(item.line_total ?? qty * unit) || 0;
      return `<tr><td>${safeText(name)}</td><td>${qty}</td><td>${currency(unit)}</td><td>${currency(line)}</td></tr>`;
    }).join("");
    const address = safeText(order.displayAddress);
    const html = `<!doctype html><html><head><title>Invoice ${safeText(order.displayNumber)}</title><style>
      body{font-family:Arial,sans-serif;color:#222;padding:36px}header{display:flex;justify-content:space-between;border-bottom:2px solid #c49a37;padding-bottom:18px}
      h1{margin:0;color:#9a741e}small{color:#666}section{margin:24px 0}table{width:100%;border-collapse:collapse;margin-top:20px}
      th,td{text-align:left;padding:12px;border-bottom:1px solid #ddd}th{background:#f4ecd8}.total{text-align:right;font-size:22px;font-weight:bold;margin-top:20px}
      </style></head><body><header><div><h1>ARK MARBLES</h1><small>PREMIUM MARBLE & NATURAL STONE</small></div><div><h2>INVOICE</h2><b>${safeText(order.displayNumber)}</b><br/><small>${safeText(formatDate(order.displayDate, true))}</small></div></header>
      <section><b>Bill To:</b><p>${safeText(order.displayCustomer)}<br/>${safeText(order.displayPhone)}<br/>${safeText(order.displayEmail)}</p><b>Delivery Address:</b><p>${address}</p></section>
      <table><thead><tr><th>Product</th><th>Qty</th><th>Unit Price</th><th>Amount</th></tr></thead><tbody>${itemRows || "<tr><td colspan='4'>Item details unavailable</td></tr>"}</tbody></table>
      <p class="total">Total: ${currency(order.displayAmount)}</p><p>Order Status: ${safeText(titleCase(order.displayStatus))} | Payment: ${safeText(titleCase(order.displayPayment))}</p>
      <script>window.onload=()=>window.print()</script></body></html>`;
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) {
      setNotice("Allow pop-ups in your browser to print the invoice.");
      return;
    }
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const downloadReceipt = (order) => {
    if (!order) return;
    const itemLines = order.items.map((item) => {
      const name = firstValue(item.product_name, item.name, item.product_snapshot?.name, "Marble Product");
      const qty = Number(item.quantity ?? item.qty ?? 1) || 1;
      const unit = Number(item.unit_price ?? item.price ?? 0) || 0;
      return `${name} | Qty: ${qty} | Unit: ${currency(unit)} | Total: ${currency(Number(item.line_total) || qty * unit)}`;
    });
    const receipt = [
      "ARK MARBLES — ORDER RECEIPT", "================================",
      `Order: ${order.displayNumber}`, `Date: ${formatDate(order.displayDate, true)}`,
      `Customer: ${order.displayCustomer}`, `Phone: ${order.displayPhone}`,
      `Email: ${order.displayEmail}`, `Delivery: ${order.displayAddress}`,
      "", "ITEMS", ...itemLines, "", `Total: ${currency(order.displayAmount)}`,
      `Payment: ${titleCase(order.displayPayment)}`, `Status: ${titleCase(order.displayStatus)}`,
    ].join("\r\n");
    const url = URL.createObjectURL(new Blob([receipt], { type: "text/plain;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${order.displayNumber}-receipt.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="ark-orders-page">
      <div className="ark-orders-content">
        {notice && <div className="orders-toast" role="status"><CheckCircle2 size={17} /><span>{notice}</span><button onClick={() => setNotice("")} aria-label="Dismiss"><X size={15} /></button></div>}
        {error && <div className="orders-alert orders-alert-error"><CircleAlert size={18} /><span>{error}</span><button onClick={() => loadOrders()}>Retry</button></div>}
        {itemsWarning && <div className="orders-alert"><CircleAlert size={17} /><span>{itemsWarning}</span></div>}

        <section className="orders-hero">
          <div className="orders-hero-icon"><ShoppingCart size={32} /></div>
          <div className="orders-hero-copy">
            <span className="orders-eyebrow">ORDER MANAGEMENT</span>
            <h1>Orders Management</h1>
            <p>View, process and track all customer orders in one place.</p>
          </div>
          <div className="orders-hero-actions">
            <button className="orders-button orders-button-primary" onClick={() => setNotice("Orders are created through the customer checkout process. New customer orders will appear here automatically.")}><Plus size={18} /> Create Order</button>
            <button className="orders-button orders-button-outline" onClick={exportOrders} disabled={!filtered.length}><Download size={17} /> Export</button>
            <button className="orders-button orders-button-outline" onClick={() => loadOrders(true)} disabled={refreshing}><RefreshCw size={17} className={refreshing ? "orders-spin" : ""} /> Refresh</button>
          </div>
        </section>

        <section className="orders-stats">
          <article className="orders-stat-card"><div className="orders-stat-icon stat-gold"><ShoppingCart size={27} /></div><div><span>Total Orders</span><strong>{loading ? "—" : totalOrders.toLocaleString("en-IN")}</strong><small>All customer orders</small></div></article>
          <article className="orders-stat-card"><div className="orders-stat-icon stat-amber"><Wallet size={27} /></div><div><span>Pending</span><strong>{loading ? "—" : pendingCount}</strong><small>Orders awaiting processing</small></div></article>
          <article className="orders-stat-card"><div className="orders-stat-icon stat-blue"><Truck size={28} /></div><div><span>In Progress</span><strong>{loading ? "—" : inProgressCount}</strong><small>Production / dispatch</small></div></article>
          <article className="orders-stat-card"><div className="orders-stat-icon stat-green"><CheckCircle2 size={27} /></div><div><span>Completed</span><strong>{loading ? "—" : completedCount}</strong><small>Successfully delivered</small></div></article>
          <article className="orders-stat-card"><div className="orders-stat-icon stat-red"><X size={27} /></div><div><span>Cancelled</span><strong>{loading ? "—" : cancelledCount}</strong><small>Cancelled orders</small></div></article>
        </section>

        <section className="orders-workspace">
          <div className="orders-list-panel">
            <div className="orders-panel-heading">
              <div className="orders-panel-icon"><ShoppingCart size={27} /></div>
              <div><h2>Order List</h2><p>All orders with customer, amount, status and delivery details.</p></div>
              <span className="orders-count">{filtered.length.toLocaleString("en-IN")} Orders</span>
            </div>

            <div className="orders-filters">
              <label className="orders-search"><Search size={19} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by Order ID, Customer, Phone..." aria-label="Search orders" />{search && <button onClick={() => setSearch("")} aria-label="Clear search"><X size={15} /></button>}</label>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter order status"><option value="all">All Status</option>{ORDER_STATUSES.map((status) => <option key={status} value={status}>{titleCase(status)}</option>)}</select>
              <select value={paymentFilter} onChange={(event) => setPaymentFilter(event.target.value)} aria-label="Filter payment status"><option value="all">All Payment Status</option>{PAYMENT_STATUSES.map((status) => <option key={status} value={status}>{titleCase(status)}</option>)}</select>
              <select value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} aria-label="Filter date"><option value="all">All Dates</option><option value="today">Today</option><option value="yesterday">Yesterday</option><option value="week">Last 7 Days</option><option value="month">This Month</option></select>
              <button className="orders-reset" onClick={resetFilters}><RotateCcw size={16} /> Reset</button>
            </div>

            <div className="orders-table-wrap">
              <table className="orders-table">
                <thead><tr><th>#</th><th>Order ID</th><th>Customer</th><th>Date</th><th>Items</th><th>Amount</th><th>Payment</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {loading ? <tr><td colSpan="9" className="orders-empty"><LoaderCircle className="orders-spin" size={25} />Loading orders...</td></tr>
                    : visibleRows.length ? visibleRows.map((order, index) => (
                      <tr key={order.id} className={String(selectedOrderId) === String(order.id) ? "order-row-selected" : ""} onClick={() => setSelectedOrderId(order.id)}>
                        <td>{(currentPage - 1) * PAGE_SIZE + index + 1}</td>
                        <td><strong className="order-number">{order.displayNumber}</strong></td>
                        <td><div className="order-customer"><span className="order-avatar">{initials(order.displayCustomer)}</span><strong>{order.displayCustomer}</strong></div></td>
                        <td>{formatDate(order.displayDate)}</td>
                        <td>{order.displayItemsCount}</td>
                        <td className="order-amount">{currency(order.displayAmount)}</td>
                        <td><StatusPill value={order.displayPayment} kind="payment" /></td>
                        <td><StatusPill value={order.displayStatus} /></td>
                        <td><div className="order-row-actions">
                          <button title="View order" aria-label={`View ${order.displayNumber}`} onClick={(event) => { event.stopPropagation(); setSelectedOrderId(order.id); }}><Eye size={16} /></button>
                          <button title="Update order" aria-label={`Edit ${order.displayNumber}`} onClick={(event) => { event.stopPropagation(); setEditingOrder({ id: order.id, status: order.displayStatus, payment_status: order.displayPayment }); }}><Pencil size={15} /></button>
                          <button title="Print invoice" aria-label={`Print ${order.displayNumber}`} onClick={(event) => { event.stopPropagation(); printInvoice(order); }}><MoreHorizontal size={17} /></button>
                        </div></td>
                      </tr>
                    )) : <tr><td colSpan="9" className="orders-empty"><Package size={28} /><strong>No orders found</strong><span>Orders placed through the storefront will appear here.</span></td></tr>}
                </tbody>
              </table>
            </div>

            <div className="orders-pagination">
              <span>Showing <b>{filtered.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0} to {Math.min(currentPage * PAGE_SIZE, filtered.length)}</b> of <b>{filtered.length}</b> orders</span>
              <div><span>Rows per page: 5</span><button disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}><ChevronLeft size={17} /></button><b>{currentPage}</b><span>of {totalPages}</span><button disabled={currentPage === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}><ChevronRight size={17} /></button></div>
            </div>
          </div>

          <aside className="orders-details-panel">
            <div className="orders-details-heading"><FileText size={25} /><h2>Order Details</h2></div>
            {selectedOrder ? (
              <div className="orders-details-body">
                <div className="orders-detail-reference"><div><FileText size={26} /><div><strong>{selectedOrder.displayNumber}</strong><span>Placed on: {formatDate(selectedOrder.displayDate, true)}</span></div></div><StatusPill value={selectedOrder.displayStatus} /></div>
                <div className="orders-customer-info">
                  <div><UserRound size={17} /><span>Customer</span><strong>{selectedOrder.displayCustomer}</strong></div>
                  <div><Phone size={17} /><span>Phone</span><strong>{selectedOrder.displayPhone}</strong></div>
                  <div><Mail size={17} /><span>Email</span><strong>{selectedOrder.displayEmail}</strong></div>
                  <div><MapPin size={17} /><span>Delivery Address</span><strong>{selectedOrder.displayAddress}</strong></div>
                </div>
                <div className="orders-items-heading">Order Items <span>{selectedOrder.items.length}</span></div>
                <div className="orders-item-list">
                  {selectedOrder.items.length ? selectedOrder.items.map((item) => {
                    const name = firstValue(item.product_name, item.name, item.product_snapshot?.name, "Marble Product");
                    const quantity = Number(item.quantity ?? item.qty ?? 1) || 1;
                    const unitPrice = Number(item.unit_price ?? item.price ?? 0) || 0;
                    const lineTotal = Number(item.line_total ?? quantity * unitPrice) || 0;
                    const image = firstValue(item.product_snapshot?.image, item.image_url, item.image);
                    return <div className="orders-item" key={item.id || `${selectedOrder.id}-${name}`}><div className="orders-item-image">{image ? <img src={image} alt={name} /> : <Package size={24} />}</div><div className="orders-item-copy"><strong>{name}</strong><span>{currency(unitPrice)} each</span></div><span className="orders-item-qty">{quantity} {quantity === 1 ? "Item" : "Items"}</span><strong className="orders-item-total">{currency(lineTotal)}</strong></div>;
                  }) : <div className="orders-no-items">Item details are not available for this order.</div>}
                </div>
                <div className="orders-total-line"><span>Total Amount</span><strong>{currency(selectedOrder.displayAmount)}</strong></div>
                <div className="orders-payment-line"><span>Payment Status</span><StatusPill value={selectedOrder.displayPayment} kind="payment" /></div>
                <div className="orders-detail-actions"><button onClick={() => printInvoice(selectedOrder)}><Printer size={17} /> Print Invoice</button><button onClick={() => downloadReceipt(selectedOrder)}><Download size={17} /> Download Receipt</button></div>
              </div>
            ) : <div className="orders-no-selection"><div><FileText size={34} /></div><h3>Select an order</h3><p>Choose an order from the list to view customer information, marble items, payment and delivery details.</p></div>}
          </aside>
        </section>
        <footer className="orders-page-footer"><strong>ARK MARBLES</strong><span>Order Management</span><span>{loading ? "Loading orders..." : `${totalOrders.toLocaleString("en-IN")} order records loaded · Total value ${currency(totalValue)}`}</span></footer>
      </div>

      {editingOrder && (
        <div className="orders-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && !saving && setEditingOrder(null)}>
          <section className="orders-edit-modal" role="dialog" aria-modal="true" aria-labelledby="edit-order-heading">
            <button className="orders-modal-close" onClick={() => setEditingOrder(null)} disabled={saving}><X size={19} /></button>
            <span className="orders-eyebrow">ORDER MANAGEMENT</span><h2 id="edit-order-heading">Update Order Status</h2>
            <p>Change the order fulfilment and payment status. The update will be saved to Supabase.</p>
            <label>Order Status<select value={editingOrder.status} onChange={(event) => setEditingOrder((current) => ({ ...current, status: event.target.value }))}>{ORDER_STATUSES.map((status) => <option key={status} value={status}>{titleCase(status)}</option>)}</select></label>
            <label>Payment Status<select value={editingOrder.payment_status} onChange={(event) => setEditingOrder((current) => ({ ...current, payment_status: event.target.value }))}>{PAYMENT_STATUSES.map((status) => <option key={status} value={status}>{titleCase(status)}</option>)}</select></label>
            <div className="orders-modal-actions"><button onClick={() => setEditingOrder(null)} disabled={saving}>Cancel</button><button className="primary" onClick={updateOrder} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</button></div>
          </section>
        </div>
      )}
    </main>
  );
}
