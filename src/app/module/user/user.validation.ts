import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  avatar: z.string().url().optional(),
});

export const updateSearchPreferenceSchema = z.object({
  keywords: z.array(z.string()).optional(),
  avgPrice: z.number().positive().optional(),
  targetAreas: z.array(z.string()).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateSearchPreferenceInput = z.infer<
  typeof updateSearchPreferenceSchema
>;
