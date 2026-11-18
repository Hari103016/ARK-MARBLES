import { useEffect, useMemo, useState } from "react";
import {
  Users, UserRound, ShieldCheck, CalendarDays, Search, Plus, Download,
  RefreshCw, Eye, Pencil, Trash2, Mail, Phone, Building2, Clock3,
  KeyRound, X, ChevronLeft, ChevronRight, CircleAlert, CheckCircle2
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import "./Staff.css";

const STAFF_ROLES = ["admin", "manager", "sales", "inventory", "accounts", "staff", "support"];
const label = (value) => String(value || "").replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
const first = (...values) => values.find((v) => v !== undefined && v !== null && v !== "");
const initials = (name) => String(name || "S").trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};
const isCustomer = (profile) => String(profile.role || "customer").toLowerCase() === "customer";
const activeValue = (profile) => {
  if (typeof profile.is_active === "boolean") return profile.is_active;
  if (typeof profile.active === "boolean") return profile.active;
  if (profile.status) return String(profile.status).toLowerCase() === "active";
  return true;
};
const getName = (profile) => first(profile.full_name, profile.name, profile.username, "Unnamed Staff");
const getPhone = (profile) => first(profile.phone, profile.phone_number, profile.mobile, "—");
const getEmail = (profile) => first(profile.email, "Not available in profiles");
const getJoined = (profile) => first(profile.created_at, profile.joined_at, profile.join_date);

function downloadCsv(rows) {
  if (!rows.length) return window.alert("No staff records to export.");
  const quote = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const lines = [
    ["Name", "Email", "Phone", "Role", "Status", "Join Date"].map(quote).join(","),
    ...rows.map((p) => [getName(p), getEmail(p), getPhone(p), label(p.role), activeValue(p) ? "Active" : "Inactive", getJoined(p)].map(quote).join(","))
  ];
  const blob = new Blob(["\uFEFF", lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "ark-marbles-staff.csv"; a.click();
  URL.revokeObjectURL(url);
}

export default function Staff() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedId, setSelectedId] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [modal, setModal] = useState("");
  const [form, setForm] = useState({ id: "", full_name: "", role: "staff", phone: "", status: "active" });

  async function loadStaff() {
    setLoading(true); setError("");
    try {
      const { data, error: queryError } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (queryError) throw queryError;
      const rows = (data || []).filter((profile) => !isCustomer(profile));
      setProfiles(rows);
      setSelectedId((current) => rows.some((p) => p.id === current) ? current : (rows[0]?.id ?? null));
    } catch (err) {
      console.error("Staff loading failed:", err);
      setError(err.message || "Unable to load staff. Check the profiles table and its Row Level Security policies.");
    } finally { setLoading(false); }
  }

  useEffect(() => { loadStaff(); }, []);

  const selected = profiles.find((p) => p.id === selectedId) || null;
  const roleOptions = useMemo(() => [...new Set(profiles.map((p) => String(p.role || "staff").toLowerCase()))].sort(), [profiles]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return profiles.filter((p) => {
      const text = [getName(p), getEmail(p), getPhone(p), p.role].join(" ").toLowerCase();
      const status = activeValue(p) ? "active" : "inactive";
      return (!q || text.includes(q)) &&
        (roleFilter === "all" || String(p.role || "staff").toLowerCase() === roleFilter) &&
        (statusFilter === "all" || status === statusFilter);
    });
  }, [profiles, search, roleFilter, statusFilter]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pages);
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const activeCount = profiles.filter(activeValue).length;
  const inactiveCount = profiles.length - activeCount;
  const roleCount = new Set(profiles.map((p) => String(p.role || "staff").toLowerCase())).size;
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0);
  const newThisMonth = profiles.filter((p) => getJoined(p) && new Date(getJoined(p)) >= monthStart).length;
  const hasStatusColumn = profiles.some((p) => "status" in p || "is_active" in p || "active" in p);
  const hasPhoneColumn = profiles.some((p) => "phone" in p || "phone_number" in p || "mobile" in p);
  const hasNameColumn = profiles.some((p) => "full_name" in p || "name" in p);

  function openEdit(profile) {
    setForm({
      id: profile.id,
      full_name: getName(profile),
      role: String(profile.role || "staff").toLowerCase(),
      phone: getPhone(profile) === "—" ? "" : getPhone(profile),
      status: activeValue(profile) ? "active" : "inactive"
    });
    setModal("edit");
  }

  function openAdd() {
    setForm({ id: "", full_name: "", role: "staff", phone: "", status: "active" });
    setModal("add");
  }

  async function saveStaff(event) {
    event?.preventDefault();
    setSaving(true); setError(""); setNotice("");
    try {
      if (modal === "add") {
        // Staff accounts must already exist in Supabase Auth. This promotes an
        // existing profile rather than attempting privileged Auth creation in the browser.
        if (!form.id.trim()) throw new Error("Enter the existing Supabase user ID for the staff account.");
        const update = { role: form.role };
        if (hasNameColumn && form.full_name.trim()) update.full_name = form.full_name.trim();
        if (hasPhoneColumn && form.phone.trim()) {
          const phoneKey = profiles.some((p) => "phone" in p) ? "phone" : profiles.some((p) => "phone_number" in p) ? "phone_number" : "mobile";
          update[phoneKey] = form.phone.trim();
        }
        const { error: updateError } = await supabase.from("profiles").update(update).eq("id", form.id.trim());
        if (updateError) throw updateError;
        setNotice("Existing account assigned to the selected staff role.");
      } else {
        const current = profiles.find((p) => p.id === form.id);
        if (!current) throw new Error("Staff profile was not found.");
        const update = { role: form.role };
        if ("full_name" in current) update.full_name = form.full_name.trim();
        else if ("name" in current) update.name = form.full_name.trim();
        if ("phone" in current) update.phone = form.phone.trim() || null;
        else if ("phone_number" in current) update.phone_number = form.phone.trim() || null;
        else if ("mobile" in current) update.mobile = form.phone.trim() || null;
        if ("is_active" in current) update.is_active = form.status === "active";
        else if ("active" in current) update.active = form.status === "active";
        else if ("status" in current) update.status = form.status;
        const { error: updateError } = await supabase.from("profiles").update(update).eq("id", form.id);
        if (updateError) throw updateError;
        setNotice(hasStatusColumn ? "Staff profile updated." : "Staff role and available profile fields updated. Your profiles table has no active-status field, so status was not changed.");
      }
      setModal(""); await loadStaff();
    } catch (err) {
      setError(err.message || "Could not save staff profile.");
    } finally { setSaving(false); }
  }

  async function changeRole(profile, nextRole) {
    if (!window.confirm(`Change ${getName(profile)} role to ${label(nextRole)}?`)) return;
    setSaving(true); setError("");
    const { error: updateError } = await supabase.from("profiles").update({ role: nextRole }).eq("id", profile.id);
    setSaving(false);
    if (updateError) setError(updateError.message);
    else { setNotice("Staff access role updated."); await loadStaff(); }
  }

  async function removeStaff(profile) {
    if (!window.confirm(`Remove ${getName(profile)} from the staff list? This changes the profile role to Customer; it does not delete the login account.`)) return;
    setSaving(true); setError("");
    const { error: updateError } = await supabase.from("profiles").update({ role: "customer" }).eq("id", profile.id);
    setSaving(false);
    if (updateError) setError(updateError.message);
    else { setNotice("Profile role changed to Customer. The Auth account remains intact."); await loadStaff(); }
  }

  function resetFilters() { setSearch(""); setRoleFilter("all"); setStatusFilter("all"); setPage(1); }

  return (
    <main className="ark-staff-page">
      <div className="ark-staff-shell">
        <section className="ark-staff-hero">
          <div className="ark-staff-hero-icon"><Users size={31}/></div>
          <div className="ark-staff-hero-copy"><span>STAFF MANAGEMENT</span><h1>Our Staff Members</h1><p>Add, manage and control staff access and responsibilities.</p></div>
          <div className="ark-staff-hero-actions">
            <button className="staff-btn primary" onClick={openAdd}><Plus size={17}/> Add Staff</button>
            <button className="staff-btn" onClick={() => downloadCsv(filtered)}><Download size={16}/> Export</button>
            <button className="staff-btn" onClick={loadStaff} disabled={loading}><RefreshCw size={16} className={loading ? "staff-spin" : ""}/> Refresh</button>
          </div>
        </section>

        {notice && <div className="ark-staff-alert success"><CheckCircle2 size={16}/><span>{notice}</span><button onClick={()=>setNotice("")}><X size={15}/></button></div>}
        {error && <div className="ark-staff-alert error"><CircleAlert size={16}/><span>{error}</span><button onClick={()=>setError("")}><X size={15}/></button></div>}

        <section className="ark-staff-stats">
          <article><div className="staff-stat-icon gold"><Users size={23}/></div><div><span>Total Staff</span><strong>{profiles.length}</strong><small>All staff profiles</small></div></article>
          <article><div className="staff-stat-icon green"><UserRound size={23}/></div><div><span>Active Staff</span><strong>{activeCount}</strong><small>Currently active</small></div></article>
          <article><div className="staff-stat-icon blue"><ShieldCheck size={23}/></div><div><span>Roles</span><strong>{roleCount}</strong><small>Distinct staff roles</small></div></article>
          <article><div className="staff-stat-icon amber"><CalendarDays size={23}/></div><div><span>Inactive Staff</span><strong>{inactiveCount}</strong><small>Inactive profiles</small></div></article>
          <article><div className="staff-stat-icon purple"><Users size={23}/></div><div><span>New This Month</span><strong>{newThisMonth}</strong><small>Based on profile creation date</small></div></article>
        </section>

        <section className="ark-staff-content">
          <div className="ark-staff-list-panel">
            <div className="ark-staff-panel-heading"><div><span>TEAM DIRECTORY</span><h2>Staff List</h2><p>View, search and manage staff members.</p></div><span className="staff-count-pill">{filtered.length} Members</span></div>
            <div className="ark-staff-filters">
              <label className="staff-search"><Search size={17}/><input value={search} onChange={(e)=>{setSearch(e.target.value);setPage(1);}} placeholder="Search by name, email or phone..."/></label>
              <select value={roleFilter} onChange={(e)=>{setRoleFilter(e.target.value);setPage(1);}}><option value="all">All Roles</option>{roleOptions.map((role)=><option key={role} value={role}>{label(role)}</option>)}</select>
              <select value={statusFilter} onChange={(e)=>{setStatusFilter(e.target.value);setPage(1);}}><option value="all">All Status</option><option value="active">Active</option><option value="inactive">Inactive</option></select>
              <button className="staff-reset" onClick={resetFilters}>Reset</button>
            </div>
            <div className="ark-staff-table-wrap">
              <table className="ark-staff-table"><thead><tr><th>#</th><th>EMPLOYEE ID</th><th>NAME</th><th>ROLE</th><th>PHONE</th><th>EMAIL</th><th>STATUS</th><th>JOIN DATE</th><th>ACTIONS</th></tr></thead>
                <tbody>{visible.map((profile,index)=><tr key={profile.id} className={selectedId===profile.id?"selected":""} onClick={()=>setSelectedId(profile.id)}>
                  <td>{(currentPage-1)*pageSize+index+1}</td><td className="staff-employee-id">ST-{String(profile.id).slice(-5).toUpperCase()}</td>
                  <td><div className="staff-name-cell"><span>{initials(getName(profile))}</span><b>{getName(profile)}</b></div></td>
                  <td><span className={`staff-role-badge ${String(profile.role).toLowerCase()}`}>{label(profile.role)}</span></td>
                  <td>{getPhone(profile)}</td><td>{getEmail(profile)}</td>
                  <td><span className={`staff-status ${activeValue(profile)?"active":"inactive"}`}>{activeValue(profile)?"Active":"Inactive"}</span></td>
                  <td>{formatDate(getJoined(profile))}</td>
                  <td><div className="staff-row-actions"><button title="View details" onClick={(e)=>{e.stopPropagation();setSelectedId(profile.id);}}><Eye size={15}/></button><button title="Edit staff" onClick={(e)=>{e.stopPropagation();openEdit(profile);}}><Pencil size={15}/></button><button title="Remove from staff roles" onClick={(e)=>{e.stopPropagation();removeStaff(profile);}}><Trash2 size={15}/></button></div></td>
                </tr>)}</tbody>
              </table>
              {!loading && !visible.length && <div className="ark-staff-empty"><Users size={30}/><h3>No staff members found</h3><p>Staff accounts are profiles with a role other than Customer.</p></div>}
              {loading && <div className="ark-staff-empty"><RefreshCw size={22} className="staff-spin"/>Loading staff profiles...</div>}
            </div>
            <footer className="ark-staff-pagination"><span>Showing {filtered.length?(currentPage-1)*pageSize+1:0} to {Math.min(currentPage*pageSize,filtered.length)} of {filtered.length} staff members</span><div><label>Rows per page <select value={pageSize} onChange={(e)=>{setPageSize(Number(e.target.value));setPage(1);}}><option value={5}>5</option><option value={10}>10</option><option value={20}>20</option></select></label><button disabled={currentPage===1} onClick={()=>setPage(p=>p-1)}><ChevronLeft size={16}/></button><b>{currentPage}</b><span>/ {pages}</span><button disabled={currentPage===pages} onClick={()=>setPage(p=>p+1)}><ChevronRight size={16}/></button></div></footer>
          </div>

          <aside className="ark-staff-details">
            <div className="ark-staff-panel-heading"><div><span>EMPLOYEE PROFILE</span><h2>Staff Details</h2></div></div>
            {selected ? <>
              <div className="staff-profile-top"><div className="staff-profile-avatar">{initials(getName(selected))}</div><div className="staff-profile-name"><h3>{getName(selected)}</h3><div><span>{`ST-${String(selected.id).slice(-5).toUpperCase()}`}</span><span className={`staff-role-badge ${String(selected.role).toLowerCase()}`}>{label(selected.role)}</span></div></div><span className={`staff-status ${activeValue(selected)?"active":"inactive"}`}>{activeValue(selected)?"Active":"Inactive"}</span></div>
              <div className="staff-profile-info">
                <div><Mail size={17}/><span>Email</span><b>{getEmail(selected)}</b></div>
                <div><Phone size={17}/><span>Phone</span><b>{getPhone(selected)}</b></div>
                <div><CalendarDays size={17}/><span>Join Date</span><b>{formatDate(getJoined(selected))}</b></div>
                <div><ShieldCheck size={17}/><span>Role</span><b>{label(selected.role)}</b></div>
                <div><Building2 size={17}/><span>Department</span><b>{first(selected.department, label(selected.role), "—")}</b></div>
                <div><Clock3 size={17}/><span>Last Login</span><b>{formatDate(selected.last_login_at || selected.last_sign_in_at)}</b></div>
              </div>
              <div className="staff-profile-actions"><button className="staff-btn primary" onClick={()=>openEdit(selected)}><Pencil size={15}/> Edit</button><button className="staff-btn" onClick={()=>removeStaff(selected)}><Trash2 size={15}/> Remove</button><button className="staff-btn" onClick={()=>setModal("access")}><KeyRound size={15}/> Access Control</button></div>
              {modal==="access" && <div className="staff-access-inline"><label>Assign role<select value={String(selected.role||"staff").toLowerCase()} onChange={(e)=>changeRole(selected,e.target.value)} disabled={saving}>{STAFF_ROLES.map((role)=><option key={role} value={role}>{label(role)}</option>)}</select></label><p>Role changes affect the permissions associated with this profile. Configure matching RLS policies in Supabase.</p><button onClick={()=>setModal("")}>Close</button></div>}
            </> : <div className="ark-staff-empty"><UserRound size={30}/><h3>Select a staff member</h3><p>Choose a row to view profile details.</p></div>}
          </aside>
        </section>
      </div>

      {(modal==="add" || modal==="edit") && <div className="ark-staff-modal-backdrop" onMouseDown={(e)=>{if(e.target===e.currentTarget)setModal("");}}>
        <form className="ark-staff-modal" onSubmit={saveStaff}>
          <div className="ark-staff-modal-head"><div><span>{modal==="add"?"STAFF ACCOUNT ASSIGNMENT":"STAFF PROFILE"}</span><h2>{modal==="add"?"Add Existing Staff Account":"Edit Staff Member"}</h2></div><button type="button" onClick={()=>setModal("")}><X size={19}/></button></div>
          {modal==="add" && <div className="staff-modal-note"><CircleAlert size={16}/><p>Create the user's login in Supabase Authentication first. Then enter their existing Auth user UUID here to assign a staff role. This page does not create Auth accounts from the browser.</p></div>}
          {modal==="add" && <label>Existing Supabase User ID<input required value={form.id} onChange={(e)=>setForm({...form,id:e.target.value})} placeholder="Paste Auth user UUID"/></label>}
          {(modal==="edit" || hasNameColumn) && <label>Full Name<input value={form.full_name} onChange={(e)=>setForm({...form,full_name:e.target.value})} placeholder="Staff member name"/></label>}
          {hasPhoneColumn && <label>Phone Number<input value={form.phone} onChange={(e)=>setForm({...form,phone:e.target.value})} placeholder="+91 ..."/></label>}
          <label>Staff Role<select value={form.role} onChange={(e)=>setForm({...form,role:e.target.value})}>{STAFF_ROLES.map((role)=><option key={role} value={role}>{label(role)}</option>)}</select></label>
          {modal==="edit" && hasStatusColumn && <label>Account Status<select value={form.status} onChange={(e)=>setForm({...form,status:e.target.value})}><option value="active">Active</option><option value="inactive">Inactive</option></select></label>}
          <div className="ark-staff-modal-actions"><button type="button" className="staff-btn" onClick={()=>setModal("")}>Cancel</button><button type="submit" className="staff-btn primary" disabled={saving}>{saving?"Saving...":modal==="add"?"Assign Staff Role":"Save Changes"}</button></div>
        </form>
      </div>}
    </main>
  );
}
