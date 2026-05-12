import { z } from "zod";

export const createReviewSchema = z.object({
  propertyId: z.string().uuid("Invalid property ID"),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});

export const updateReviewSchema = createReviewSchema.partial();

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
