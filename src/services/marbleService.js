
import { supabase } from "../lib/supabase";

const MARBLES_TABLE = "marbles";

function handleError(error, fallbackMessage) {
  if (error) {
    console.error(fallbackMessage, error);
    throw new Error(error.message || fallbackMessage);
  }
}

function sanitizeSearch(value) {
  return String(value ?? "").trim().replace(/[%_,()]/g, "");
}

function isConstructionProduct(product) {
  const category = String(product.category || "").toLowerCase();

  return [
    "steel",
    "tmt",
    "cement",
    "brick",
    "block",
    "pipe",
    "plumbing",
    "construction essentials",
  ].some((keyword) => category.includes(keyword));
}

export async function getMarbles(options = {}) {
  let query = supabase
    .from(MARBLES_TABLE)
    .select("*")
    .order("created_at", { ascending: false });

  if (options.category) {
    query = query.eq("category", options.category);
  }

  if (options.status) {
    query = query.eq("status", options.status);
  }

  if (options.search) {
    const search = sanitizeSearch(options.search);

    if (search) {
      query = query.ilike("name", `%${search}%`);
    }
  }

  if (options.availableOnly) {
    query = query
      .eq("is_available", true)
      .eq("status", "available");
  }

  if (options.limit != null) {
    const limit = Number(options.limit);

    if (!Number.isInteger(limit) || limit < 1) {
      throw new Error("Limit must be a positive integer.");
    }

    query = query.limit(limit);
  }

  const { data, error } = await query;

  handleError(error, "Unable to load products.");

  return data ?? [];
}

export async function getMarbleById(id) {
  const marbleId = Number(id);

  if (!Number.isSafeInteger(marbleId) || marbleId <= 0) {
    throw new Error("A valid product ID is required.");
  }

  const { data, error } = await supabase
    .from(MARBLES_TABLE)
    .select("*")
    .eq("id", marbleId)
    .maybeSingle();

  handleError(error, "Unable to load product details.");

  if (!data) {
    throw new Error("Product not found.");
  }

  return data;
}

export async function createMarble(marbleData) {
  if (!marbleData || typeof marbleData !== "object") {
    throw new Error("Product details are required.");
  }

  const {
    id,
    created_at,
    updated_at,
    ...newMarble
  } = marbleData;

  if (!String(newMarble.name ?? "").trim()) {
    throw new Error("Product name is required.");
  }

  const { data, error } = await supabase
    .from(MARBLES_TABLE)
    .insert([newMarble])
    .select()
    .single();

  handleError(error, "Unable to create product.");

  return data;
}

export async function updateMarble(id, marbleData) {
  const marbleId = Number(id);

  if (!Number.isSafeInteger(marbleId) || marbleId <= 0) {
    throw new Error("A valid product ID is required.");
  }

  if (!marbleData || typeof marbleData !== "object") {
    throw new Error("Updated product details are required.");
  }

  const {
    id: ignoredId,
    created_at,
    updated_at,
    ...updates
  } = marbleData;

  if (Object.keys(updates).length === 0) {
    throw new Error("No product changes were provided.");
  }

  const { data, error } = await supabase
    .from(MARBLES_TABLE)
    .update(updates)
    .eq("id", marbleId)
    .select()
    .single();

  handleError(error, "Unable to update product.");

  return data;
}

export async function deleteMarble(id) {
  const marbleId = Number(id);

  if (!Number.isSafeInteger(marbleId) || marbleId <= 0) {
    throw new Error("A valid product ID is required.");
  }

  const { error } = await supabase
    .from(MARBLES_TABLE)
    .delete()
    .eq("id", marbleId);

  handleError(error, "Unable to delete product.");

  return true;
}

// Fetch featured marble and construction products for the homepage.
export async function getFeaturedMarbles(limit = 8) {
  const safeLimit = Number(limit);

  if (!Number.isInteger(safeLimit) || safeLimit < 1) {
    throw new Error("Limit must be a positive integer.");
  }

  const products = await getMarbles({
    availableOnly: true,
  });

  const marbles = products.filter(
    (product) => !isConstructionProduct(product)
  );

  const constructionProducts = products.filter(
    isConstructionProduct
  );

  // Feature both groups when available.
  const constructionLimit = Math.min(
    constructionProducts.length,
    Math.ceil(safeLimit / 2)
  );

  const marbleLimit = Math.min(
    marbles.length,
    safeLimit - constructionLimit
  );

  let featured = [
    ...constructionProducts.slice(0, constructionLimit),
    ...marbles.slice(0, marbleLimit),
  ];

  // Fill remaining slots from either group if one group is small.
  if (featured.length < safeLimit) {
    const usedIds = new Set(featured.map((product) => product.id));

    const remaining = products.filter(
      (product) => !usedIds.has(product.id)
    );

    featured = [
      ...featured,
      ...remaining.slice(0, safeLimit - featured.length),
    ];
  }

  return featured.slice(0, safeLimit);
}

export async function searchMarbles(searchTerm) {
  const search = sanitizeSearch(searchTerm);

  if (!search) {
    return [];
  }

  return getMarbles({ search });
}
