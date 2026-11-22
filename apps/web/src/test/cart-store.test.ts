import { describe, it, expect, beforeEach } from "vitest";
import { useCartStore } from "../stores/cart-store";

describe("Shopping Bag & Cart Store Logic", () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
  });

  it("initializes with an empty cart", () => {
    const state = useCartStore.getState();
    expect(state.items).toEqual([]);
    expect(state.getItemCount()).toBe(0);
    expect(state.getSubtotal()).toBe(0);
  });

  it("adds new items to the shopping bag", () => {
    const kurti = {
      id: "prod-1-s",
      productId: "prod-1",
      slug: "chanderi-silk-kurti",
      title: "Chanderi Silk Kurti",
      price: 185.0,
      size: "S",
      color: "Crimson",
      maxStock: 10,
    };

    useCartStore.getState().addItem(kurti, 2);

    const state = useCartStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0]?.quantity).toBe(2);
    expect(state.getItemCount()).toBe(2);
    expect(state.getSubtotal()).toBe(370.0);
  });

  it("increments quantity for existing cart item without exceeding maxStock", () => {
    const lehenga = {
      id: "prod-2-m",
      productId: "prod-2",
      slug: "bandhani-silk-lehenga",
      title: "Bandhani Silk Lehenga",
      price: 495.0,
      size: "M",
      color: "Emerald",
      maxStock: 5,
    };

    useCartStore.getState().addItem(lehenga, 3);
    expect(useCartStore.getState().getItemCount()).toBe(3);

    // Add 4 more, but maxStock is 5
    useCartStore.getState().addItem(lehenga, 4);

    const state = useCartStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0]?.quantity).toBe(5);
    expect(state.getItemCount()).toBe(5);
    expect(state.getSubtotal()).toBe(2475.0);
  });

  it("updates item quantity and clamps to maxStock", () => {
    const item = {
      id: "prod-3-l",
      productId: "prod-3",
      slug: "mulmul-cotton-kurti",
      title: "Mulmul Cotton Kurti",
      price: 68.0,
      maxStock: 4,
    };

    useCartStore.getState().addItem(item, 1);
    useCartStore.getState().updateQuantity("prod-3-l", 3);

    expect(useCartStore.getState().items[0]?.quantity).toBe(3);

    // Exceeding max stock clamps to maxStock
    useCartStore.getState().updateQuantity("prod-3-l", 10);
    expect(useCartStore.getState().items[0]?.quantity).toBe(4);
  });

  it("removes item when quantity is reduced to 0 or below", () => {
    const item = {
      id: "prod-4-xl",
      productId: "prod-4",
      slug: "anarkali-suit",
      title: "Anarkali Suit",
      price: 120.0,
    };

    useCartStore.getState().addItem(item, 2);
    expect(useCartStore.getState().items).toHaveLength(1);

    useCartStore.getState().updateQuantity("prod-4-xl", 0);
    expect(useCartStore.getState().items).toHaveLength(0);
    expect(useCartStore.getState().getItemCount()).toBe(0);
  });

  it("removes specified item by id", () => {
    useCartStore.getState().addItem({
      id: "item-a",
      productId: "prod-a",
      slug: "a",
      title: "A",
      price: 50,
    });
    useCartStore.getState().addItem({
      id: "item-b",
      productId: "prod-b",
      slug: "b",
      title: "B",
      price: 100,
    });

    expect(useCartStore.getState().items).toHaveLength(2);

    useCartStore.getState().removeItem("item-a");
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items[0]?.id).toBe("item-b");
    expect(useCartStore.getState().getSubtotal()).toBe(100);
  });

  it("clears all items in the shopping bag", () => {
    useCartStore.getState().addItem({
      id: "item-1",
      productId: "prod-1",
      slug: "1",
      title: "1",
      price: 25,
    });
    useCartStore.getState().clearCart();

    expect(useCartStore.getState().items).toEqual([]);
    expect(useCartStore.getState().getSubtotal()).toBe(0);
  });
});
