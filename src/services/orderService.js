
import { supabase } from "../lib/supabase";

const ORDERS_TABLE = "orders";

function handleError(error, fallbackMessage) {
  if (error) {
    console.error(fallbackMessage, {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });

    throw new Error(
      `${fallbackMessage} ${error.message || ""}`.trim()
    );
  }
}

function validateId(id, message) {
  if (id === undefined || id === null || id === "") {
    throw new Error(message);
  }
}

/**
 * Create an order.
 * Call this from a trusted checkout flow after validating prices,
 * stock, and customer identity on the server.
 */
export async function createOrder(orderData) {
  if (
    !orderData ||
    typeof orderData !== "object" ||
    Array.isArray(orderData)
  ) {
    throw new Error("Valid order details are required.");
  }

  const {
    id,
    created_at,
    updated_at,
    ...newOrder
  } = orderData;

  const { data, error } = await supabase
    .from(ORDERS_TABLE)
    .insert([newOrder])
    .select()
    .single();

  handleError(error, "Unable to create the order.");

  return data;
}

/**
 * Get all orders belonging to the currently signed-in customer.
 */
export async function getMyOrders() {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  handleError(authError, "Unable to verify the customer.");

  if (!user) {
    throw new Error("Please sign in to view your orders.");
  }

  const { data, error } = await supabase
    .from(ORDERS_TABLE)
    .select("*")
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false });

  handleError(error, "Unable to load your orders.");

  return data ?? [];
}

/**
 * Get one order.
 * Customer access must be enforced by RLS.
 */
export async function getOrderById(id) {
  validateId(id, "An order ID is required.");

  const { data, error } = await supabase
    .from(ORDERS_TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  handleError(error, "Unable to load order details.");

  return data;
}

/**
 * Admin: get all orders.
 * The database must restrict this operation to authorized admins.
 */
export async function getAllOrders(options = {}) {
  let query = supabase
    .from(ORDERS_TABLE)
    .select("*")
    .order("created_at", { ascending: false });

  if (options.status) {
    query = query.eq("status", options.status);
  }

  if (options.customerId) {
    query = query.eq("customer_id", options.customerId);
  }

  if (options.limit !== undefined && options.limit !== null) {
    const limit = Number(options.limit);

    if (!Number.isInteger(limit) || limit < 1) {
      throw new Error("The order limit must be a positive integer.");
    }

    query = query.limit(limit);
  }

  const { data, error } = await query;

  handleError(error, "Unable to load orders.");

  return data ?? [];
}

/**
 * Admin: update order status.
 * Example statuses: pending, confirmed, processing, shipped,
 * delivered, cancelled.
 */
export async function updateOrderStatus(id, status) {
  validateId(id, "An order ID is required.");

  const allowedStatuses = [
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ];

  if (!allowedStatuses.includes(status)) {
    throw new Error("Invalid order status.");
  }

  const { data, error } = await supabase
    .from(ORDERS_TABLE)
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  handleError(error, "Unable to update the order status.");

  return data;
}

/**
 * Admin: delete an order, if permitted by your business rules and RLS.
 */
export async function deleteOrder(id) {
  validateId(id, "An order ID is required.");

  const { error } = await supabase
    .from(ORDERS_TABLE)
    .delete()
    .eq("id", id);

  handleError(error, "Unable to delete the order.");

  return true;
}
