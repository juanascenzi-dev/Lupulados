import { ArrowDownAZ, Search, Sparkles, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  STORE_MAIN_CATEGORY_LABELS,
  STORE_PRICE_RANGE_LABELS,
  STORE_SORT_LABELS,
  getStoreResultLabel,
  type StoreMainCategory,
  type StorePriceRange,
  type StoreSortOption,
} from "@/domain/storeCatalog";
import { mainCategories, priceRangeOptions, sortOptions } from "@/domain/storePageConstants";

interface StoreFilterBarProps {
  query: string;
  onQueryChange: (value: string) => void;
  subcategory: string;
  onSubcategoryChange: (value: string) => void;
  subcategories: string[];
  presentationType: string;
  onPresentationTypeChange: (value: string) => void;
  presentationOptions: { value: string; label: string }[];
  priceRange: StorePriceRange;
  onPriceRangeChange: (value: StorePriceRange) => void;
  sortBy: StoreSortOption;
  onSortByChange: (value: StoreSortOption) => void;
  mainCategory: StoreMainCategory;
  onMainCategoryChange: (value: StoreMainCategory) => void;
  onlyPromotions: boolean;
  onToggleOnlyPromotions: () => void;
  onlyVolumeSavings: boolean;
  onToggleOnlyVolumeSavings: () => void;
  activeFilterCount: number;
  onClearFilters: () => void;
  resultCount: number;
}

export function StoreFilterBar({
  query,
  onQueryChange,
  subcategory,
  onSubcategoryChange,
  subcategories,
  presentationType,
  onPresentationTypeChange,
  presentationOptions,
  priceRange,
  onPriceRangeChange,
  sortBy,
  onSortByChange,
  mainCategory,
  onMainCategoryChange,
  onlyPromotions,
  onToggleOnlyPromotions,
  onlyVolumeSavings,
  onToggleOnlyVolumeSavings,
  activeFilterCount,
  onClearFilters,
  resultCount,
}: StoreFilterBarProps) {
  return (
    <section className="mb-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_220px_220px_220px]">
        <label className="relative block">
          <span className="sr-only">Buscar productos</span>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35"
            aria-hidden="true"
          />
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Buscar por nombre, estilo, tipo..."
            className="h-11 w-full rounded-xl border border-white/10 bg-black/35 pl-10 pr-3 text-white placeholder:text-white/35 focus:border-primary focus:outline-none"
          />
        </label>
        <label>
          <span className="sr-only">Subcategoría</span>
          <Select value={subcategory} onValueChange={onSubcategoryChange}>
            <SelectTrigger className="h-11 rounded-xl border-white/10 bg-black/35 px-3 pr-4 text-white focus:ring-1 focus:ring-primary [&>svg]:ml-3 [&>svg]:text-primary">
              <SelectValue placeholder="Todas las subcategorías" />
            </SelectTrigger>
            <SelectContent className="z-[80] border-white/10 bg-[#15110d] text-white shadow-2xl shadow-black/50">
              <SelectItem
                value="all"
                className="text-white focus:bg-primary/20 focus:text-white data-[highlighted]:bg-primary/20 data-[highlighted]:text-white"
              >
                Todas las subcategorías
              </SelectItem>
              {subcategories.map((value) => (
                <SelectItem
                  key={value}
                  value={value}
                  className="text-white focus:bg-primary/20 focus:text-white data-[highlighted]:bg-primary/20 data-[highlighted]:text-white"
                >
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <label>
          <span className="sr-only">Tipo o presentación</span>
          <Select value={presentationType} onValueChange={onPresentationTypeChange}>
            <SelectTrigger className="h-11 rounded-xl border-white/10 bg-black/35 px-3 pr-4 text-white focus:ring-1 focus:ring-primary [&>svg]:ml-3 [&>svg]:text-primary">
              <SelectValue placeholder="Todas las presentaciones" />
            </SelectTrigger>
            <SelectContent className="z-[80] border-white/10 bg-[#15110d] text-white shadow-2xl shadow-black/50">
              <SelectItem
                value="all"
                className="text-white focus:bg-primary/20 focus:text-white data-[highlighted]:bg-primary/20 data-[highlighted]:text-white"
              >
                Todas las presentaciones
              </SelectItem>
              {presentationOptions.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className="text-white focus:bg-primary/20 focus:text-white data-[highlighted]:bg-primary/20 data-[highlighted]:text-white"
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <label>
          <span className="sr-only">Rango de precio</span>
          <Select
            value={priceRange}
            onValueChange={(value) => onPriceRangeChange(value as StorePriceRange)}
          >
            <SelectTrigger className="h-11 rounded-xl border-white/10 bg-black/35 px-3 pr-4 text-white focus:ring-1 focus:ring-primary [&>svg]:ml-3 [&>svg]:text-primary">
              <SelectValue placeholder="Todos los precios" />
            </SelectTrigger>
            <SelectContent className="z-[80] border-white/10 bg-[#15110d] text-white shadow-2xl shadow-black/50">
              {priceRangeOptions.map((value) => (
                <SelectItem
                  key={value}
                  value={value}
                  className="text-white focus:bg-primary/20 focus:text-white data-[highlighted]:bg-primary/20 data-[highlighted]:text-white"
                >
                  {STORE_PRICE_RANGE_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <label>
          <span className="sr-only">Ordenar por</span>
          <Select
            value={sortBy}
            onValueChange={(value) => onSortByChange(value as StoreSortOption)}
          >
            <SelectTrigger className="h-11 rounded-xl border-white/10 bg-black/35 px-3 pr-4 text-white focus:ring-1 focus:ring-primary [&>svg]:ml-3 [&>svg]:text-primary">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent className="z-[80] border-white/10 bg-[#15110d] text-white shadow-2xl shadow-black/50">
              {sortOptions.map((value) => (
                <SelectItem
                  key={value}
                  value={value}
                  className="text-white focus:bg-primary/20 focus:text-white data-[highlighted]:bg-primary/20 data-[highlighted]:text-white"
                >
                  {STORE_SORT_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {mainCategories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => onMainCategoryChange(category)}
            className={cn(
              "rounded-full border px-3 py-2 text-xs font-bold transition-colors",
              mainCategory === category
                ? "border-primary bg-primary text-black"
                : "border-white/10 bg-white/5 text-white/65 hover:border-primary/60",
            )}
          >
            {STORE_MAIN_CATEGORY_LABELS[category]}
          </button>
        ))}
        <button
          type="button"
          onClick={onToggleOnlyPromotions}
          className={cn(
            "flex items-center gap-1 rounded-full border px-3 py-2 text-xs font-bold transition-colors",
            onlyPromotions
              ? "border-primary bg-primary text-black"
              : "border-white/10 bg-white/5 text-white/65 hover:border-primary/60",
          )}
        >
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          Solo promociones
        </button>
        <button
          type="button"
          onClick={onToggleOnlyVolumeSavings}
          className={cn(
            "flex items-center gap-1 rounded-full border px-3 py-2 text-xs font-bold transition-colors",
            onlyVolumeSavings
              ? "border-primary bg-primary text-black"
              : "border-white/10 bg-white/5 text-white/65 hover:border-primary/60",
          )}
        >
          <ArrowDownAZ className="h-3.5 w-3.5" aria-hidden="true" />
          Con ahorro
        </button>
        <button
          type="button"
          onClick={onClearFilters}
          className="ml-auto flex items-center gap-1 rounded-full border border-white/10 px-3 py-2 text-xs font-bold text-white/55 hover:bg-white/10"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
          Limpiar filtros{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
        </button>
      </div>
      <p className="mt-3 flex items-center gap-2 text-sm text-white/50" role="status">
        <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
        {getStoreResultLabel(resultCount)}
      </p>
    </section>
  );
}
