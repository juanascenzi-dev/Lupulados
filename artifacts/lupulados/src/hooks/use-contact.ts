import { useMutation } from "@tanstack/react-query";
import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().min(2, "El nombre es muy corto"),
  email: z.string().email("Email inválido"),
  message: z.string().min(10, "El mensaje debe tener al menos 10 caracteres"),
});

export type ContactInput = z.infer<typeof contactSchema>;

// Simulates a backend endpoint for the contact form
export function useSubmitContact() {
  return useMutation({
    mutationFn: async (data: ContactInput) => {
      // Simulate network latency
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log("Form submitted:", data);
      return { success: true };
    }
  });
}
