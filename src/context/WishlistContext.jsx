import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const WishlistContext = createContext(null);
const WISHLIST_STORAGE_KEY = "ark_marbles_wishlist";

function readSavedWishlist() {
  try {
    const saved = localStorage.getItem(WISHLIST_STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function WishlistProvider({ children }) {
  const [items, setItems] = useState(readSavedWishlist);

  useEffect(() => {
    try {
      localStorage.setItem(
        WISHLIST_STORAGE_KEY,
        JSON.stringify(items)
      );
    } catch (error) {
      console.error("Unable to save wishlist:", error);
    }
  }, [items]);

  const addToWishlist = useCallback((product) => {
    if (!product || product.id == null) {
      throw new Error("A valid product is required.");
    }

    setItems((currentItems) => {
      const alreadyExists = currentItems.some(
        (item) => String(item.id) === String(product.id)
      );

      if (alreadyExists) {
        return currentItems;
      }

      return [...currentItems, product];
    });
  }, []);

  const removeFromWishlist = useCallback((productId) => {
    setItems((currentItems) =>
      currentItems.filter(
        (item) => String(item.id) !== String(productId)
      )
    );
  }, []);

  const toggleWishlist = useCallback((product) => {
    if (!product || product.id == null) {
      throw new Error("A valid product is required.");
    }

    setItems((currentItems) => {
      const exists = currentItems.some(
        (item) => String(item.id) === String(product.id)
      );

      return exists
        ? currentItems.filter(
            (item) => String(item.id) !== String(product.id)
          )
        : [...currentItems, product];
    });
  }, []);

  const isInWishlist = useCallback(
    (productId) =>
      items.some(
        (item) => String(item.id) === String(productId)
      ),
    [items]
  );

  const clearWishlist = useCallback(() => {
    setItems([]);
  }, []);

  const value = useMemo(
    () => ({
      items,
      wishlistItems: items,
      wishlistCount: items.length,
      addToWishlist,
      removeFromWishlist,
      toggleWishlist,
      isInWishlist,
      clearWishlist,
    }),
    [
      items,
      addToWishlist,
      removeFromWishlist,
      toggleWishlist,
      isInWishlist,
      clearWishlist,
    ]
  );

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlistContext() {
  const context = useContext(WishlistContext);

  if (!context) {
    throw new Error(
      "useWishlistContext must be used inside a WishlistProvider."
    );
  }

  return context;
}

export default WishlistContext;