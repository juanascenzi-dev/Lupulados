import { Beer } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductImageFallbackProps {
  className?: string;
}

export function ProductImageFallback({ className = "w-full h-full" }: ProductImageFallbackProps) {
  return (
    <div className={cn(className, "bg-primary/15 flex items-center justify-center")}>
      <Beer className="w-7 h-7 text-primary" aria-hidden="true" />
    </div>
  );
}
