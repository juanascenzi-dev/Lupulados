import { describe, expect, it } from "vitest";
import { contactSchema } from "./contact";

describe("contactSchema", () => {
  it("accepts a fully valid input", () => {
    const result = contactSchema.safeParse({
      name: "Julian",
      email: "julian@example.com",
      message: "Quisiera cotizar un evento para 100 personas.",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a name shorter than the minimum", () => {
    const result = contactSchema.safeParse({
      name: "J",
      email: "julian@example.com",
      message: "Quisiera cotizar un evento para 100 personas.",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("El nombre es muy corto");
    }
  });

  it("accepts a name at exactly the minimum length", () => {
    const result = contactSchema.safeParse({
      name: "Ju",
      email: "julian@example.com",
      message: "Quisiera cotizar un evento para 100 personas.",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid email format", () => {
    const result = contactSchema.safeParse({
      name: "Julian",
      email: "no-es-un-email",
      message: "Quisiera cotizar un evento para 100 personas.",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Email inválido");
    }
  });

  it("rejects a message just below the minimum length", () => {
    const result = contactSchema.safeParse({
      name: "Julian",
      email: "julian@example.com",
      message: "123456789",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("El mensaje debe tener al menos 10 caracteres");
    }
  });

  it("accepts a message at exactly the minimum length", () => {
    const result = contactSchema.safeParse({
      name: "Julian",
      email: "julian@example.com",
      message: "1234567890",
    });
    expect(result.success).toBe(true);
  });

  it("accumulates errors for every invalid field at once", () => {
    const result = contactSchema.safeParse({
      name: "J",
      email: "no-es-un-email",
      message: "corto",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.length).toBe(3);
    }
  });
});
