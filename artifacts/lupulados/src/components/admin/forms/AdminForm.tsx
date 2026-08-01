import type { ReactNode } from "react";
import { Plus, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AdminForm({
  title,
  error,
  disabled,
  submitLabel,
  children,
  onCancel,
  onSubmit,
}: {
  title: string;
  error: string;
  disabled: boolean;
  submitLabel: string;
  children: ReactNode;
  onCancel?: () => void;
  onSubmit: React.FormEventHandler<HTMLFormElement>;
}) {
  const errorId = error ? `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-error` : undefined;
  return (
    <form
      className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-card border border-white/10 rounded-lg p-4"
      onSubmit={onSubmit}
      aria-describedby={errorId}
    >
      <h2 className="md:col-span-4 text-lg font-semibold">{title}</h2>
      {children}
      {error && (
        <p id={errorId} className="md:col-span-4 text-sm text-red-300" role="alert">
          {error}
        </p>
      )}
      <div className="md:col-span-4 flex flex-wrap gap-2">
        <Button disabled={disabled} className="bg-primary text-black hover:bg-amber-500">
          {submitLabel === "Guardar cambios" ? (
            <Save className="w-4 h-4 mr-2" />
          ) : (
            <Plus className="w-4 h-4 mr-2" />
          )}
          {submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" disabled={disabled} onClick={onCancel}>
            <X className="w-4 h-4 mr-2" /> Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}
