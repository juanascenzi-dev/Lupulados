import { z } from "zod";

const idSchema = z.string().trim().min(1);
const nonNegativePriceSchema = z.number().finite().nonnegative();
const positiveVolumeSchema = z.number().finite().positive();
const sortOrderSchema = z.number().int().nonnegative();
const phoneE164Schema = z.string().regex(/^54911\d{8}$/, "WhatsApp phone must use 54911XXXXXXXX format");
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const nullableDateSchema = dateSchema.nullable().optional();

export const businessProfileSchema = z.object({
  id: idSchema,
  businessName: z.string().trim().min(1),
  address: z.string().trim().min(1),
  openingHours: z.string().trim().min(1),
  email: z.string().email().nullable(),
  pricingStatus: z.enum(["estimated", "confirmed"]),
  priceDisclaimer: z.string().trim().min(1),
  active: z.boolean(),
});

export const whatsAppChannelSchema = z.object({
  id: idSchema,
  label: z.string().trim().min(1),
  phoneDisplay: z.string().trim().min(1),
  phoneE164: phoneE164Schema,
  purpose: z.enum(["orders", "contact", "orders_and_contact"]),
  isPrimary: z.boolean(),
  active: z.boolean(),
  sortOrder: sortOrderSchema,
});

export const productSchema = z.object({
  id: idSchema,
  slug: z.string().trim().min(1),
  name: z.string().trim().min(1),
  description: z.string().trim().min(1),
  style: z.string().trim().min(1),
  category: z.enum(["beer", "pack"]),
  abv: z.number().finite().positive().optional(),
  ibu: z.number().finite().nonnegative().optional(),
  badge: z.string().trim().min(1).optional(),
  image: z.string().url(),
  status: z.enum(["active", "archived"]),
  sortOrder: sortOrderSchema,
});

export const productPresentationSchema = z.object({
  id: idSchema,
  productId: idSchema,
  presentationType: z.enum(["barril20L", "barril30L", "barril50L", "growler1L", "growler2L", "porron500ml"]),
  label: z.string().trim().min(1),
  volumeLiters: positiveVolumeSchema,
  unitPrice: nonNegativePriceSchema,
  category: z.enum(["barril", "growler", "porrón", "pack"]),
  description: z.string().trim().min(1).optional(),
  active: z.boolean(),
  sortOrder: sortOrderSchema,
});

export const deliveryOptionSchema = z.object({
  id: idSchema,
  label: z.string().trim().min(1),
  description: z.string().trim().min(1),
  price: nonNegativePriceSchema,
  requiresAddress: z.boolean(),
  active: z.boolean(),
  sortOrder: sortOrderSchema,
});

export const extraOptionSchema = z.object({
  id: idSchema,
  label: z.string().trim().min(1),
  price: nonNegativePriceSchema,
  unit: z.string().trim().min(1),
  active: z.boolean(),
  sortOrder: sortOrderSchema,
});

export const promotionSchema = z.object({
  id: idSchema,
  code: z.string().trim().min(1),
  type: z.enum(["percentage", "fixed"]),
  value: nonNegativePriceSchema,
  active: z.boolean(),
  startDate: nullableDateSchema,
  endDate: nullableDateSchema,
}).superRefine((promotion, ctx) => {
  if (promotion.type === "percentage" && promotion.value > 1) {
    ctx.addIssue({ code: "custom", message: "Percentage promotions must use a value between 0 and 1", path: ["value"] });
  }
  if (promotion.startDate && promotion.endDate && promotion.startDate > promotion.endDate) {
    ctx.addIssue({ code: "custom", message: "Promotion startDate must be before endDate", path: ["startDate"] });
  }
});

export const commercialSnapshotSchema = z.object({
  businessProfile: businessProfileSchema,
  whatsappChannels: z.array(whatsAppChannelSchema).min(1),
  products: z.array(productSchema).min(1),
  productPresentations: z.array(productPresentationSchema).min(1),
  deliveryOptions: z.array(deliveryOptionSchema).min(1),
  extraOptions: z.array(extraOptionSchema).min(1),
  promotions: z.array(promotionSchema),
  pricingRules: z.object({
    freeGlassesThreshold: nonNegativePriceSchema,
  }),
}).superRefine((snapshot, ctx) => {
  addUniqueIssues(snapshot.products.map((product) => product.id), "products", "Product ids must be unique", ctx);
  addUniqueIssues(snapshot.products.map((product) => product.slug), "products", "Product slugs must be unique", ctx);
  addUniqueIssues(
    snapshot.productPresentations.map((presentation) => presentation.id),
    "productPresentations",
    "Presentation ids must be unique",
    ctx,
  );
  addUniqueIssues(snapshot.deliveryOptions.map((option) => option.id), "deliveryOptions", "Delivery option ids must be unique", ctx);
  addUniqueIssues(snapshot.extraOptions.map((option) => option.id), "extraOptions", "Extra option ids must be unique", ctx);
  addUniqueIssues(snapshot.promotions.map((promotion) => promotion.id), "promotions", "Promotion ids must be unique", ctx);

  const productIds = new Set(snapshot.products.map((product) => product.id));
  snapshot.productPresentations.forEach((presentation, index) => {
    if (!productIds.has(presentation.productId)) {
      ctx.addIssue({
        code: "custom",
        message: `Presentation ${presentation.id} references unknown product ${presentation.productId}`,
        path: ["productPresentations", index, "productId"],
      });
    }
  });

  const activePrimaryChannels = snapshot.whatsappChannels.filter((channel) => channel.active && channel.isPrimary);
  if (activePrimaryChannels.length > 1) {
    ctx.addIssue({
      code: "custom",
      message: "At most one active WhatsApp channel can be primary",
      path: ["whatsappChannels"],
    });
  }
});

function addUniqueIssues(
  values: string[],
  path: string,
  message: string,
  ctx: z.RefinementCtx,
) {
  if (new Set(values).size !== values.length) {
    ctx.addIssue({ code: "custom", message, path: [path] });
  }
}

export function validateCommercialSnapshot(input: unknown) {
  return commercialSnapshotSchema.parse(input);
}
