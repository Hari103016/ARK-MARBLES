
import { supabase } from "../lib/supabase";

const MARBLES_TABLE = "marbles";

function validateId(id) {
  const numericId = Number(id);

  if (!Number.isSafeInteger(numericId) || numericId <= 0) {
    throw new Error("Invalid marble product ID.");
  }

  return numericId;
}

function normalizeError(error, fallbackMessage) {
  console.error(fallbackMessage, error);

  if (error?.message) {
    return new Error(error.message);
  }

  return new Error(fallbackMessage);
}

/**
 * Get all inventory products.
 * Uses the existing marbles table.
 */
export async function getInventory() {
  const { data, error } = await supabase
    .from(MARBLES_TABLE)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw normalizeError(error, "Unable to load inventory.");
  }

  return (data || []).map((item) => ({
    ...item,
    stock: Number(item.stock ?? item.stock_quantity ?? 0),
    stock_quantity: Number(item.stock_quantity ?? item.stock ?? 0),
    price: Number(item.price ?? item.price_per_sqft ?? 0),
    price_per_sqft: Number(
      item.price_per_sqft ?? item.price ?? 0
    ),
  }));
}

/**
 * Get one inventory product by its numeric Supabase ID.
 */
export async function getInventoryItem(id) {
  const productId = validateId(id);

  const { data, error } = await supabase
    .from(MARBLES_TABLE)
    .select("*")
    .eq("id", productId)
    .maybeSingle();

  if (error) {
    throw normalizeError(error, "Unable to load the inventory item.");
  }

  if (!data) {
    throw new Error("Inventory item not found.");
  }

  return {
    ...data,
    stock: Number(data.stock ?? data.stock_quantity ?? 0),
    stock_quantity: Number(
      data.stock_quantity ?? data.stock ?? 0
    ),
    price: Number(data.price ?? data.price_per_sqft ?? 0),
    price_per_sqft: Number(
      data.price_per_sqft ?? data.price ?? 0
    ),
  };
}

/**
 * Check whether a product has enough available stock.
 */
export async function checkStock(id, requestedQuantity = 1) {
  const productId = validateId(id);
  const quantity = Number(requestedQuantity);

  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error("Requested quantity must be greater than zero.");
  }

  const item = await getInventoryItem(productId);
  const availableStock = Number(
    item.stock_quantity ?? item.stock ?? 0
  );

  return {
    available: item.is_available !== false && availableStock >= quantity,
    productId,
    requestedQuantity: quantity,
    availableStock,
  };
}

/**
 * Update inventory stock.
 *
 * The calling user must have the required database permissions.
 * This function updates the stock fields and availability status.
 */
export async function updateInventory(id, quantity) {
  const productId = validateId(id);
  const stockQuantity = Number(quantity);

  if (!Number.isFinite(stockQuantity) || stockQuantity < 0) {
    throw new Error("Stock quantity must be a non-negative number.");
  }

  const currentItem = await getInventoryItem(productId);

  const isAvailable =
    stockQuantity > 0 &&
    String(currentItem.status ?? "").toLowerCase() !== "sold";

  const updates = {
    stock: stockQuantity,
    stock_quantity: stockQuantity,
    is_available: isAvailable,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from(MARBLES_TABLE)
    .update(updates)
    .eq("id", productId)
    .select("*")
    .single();

  if (error) {
    throw normalizeError(error, "Unable to update inventory stock.");
  }

  return data;
}
