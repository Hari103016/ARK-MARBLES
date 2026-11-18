import { useEffect, useMemo, useState } from "react";
import {
  ReceiptText, Search, Download, RefreshCw, Eye, Printer, MessageCircle,
  FileText, CheckCircle2, Clock3, CircleAlert, CalendarDays, ChevronLeft,
  ChevronRight, X, UserRound, Phone, Mail, CreditCard, Package, MapPin
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import "./Receipts.css";

const PAGE_SIZE = 5;
const first = (...values) => values.find((value) => value !== null && value !== undefined && value !== "");
const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const dateLabel = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric"
  });
};
const dateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
  });
};
const statusText = (value) => ({
  paid: "Paid", pending: "Pending", partially_paid: "Partial",
  failed: "Failed", refunded: "Refunded"
}[String(value || "pending").toLowerCase()] || String(value || "Pending"));
const statusClass = (value) => String(value || "pending").toLowerCase().replace(/[^a-z0-9]+/g, "-");
const methodText = (value) => ({
  cod: "Cash on Delivery", cash: "Cash", upi: "UPI",
  card: "Card", bank_transfer: "Bank Transfer"
}[String(value || "").toLowerCase()] || first(value, "Not specified"));
const receiptNo = (order) => `RCPT-${String(order.id).slice(-6).toUpperCase()}`;
const orderNo = (order) => first(order.order_number, `ORD-${String(order.id).slice(-6).toUpperCase()}`);

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[char]));
}

function buildReceiptDocument(order) {
  const address = order.shipping_address && typeof order.shipping_address === "object" ? order.shipping_address : {};
  const items = order.items || [];
  const rows = items.length
    ? items.map((item, index) => `<tr><td>${index + 1}</td><td>${escapeHtml(item.product_name || "Marble Product")}</td><td>${Number(item.quantity || 1)}</td><td>${money(item.unit_price)}</td><td>${money(item.line_total)}</td></tr>`).join("")
    : `<tr><td>1</td><td>Order purchase</td><td>1</td><td>${money(order.total_amount)}</td><td>${money(order.total_amount)}</td></tr>`;
  return `<!doctype html><html><head><meta charset="utf-8"><title>${receiptNo(order)}</title>
  <style>
    *{box-sizing:border-box}body{margin:0;padding:35px;background:#f4f1e9;color:#25231e;font:13px Arial,sans-serif}
    .paper{max-width:820px;margin:auto;padding:34px;background:#fffdf8;border:5px double #bd964d;box-shadow:0 8px 35px #0001}
    .head{display:flex;justify-content:space-between;gap:20px;align-items:center;border-bottom:2px solid #c8a45e;padding-bottom:18px}
    .brand{font: bold 25px Georgia,serif;color:#8b682b;letter-spacing:1px}.brand small{display:block;color:#34302a;font: bold 11px Arial;letter-spacing:2px;margin-top:4px}
    h1{font: bold 26px Georgia,serif;margin:0 0 6px}.muted{color:#777;font-size:11px;line-height:1.6}
    .meta{display:grid;grid-template-columns:1fr 1fr;gap:20px;padding:20px 0}
    .meta p{margin:5px 0}.section{padding:10px;background:#f1e4c6;font-weight:bold;margin:8px 0}
    table{width:100%;border-collapse:collapse;margin-top:10px}th{background:#e9d7ad;text-align:left}th,td{padding:11px 9px;border-bottom:1px solid #e4dccb}
    .right{text-align:right}.total{margin:18px 0 0 auto;width:min(340px,100%);padding:14px;background:#50370f;color:white;display:flex;justify-content:space-between;font-size:17px;font-weight:bold}
    .foot{margin-top:35px;padding-top:15px;border-top:1px solid #d9c9a5;text-align:center;color:#777;font-size:10px}
    @media print{body{padding:0;background:white}.paper{box-shadow:none;border-width:4px}}
  </style></head><body><div class="paper">
    <div class="head"><div><div class="brand">ARK MARBLES<small>& CONSTRUCTION</small></div><p class="muted">Premium Marble & Natural Stone</p></div>
    <div class="right"><h1>PAYMENT RECEIPT</h1><b>${receiptNo(order)}</b></div></div>
    <div class="meta"><div><b>ARK MARBLES & CONSTRUCTION</b><p class="muted">Mylavaram, NTR District, Andhra Pradesh, India<br/>Phone: Add your business phone<br/>Email: Add your business email</p></div>
    <div class="right"><p><b>Date:</b> ${dateLabel(order.created_at)}</p><p><b>Order ID:</b> ${escapeHtml(orderNo(order))}</p><p><b>Payment Type:</b> ${escapeHtml(methodText(order.payment_method))}</p><p><b>Payment Status:</b> ${escapeHtml(statusText(order.payment_status))}</p></div></div>
    <div class="section">CUSTOMER DETAILS</div><p><b>Customer:</b> ${escapeHtml(order.customerName)}</p><p><b>Phone:</b> ${escapeHtml(first(address.phone, "—"))}</p><p><b>Email:</b> ${escapeHtml(first(address.email, "—"))}</p><p><b>Address:</b> ${escapeHtml([address.address,address.city,address.state,address.postalCode].filter(Boolean).join(", ") || "—")}</p>
    <div class="section">ORDER DETAILS</div><table><thead><tr><th>#</th><th>Item Description</th><th>Qty</th><th>Unit Price</th><th class="right">Amount</th></tr></thead><tbody>${rows}</tbody></table>
    <div class="total"><span>Total Amount</span><span>${money(order.total_amount)}</span></div>
    <div class="foot">Thank you for choosing ARK MARBLES. This receipt reflects the order and payment status recorded in our system.</div>
  </div></body></html>`;
}

function openReceipt(order) {
  const win = window.open("", "_blank", "width=900,height=950");
  if (!win) {
    window.alert("Please allow pop-ups to view or print the receipt.");
    return;
  }
  win.document.open();
  win.document.write(buildReceiptDocument(order));
  win.document.close();
  return win;
}

function exportCsv(rows) {
  if (!rows.length) {
    window.alert("There are no receipts to export.");
    return;
  }
  const headers = ["Receipt No", "Order No", "Customer", "Date", "Amount", "Payment Method", "Payment Status"];
  const quote = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const data = rows.map((order) => [
    receiptNo(order), orderNo(order), order.customerName, order.created_at,
    order.total_amount, methodText(order.payment_method), statusText(order.payment_status)
  ].map(quote).join(","));
  const blob = new Blob(["\uFEFF", [headers.map(quote).join(","), ...data].join("\r\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `ark-marbles-receipts-${new Date().toISOString().slice(0,10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function Receipts() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [methodFilter, setMethodFilter] = useState("All Payment Types");
  const [dateFilter, setDateFilter] = useState("All Dates");
  const [selectedId, setSelectedId] = useState(null);
  const [page, setPage] = useState(1);

  async function loadReceipts() {
    setLoading(true);
    setError("");
    try {
      const { data: orderRows, error: orderError } = await supabase
        .from("orders").select("*").order("created_at", { ascending: false });
      if (orderError) throw orderError;
      const rows = orderRows || [];
      const orderIds = rows.map((row) => row.id).filter(Boolean);
      const customerIds = [...new Set(rows.map((row) => row.customer_id).filter(Boolean))];

      let profileMap = {};
      let itemMap = {};
      if (customerIds.length) {
        const { data, error: profileError } = await supabase
          .from("profiles").select("id, full_name").in("id", customerIds);
        if (profileError) throw profileError;
        profileMap = Object.fromEntries((data || []).map((profile) => [profile.id, profile]));
      }
      if (orderIds.length) {
        const { data, error: itemsError } = await supabase
          .from("order_items")
          .select("id, order_id, product_name, quantity, unit_price, line_total")
          .in("order_id", orderIds);
        if (itemsError) throw itemsError;
        itemMap = (data || []).reduce((map, item) => {
          (map[item.order_id] ||= []).push(item);
          return map;
        }, {});
      }

      const enriched = rows.map((order) => {
        const address = order.shipping_address && typeof order.shipping_address === "object" ? order.shipping_address : {};
        return {
          ...order,
          customerName: first(profileMap[order.customer_id]?.full_name, address.fullName, "Customer"),
          customerPhone: first(address.phone, "—"),
          customerEmail: first(address.email, "—"),
          items: itemMap[order.id] || []
        };
      });
      setOrders(enriched);
      setSelectedId((currentId) => {
        if (currentId && enriched.some((row) => row.id === currentId)) return currentId;
        return enriched[0]?.id ?? null;
      });
    } catch (err) {
      console.error("Receipt loading failed:", err);
      setError(err.message || "Could not load receipts. Check your Supabase access policies.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadReceipts(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((order) => {
      const haystack = [receiptNo(order), orderNo(order), order.customerName, order.customerPhone, order.customerEmail].join(" ").toLowerCase();
      const status = String(order.payment_status || "pending").toLowerCase();
      const method = String(order.payment_method || "").toLowerCase();
      const day = order.created_at ? new Date(order.created_at).toISOString().slice(0,10) : "";
      return (!q || haystack.includes(q)) &&
        (statusFilter === "All Status" || status === statusFilter) &&
        (methodFilter === "All Payment Types" || method === methodFilter) &&
        (dateFilter === "All Dates" || day === dateFilter);
    });
  }, [orders, search, statusFilter, methodFilter, dateFilter]);

  const selected = orders.find((order) => order.id === selectedId) || null;
  const paid = orders.filter((order) => String(order.payment_status).toLowerCase() === "paid");
  const partial = orders.filter((order) => String(order.payment_status).toLowerCase() === "partially_paid");
  const pending = orders.filter((order) => ["pending", "failed"].includes(String(order.payment_status || "pending").toLowerCase()));
  const totalValue = orders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function resetFilters() {
    setSearch(""); setStatusFilter("All Status"); setMethodFilter("All Payment Types");
    setDateFilter("All Dates"); setPage(1);
  }
  function shareWhatsApp(order) {
    const address = order.shipping_address && typeof order.shipping_address === "object" ? order.shipping_address : {};
    if (!address.phone || address.phone === "—") {
      window.alert("This order does not have a customer phone number.");
      return;
    }
    const phone = String(address.phone).replace(/\D/g, "");
    const message = `Hello ${order.customerName}, your ARK MARBLES receipt ${receiptNo(order)} for order ${orderNo(order)} is ready. Order amount: ${money(order.total_amount)}. Payment status: ${statusText(order.payment_status)}.`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  }

  return (
    <main className="ark-receipts-page">
      <div className="ark-receipts-shell">
        <header className="ark-receipts-header">
          <div className="ark-receipts-title">
            <div className="ark-receipts-title-icon"><ReceiptText size={25} /></div>
            <div><span className="ark-receipts-eyebrow">ARK MARBLES / FINANCE MANAGEMENT</span><h1>Receipts Management</h1><p>View, print and share customer order receipts.</p></div>
          </div>
          <div className="ark-receipts-header-actions">
            <button className="ark-receipt-btn outline" onClick={() => exportCsv(filtered)}><Download size={15}/> Export</button>
            <button className="ark-receipt-btn outline" onClick={loadReceipts} disabled={loading}><RefreshCw size={15} className={loading ? "receipt-spin" : ""}/> Refresh</button>
          </div>
        </header>

        {error && <div className="ark-receipt-error"><CircleAlert size={15}/><span>{error}</span><button onClick={() => setError("")}><X size={15}/></button></div>}

        <section className="ark-receipt-stats">
          <article><div className="receipt-stat-icon gold"><ReceiptText size={21}/></div><div><span>Total Receipts</span><strong>{orders.length}</strong><small>Generated from orders</small></div></article>
          <article><div className="receipt-stat-icon green"><CheckCircle2 size={21}/></div><div><span>Paid Orders</span><strong>{paid.length}</strong><small>Fully paid orders</small></div></article>
          <article><div className="receipt-stat-icon blue"><FileText size={21}/></div><div><span>Partial Payments</span><strong>{partial.length}</strong><small>Partially paid orders</small></div></article>
          <article><div className="receipt-stat-icon amber"><Clock3 size={21}/></div><div><span>Pending Payments</span><strong>{pending.length}</strong><small>Awaiting payment</small></div></article>
          <article><div className="receipt-stat-icon purple"><span>₹</span></div><div><span>Total Order Value</span><strong>{money(totalValue)}</strong><small>Value across all orders</small></div></article>
        </section>

        <section className="ark-receipts-layout">
          <div className="ark-receipt-list-panel">
            <div className="ark-receipt-panel-heading"><div><span className="ark-receipts-overline">DOCUMENT CONTROL</span><h2>Receipt List</h2><p>Receipts are generated from existing customer orders.</p></div><span className="ark-receipt-total-pill">{filtered.length} Receipts</span></div>
            <div className="ark-receipt-filters">
              <label className="receipt-search"><Search size={16}/><input value={search} onChange={(e) => {setSearch(e.target.value);setPage(1);}} placeholder="Search receipt, order, customer..."/></label>
              <select value={statusFilter} onChange={(e) => {setStatusFilter(e.target.value);setPage(1);}}><option>All Status</option><option value="paid">Paid</option><option value="partially_paid">Partial</option><option value="pending">Pending</option><option value="failed">Failed</option><option value="refunded">Refunded</option></select>
              <select value={methodFilter} onChange={(e) => {setMethodFilter(e.target.value);setPage(1);}}><option>All Payment Types</option>{["cod","upi","bank_transfer","card","cash"].map((method)=><option key={method} value={method}>{methodText(method)}</option>)}</select>
              <label className="receipt-date"><CalendarDays size={14}/><input aria-label="Filter by date" type="date" value={dateFilter === "All Dates" ? "" : dateFilter} onChange={(e)=>{setDateFilter(e.target.value || "All Dates");setPage(1);}}/></label>
              <button className="receipt-reset" onClick={resetFilters}>Reset</button>
            </div>
            <div className="ark-receipt-table-wrap">
              <table className="ark-receipt-table"><thead><tr><th>#</th><th>RECEIPT NO.</th><th>ORDER ID</th><th>CUSTOMER</th><th>DATE</th><th>AMOUNT</th><th>PAYMENT TYPE</th><th>STATUS</th><th>ACTIONS</th></tr></thead>
                <tbody>{pageRows.map((order,index)=><tr key={order.id} className={selectedId===order.id?"selected":""} onClick={()=>setSelectedId(order.id)}>
                  <td>{(currentPage-1)*PAGE_SIZE+index+1}</td><td className="receipt-number">{receiptNo(order)}</td><td>{orderNo(order)}</td>
                  <td><div className="receipt-customer"><span>{order.customerName.split(" ").map((part)=>part[0]).slice(0,2).join("").toUpperCase()}</span><b>{order.customerName}</b></div></td>
                  <td>{dateLabel(order.created_at)}</td><td className="receipt-amount">{money(order.total_amount)}</td><td>{methodText(order.payment_method)}</td>
                  <td><span className={`receipt-status ${statusClass(order.payment_status)}`}>{statusText(order.payment_status)}</span></td>
                  <td><div className="receipt-row-actions"><button title="Preview receipt" onClick={(e)=>{e.stopPropagation();setSelectedId(order.id);}}><Eye size={15}/></button><button title="Print / Save PDF" onClick={(e)=>{e.stopPropagation();const win=openReceipt(order);if(win)win.onload=()=>win.print();}}><Download size={15}/></button><button title="Print receipt" onClick={(e)=>{e.stopPropagation();const win=openReceipt(order);if(win)win.onload=()=>win.print();}}><Printer size={15}/></button></div></td>
                </tr>)}</tbody>
              </table>
              {!loading && !pageRows.length && <div className="ark-receipt-empty"><ReceiptText size={30}/><h3>No receipts found</h3><p>{orders.length?"Try another search or filter.":"Receipts will appear here when customer orders are available."}</p></div>}
              {loading && <div className="ark-receipt-empty"><RefreshCw className="receipt-spin" size={24}/><p>Loading receipts...</p></div>}
            </div>
            <footer className="ark-receipt-pagination"><span>Showing {filtered.length?(currentPage-1)*PAGE_SIZE+1:0} to {Math.min(currentPage*PAGE_SIZE,filtered.length)} of {filtered.length} receipts</span><div><button disabled={currentPage<=1} onClick={()=>setPage(p=>p-1)}><ChevronLeft size={15}/></button><b>{currentPage}</b><span>/ {pageCount}</span><button disabled={currentPage>=pageCount} onClick={()=>setPage(p=>p+1)}><ChevronRight size={15}/></button></div></footer>
          </div>

          <aside className="ark-receipt-preview-panel">
            <div className="ark-receipt-preview-heading"><div><span className="ark-receipts-overline">DOCUMENT PREVIEW</span><h2>Receipt Preview</h2></div>{selected&&<span className="receipt-preview-id">{receiptNo(selected)}</span>}</div>
            {selected ? <>
              <div className="ark-receipt-paper">
                <div className="receipt-paper-head"><div className="receipt-brand-mark">A</div><div className="receipt-brand-name"><strong>ARK MARBLES</strong><small>& CONSTRUCTION</small></div><div className="receipt-paper-title"><strong>Receipt</strong><small>Receipt No: {receiptNo(selected)}</small></div></div>
                <div className="receipt-paper-business"><div><b>ARK MARBLES & CONSTRUCTION</b><small>Premium Marble & Natural Stone</small><small>Mylavaram, NTR District, Andhra Pradesh</small></div><div><b>Date: {dateLabel(selected.created_at)}</b><b>Order ID: {orderNo(selected)}</b><b>Payment Type: {methodText(selected.payment_method)}</b><b>Payment Status: <em className={`receipt-status ${statusClass(selected.payment_status)}`}>{statusText(selected.payment_status)}</em></b></div></div>
                <div className="receipt-paper-section">Customer Details</div>
                <div className="receipt-paper-customer"><span>Customer</span><b>{selected.customerName}</b><span>Phone</span><b>{selected.customerPhone}</b><span>Email</span><b>{selected.customerEmail}</b></div>
                <div className="receipt-paper-section">Order Items</div>
                <div className="receipt-paper-items"><div className="receipt-paper-item-head"><b>Item Description</b><b>Qty</b><b>Amount</b></div>
                  {selected.items.length ? selected.items.slice(0,4).map((item)=><div className="receipt-paper-item" key={item.id}><span>{item.product_name}</span><span>{item.quantity}</span><b>{money(item.line_total)}</b></div>) : <div className="receipt-paper-item"><span>Order purchase</span><span>1</span><b>{money(selected.total_amount)}</b></div>}
                  {selected.items.length>4&&<small>+ {selected.items.length-4} more items</small>}
                </div>
                <div className="receipt-paper-total"><span>Total Amount</span><b>{money(selected.total_amount)}</b></div>
                <div className="receipt-paper-thanks">Thank you for choosing ARK MARBLES</div>
              </div>
              <div className="ark-receipt-preview-actions">
                <button onClick={()=>openReceipt(selected)}><Eye size={15}/> View Full</button>
                <button onClick={()=>{const win=openReceipt(selected);if(win)win.onload=()=>win.print();}}><Download size={15}/> Download PDF</button>
                <button onClick={()=>{const win=openReceipt(selected);if(win)win.onload=()=>win.print();}}><Printer size={15}/> Print</button>
                <button className="whatsapp" onClick={()=>shareWhatsApp(selected)}><MessageCircle size={15}/> WhatsApp</button>
              </div>
            </> : <div className="ark-receipt-preview-empty"><ReceiptText size={30}/><h3>Select a receipt</h3><p>Choose an order to preview its receipt.</p></div>}
          </aside>
        </section>
        <footer className="ark-receipts-footer"><span>© {new Date().getFullYear()} ARK MARBLES</span><span>RECEIPTS ARE GENERATED FROM ORDER RECORDS</span></footer>
      </div>
    </main>
  );
}
