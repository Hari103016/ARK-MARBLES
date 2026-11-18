
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Plus,
  Pencil,
  Trash2,
  Home,
  BriefcaseBusiness,
  MapPinned,
  Star,
  X,
  Save,
  LoaderCircle,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";


import { supabase } from "../../lib/supabase";
import "./CustomerAddresses.css";

const EMPTY_ADDRESS = {
  label: "Home",
  recipient_name: "",
  phone: "",
  address_line1: "",
  address_line2: "",
  city: "",
  state: "",
  postal_code: "",
  country: "India",
  is_default: false,
};

function addressIcon(label) {
  if (label === "Work") return BriefcaseBusiness;
  if (label === "Other") return MapPinned;
  return Home;
}

export default function CustomerAddresses() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_ADDRESS);
  const [deleteId, setDeleteId] = useState(null);

  const [message, setMessage] = useState({
    type: "",
    text: "",
  });

  const notify = (type, text) => setMessage({ type, text });

  const loadAddresses = useCallback(async () => {
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError) throw authError;

      const user = authData?.user;

      if (!user) {
        notify("error", "Please sign in to manage your addresses.");
        setAddresses([]);
        return;
      }

      setUserId(user.id);

      const { data, error } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;

      setAddresses(data || []);
    } catch (error) {
      console.error("Unable to load addresses:", error);
      notify(
        "error",
        error.message || "Unable to load your addresses."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  function openAddModal() {
    setEditingId(null);
    setForm({ ...EMPTY_ADDRESS });
    setMessage({ type: "", text: "" });
    setModalOpen(true);
  }

  function openEditModal(address) {
    setEditingId(address.id);
    setForm({
      ...EMPTY_ADDRESS,
      ...address,
    });
    setMessage({ type: "", text: "" });
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setModalOpen(false);
    setEditingId(null);
    setForm({ ...EMPTY_ADDRESS });
  }

  function updateField(event) {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSave(event) {
    event.preventDefault();

    if (!userId) {
      notify("error", "Please sign in before saving an address.");
      return;
    }

    const requiredFields = [
      ["recipient_name", "recipient name"],
      ["phone", "phone number"],
      ["address_line1", "address"],
      ["city", "city"],
      ["state", "state"],
      ["postal_code", "postal code"],
      ["country", "country"],
    ];

    for (const [key, label] of requiredFields) {
      if (!String(form[key] || "").trim()) {
        notify("error", `Please enter the ${label}.`);
        return;
      }
    }

    const payload = {
      user_id: userId,
      label: form.label,
      recipient_name: form.recipient_name.trim(),
      phone: form.phone.trim(),
      address_line1: form.address_line1.trim(),
      address_line2: form.address_line2.trim() || null,
      city: form.city.trim(),
      state: form.state.trim(),
      postal_code: form.postal_code.trim(),
      country: form.country.trim(),
      is_default: Boolean(form.is_default),
    };

    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      // If setting a default, clear the current default first.
      // Both updates are restricted by RLS to the current user's rows.
      if (payload.is_default) {
        const { error: defaultError } = await supabase
          .from("addresses")
          .update({ is_default: false })
          .eq("user_id", userId);

        if (defaultError) throw defaultError;
      }

      if (editingId) {
        const { error } = await supabase
          .from("addresses")
          .update(payload)
          .eq("id", editingId)
          .eq("user_id", userId);

        if (error) throw error;
      } else {
        // Make the first address the default automatically.
        if (addresses.length === 0) {
          payload.is_default = true;
        }

        const { error } = await supabase
          .from("addresses")
          .insert(payload);

        if (error) throw error;
      }

      setModalOpen(false);
      setEditingId(null);
      setForm({ ...EMPTY_ADDRESS });

      notify(
        "success",
        editingId
          ? "Address updated successfully."
          : "Address added successfully."
      );

      await loadAddresses();
    } catch (error) {
      console.error("Unable to save address:", error);
      notify(
        "error",
        error.message || "Unable to save the address."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleSetDefault(address) {
    if (!userId || address.is_default) return;

    setMessage({ type: "", text: "" });

    try {
      const { error: clearError } = await supabase
        .from("addresses")
        .update({ is_default: false })
        .eq("user_id", userId);

      if (clearError) throw clearError;

      const { error: setError } = await supabase
        .from("addresses")
        .update({ is_default: true })
        .eq("id", address.id)
        .eq("user_id", userId);

      if (setError) throw setError;

      notify("success", "Default address updated.");
      await loadAddresses();
    } catch (error) {
      console.error("Unable to update default address:", error);
      notify(
        "error",
        error.message || "Unable to set the default address."
      );
    }
  }

  async function handleDelete() {
    if (!deleteId || !userId) return;

    setMessage({ type: "", text: "" });

    try {
      const removedAddress = addresses.find(
        (address) => address.id === deleteId
      );

      const { error } = await supabase
        .from("addresses")
        .delete()
        .eq("id", deleteId)
        .eq("user_id", userId);

      if (error) throw error;

      setDeleteId(null);

      // If the deleted address was default, promote another address.
      if (
        removedAddress?.is_default &&
        addresses.length > 1
      ) {
        const replacement = addresses.find(
          (address) => address.id !== deleteId
        );

        if (replacement) {
          const { error: defaultError } = await supabase
            .from("addresses")
            .update({ is_default: true })
            .eq("id", replacement.id)
            .eq("user_id", userId);

          if (defaultError) throw defaultError;
        }
      }

      notify("success", "Address deleted successfully.");
      await loadAddresses();
    } catch (error) {
      console.error("Unable to delete address:", error);
      notify(
        "error",
        error.message || "Unable to delete the address."
      );
    }
  }

  return (
    <main className="customer-addresses-page">
      <div className="customer-addresses-container">
        <header className="customer-addresses-topbar">
          <Link to="/" className="customer-addresses-back">
            <ArrowLeft size={17} />
            <span>Back to Store</span>
          </Link>

          <Link
            to="/"
            className="customer-addresses-brand"
            aria-label="ARK MARBLES homepage"
          >
            <span className="customer-addresses-brand-icon">
              <MapPin size={22} />
            </span>
            <span>ARK MARBLES</span>
          </Link>
        </header>

        <section className="customer-addresses-heading">
          <div>
            <span className="customer-addresses-eyebrow">
              YOUR ACCOUNT
            </span>
            <h1>My Addresses</h1>
            <p>
              Manage your delivery details for a smoother shopping
              experience.
            </p>
          </div>

          <button
            type="button"
            className="customer-addresses-add"
            onClick={openAddModal}
          >
            <Plus size={18} />
            Add Address
          </button>
        </section>

        {message.text && (
          <div
            className={`customer-addresses-message ${
              message.type === "success"
                ? "is-success"
                : "is-error"
            }`}
            role={message.type === "error" ? "alert" : "status"}
            aria-live="polite"
          >
            {message.type === "success" ? (
              <CheckCircle2 size={18} />
            ) : (
              <AlertCircle size={18} />
            )}
            <span>{message.text}</span>
            <button
              type="button"
              aria-label="Dismiss message"
              onClick={() => setMessage({ type: "", text: "" })}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {loading ? (
          <div className="customer-addresses-loading">
            <LoaderCircle size={30} className="addresses-spinner" />
            <p>Loading your addresses...</p>
          </div>
        ) : addresses.length === 0 ? (
          <section className="customer-addresses-empty">
            <div className="customer-addresses-empty-icon">
              <MapPin size={34} />
            </div>
            <h2>No addresses saved yet</h2>
            <p>
              Add your first address to make your next order easier.
            </p>
            <button
              type="button"
              className="customer-addresses-add"
              onClick={openAddModal}
            >
              <Plus size={18} />
              Add Your First Address
            </button>
          </section>
        ) : (
          <section className="customer-addresses-grid">
            {addresses.map((address) => {
              const Icon = addressIcon(address.label);

              return (
                <article
                  className="customer-address-card"
                  key={address.id}
                >
                  <div className="customer-address-card-top">
                    <div className="customer-address-label">
                      <span className="customer-address-icon">
                        <Icon size={21} />
                      </span>
                      <div>
                        <h2>{address.label}</h2>
                        <span className="customer-address-type">
                          Saved address
                        </span>
                      </div>
                    </div>

                    {address.is_default && (
                      <span className="customer-address-default">
                        <Star size={13} fill="currentColor" />
                        Default
                      </span>
                    )}
                  </div>

                  <div className="customer-address-details">
                    <h3>{address.recipient_name}</h3>
                    <p>{address.phone}</p>
                    <p>{address.address_line1}</p>

                    {address.address_line2 && (
                      <p>{address.address_line2}</p>
                    )}

                    <p>
                      {address.city}, {address.state}{" "}
                      {address.postal_code}
                    </p>
                    <p>{address.country}</p>
                  </div>

                  <div className="customer-address-actions">
                    {!address.is_default && (
                      <button
                        type="button"
                        className="customer-address-default-btn"
                        onClick={() => handleSetDefault(address)}
                      >
                        <Star size={15} />
                        Set Default
                      </button>
                    )}

                    <button
                      type="button"
                      className="customer-address-edit"
                      onClick={() => openEditModal(address)}
                    >
                      <Pencil size={15} />
                      Edit
                    </button>

                    <button
                      type="button"
                      className="customer-address-delete"
                      onClick={() => setDeleteId(address.id)}
                    >
                      <Trash2 size={15} />
                      Delete
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        <footer className="customer-addresses-footer">
          <ShieldCheck size={17} />
          <span>
            Your saved addresses are private to your account.
          </span>
        </footer>
      </div>

      {modalOpen && (
        <div
          className="customer-address-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <section
            className="customer-address-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="address-modal-title"
          >
            <header className="customer-address-modal-header">
              <div>
                <span className="customer-addresses-eyebrow">
                  ADDRESS DETAILS
                </span>
                <h2 id="address-modal-title">
                  {editingId ? "Edit Address" : "Add New Address"}
                </h2>
              </div>

              <button
                type="button"
                className="customer-address-modal-close"
                aria-label="Close address form"
                onClick={closeModal}
                disabled={saving}
              >
                <X size={20} />
              </button>
            </header>

            <form onSubmit={handleSave}>
              <div className="customer-address-form-grid">
                <div className="customer-address-form-field">
                  <label htmlFor="address-label">Address Type</label>
                  <select
                    id="address-label"
                    name="label"
                    value={form.label}
                    onChange={updateField}
                    required
                  >
                    <option value="Home">Home</option>
                    <option value="Work">Work</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="customer-address-form-field">
                  <label htmlFor="recipient-name">Full Name</label>
                  <input
                    id="recipient-name"
                    name="recipient_name"
                    value={form.recipient_name}
                    onChange={updateField}
                    autoComplete="name"
                    maxLength={120}
                    required
                  />
                </div>

                <div className="customer-address-form-field">
                  <label htmlFor="address-phone">Phone Number</label>
                  <input
                    id="address-phone"
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={updateField}
                    autoComplete="tel"
                    maxLength={20}
                    required
                  />
                </div>

                <div className="customer-address-form-field">
                  <label htmlFor="address-line1">Address Line 1</label>
                  <input
                    id="address-line1"
                    name="address_line1"
                    value={form.address_line1}
                    onChange={updateField}
                    autoComplete="address-line1"
                    maxLength={200}
                    required
                  />
                </div>

                <div className="customer-address-form-field">
                  <label htmlFor="address-line2">
                    Address Line 2 (Optional)
                  </label>
                  <input
                    id="address-line2"
                    name="address_line2"
                    value={form.address_line2 || ""}
                    onChange={updateField}
                    autoComplete="address-line2"
                    maxLength={200}
                  />
                </div>

                <div className="customer-address-form-field">
                  <label htmlFor="address-city">City / Town</label>
                  <input
                    id="address-city"
                    name="city"
                    value={form.city}
                    onChange={updateField}
                    autoComplete="address-level2"
                    maxLength={100}
                    required
                  />
                </div>

                <div className="customer-address-form-field">
                  <label htmlFor="address-state">State</label>
                  <input
                    id="address-state"
                    name="state"
                    value={form.state}
                    onChange={updateField}
                    autoComplete="address-level1"
                    maxLength={100}
                    required
                  />
                </div>

                <div className="customer-address-form-field">
                  <label htmlFor="address-postal">PIN Code</label>
                  <input
                    id="address-postal"
                    name="postal_code"
                    value={form.postal_code}
                    onChange={updateField}
                    autoComplete="postal-code"
                    maxLength={20}
                    required
                  />
                </div>

                <div className="customer-address-form-field">
                  <label htmlFor="address-country">Country</label>
                  <input
                    id="address-country"
                    name="country"
                    value={form.country}
                    onChange={updateField}
                    autoComplete="country-name"
                    maxLength={100}
                    required
                  />
                </div>
              </div>

              <label className="customer-address-default-checkbox">
                <input
                  type="checkbox"
                  name="is_default"
                  checked={Boolean(form.is_default)}
                  onChange={updateField}
                />
                <span>Set as my default address</span>
              </label>

              <div className="customer-address-modal-actions">
                <button
                  type="button"
                  className="customer-address-cancel"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="customer-address-submit"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <LoaderCircle
                        size={17}
                        className="addresses-spinner"
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={17} />
                      {editingId ? "Save Changes" : "Save Address"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {deleteId && (
        <div className="customer-address-modal-overlay">
          <section
            className="customer-address-delete-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-address-title"
          >
            <div className="customer-address-delete-icon">
              <Trash2 size={24} />
            </div>

            <h2 id="delete-address-title">Delete this address?</h2>
            <p>
              This action cannot be undone. The saved address will be
              removed from your account.
            </p>

            <div className="customer-address-modal-actions">
              <button
                type="button"
                className="customer-address-cancel"
                onClick={() => setDeleteId(null)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="customer-address-confirm-delete"
                onClick={handleDelete}
              >
                <Trash2 size={16} />
                Delete Address
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
