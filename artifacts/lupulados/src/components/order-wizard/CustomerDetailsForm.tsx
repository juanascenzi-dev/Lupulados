import { User } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface OrderFormData {
  nombre: string;
  fecha: string;
  horario: string;
  direccion: string;
  comentarios: string;
}

interface CustomerDetailsFormProps {
  step: number;
  canProceed: boolean;
  formData: OrderFormData;
  onChange: (formData: OrderFormData) => void;
  today: string;
  deliveryRequiresAddress: boolean;
}

export function CustomerDetailsForm({
  step,
  canProceed,
  formData,
  onChange,
  today,
  deliveryRequiresAddress,
}: CustomerDetailsFormProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-white flex items-center gap-2">
        <User className="w-5 h-5 text-primary" /> Tus datos
      </h3>
      <div>
        <label
          htmlFor="order-name"
          className="text-xs font-bold text-white/70 uppercase tracking-widest mb-1.5 block"
        >
          Nombre Completo *
        </label>
        <input
          id="order-name"
          type="text"
          value={formData.nombre}
          onChange={(e) => onChange({ ...formData, nombre: e.target.value })}
          placeholder="Ej: Juan Pérez"
          required
          autoComplete="name"
          aria-invalid={step === 4 && !formData.nombre.trim()}
          aria-describedby={step === 4 && !canProceed ? `order-step-${step}-error` : undefined}
          className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-white/20"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="order-date"
            className="text-xs font-bold text-white/70 uppercase tracking-widest mb-1.5 block"
          >
            Fecha *
          </label>
          <input
            id="order-date"
            type="date"
            min={today}
            value={formData.fecha}
            onChange={(e) =>
              onChange({
                ...formData,
                fecha: e.target.value,
              })
            }
            required
            aria-invalid={step === 4 && (!formData.fecha || formData.fecha < today)}
            aria-describedby={step === 4 && !canProceed ? `order-step-${step}-error` : undefined}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary [color-scheme:dark]"
          />
        </div>
        <div>
          <label
            htmlFor="order-time-slot"
            className="text-xs font-bold text-white/70 uppercase tracking-widest mb-1.5 block"
          >
            Horario
          </label>
          <Select
            value={formData.horario}
            onValueChange={(value) =>
              onChange({
                ...formData,
                horario: value,
              })
            }
          >
            <SelectTrigger
              id="order-time-slot"
              className="h-11 rounded-xl border-white/10 bg-white/5 px-4 pr-4 text-white focus:ring-1 focus:ring-primary [&>svg]:ml-3 [&>svg]:text-primary"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-[80] border-white/10 bg-[#15110d] text-white shadow-2xl shadow-black/50">
              <SelectItem
                value="Mañana 9-12hs"
                className="text-white focus:bg-primary/20 focus:text-white data-[highlighted]:bg-primary/20 data-[highlighted]:text-white"
              >
                Mañana (9-12hs)
              </SelectItem>
              <SelectItem
                value="Tarde 12-16hs"
                className="text-white focus:bg-primary/20 focus:text-white data-[highlighted]:bg-primary/20 data-[highlighted]:text-white"
              >
                Tarde (12-16hs)
              </SelectItem>
              <SelectItem
                value="Noche 16-20hs"
                className="text-white focus:bg-primary/20 focus:text-white data-[highlighted]:bg-primary/20 data-[highlighted]:text-white"
              >
                Noche (16-20hs)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {deliveryRequiresAddress && (
        <div>
          <label
            htmlFor="order-address"
            className="text-xs font-bold text-white/70 uppercase tracking-widest mb-1.5 block"
          >
            Dirección *
          </label>
          <input
            id="order-address"
            type="text"
            value={formData.direccion}
            onChange={(e) =>
              onChange({
                ...formData,
                direccion: e.target.value,
              })
            }
            placeholder="Ej: Av. Corrientes 1234, CABA"
            required
            autoComplete="street-address"
            aria-invalid={step === 4 && deliveryRequiresAddress && !formData.direccion.trim()}
            aria-describedby={step === 4 && !canProceed ? `order-step-${step}-error` : undefined}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-white/20"
          />
        </div>
      )}
      <div>
        <label
          htmlFor="order-comments"
          className="text-xs font-bold text-white/70 uppercase tracking-widest mb-1.5 block"
        >
          Comentarios
        </label>
        <textarea
          id="order-comments"
          value={formData.comentarios}
          onChange={(e) =>
            onChange({
              ...formData,
              comentarios: e.target.value,
            })
          }
          placeholder="Detalles de entrega, preferencias, etc."
          autoComplete="off"
          className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary h-20 resize-none placeholder:text-white/20"
        />
      </div>
    </div>
  );
}
