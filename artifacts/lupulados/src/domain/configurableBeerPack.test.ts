import { describe, expect, it } from "vitest";
import { beerCatalog } from "./beerCatalog";
import { addCartItemToCart, getCartItemSubtotal } from "./cartStorage";
import {
  CONFIGURABLE_BEER_PACK_CAPACITY,
  applyCompositionToAllPacks,
  buildConfigurablePackCartItem,
  calculatePackPrice,
  canonicalizePackComposition,
  copyPackComposition,
  createEmptyPackDraft,
  getPackRemainingCount,
  getPackSelectedCount,
  groupIdenticalPacks,
  hasOtherConfiguredPacks,
  isPackComplete,
  listPackAvailableProducts,
  resizePackDrafts,
  updatePackSelection,
} from "./configurableBeerPack";

const products = listPackAvailableProducts(beerCatalog);
const blonde = products.find((product) => product.productId === "blonde-ale")!;
const ipa = products.find((product) => product.productId === "ipa")!;
const stout = products.find((product) => product.productId === "stout")!;

describe("configurableBeerPack", () => {
  it("creates an empty pack with capacity 6 and tracks remaining bottles", () => {
    const draft = createEmptyPackDraft();

    expect(draft.capacity).toBe(CONFIGURABLE_BEER_PACK_CAPACITY);
    expect(draft.selections).toEqual([]);
    expect(getPackSelectedCount(draft)).toBe(0);
    expect(getPackRemainingCount(draft)).toBe(6);
    expect(isPackComplete(draft)).toBe(false);
  });

  it("increments, decrements, normalizes and never exceeds capacity or goes negative", () => {
    const empty = createEmptyPackDraft();
    const withBlonde = updatePackSelection(empty, blonde.productId, 2);
    const full = updatePackSelection(withBlonde, ipa.productId, 20);
    const decremented = updatePackSelection(full, blonde.productId, -5);

    expect(withBlonde.selections).toEqual([{ productId: blonde.productId, quantity: 2 }]);
    expect(getPackSelectedCount(full)).toBe(6);
    expect(
      full.selections.find((selection) => selection.productId === ipa.productId)?.quantity,
    ).toBe(4);
    expect(decremented.selections.some((selection) => selection.quantity < 0)).toBe(false);
    expect(getPackSelectedCount(decremented)).toBe(4);
  });

  it("ignores zero quantities and canonicalizes independently from click order", () => {
    const left = {
      capacity: 6,
      selections: [
        { productId: stout.productId, quantity: 3 },
        { productId: blonde.productId, quantity: 3 },
        { productId: ipa.productId, quantity: 0 },
      ],
    };
    const right = {
      capacity: 6,
      selections: [
        { productId: blonde.productId, quantity: 3 },
        { productId: stout.productId, quantity: 3 },
      ],
    };

    expect(canonicalizePackComposition(left)).toBe(canonicalizePackComposition(right));
    expect(canonicalizePackComposition(left)).toContain("capacity=6");
    expect(canonicalizePackComposition(left)).not.toContain(ipa.productId);
  });

  it("generates equal keys for equal packs and different keys for different packs", () => {
    const a = canonicalizePackComposition({
      capacity: 6,
      selections: [{ productId: blonde.productId, quantity: 6 }],
    });
    const b = canonicalizePackComposition({
      capacity: 6,
      selections: [{ productId: blonde.productId, quantity: 6 }],
    });
    const c = canonicalizePackComposition({
      capacity: 6,
      selections: [{ productId: ipa.productId, quantity: 6 }],
    });

    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });

  it("copies compositions and applies to all packs without sharing references", () => {
    const source = updatePackSelection(createEmptyPackDraft(), blonde.productId, 6);
    const copy = copyPackComposition(source, "copy");
    const applied = applyCompositionToAllPacks(
      [source, createEmptyPackDraft(1), createEmptyPackDraft(2)],
      0,
    );

    copy.selections[0].quantity = 1;
    applied[1].selections[0].quantity = 2;

    expect(source.selections[0].quantity).toBe(6);
    expect(applied[0].selections[0].quantity).toBe(6);
    expect(applied[2].selections[0].quantity).toBe(6);
  });

  it("resizes drafts while preserving previous packs and flagging configured discards", () => {
    const first = updatePackSelection(createEmptyPackDraft(), blonde.productId, 6);
    const second = updatePackSelection(createEmptyPackDraft(1), ipa.productId, 6);
    const increased = resizePackDrafts([first, second], 3);
    const blocked = resizePackDrafts(increased.drafts, 1);
    const confirmed = resizePackDrafts(increased.drafts, 1, { allowDiscardConfigured: true });

    expect(increased.drafts).toHaveLength(3);
    expect(increased.drafts[0].selections).toEqual(first.selections);
    expect(increased.drafts[2].selections).toEqual([]);
    expect(blocked.needsConfirmation).toBe(true);
    expect(blocked.drafts).toHaveLength(3);
    expect(confirmed.drafts).toHaveLength(1);
  });

  it("calculates single-style, mixed and invalid prices without NaN", () => {
    const sixBlonde = { capacity: 6, selections: [{ productId: blonde.productId, quantity: 6 }] };
    const mixed = {
      capacity: 6,
      selections: [
        { productId: blonde.productId, quantity: 2 },
        { productId: ipa.productId, quantity: 1 },
        { productId: stout.productId, quantity: 3 },
      ],
    };
    const invalid = { capacity: 6, selections: [{ productId: "missing", quantity: 6 }] };

    expect(calculatePackPrice(sixBlonde, products)).toBe(blonde.price * 6);
    expect(calculatePackPrice(mixed, products)).toBe(
      blonde.price * 2 + ipa.price + stout.price * 3,
    );
    expect(calculatePackPrice(mixed, products)).not.toBe(calculatePackPrice(sixBlonde, products));
    expect(Number.isNaN(calculatePackPrice(invalid, products))).toBe(false);
  });

  it("excludes beers without an active porron price from selectable products", () => {
    const catalog = beerCatalog.map((beer) =>
      beer.id === blonde.productId
        ? {
            ...beer,
            presentations: beer.presentations.filter(
              (presentation) => presentation.id !== "porron500ml",
            ),
          }
        : beer,
    );

    expect(listPackAvailableProducts(catalog).map((product) => product.productId)).not.toContain(
      blonde.productId,
    );
  });

  it("groups identical packs, keeps different packs separate and uses qty as packs", () => {
    const packA = updatePackSelection(createEmptyPackDraft(), blonde.productId, 3);
    const completeA = updatePackSelection(packA, stout.productId, 3);
    const sameA = updatePackSelection(createEmptyPackDraft(1), stout.productId, 3);
    const sameCompleteA = updatePackSelection(sameA, blonde.productId, 3);
    const packB = updatePackSelection(createEmptyPackDraft(2), ipa.productId, 6);

    const grouped = groupIdenticalPacks([completeA, sameCompleteA, packB], products);
    const cart = grouped.reduce(
      (items, group) =>
        addCartItemToCart(items, buildConfigurablePackCartItem(group.draft, products), group.qty),
      [],
    );

    expect(grouped).toHaveLength(2);
    expect(grouped.find((group) => group.qty === 2)?.unitPrice).toBe(
      blonde.price * 3 + stout.price * 3,
    );
    expect(cart).toHaveLength(2);
    expect(
      cart.find((item) =>
        item.pack?.composition.some((selection) => selection.productId === ipa.productId),
      )?.qty,
    ).toBe(1);
    expect(cart.find((item) => item.qty === 2)?.pack?.capacity).toBe(6);
    expect(getCartItemSubtotal(cart.find((item) => item.qty === 2)!)).toBe(
      (blonde.price * 3 + stout.price * 3) * 2,
    );
  });

  it("detects other configured packs, excluding the active one", () => {
    const empty = createEmptyPackDraft();
    const configured = updatePackSelection(createEmptyPackDraft(1), blonde.productId, 3);

    expect(hasOtherConfiguredPacks([empty, configured], 0)).toBe(true);
    expect(hasOtherConfiguredPacks([empty, configured], 1)).toBe(false);
    expect(hasOtherConfiguredPacks([empty, createEmptyPackDraft(1)], 0)).toBe(false);
  });

  it("adding the same composition again increments quantity", () => {
    const draft = updatePackSelection(createEmptyPackDraft(), blonde.productId, 6);
    const line = buildConfigurablePackCartItem(draft, products);
    const cart = addCartItemToCart(addCartItemToCart([], line, 2), line, 1);

    expect(cart).toHaveLength(1);
    expect(cart[0].qty).toBe(3);
    expect(cart[0].qty * (cart[0].pack?.capacity ?? 0)).toBe(18);
  });
});
