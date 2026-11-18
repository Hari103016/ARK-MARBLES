import { useMemo, useState } from "react";
import {
  Search, RefreshCw, Download, Plus, MessageSquare, Clock3, CheckCircle2,
  CircleAlert, Phone, Mail, CalendarDays, X, ArrowUpRight, MessageCircle,
  UserRound, Package, ChevronDown, SlidersHorizontal
} from "lucide-react";
import "./Enquiries.css";

const STATUSES = ["New", "Contacted", "In Follow-up", "Converted", "Closed"];
const PRIORITIES = ["High", "Medium", "Low"];
const EMPTY_FORM = { name: "", phone: "", email: "", subject: "", message: "", priority: "Medium" };

const dateLabel = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric"
  });
};
const statusClass = (value = "") => value.toLowerCase().replace(/[^a-z0-9]+/g, "-");
const initials = (name) => String(name || "C").trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");

function exportCsv(rows) {
  if (!rows.length) {
    window.alert("There are no enquiries to export.");
    return;
  }
  const headers = ["Customer", "Phone", "Email", "Enquiry", "Message", "Date", "Status", "Priority"];
  const quote = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const body = rows.map((row) => [row.name, row.phone, row.email, row.subject, row.message,
    row.created_at, row.status, row.priority].map(quote).join(","));
  const blob = new Blob(["\uFEFF", [headers.map(quote).join(","), ...body].join("\r\n")], {
    type: "text/csv;charset=utf-8;"
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "ark-marbles-enquiries.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function Enquiries() {
  // Enquiries are currently held in page state; connect the confirmed table schema to Supabase for persistence.
  const [enquiries, setEnquiries] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [priorityFilter, setPriorityFilter] = useState("All Priority");
  const [selectedId, setSelectedId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [notice, setNotice] = useState("");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return enquiries.filter((item) => {
      const matchesSearch = !query || [item.name, item.phone, item.email, item.subject, item.message]
        .some((value) => String(value || "").toLowerCase().includes(query));
      return matchesSearch && (statusFilter === "All Status" || item.status === statusFilter) &&
        (priorityFilter === "All Priority" || item.priority === priorityFilter);
    });
  }, [enquiries, search, statusFilter, priorityFilter]);

  const selected = enquiries.find((item) => item.id === selectedId) || null;
  const total = enquiries.length;
  const newCount = enquiries.filter((item) => item.status === "New").length;
  const followUpCount = enquiries.filter((item) => ["In Follow-up", "Contacted"].includes(item.status)).length;
  const convertedCount = enquiries.filter((item) => item.status === "Converted").length;
  const closedCount = enquiries.filter((item) => item.status === "Closed").length;

  const updateStatus = (id, status) => {
    setEnquiries((items) => items.map((item) => item.id === id ? { ...item, status } : item));
    setNotice("Status updated in this page session. Supabase saving is not connected yet.");
  };

  const submitEnquiry = (event) => {
    event.preventDefault();
    const item = { ...form, id: `ENQ-${Date.now()}`, status: "New", created_at: new Date().toISOString() };
    setEnquiries((items) => [item, ...items]);
    setSelectedId(item.id);
    setForm(EMPTY_FORM);
    setShowForm(false);
    setNotice("Enquiry added to this page session. Connect Supabase to save it permanently.");
  };

  const replyTo = (item) => {
    if (item?.phone) {
      const number = item.phone.replace(/\D/g, "");
      window.open(`https://wa.me/${number}?text=${encodeURIComponent(`Hello ${item.name}, thank you for contacting ARK MARBLES. How can we help you?`)}`, "_blank", "noopener,noreferrer");
    } else if (item?.email) {
      window.location.href = `mailto:${item.email}?subject=${encodeURIComponent("ARK MARBLES enquiry follow-up")}`;
    } else {
      window.alert("No phone number or email address is available for this enquiry.");
    }
  };

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("All Status");
    setPriorityFilter("All Priority");
  };

  return (
    <main className="ark-orders-page">
      <div className="ark-orders-content">
        {notice && <div className="orders-toast" role="status"><CheckCircle2 size={17} /><span>{notice}</span><button onClick={() => setNotice("")} aria-label="Dismiss"><X size={15} /></button></div>}

        <section className="orders-hero">
          <div className="orders-hero-icon"><MessageSquare size={32} /></div>
          <div className="orders-hero-copy">
            <span className="orders-eyebrow">CUSTOMER RELATIONS</span>
            <h1>Enquiries Management</h1>
            <p>Manage customer conversations, follow-ups and sales opportunities.</p>
          </div>
          <div className="orders-hero-actions">
            <button className="orders-button orders-button-outline" onClick={() => setNotice("The current enquiry list is up to date for this page session.")}><RefreshCw size={17} /> Refresh</button>
            <button className="orders-button orders-button-primary" onClick={() => setShowForm(true)}><Plus size={18} /> Add Enquiry</button>
          </div>
        </section>

        <section className="orders-stats">
          <article className="orders-stat-card"><div className="orders-stat-icon stat-gold"><MessageSquare size={27} /></div><div><span>Total Enquiries</span><strong>{total}</strong><small>All customer requests</small></div></article>
          <article className="orders-stat-card"><div className="orders-stat-icon stat-amber"><CircleAlert size={27} /></div><div><span>New Enquiries</span><strong>{newCount}</strong><small>Awaiting first response</small></div></article>
          <article className="orders-stat-card"><div className="orders-stat-icon stat-blue"><Clock3 size={27} /></div><div><span>In Follow-up</span><strong>{followUpCount}</strong><small>Contact initiated</small></div></article>
          <article className="orders-stat-card"><div className="orders-stat-icon stat-green"><CheckCircle2 size={27} /></div><div><span>Converted</span><strong>{convertedCount}</strong><small>Successful leads</small></div></article>
          <article className="orders-stat-card"><div className="orders-stat-icon stat-red"><X size={27} /></div><div><span>Closed</span><strong>{closedCount}</strong><small>Closed enquiries</small></div></article>
        </section>

        <section className="orders-workspace">
          <div className="orders-list-panel">
            <div className="orders-panel-heading">
              <div className="orders-panel-icon"><MessageSquare size={27} /></div>
              <div><h2>Enquiry List</h2><p>Review incoming requests and manage customer follow-ups.</p></div>
              <span className="orders-count">{filtered.length.toLocaleString("en-IN")} Enquiries</span>
            </div>

            <div className="orders-filters enquiries-filters">
              <label className="orders-search"><Search size={19} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search customer, phone, email..." aria-label="Search enquiries" />{search && <button onClick={() => setSearch("")} aria-label="Clear search"><X size={15} /></button>}</label>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter enquiry status"><option>All Status</option>{STATUSES.map((status) => <option key={status}>{status}</option>)}</select>
              <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)} aria-label="Filter priority"><option>All Priority</option>{PRIORITIES.map((priority) => <option key={priority}>{priority}</option>)}</select>
              <button className="orders-reset" onClick={resetFilters}><SlidersHorizontal size={15} /> Reset</button>
            </div>

            <div className="orders-table-wrap">
              <table className="orders-table enquiries-table">
                <thead><tr><th>#</th><th>Customer</th><th>Enquiry Details</th><th>Date</th><th>Priority</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                  {filtered.length ? filtered.map((item, index) => (
                    <tr key={item.id} className={selectedId === item.id ? "order-row-selected" : ""} onClick={() => setSelectedId(item.id)}>
                      <td>{index + 1}</td>
                      <td><div className="order-customer"><span className="order-avatar">{initials(item.name)}</span><div className="enquiry-customer-copy"><strong>{item.name}</strong><small>{item.phone || item.email || "Customer"}</small></div></div></td>
                      <td className="enquiry-description"><strong>{item.subject || "General enquiry"}</strong><small>{item.message || "No message provided"}</small></td>
                      <td>{dateLabel(item.created_at)}</td>
                      <td><span className={`order-status priority-${statusClass(item.priority)}`}>{item.priority || "Medium"}</span></td>
                      <td><span className={`order-status status-${statusClass(item.status)}`}>{item.status}</span></td>
                      <td><div className="order-row-actions"><button title="View enquiry" aria-label="View enquiry" onClick={(event) => { event.stopPropagation(); setSelectedId(item.id); }}><ArrowUpRight size={16} /></button><button title="WhatsApp follow-up" aria-label="WhatsApp follow-up" onClick={(event) => { event.stopPropagation(); replyTo(item); }}><MessageCircle size={16} /></button></div></td>
                    </tr>
                  )) : <tr><td colSpan="7" className="orders-empty"><MessageSquare size={28} /><strong>{enquiries.length ? "No matching enquiries" : "No enquiries yet"}</strong><span>{enquiries.length ? "Try changing your search or filters." : "Customer enquiries will appear here when your website enquiry form is connected."}</span></td></tr>}
                </tbody>
              </table>
            </div>
            <div className="orders-pagination"><span>Showing <b>{filtered.length}</b> of <b>{total}</b> enquiries · {closedCount} closed</span><div><span>Filtered results</span></div></div>
          </div>

          <aside className="orders-details-panel">
            <div className="orders-details-heading"><UserRound size={25} /><h2>Enquiry Details</h2></div>
            {selected ? <div className="orders-details-body">
              <div className="orders-detail-reference"><div><MessageSquare size={26} /><div><strong>{selected.id}</strong><span>Received on: {dateLabel(selected.created_at)}</span></div></div><span className={`order-status status-${statusClass(selected.status)}`}>{selected.status}</span></div>
              <div className="orders-customer-info">
                <div><UserRound size={17} /><span>Customer</span><strong>{selected.name}</strong></div>
                <div><Phone size={17} /><span>Phone</span><strong>{selected.phone || "Not provided"}</strong></div>
                <div><Mail size={17} /><span>Email</span><strong>{selected.email || "Not provided"}</strong></div>
                <div><CalendarDays size={17} /><span>Received</span><strong>{dateLabel(selected.created_at)}</strong></div>
              </div>
              <div className="orders-items-heading">Enquiry Requirement <span>{selected.priority || "Medium"} Priority</span></div>
              <div className="enquiry-requirement"><strong>{selected.subject || "General enquiry"}</strong><p>{selected.message || "No additional details supplied."}</p></div>
              <div className="enquiry-manage"><label>Enquiry Status<select value={selected.status} onChange={(event) => updateStatus(selected.id, event.target.value)}>{STATUSES.map((status) => <option key={status}>{status}</option>)}</select></label></div>
              <div className="orders-detail-actions enquiries-detail-actions"><button onClick={() => replyTo(selected)}><MessageCircle size={17} /> WhatsApp Follow-up</button><button onClick={() => updateStatus(selected.id, "Converted")}><CheckCircle2 size={17} /> Mark Converted</button></div>
            </div> : <div className="orders-no-selection"><div><UserRound size={34} /></div><h3>Select an enquiry</h3><p>Choose an enquiry from the list to view customer information, requirements and follow-up actions.</p></div>}
          </aside>
        </section>
        <footer className="orders-page-footer"><strong>ARK MARBLES</strong><span>Customer Relations</span><span>{total.toLocaleString("en-IN")} enquiry records · {closedCount} closed</span></footer>
      </div>

      {showForm && <div className="orders-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setShowForm(false)}>
        <section className="orders-edit-modal enquiry-modal" role="dialog" aria-modal="true" aria-labelledby="enquiry-form-heading">
          <button className="orders-modal-close" onClick={() => setShowForm(false)} aria-label="Close"><X size={19} /></button>
          <span className="orders-eyebrow">CUSTOMER RELATIONS</span><h2 id="enquiry-form-heading">Create New Enquiry</h2>
          <p>Add a customer request to the enquiry list. This entry will remain in the current page session.</p>
          <form onSubmit={submitEnquiry}>
            <label>Customer Name *<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Enter full name" /></label>
            <div className="enquiry-form-grid"><label>Phone Number<input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="+91 ..." /></label><label>Email Address<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="name@example.com" /></label></div>
            <label>Enquiry For<input value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} placeholder="Marble, project or service" /></label>
            <label>Message *<textarea required rows="4" value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} placeholder="Enter customer requirement..." /></label>
            <label>Priority<select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}>{PRIORITIES.map((priority) => <option key={priority}>{priority}</option>)}</select></label>
            <div className="orders-modal-actions"><button type="button" onClick={() => setShowForm(false)}>Cancel</button><button type="submit" className="primary"><Plus size={16} /> Save Enquiry</button></div>
          </form>
        </section>
      </div>}
    </main>
  );
}
