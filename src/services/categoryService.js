
import { supabase } from "../lib/supabase";

const CATEGORIES_TABLE = "categories";

function handleCategoryError(error, action) {
  console.error(`Category service — ${action}:`, {
    message: error?.message,
    code: error?.code,
    details: error?.details,
    hint: error?.hint,
  });

  throw new Error(
    `${action}: ${error?.message || "Unable to complete category operation."}`
  );
}

export async function getCategories() {
  const { data, error } = await supabase
    .from(CATEGORIES_TABLE)
    .select("*")
    .order("name", { ascending: true });

  if (error) handleCategoryError(error, "Load categories");

  return data ?? [];
}

export async function getCategoryById(id) {
  if (!id) throw new Error("A category ID is required.");

  const { data, error } = await supabase
    .from(CATEGORIES_TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) handleCategoryError(error, "Load category");

  return data;
}

export async function createCategory(categoryData) {
  if (
    !categoryData ||
    typeof categoryData !== "object" ||
    Array.isArray(categoryData)
  ) {
    throw new Error("Valid category details are required.");
  }

  const { id, created_at, updated_at, ...newCategory } = categoryData;

  const { data, error } = await supabase
    .from(CATEGORIES_TABLE)
    .insert([newCategory])
    .select()
    .single();

  if (error) handleCategoryError(error, "Create category");

  return data;
}

export async function updateCategory(id, categoryData) {
  if (!id) throw new Error("A category ID is required.");

  if (
    !categoryData ||
    typeof categoryData !== "object" ||
    Array.isArray(categoryData)
  ) {
    throw new Error("Valid category details are required.");
  }

  const {
    id: ignoredId,
    created_at,
    updated_at,
    ...updates
  } = categoryData;

  if (Object.keys(updates).length === 0) {
    throw new Error("Provide at least one category field to update.");
  }

  const { data, error } = await supabase
    .from(CATEGORIES_TABLE)
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) handleCategoryError(error, "Update category");

  return data;
}

export async function deleteCategory(id) {
  if (!id) throw new Error("A category ID is required.");

  const { error } = await supabase
    .from(CATEGORIES_TABLE)
    .delete()
    .eq("id", id);

  if (error) handleCategoryError(error, "Delete category");

  return true;
}
