
import { supabase } from "../lib/supabase";

const PAYMENTS_TABLE = "payments";

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

// Customer: get payment records belonging to the logged-in customer.
export async function getMyPayments() {
  const user = await getAuthenticatedUser();

  const { data, error } = await supabase
    .from(PAYMENTS_TABLE)
    .select("*")
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false });

  handleError(error, "Unable to load your payment records.");

  return data ?? [];
}

// Customer: retrieve payment records for a particular order.
export async function getPaymentsByOrderId(orderId) {
  if (!orderId) {
    throw new Error("Order ID is required.");
  }

  const user = await getAuthenticatedUser();

  const { data, error } = await supabase
    .from(PAYMENTS_TABLE)
    .select("*")
    .eq("order_id", orderId)
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false });

  handleError(error, "Unable to load payments for this order.");

  return data ?? [];
}

// Admin: retrieve payment records for the dashboard.
// RLS must restrict access to administrators.
export async function getAllPayments(options = {}) {
  await getAuthenticatedUser();

  let query = supabase
    .from(PAYMENTS_TABLE)
    .select("*")
    .order("created_at", { ascending: false });

  if (options.status) {
    query = query.eq("status", options.status);
  }

  if (options.orderId) {
    query = query.eq("order_id", options.orderId);
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

  handleError(error, "Unable to load payment records.");

  return data ?? [];
}

// Retrieve a single payment record.
// Supabase RLS must enforce the caller's permissions.
export async function getPaymentById(id) {
  if (!id) {
    throw new Error("Payment ID is required.");
  }

  await getAuthenticatedUser();

  const { data, error } = await supabase
    .from(PAYMENTS_TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  handleError(error, "Unable to load payment details.");

  if (!data) {
    throw new Error("Payment not found or access denied.");
  }

  return data;
}

// SECURITY:
// Do not create payments, change payment statuses, or mark orders
// as paid directly from the browser.
// Those operations must be performed by a trusted backend after
// verifying the payment gateway signature and transaction status.
