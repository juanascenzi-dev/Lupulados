import type { KeyboardEvent as ReactKeyboardEvent, MouseEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Step } from "@/domain/orderWizardConstants";

interface WizardActionBarProps {
  step: Step;
  canProceed: boolean;
  validationMessage: string | null;
  primaryActionLabel: string;
  whatsAppOrderUrl: string | null;
  whatsAppOrderError: string | null;
  whatsAppOpening: boolean;
  onPrev: () => void;
  onNext: () => void;
  onGoToTicketPrev: () => void;
  onWhatsAppClick: (event: MouseEvent<HTMLAnchorElement>) => void;
  onWhatsAppKeyDown: (event: ReactKeyboardEvent<HTMLAnchorElement>) => void;
}

export function WizardActionBar({
  step,
  canProceed,
  validationMessage,
  primaryActionLabel,
  whatsAppOrderUrl,
  whatsAppOrderError,
  whatsAppOpening,
  onPrev,
  onNext,
  onGoToTicketPrev,
  onWhatsAppClick,
  onWhatsAppKeyDown,
}: WizardActionBarProps) {
  return (
    <div className="sticky bottom-[var(--wizard-action-bottom-inset)] z-20 shrink-0 border-t border-white/10 bg-background/95 pt-3 pb-[var(--wizard-action-bottom-inset)] backdrop-blur-md">
      <div className="flex items-center gap-3">
        {step > 1 && (
          <button
            type="button"
            onClick={step === 5 ? onGoToTicketPrev : onPrev}
            className="flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 font-bold text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:px-4"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" /> Anterior
          </button>
        )}
        {step < 5 ? (
          <button
            type="button"
            onClick={onNext}
            disabled={!canProceed}
            title={!canProceed ? (validationMessage ?? undefined) : undefined}
            aria-describedby={!canProceed ? `order-step-${step}-error` : undefined}
            className={cn(
              "flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-base font-bold transition-all",
              canProceed
                ? "bg-gradient-to-r from-primary to-amber-400 text-black shadow-[0_0_20px_rgba(251,191,36,0.22)] hover:-translate-y-0.5 hover:shadow-[0_0_28px_rgba(251,191,36,0.34)]"
                : "cursor-not-allowed bg-white/10 text-white/30",
            )}
          >
            {primaryActionLabel} <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>
        ) : (
          <a
            href={whatsAppOrderUrl ?? undefined}
            target="_blank"
            rel="noopener noreferrer"
            aria-disabled={!whatsAppOrderUrl || whatsAppOpening}
            onClick={onWhatsAppClick}
            onKeyDown={onWhatsAppKeyDown}
            className={cn(
              "flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 py-2.5 text-center text-base font-bold text-white transition-colors hover:bg-[#1db954] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              !whatsAppOrderUrl || whatsAppOpening ? "pointer-events-none opacity-70" : "",
            )}
          >
            {whatsAppOpening ? "Abriendo WhatsApp..." : "Confirmar por WhatsApp"}
          </a>
        )}
      </div>
      {!canProceed && step < 5 && (
        <p id={`order-step-${step}-error`} className="mt-2 text-xs text-white/70" role="alert">
          {validationMessage}
        </p>
      )}
      {step === 5 && whatsAppOrderError && (
        <p className="mt-2 text-xs text-white/70" role="alert">
          {whatsAppOrderError}
        </p>
      )}
    </div>
  );
}
