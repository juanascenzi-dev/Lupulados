import type { InputHTMLAttributes } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function Field({
  name,
  label,
  className,
  required = true,
  ...props
}: { name: string; label: string; className?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={className}>
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        required={required}
        aria-required={required}
        className="bg-black/40 border-white/10 text-white disabled:opacity-70"
        {...props}
      />
    </div>
  );
}
