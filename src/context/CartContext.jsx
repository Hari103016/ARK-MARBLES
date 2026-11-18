
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const CartContext = createContext(null);
const CART_STORAGE_KEY = "ark_marbles_cart";

/* Read the saved cart safely */
function readSavedCart() {
  try {
    if (typeof window === "undefined") return [];

    const saved = window.localStorage.getItem(CART_STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];

    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Unable to read saved cart:", error);
    return [];
  }
}

/* Support the product ID fields used in the application */
function getItemId(item) {
  return String(item?.id ?? item?.marble_id ?? "");
}

/* Preserve the existing price-field priority */
function getItemPrice(item) {
  const raw =
    item?.price_per_unit ??
    item?.selling_price ??
    item?.price_per_sqft ??
    item?.pricePerSqft ??
    item?.price_per_sq_ft ??
    item?.price ??
    item?.unit_price ??
    item?.amount ??
    0;

  const price = Number(raw);

  return Number.isFinite(price) && price >= 0 ? price : 0;
}

/* Normalize quantity */
function getItemQuantity(item) {
  const quantity = Number(item?.quantity ?? item?.qty ?? 1);

  return Number.isFinite(quantity) && quantity > 0
    ? Math.floor(quantity)
    : 0;
}

/* Cart provider */
export function CartProvider({ children }) {
  const [items, setItems] = useState(readSavedCart);

  /* Save cart whenever items change */
  useEffect(() => {
    try {
      window.localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify(items)
      );
    } catch (error) {
      console.error("Unable to save cart:", error);
    }
  }, [items]);

  /* Add a product or increase its existing quantity */
  const addToCart = useCallback((product, quantity = 1) => {
    if (!product || product.id == null) {
      throw new Error("A valid product with an id is required.");
    }

    const productId = getItemId(product);
    const amount = Math.max(1, Math.floor(Number(quantity) || 1));

    setItems((currentItems) => {
      const existing = currentItems.find(
        (item) => getItemId(item) === productId
      );

      if (existing) {
        return currentItems.map((item) => {
          if (getItemId(item) !== productId) return item;

          return {
            ...item,
            ...product,
            quantity: getItemQuantity(item) + amount,
          };
        });
      }

      return [
        ...currentItems,
        {
          ...product,
          quantity: amount,
        },
      ];
    });
  }, []);

  /* Remove one product */
  const removeFromCart = useCallback((productId) => {
    const id = String(productId);

    setItems((currentItems) =>
      currentItems.filter((item) => getItemId(item) !== id)
    );
  }, []);

  /* Update quantity; quantities below one remove the product */
  const updateQuantity = useCallback((productId, quantity) => {
    const id = String(productId);
    const amount = Number(quantity);

    if (!Number.isFinite(amount) || amount < 1) {
      setItems((currentItems) =>
        currentItems.filter((item) => getItemId(item) !== id)
      );
      return;
    }

    const normalizedQuantity = Math.floor(amount);

    if (normalizedQuantity < 1) {
      setItems((currentItems) =>
        currentItems.filter((item) => getItemId(item) !== id)
      );
      return;
    }

    setItems((currentItems) =>
      currentItems.map((item) =>
        getItemId(item) === id
          ? {
              ...item,
              quantity: normalizedQuantity,
            }
          : item
      )
    );
  }, []);

  /* Empty the entire cart */
  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  /* Total quantity across all products */
  const cartCount = useMemo(
    () =>
      items.reduce(
        (total, item) => total + getItemQuantity(item),
        0
      ),
    [items]
  );

  /* Total price of all cart items */
  const cartTotal = useMemo(
    () =>
      items.reduce(
        (total, item) =>
          total + getItemPrice(item) * getItemQuantity(item),
        0
      ),
    [items]
  );

  /* Expose the cart API to components */
  const value = useMemo(
    () => ({
      items,
      cartItems: items,
      cartCount,
      cartTotal,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
    }),
    [
      items,
      cartCount,
      cartTotal,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
    ]
  );

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

/* Access the cart from any component inside CartProvider */
export function useCartContext() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCartContext must be used inside a CartProvider."
    );
  }

  return context;
}

export default CartContext;
