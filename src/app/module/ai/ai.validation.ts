import { z } from "zod";

// ─── Feature 1: Natural Language Search ──────────────────────────────────────
export const naturalLanguageSearchSchema = z.object({
  query: z
    .string()
    .min(5, "Search query must be at least 5 characters")
    .max(500),
  limit: z.number().int().min(1).max(50).default(10),
});

// ─── Feature 2: Property Description Generator ───────────────────────────────
export const generateDescriptionSchema = z.object({
  title: z.string().min(1).default(""),
  beds: z.number().int().min(0).default(0),
  baths: z.number().int().min(0).default(0),
  sqft: z.number().int().min(0).default(0),
  price: z.number().min(0).default(0),
  address: z.string().default(""),
  city: z.string().default(""),
  state: z.string().default(""),
  type: z
    .enum(["HOUSE", "APARTMENT", "CONDO", "TOWNHOUSE", "LAND", "COMMERCIAL"])
    .default("HOUSE"),
  yearBuilt: z.number().int().optional(),
  lotSize: z.number().optional(),
  tags: z.array(z.string()).default([]),
  highlights: z.array(z.string()).default([]),
  tone: z
    .string()
    .transform((v) => v.toLowerCase())
    .pipe(
      z.enum(["professional", "luxury", "friendly", "investment", "casual"]),
    )
    .default("professional"),
});

// ─── Feature 3: AI Recommendations ───────────────────────────────────────────
export const generateRecommendationsSchema = z.object({
  limit: z.number().int().min(1).max(20).default(6),
});

// ─── Feature 4: Neighborhood Analyzer ────────────────────────────────────────
export const neighborhoodAnalyzerSchema = z.object({
  location: z.string().min(2, "Location is required").max(200),
  city: z.string().optional(),
  zip: z.string().optional(),
});

// ─── Feature 5: Mortgage Advisor ─────────────────────────────────────────────
export const mortgageAdvisorSchema = z.object({
  propertyPrice: z.number().positive("Property price must be positive"),
  downPayment: z.number().min(0, "Down payment cannot be negative"),
  annualIncome: z.number().positive("Annual income must be positive"),
  creditScore: z.enum(["excellent", "good", "fair", "poor"]).default("good"),
  loanTermYears: z
    .union([z.literal(10), z.literal(15), z.literal(20), z.literal(30)])
    .default(30),
  includeInsurance: z.boolean().default(true),
  includePropertyTax: z.boolean().default(true),
});

export type NaturalLanguageSearchInput = z.infer<
  typeof naturalLanguageSearchSchema
>;
export type GenerateDescriptionInput = z.infer<
  typeof generateDescriptionSchema
>;
export type GenerateRecommendationsInput = z.infer<
  typeof generateRecommendationsSchema
>;
export type NeighborhoodAnalyzerInput = z.infer<
  typeof neighborhoodAnalyzerSchema
>;
export type MortgageAdvisorInput = z.infer<typeof mortgageAdvisorSchema>;
