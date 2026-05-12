import { z } from "zod";

export const createInquirySchema = z.object({
  propertyId: z.string().uuid("Invalid property ID"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export const updateInquiryStatusSchema = z.object({
  status: z.enum(["PENDING", "VIEWED", "REPLIED", "ARCHIVED"]),
});

export type CreateInquiryInput = z.infer<typeof createInquirySchema>;
export type UpdateInquiryStatusInput = z.infer<typeof updateInquiryStatusSchema>;
