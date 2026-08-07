import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { PendingPackConfirmation } from "@/domain/configurableBeerPack";

export function PackConfirmationDialog({
  pendingConfirmation,
  onOpenChange,
  onConfirm,
}: {
  pendingConfirmation: PendingPackConfirmation;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={pendingConfirmation !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent className="border-white/10 bg-[#15110d] text-white">
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar cambio</AlertDialogTitle>
          <AlertDialogDescription className="text-white/60">
            {pendingConfirmation?.type === "reduce"
              ? "Vas a descartar packs con selecciones cargadas."
              : "Vas a reemplazar composiciones ya configuradas."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-white/10 bg-white/5 text-white hover:bg-white/10">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-primary text-black hover:bg-amber-300"
          >
            Confirmar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
