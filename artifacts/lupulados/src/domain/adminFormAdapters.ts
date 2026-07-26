import { z } from "zod";
import type {
  CreateDeliveryOptionInput,
  CreateExtraOptionInput,
  CreatePresentationInput,
  CreateProductInput,
  CreatePromotionInput,
  CreateWhatsAppChannelInput,
  UpdateDeliveryOptionInput,
  UpdateExtraOptionInput,
  UpdatePresentationInput,
  UpdateProductInput,
  UpdatePromotionInput,
  UpdateWhatsAppChannelInput,
} from "./adminContracts";
import type { DeliveryOption, ExtraOption, Product, ProductPresentation, Promotion, WhatsAppChannel } from "./commercialTypes";

const requiredText = (label: string) => z.string().trim().min(1, `${label} es obligatorio.`);
const optionalText = z.string().trim().transform((value) => value || null);
const requiredUrl = z.string().trim().min(1, "La URL de imagen es obligatoria.").url("Ingresá una URL válida.");
const nonNegativeNumber = (label: string) => z.preprocess(parseRequiredNumber, z.number({ message: `${label} debe ser un número.` }).finite().nonnegative(`${label} no puede ser negativo.`));
const positiveNumber = (label: string) => z.preprocess(parseRequiredNumber, z.number({ message: `${label} debe ser un número.` }).finite().positive(`${label} debe ser mayor a 0.`));
const optionalPositiveNumber = (label: string) => z.preprocess(parseOptionalNumber, z.number({ message: `${label} debe ser un número.` }).finite().positive(`${label} debe ser mayor a 0.`).nullable());
const optionalNonNegativeNumber = (label: string) => z.preprocess(parseOptionalNumber, z.number({ message: `${label} debe ser un número.` }).finite().nonnegative(`${label} no puede ser negativo.`).nullable());
const sortOrder = z.preprocess(parseRequiredNumber, z.number({ message: "El orden debe ser un número." }).int("El orden debe ser un entero.").nonnegative("El orden no puede ser negativo."));
const dateOrNull = z.string().trim().transform((value) => value || null).pipe(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Usá una fecha válida.").nullable());

export const adminProductFormSchema = z.object({
  id: requiredText("El ID"),
  slug: requiredText("El slug"),
  name: requiredText("El nombre"),
  description: requiredText("La descripción"),
  style: requiredText("El estilo"),
  category: z.enum(["beer", "pack"], { message: "Elegí una categoría válida." }),
  image: requiredUrl,
  sortOrder,
  abv: optionalPositiveNumber("ABV"),
  ibu: optionalNonNegativeNumber("IBU"),
  badge: optionalText,
});

export const adminPresentationFormSchema = z.object({
  id: requiredText("El ID"),
  productId: requiredText("El producto"),
  presentationType: z.enum(["barril20L", "barril30L", "barril50L", "growler1L", "growler2L", "porron500ml"], { message: "Elegí un tipo válido." }),
  label: requiredText("La etiqueta"),
  volumeLiters: positiveNumber("El volumen"),
  unitPrice: nonNegativeNumber("El precio"),
  category: z.enum(["barril", "growler", "porrón", "pack"], { message: "Elegí una categoría válida." }),
  description: optionalText,
  sortOrder,
});

export const adminDeliveryFormSchema = z.object({
  id: requiredText("El ID"),
  label: requiredText("La etiqueta"),
  description: requiredText("La descripción"),
  price: nonNegativeNumber("El precio"),
  requiresAddress: z.preprocess(parseBoolean, z.boolean()),
  sortOrder,
});

export const adminExtraFormSchema = z.object({
  id: requiredText("El ID"),
  label: requiredText("La etiqueta"),
  price: nonNegativeNumber("El precio"),
  unit: requiredText("La unidad"),
  sortOrder,
});

const promotionBaseSchema = z.object({
  id: requiredText("El ID"),
  code: requiredText("El código").transform((value) => value.toUpperCase()),
  type: z.enum(["percentage", "fixed"], { message: "Elegí un tipo válido." }),
  value: nonNegativeNumber("El valor"),
  startDate: dateOrNull,
  endDate: dateOrNull,
});

export const adminPromotionFormSchema = promotionBaseSchema.superRefine((promotion, ctx) => {
  if (promotion.type === "percentage" && promotion.value > 1) {
    ctx.addIssue({ code: "custom", path: ["value"], message: "El porcentaje debe estar entre 0 y 1." });
  }
  if (promotion.startDate && promotion.endDate && promotion.startDate > promotion.endDate) {
    ctx.addIssue({ code: "custom", path: ["startDate"], message: "La fecha inicial no puede ser posterior a la final." });
  }
});

const adminPromotionUpdateFormSchema = promotionBaseSchema.omit({ id: true }).superRefine((promotion, ctx) => {
  if (promotion.type === "percentage" && promotion.value > 1) {
    ctx.addIssue({ code: "custom", path: ["value"], message: "El porcentaje debe estar entre 0 y 1." });
  }
  if (promotion.startDate && promotion.endDate && promotion.startDate > promotion.endDate) {
    ctx.addIssue({ code: "custom", path: ["startDate"], message: "La fecha inicial no puede ser posterior a la final." });
  }
});

export const adminWhatsAppFormSchema = z.object({
  id: requiredText("El ID"),
  label: requiredText("La etiqueta"),
  phoneDisplay: requiredText("El teléfono visible"),
  phoneE164: z.string().trim().regex(/^54911\d{8}$/, "Usá formato E.164: 54911XXXXXXXX."),
  purpose: z.enum(["orders", "contact", "orders_and_contact"], { message: "Elegí un propósito válido." }),
  sortOrder,
});

export type ProductFormValues = z.infer<typeof adminProductFormSchema>;
export type PresentationFormValues = z.infer<typeof adminPresentationFormSchema>;
export type DeliveryFormValues = z.infer<typeof adminDeliveryFormSchema>;
export type ExtraFormValues = z.infer<typeof adminExtraFormSchema>;
export type PromotionFormValues = z.infer<typeof adminPromotionFormSchema>;
export type WhatsAppFormValues = z.infer<typeof adminWhatsAppFormSchema>;

export function parseProductForm(input: FormData | Record<string, unknown>) {
  const values = adminProductFormSchema.parse(toObject(input));
  return {
    ...values,
    abv: values.abv ?? undefined,
    ibu: values.ibu ?? undefined,
    badge: values.badge ?? undefined,
  } satisfies CreateProductInput;
}

export function parseProductUpdateForm(input: FormData | Record<string, unknown>) {
  const values = adminProductFormSchema.omit({ id: true }).parse(toObject(input));
  return values satisfies UpdateProductInput;
}

export function productToFormValues(product: Product): ProductFormValues {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description,
    style: product.style,
    category: product.category,
    image: product.image,
    sortOrder: product.sortOrder,
    abv: product.abv ?? null,
    ibu: product.ibu ?? null,
    badge: product.badge ?? null,
  };
}

export function parsePresentationForm(input: FormData | Record<string, unknown>, products: Product[]) {
  const values = adminPresentationFormSchema.parse(toObject(input));
  assertProductExists(values.productId, products);
  return {
    ...values,
    description: values.description ?? undefined,
  } satisfies CreatePresentationInput;
}

export function parsePresentationUpdateForm(input: FormData | Record<string, unknown>, products: Product[]) {
  const values = adminPresentationFormSchema.omit({ id: true }).parse(toObject(input));
  assertProductExists(values.productId, products);
  return values satisfies UpdatePresentationInput;
}

export function presentationToFormValues(presentation: ProductPresentation): PresentationFormValues {
  return {
    id: presentation.id,
    productId: presentation.productId,
    presentationType: presentation.presentationType,
    label: presentation.label,
    volumeLiters: presentation.volumeLiters,
    unitPrice: presentation.unitPrice,
    category: presentation.category,
    description: presentation.description ?? null,
    sortOrder: presentation.sortOrder,
  };
}

export function parseDeliveryForm(input: FormData | Record<string, unknown>) {
  return adminDeliveryFormSchema.parse(toObject(input)) satisfies CreateDeliveryOptionInput;
}

export function parseDeliveryUpdateForm(input: FormData | Record<string, unknown>) {
  return adminDeliveryFormSchema.omit({ id: true }).parse(toObject(input)) satisfies UpdateDeliveryOptionInput;
}

export function deliveryToFormValues(option: DeliveryOption): DeliveryFormValues {
  return {
    id: option.id,
    label: option.label,
    description: option.description,
    price: option.price,
    requiresAddress: option.requiresAddress,
    sortOrder: option.sortOrder,
  };
}

export function parseExtraForm(input: FormData | Record<string, unknown>) {
  return adminExtraFormSchema.parse(toObject(input)) satisfies CreateExtraOptionInput;
}

export function parseExtraUpdateForm(input: FormData | Record<string, unknown>) {
  return adminExtraFormSchema.omit({ id: true }).parse(toObject(input)) satisfies UpdateExtraOptionInput;
}

export function extraToFormValues(option: ExtraOption): ExtraFormValues {
  return {
    id: option.id,
    label: option.label,
    price: option.price,
    unit: option.unit,
    sortOrder: option.sortOrder,
  };
}

export function parsePromotionForm(input: FormData | Record<string, unknown>) {
  return adminPromotionFormSchema.parse(toObject(input)) satisfies CreatePromotionInput;
}

export function parsePromotionUpdateForm(input: FormData | Record<string, unknown>) {
  return adminPromotionUpdateFormSchema.parse(toObject(input)) satisfies UpdatePromotionInput;
}

export function promotionToFormValues(promotion: Promotion): PromotionFormValues {
  return {
    id: promotion.id,
    code: promotion.code,
    type: promotion.type,
    value: promotion.value,
    startDate: promotion.startDate ?? null,
    endDate: promotion.endDate ?? null,
  };
}

export function parseWhatsAppForm(input: FormData | Record<string, unknown>) {
  const values = adminWhatsAppFormSchema.parse(toObject(input));
  return { ...values, isPrimary: false } satisfies CreateWhatsAppChannelInput;
}

export function parseWhatsAppUpdateForm(input: FormData | Record<string, unknown>) {
  return adminWhatsAppFormSchema.omit({ id: true }).parse(toObject(input)) satisfies UpdateWhatsAppChannelInput;
}

export function whatsAppToFormValues(channel: WhatsAppChannel): WhatsAppFormValues {
  return {
    id: channel.id,
    label: channel.label,
    phoneDisplay: channel.phoneDisplay,
    phoneE164: channel.phoneE164,
    purpose: channel.purpose,
    sortOrder: channel.sortOrder,
  };
}

export function getFirstZodError(error: unknown, fallback: string) {
  if (error instanceof z.ZodError) return error.issues[0]?.message ?? fallback;
  return error instanceof Error ? error.message : fallback;
}

function parseRequiredNumber(value: unknown) {
  if (typeof value === "string" && value.trim() === "") return Number.NaN;
  return Number(value);
}

function parseOptionalNumber(value: unknown) {
  if (typeof value === "string" && value.trim() === "") return null;
  if (value === null || value === undefined) return null;
  return Number(value);
}

function parseBoolean(value: unknown) {
  return value === true || value === "true" || value === "on";
}

function toObject(input: FormData | Record<string, unknown>) {
  return input instanceof FormData ? Object.fromEntries(input) : input;
}

function assertProductExists(productId: string, products: Product[]) {
  if (!products.some((product) => product.id === productId)) {
    throw new Error("El producto relacionado no existe.");
  }
}
