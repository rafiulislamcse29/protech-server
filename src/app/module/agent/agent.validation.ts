import { z } from "zod";

export const createAgentProfileSchema = z.object({
  licenseNumber: z.string().min(3, "License number is required"),
  specialties: z.array(z.string()).min(1, "At least one specialty is required"),
  bio: z.string().optional(),
  phone: z.string().optional(),
  experienceYears: z.number().int().min(0).optional(),
  name: z.string().optional(),
  email: z.email().optional(),
});

export const updateAgentProfileSchema = createAgentProfileSchema.partial();

export type CreateAgentProfileInput = z.infer<typeof createAgentProfileSchema>;
export type UpdateAgentProfileInput = z.infer<typeof updateAgentProfileSchema>;
