import { cn } from "@/lib/utils";
import { listVisibleCatalogCategories, shouldShowCategorySelector } from "@/domain/productCatalog";
import type { ProductCategory } from "@/domain/commercialTypes";

interface CategorySelectorProps {
  categories: ReturnType<typeof listVisibleCatalogCategories>;
  selectedCategory: ProductCategory;
  onSelect: (category: ProductCategory) => void;
}

export function CategorySelector({
  categories,
  selectedCategory,
  onSelect,
}: CategorySelectorProps) {
  if (!shouldShowCategorySelector(categories)) return null;

  const selectedIndex = Math.max(
    0,
    categories.findIndex((category) => category.id === selectedCategory),
  );

  const focusTab = (index: number) => {
    const tab = document.getElementById(`order-category-${categories[index]?.id}`);
    tab?.focus();
  };

  return (
    <div className="mb-6" role="tablist" aria-label="Categorias de productos">
      <div className="flex flex-wrap gap-2 justify-center">
        {categories.map((category) => {
          const selected = category.id === selectedCategory;
          return (
            <button
              key={category.id}
              id={`order-category-${category.id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => onSelect(category.id)}
              onKeyDown={(event) => {
                if (
                  event.key !== "ArrowRight" &&
                  event.key !== "ArrowLeft" &&
                  event.key !== "Home" &&
                  event.key !== "End"
                )
                  return;
                event.preventDefault();
                const nextIndex =
                  event.key === "Home"
                    ? 0
                    : event.key === "End"
                      ? categories.length - 1
                      : event.key === "ArrowRight"
                        ? (selectedIndex + 1) % categories.length
                        : (selectedIndex - 1 + categories.length) % categories.length;
                onSelect(categories[nextIndex].id);
                window.requestAnimationFrame(() => focusTab(nextIndex));
              }}
              className={cn(
                "min-h-11 rounded-xl px-4 py-2 text-sm font-bold border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                selected
                  ? "bg-primary text-black border-primary"
                  : "bg-white/5 text-white/75 border-white/10 hover:border-primary/60 hover:text-white",
              )}
            >
              {category.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
