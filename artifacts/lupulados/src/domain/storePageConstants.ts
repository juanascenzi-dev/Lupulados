import { STORE_PRICE_RANGE_LABELS, STORE_SORT_LABELS } from "@/domain/storeCatalog";
import type { StoreMainCategory, StorePriceRange, StoreSortOption } from "@/domain/storeCatalog";

export const mainCategories: StoreMainCategory[] = [
  "all",
  "beer",
  "alcohol",
  "non-alcohol",
  "combo",
  "accessory",
];
export const sortOptions = Object.keys(STORE_SORT_LABELS) as StoreSortOption[];
export const priceRangeOptions = Object.keys(STORE_PRICE_RANGE_LABELS) as StorePriceRange[];
