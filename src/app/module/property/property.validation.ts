import { z } from "zod";

export const createPropertySchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  shortDescription: z.string().max(300).optional(),
  price: z.number().min(0, "Price must be at least 0"),
  address: z.string().min(5),
  city: z.string().min(2),
  state: z.string().min(2),
  zip: z.string().min(3),
  lat: z.number().optional(),
  lng: z.number().optional(),
  beds: z.number().int().min(0),
  baths: z.number().min(0),
  sqft: z.number().int().min(1),
  lotSize: z.number().optional(),
  yearBuilt: z
    .number()
    .int()
    .min(1800)
    .max(new Date().getFullYear())
    .optional(),
  type: z.enum(["HOUSE", "APARTMENT", "CONDO", "TOWNHOUSE", "LAND", "COMMERCIAL"]),
  status: z
    .enum(["AVAILABLE", "PENDING", "SOLD", "RENTED"])
    .default("AVAILABLE"),
  tags: z.array(z.string()).default([]),
  highlights: z.array(z.string()).default([]),
  aiFeatures: z.record(z.string(), z.unknown()).default({}),
  aiImageUrl: z.string().optional(),
});

export const updatePropertySchema = createPropertySchema.partial();

export const addMediaSchema = z.object({
  url: z.url().optional(),
  type: z.enum(["IMAGE", "VIDEO", "VIRTUAL_TOUR", "LINK", "YOUTUBE", "MAP"]),
  order: z.number().int().min(1),
  altText: z.string().optional(),
});

export const createInquirySchema = z.object({
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;
export type AddMediaInput = z.infer<typeof addMediaSchema>;
export type CreateInquiryInput = z.infer<typeof createInquirySchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
