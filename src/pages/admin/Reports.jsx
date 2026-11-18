import { useEffect, useMemo, useState } from "react";
import {
  BarChart3, ShoppingCart, IndianRupee, Layers3, Users, Clock3,
  CalendarDays, Download, FileSpreadsheet, RefreshCw,
  Package, Boxes, FileText, CircleAlert
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import "./Reports.css";

const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
const number = (value) => Number(value || 0).toLocaleString("en-IN");
const dateInput = (date) => {
  const d = new Date(date);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};
const dateLabel = (value, options = { day: "2-digit", month: "short" }) => {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-IN", options);
};
const orderNumber = (order) => order.order_number || `ORD-${String(order.id).slice(-6).toUpperCase()}`;
const cleanStatus = (value) => String(value || "pending").toLowerCase().replace(/[\s-]+/g, "_");
const isCancelled = (order) => ["cancelled", "canceled"].includes(cleanStatus(order.status));
const isPaid = (order) => ["paid", "partially_paid"].includes(cleanStatus(order.payment_status));

function csvDownload(rows, filename) {
  if (!rows.length) {
    window.alert("No records are available for this report.");
    return;
  }
  const quote = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = rows.map((row) => row.map(quote).join(",")).join("\r\n");
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function Donut({ segments, center, subtitle }) {
  const total = segments.reduce((sum, item) => sum + item.value, 0);
  let cursor = 0;
  const stops = segments.map((item) => {
    const start = cursor;
    cursor += total ? (item.value / total) * 100 : 0;
    return `${item.color} ${start}% ${cursor}%`;
  }).join(", ");
  return (
    <div className="ark-report-donut-wrap">
      <div className="ark-report-donut" style={{ background: `conic-gradient(${stops || "#303638 0 100%"})` }}>
        <div><strong>{center}</strong><span>{subtitle}</span></div>
      </div>
      <div className="ark-report-legend">
        {segments.map((item) => (
          <div key={item.label}><i style={{ background: item.color }} /><span>{item.label}</span><b>{number(item.value)} <small>{total ? `(${((item.value / total) * 100).toFixed(1)}%)` : "(0%)"}</small></b></div>
        ))}
      </div>
    </div>
  );
}

function SalesChart({ data }) {
  const max = Math.max(...data.map((item) => item.value), 1);
  const points = data.map((item, index) => {
    const x = data.length === 1 ? 50 : 18 + (index / (data.length - 1)) * 964;
    const y = 170 - (item.value / max) * 135;
    return `${x},${y}`;
  }).join(" ");
  const area = data.length ? `18,170 ${points} 982,170` : "";
  return (
    <div className="ark-report-chart">
      <div className="ark-report-chart-y">
        {[max, max * .75, max * .5, max * .25, 0].map((v, i) => <span key={i}>{money(v)}</span>)}
      </div>
      <div className="ark-report-chart-main">
        <svg viewBox="0 0 1000 190" preserveAspectRatio="none" role="img" aria-label="Sales trend chart">
          <defs><linearGradient id="arkSalesFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#e4b847" stopOpacity=".42"/><stop offset="100%" stopColor="#e4b847" stopOpacity=".015"/></linearGradient></defs>
          {[35, 68, 102, 136, 170].map((y) => <line key={y} x1="18" x2="982" y1={y} y2={y} stroke="rgba(211,190,143,.18)" strokeDasharray="4 5"/>)}
          {data.length > 1 && <polygon points={area} fill="url(#arkSalesFill)"/>}
          {data.length > 1 && <polyline points={points} fill="none" stroke="#f0c64d" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>}
          {data.map((item, index) => {
            const x = data.length === 1 ? 500 : 18 + (index / (data.length - 1)) * 964;
            const y = 170 - (item.value / max) * 135;
            return <g key={item.label}><circle cx={x} cy={y} r="5.5" fill="#f6c84e" stroke="#171818" strokeWidth="2"/><title>{item.label}: {money(item.value)}</title></g>;
          })}
        </svg>
        <div className="ark-report-chart-x">{data.map((item, index) => <span key={item.label} className={index % Math.max(1, Math.ceil(data.length / 7)) === 0 || index === data.length - 1 ? "" : "muted"}>{item.label}</span>)}</div>
      </div>
    </div>
  );
}

export default function Reports() {
  const today = new Date();
  const [startDate, setStartDate] = useState(dateInput(new Date(today.getFullYear(), today.getMonth(), 1)));
  const [endDate, setEndDate] = useState(dateInput(today));
  const [orders, setOrders] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [marbles, setMarbles] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reportMode, setReportMode] = useState("overview");
  const [chartMode, setChartMode] = useState("Sales Revenue");

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [orderRes, profileRes, marbleRes] = await Promise.all([
        supabase.from("orders").select("*").order("created_at", { ascending: false }),
        supabase.from("profiles").select("id, full_name, role"),
        supabase.from("marbles").select("*")
      ]);
      if (orderRes.error) throw orderRes.error;
      if (profileRes.error) throw profileRes.error;
      if (marbleRes.error) throw marbleRes.error;

      const orderRows = orderRes.data || [];
      let itemRows = [];
      if (orderRows.length) {
        const { data, error: itemError } = await supabase
          .from("order_items")
          .select("id, order_id, marble_id, product_name, quantity, unit_price, line_total")
          .in("order_id", orderRows.map((row) => row.id));
        if (itemError) throw itemError;
        itemRows = data || [];
      }
      setOrders(orderRows);
      setProfiles(profileRes.data || []);
      setMarbles(marbleRes.data || []);
      setOrderItems(itemRows);
    } catch (err) {
      console.error("Reports loading failed:", err);
      setError(err.message || "Unable to load report data. Check Supabase access policies.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  const profileMap = useMemo(() => Object.fromEntries(profiles.map((p) => [p.id, p])), [profiles]);
  const marbleMap = useMemo(() => Object.fromEntries(marbles.map((m) => [String(m.id), m])), [marbles]);
  const itemMap = useMemo(() => orderItems.reduce((map, item) => {
    (map[item.order_id] ||= []).push(item);
    return map;
  }, {}), [orderItems]);

  const filteredOrders = useMemo(() => orders.filter((order) => {
    if (!order.created_at) return false;
    const day = dateInput(order.created_at);
    return day >= startDate && day <= endDate;
  }), [orders, startDate, endDate]);

  const validOrders = filteredOrders.filter((order) => !isCancelled(order));
  const paidOrders = validOrders.filter((order) => cleanStatus(order.payment_status) === "paid");
  const partialOrders = validOrders.filter((order) => cleanStatus(order.payment_status) === "partially_paid");
  const pendingOrders = validOrders.filter((order) => ["pending", "failed"].includes(cleanStatus(order.payment_status)));
  const totalSales = validOrders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
  const totalPayments = paidOrders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
  const pendingAmount = pendingOrders.concat(partialOrders).reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
  const customerCount = new Set(validOrders.map((order) => order.customer_id).filter(Boolean)).size;
  const previousRangeDays = Math.max(1, Math.ceil((new Date(`${endDate}T00:00:00`) - new Date(`${startDate}T00:00:00`)) / 86400000) + 1);
  const previousStart = dateInput(new Date(new Date(`${startDate}T00:00:00`).getTime() - previousRangeDays * 86400000));
  const previousEnd = dateInput(new Date(new Date(`${startDate}T00:00:00`).getTime() - 86400000));
  const previousOrders = orders.filter((order) => order.created_at && dateInput(order.created_at) >= previousStart && dateInput(order.created_at) <= previousEnd && !isCancelled(order));
  const previousSales = previousOrders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
  const growth = previousSales ? ((totalSales - previousSales) / previousSales) * 100 : null;

  const salesByDay = useMemo(() => {
    const days = [];
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);
    const span = Math.max(0, Math.min(30, Math.ceil((end - start) / 86400000)));
    for (let i = 0; i <= span; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      const key = dateInput(day);
      const value = validOrders.filter((order) => dateInput(order.created_at) === key)
        .reduce((sum, order) => sum + (chartMode === "Order Count" ? 1 : Number(order.total_amount || 0)), 0);
      days.push({ label: dateLabel(day), value });
    }
    return days;
  }, [startDate, endDate, validOrders, chartMode]);

  const statusSegments = [
    { label: "Paid", value: paidOrders.length, color: "#16cf70" },
    { label: "Partial", value: partialOrders.length, color: "#1498e7" },
    { label: "Pending", value: pendingOrders.length, color: "#f3bd32" },
    { label: "Cancelled", value: filteredOrders.filter(isCancelled).length, color: "#ef514d" }
  ];
  const categoryTotals = useMemo(() => {
    const totals = {};
    validOrders.forEach((order) => (itemMap[order.id] || []).forEach((item) => {
      const marble = item.marble_id ? marbleMap[String(item.marble_id)] : null;
      const category = marble?.category || marble?.product_type || "Other";
      totals[category] = (totals[category] || 0) + Number(item.line_total || 0);
    }));
    return Object.entries(totals).map(([label, value]) => ({ label, value })).sort((a,b) => b.value-a.value);
  }, [validOrders, itemMap, marbleMap]);
  const categoryColors = ["#f3bd42", "#a65ee8", "#159fe8", "#18cf70", "#8a969e", "#d87946"];
  const categorySegments = categoryTotals.length
    ? categoryTotals.slice(0, 5).map((item, index) => ({ ...item, color: categoryColors[index] }))
    : [{ label: "No item category data", value: 0, color: "#566064" }];

  const recentTransactions = useMemo(() =>
    [...filteredOrders]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 7),
    [filteredOrders]
  );

  const inventorySummary = useMemo(() => {
    const active = marbles.filter((item) => item.status !== "inactive" && item.status !== "archived");
    const stock = (item) => Number(item.stock_quantity ?? item.stock ?? 0);
    return {
      products: marbles.length,
      low: active.filter((item) => stock(item) > 0 && stock(item) <= 5).length,
      out: active.filter((item) => stock(item) <= 0).length,
      units: active.reduce((sum, item) => sum + stock(item), 0)
    };
  }, [marbles]);

  const exportReport = () => {
    const rows = [["Order ID","Customer","Order Date","Order Status","Payment Status","Payment Method","Total Amount"]];
    filteredOrders.forEach((order) => rows.push([
      orderNumber(order), profileMap[order.customer_id]?.full_name || order.shipping_address?.fullName || "Customer",
      order.created_at, order.status, order.payment_status, order.payment_method, order.total_amount
    ]));
    csvDownload(rows, `ark-marbles-${reportMode}-report-${startDate}-to-${endDate}.csv`);
  };
  const printReport = () => window.print();
  const quickReport = (mode) => {
    setReportMode(mode);
  };

  return (
    <main className="ark-reports-page">
      <div className="ark-reports-shell">
        <section className="ark-reports-banner">
          <div className="ark-reports-banner-icon"><BarChart3 size={31}/></div>
          <div className="ark-reports-banner-copy"><span>BUSINESS REPORTS</span><h2>Reports & Analytics</h2><p>Get insights on sales, orders, payments and inventory performance.</p></div>
          <div className="ark-reports-date-controls"><label><CalendarDays size={16}/><input type="date" value={startDate} max={endDate} onChange={(e)=>setStartDate(e.target.value)}/><span>to</span><input type="date" value={endDate} min={startDate} onChange={(e)=>setEndDate(e.target.value)}/></label><button onClick={loadData} disabled={loading}><BarChart3 size={16}/> Generate Report</button></div>
        </section>

        {error && <div className="ark-reports-error"><CircleAlert size={15}/>{error}</div>}
        <section className="ark-reports-kpis">
          <article><div className="report-kpi-icon gold"><ShoppingCart size={22}/></div><div><span>Total Orders</span><strong>{number(validOrders.length)}</strong><small className={growth === null ? "" : growth >= 0 ? "up" : "down"}>{growth === null ? "—" : `${growth >= 0 ? "↑" : "↓"} ${Math.abs(growth).toFixed(1)}%`} <i>vs previous period</i></small></div></article>
          <article><div className="report-kpi-icon green"><IndianRupee size={23}/></div><div><span>Total Sales</span><strong>{money(totalSales)}</strong><small>{dateLabel(startDate,{day:"2-digit",month:"short",year:"numeric"})} – {dateLabel(endDate,{day:"2-digit",month:"short",year:"numeric"})}</small></div></article>
          <article><div className="report-kpi-icon gold"><Layers3 size={22}/></div><div><span>Total Payments</span><strong>{money(totalPayments)}</strong><small>Fully paid orders only</small></div></article>
          <article><div className="report-kpi-icon red"><Clock3 size={22}/></div><div><span>Pending Amount</span><strong>{money(pendingAmount)}</strong><small>Pending + partial order value</small></div></article>
          <article><div className="report-kpi-icon green"><Users size={22}/></div><div><span>Customers</span><strong>{number(customerCount)}</strong><small>Customers with orders in period</small></div></article>
        </section>

        <section className="ark-reports-charts">
          <article className="ark-report-panel sales-panel">
            <div className="ark-report-panel-head"><div><span className="report-panel-icon"><BarChart3 size={17}/></span><h3>Sales Overview</h3></div><select value={chartMode} onChange={(e)=>setChartMode(e.target.value)}><option>Sales Revenue</option><option>Order Count</option></select></div>
            <SalesChart data={salesByDay}/>
          </article>
          <article className="ark-report-panel">
            <div className="ark-report-panel-head"><div><span className="report-panel-icon"><Clock3 size={17}/></span><h3>Orders by Status</h3></div></div>
            <Donut segments={statusSegments} center={number(filteredOrders.length)} subtitle="Orders"/>
          </article>
          <article className="ark-report-panel">
            <div className="ark-report-panel-head"><div><span className="report-panel-icon"><Users size={17}/></span><h3>Sales by Marble Category</h3></div></div>
            <Donut segments={categorySegments} center={money(categoryTotals.reduce((sum,item)=>sum+item.value,0))} subtitle="Item Sales"/>
          </article>
        </section>

        <section className="ark-reports-bottom">
          <article className="ark-report-panel transactions-panel">
            <div className="ark-report-panel-head"><div><span className="report-panel-icon"><FileText size={18}/></span><h3>{reportMode === "overview" ? "Recent Transactions" : `${reportMode[0].toUpperCase()}${reportMode.slice(1)} Report`}</h3></div><span className="report-period-label">{filteredOrders.length} orders in period</span></div>
            <div className="ark-report-table-wrap"><table className="ark-report-table"><thead><tr><th>#</th><th>ORDER ID</th><th>CUSTOMER</th><th>PRODUCT</th><th>AMOUNT</th><th>PAYMENT TYPE</th><th>STATUS</th><th>DATE</th></tr></thead><tbody>
              {recentTransactions.map((order,index)=>{
                const customer = profileMap[order.customer_id]?.full_name || order.shipping_address?.fullName || "Customer";
                const itemNames = (itemMap[order.id]||[]).map((item)=>item.product_name).filter(Boolean);
                return <tr key={order.id}><td>{index+1}</td><td className="report-order-id">{orderNumber(order)}</td><td>{customer}</td><td>{itemNames[0] || "Order items"}</td><td className="report-table-amount">{money(order.total_amount)}</td><td>{String(order.payment_method||"—").replaceAll("_"," ")}</td><td><span className={`report-order-status ${cleanStatus(order.payment_status)}`}>{String(order.payment_status||"pending").replaceAll("_"," ")}</span></td><td>{dateLabel(order.created_at,{day:"2-digit",month:"short",year:"numeric"})}</td></tr>;
              })}
            </tbody></table>{!loading && !recentTransactions.length && <div className="ark-reports-empty">No transactions found for this date range.</div>}{loading && <div className="ark-reports-empty"><RefreshCw size={17} className="report-spin"/> Loading report data...</div>}</div>
          </article>

          <aside className="ark-report-panel quick-panel">
            <div className="ark-report-panel-head"><div><span className="report-panel-icon"><Layers3 size={18}/></span><h3>Quick Reports</h3></div></div>
            <div className="ark-report-quick-grid">
              <button className={reportMode==="sales"?"selected":""} onClick={()=>quickReport("sales")}><BarChart3 size={23}/><span>Sales<br/>Report</span></button>
              <button className={reportMode==="orders"?"selected":""} onClick={()=>quickReport("orders")}><ShoppingCart size={23}/><span>Orders<br/>Report</span></button>
              <button className={reportMode==="payments"?"selected":""} onClick={()=>quickReport("payments")}><IndianRupee size={23}/><span>Payments<br/>Report</span></button>
              <button className={reportMode==="inventory"?"selected":""} onClick={()=>quickReport("inventory")}><Boxes size={23}/><span>Inventory<br/>Report</span></button>
              <button className={reportMode==="customers"?"selected":""} onClick={()=>quickReport("customers")}><Users size={23}/><span>Customer<br/>Report</span></button>
            </div>
            <div className="ark-report-inventory-mini"><div><Package size={15}/><span>Inventory Snapshot</span></div><b>{number(inventorySummary.products)} <small>Products</small></b><span>{number(inventorySummary.units)} units · {inventorySummary.low} low stock · {inventorySummary.out} out of stock</span></div>
            <div className="ark-report-export-actions"><button onClick={printReport}><FileText size={16}/> Export as PDF</button><button onClick={exportReport}><FileSpreadsheet size={16}/> Export as Excel (CSV)</button></div>
          </aside>
        </section>
        <footer className="ark-reports-footer"><span>© {new Date().getFullYear()} ARK MARBLES & CONSTRUCTION. All Rights Reserved.</span><span>Premium Marble&nbsp; | &nbsp;Granite&nbsp; | &nbsp;Natural Stone Solutions</span></footer>
      </div>
    </main>
  );
}
