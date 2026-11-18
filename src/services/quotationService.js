
import { supabase } from "../lib/supabase";

const QUOTATIONS_TABLE = "quotations";
const QUOTATION_ITEMS_TABLE = "quotation_items";

function handleError(error, fallbackMessage) {
  if (error) {
    console.error(fallbackMessage, error);
    throw new Error(error.message || fallbackMessage);
  }
}

async function getAuthenticatedUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  handleError(error, "Unable to verify your account.");

  if (!user) {
    throw new Error("Please log in to continue.");
  }

  return user;
}

// Create a quotation request for the logged-in customer.
export async function createQuotation(quotationData) {
  if (!quotationData || typeof quotationData !== "object") {
    throw new Error("Quotation details are required.");
  }

  const user = await getAuthenticatedUser();

  const {
    id,
    customer_id,
    quotation_number,
    status,
    quoted_amount,
    created_at,
    updated_at,
    ...details
  } = quotationData;

  const { data, error } = await supabase
    .from(QUOTATIONS_TABLE)
    .insert([
      {
        ...details,
        customer_id: user.id,
        status: "pending",
      },
    ])
    .select()
    .single();

  handleError(error, "Unable to create quotation.");

  return data;
}

// Get quotations belonging to the logged-in customer.
export async function getMyQuotations() {
  const user = await getAuthenticatedUser();

  const { data, error } = await supabase
    .from(QUOTATIONS_TABLE)
    .select("*")
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false });

  handleError(error, "Unable to load your quotations.");

  return data ?? [];
}

// Get one quotation.
// RLS must restrict access to the owner's or an administrator's records.
export async function getQuotationById(id) {
  if (!id) {
    throw new Error("Quotation ID is required.");
  }

  await getAuthenticatedUser();

  const { data, error } = await supabase
    .from(QUOTATIONS_TABLE)
    .select("*, quotation_items(*)")
    .eq("id", id)
    .maybeSingle();

  handleError(error, "Unable to load quotation details.");

  if (!data) {
    throw new Error("Quotation not found or access denied.");
  }

  return data;
}

// Add products to a quotation that is still pending.
export async function addQuotationItems(quotationId, items) {
  if (!quotationId) {
    throw new Error("Quotation ID is required.");
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Add at least one product to the quotation.");
  }

  await getAuthenticatedUser();

  const rows = items.map((item) => {
    if (!item.product_name || !Number.isFinite(Number(item.quantity)) ||
        Number(item.quantity) <= 0) {
      throw new Error("Each item needs a product name and a positive quantity.");
    }

    const row = {
      quotation_id: quotationId,
      product_name: String(item.product_name).trim(),
      quantity: Number(item.quantity),
      customer_note: item.customer_note ?? null,
    };

    if (item.marble_id != null) {
      const marbleId = Number(item.marble_id);

      if (!Number.isSafeInteger(marbleId) || marbleId <= 0) {
        throw new Error("Invalid marble ID.");
      }

      row.marble_id = marbleId;
    }

    // Customer-provided estimates are not authoritative prices.
    // The administrator should determine the final quotation amount.
    return row;
  });

  const { data, error } = await supabase
    .from(QUOTATION_ITEMS_TABLE)
    .insert(rows)
    .select();

  handleError(error, "Unable to add quotation items.");

  return data ?? [];
}

// Administrator: retrieve all quotations.
// Requires a valid administrator profile and matching RLS policy.
export async function getAllQuotations(options = {}) {
  await getAuthenticatedUser();

  let query = supabase
    .from(QUOTATIONS_TABLE)
    .select("*")
    .order("created_at", { ascending: false });

  if (options.status) {
    query = query.eq("status", options.status);
  }

  if (options.customerId) {
    query = query.eq("customer_id", options.customerId);
  }

  if (options.limit != null) {
    const limit = Number(options.limit);

    if (!Number.isInteger(limit) || limit < 1) {
      throw new Error("Limit must be a positive integer.");
    }

    query = query.limit(limit);
  }

  const { data, error } = await query;

  handleError(error, "Unable to load quotations.");

  return data ?? [];
}

// Administrator: update quotation status and quote details.
export async function updateQuotation(id, updates) {
  if (!id) {
    throw new Error("Quotation ID is required.");
  }

  if (!updates || typeof updates !== "object") {
    throw new Error("Quotation updates are required.");
  }

  await getAuthenticatedUser();

  const allowedStatuses = [
    "pending",
    "reviewing",
    "quoted",
    "accepted",
    "rejected",
    "expired",
    "converted",
  ];

  const allowedFields = [
    "status",
    "admin_note",
    "quoted_amount",
    "valid_until",
  ];

  const safeUpdates = {};

  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(updates, field)) {
      safeUpdates[field] = updates[field];
    }
  }

  if (Object.keys(safeUpdates).length === 0) {
    throw new Error("No valid quotation fields were provided.");
  }

  if (
    safeUpdates.status != null &&
    !allowedStatuses.includes(safeUpdates.status)
  ) {
    throw new Error("Invalid quotation status.");
  }

  if (
    safeUpdates.quoted_amount != null &&
    (!Number.isFinite(Number(safeUpdates.quoted_amount)) ||
      Number(safeUpdates.quoted_amount) < 0)
  ) {
    throw new Error("Quoted amount must be zero or greater.");
  }

  safeUpdates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from(QUOTATIONS_TABLE)
    .update(safeUpdates)
    .eq("id", id)
    .select()
    .single();

  handleError(error, "Unable to update quotation.");

  return data;
}
