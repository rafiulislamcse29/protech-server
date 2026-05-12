import AppError from "../../errorHelpers/AppError.js";

import { Prisma } from "../../../generated/prisma/client.js";
import {
  PropertyType,
  PropertyStatus,
  AgentStatus,
} from "../../../generated/prisma/enums.js";
import { prisma } from "../../lib/index.js";
import { getChatResponse } from "../../lib/openrouter.js";
import {
  NaturalLanguageSearchInput,
  GenerateDescriptionInput,
  GenerateRecommendationsInput,
  NeighborhoodAnalyzerInput,
  MortgageAdvisorInput,
} from "./ai.validation.js";

// ─── Shared property include ──────────────────────────────────────────────────
const propertyInclude = {
  media: { where: { order: 1 }, take: 1 },
  agent: {
    select: {
      id: true,
      name: true,
      rating: true,
      user: { select: { avatar: true } },
    },
  },
  _count: { select: { reviews: true, savedBy: true } },
};

// ─────────────────────────────────────────────────────────────────────────────
// FEATURE 1: Natural Language Property Search
// ─────────────────────────────────────────────────────────────────────────────
interface ParsedSearchFilters {
  isRealEstateQuery?: boolean;
  city?: string;
  state?: string;
  zip?: string;
  type?: string;
  minBeds?: number;
  maxBeds?: number;
  minBaths?: number;
  maxBaths?: number;
  minPrice?: number;
  maxPrice?: number;
  minSqft?: number;
  maxSqft?: number;
  tags?: string[];
  status?: string;
  summary: string;
}

export const naturalLanguageSearch = async (
  input: NaturalLanguageSearchInput,
) => {
  const systemPrompt = `You are a real estate search assistant. Parse the user's natural language property search query into structured JSON filters.

CRITICAL: Your response must be ONLY valid JSON. Do not include any text before or after the JSON. Do not wrap the JSON in markdown code blocks. Start your response with { and end with }.

Return JSON with this exact structure (omit fields that are not mentioned):
{
  "isRealEstateQuery": true or false,
  "city": "string or null",
  "state": "string or null",
  "zip": "string or null",
  "type": "HOUSE|APARTMENT|CONDO|TOWNHOUSE|LAND or null",
  "minBeds": number or null,
  "maxBeds": number or null,
  "minBaths": number or null,
  "maxBaths": number or null,
  "minPrice": number or null,
  "maxPrice": number or null,
  "minSqft": number or null,
  "maxSqft": number or null,
  "tags": ["array", "of", "keywords"] or [],
  "status": "AVAILABLE|PENDING|SOLD|RENTED or null",
  "summary": "A one-sentence human-readable summary of what was searched for"
}

Rules:
- Set "isRealEstateQuery" to false if the input is NOT a real estate search (e.g. random words, unrelated topics, gibberish). Set to true only if the query describes a property, location, price, lifestyle, or housing need.
- Convert price mentions like "$800k" to 800000, "$1.2M" to 1200000
- "under $X" means maxPrice = X
- "at least X beds" means minBeds = X
- Extract location names accurately
- Map property types: house/home→HOUSE, apartment/flat→APARTMENT, condo→CONDO, townhouse/townhome→TOWNHOUSE, land/lot→LAND
- Tags should capture lifestyle keywords: "modern kitchen", "good schools", "quiet", "park nearby", "pool", etc.`;

  const { data: filters, usage } = await getChatResponse<ParsedSearchFilters>(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: input.query },
    ],
    { temperature: 0.1, maxTokens: 600 },
  );

  if (filters.isRealEstateQuery === false) {
    return {
      query: input.query,
      parsedFilters: filters,
      summary:
        "That doesn't look like a property search. Try describing a home, location, price, or lifestyle.",
      total: 0,
      properties: [],
      tokensUsed: usage.total_tokens,
      notRealEstate: true,
    };
  }

  const hasFilter =
    filters.city ||
    filters.state ||
    filters.zip ||
    filters.type ||
    filters.minBeds ||
    filters.maxBeds ||
    filters.minBaths ||
    filters.maxBaths ||
    filters.minPrice ||
    filters.maxPrice ||
    filters.minSqft ||
    filters.maxSqft ||
    (filters.tags && filters.tags.length > 0);

  if (!hasFilter) {
    return {
      query: input.query,
      parsedFilters: filters,
      summary:
        "Please be more specific — mention a location, property type, price range, or number of bedrooms.",
      total: 0,
      properties: [],
      tokensUsed: usage.total_tokens,
      notRealEstate: true,
    };
  }

  // Build Prisma where clause from parsed filters
  const where: Prisma.PropertyWhereInput = { status: "AVAILABLE" };

  if (filters.city)
    where.city = { contains: filters.city, mode: "insensitive" };
  if (filters.state)
    where.state = { contains: filters.state, mode: "insensitive" };
  if (filters.zip) where.zip = filters.zip;
  if (filters.type) where.type = filters.type as PropertyType;
  if (filters.status) where.status = filters.status as PropertyStatus;

  if (filters.minPrice || filters.maxPrice) {
    const priceFilter: Prisma.DecimalFilter = {};
    if (filters.minPrice) priceFilter.gte = filters.minPrice;
    if (filters.maxPrice) priceFilter.lte = filters.maxPrice;
    where.price = priceFilter;
  }

  if (filters.minBeds || filters.maxBeds) {
    const bedsFilter: Prisma.IntFilter = {};
    if (filters.minBeds) bedsFilter.gte = filters.minBeds;
    if (filters.maxBeds) bedsFilter.lte = filters.maxBeds;
    where.beds = bedsFilter;
  }

  if (filters.minBaths || filters.maxBaths) {
    const bathsFilter: Prisma.IntFilter = {};
    if (filters.minBaths) bathsFilter.gte = filters.minBaths;
    if (filters.maxBaths) bathsFilter.lte = filters.maxBaths;
    where.baths = bathsFilter;
  }

  if (filters.minSqft || filters.maxSqft) {
    const sqftFilter: Prisma.IntFilter = {};
    if (filters.minSqft) sqftFilter.gte = filters.minSqft;
    if (filters.maxSqft) sqftFilter.lte = filters.maxSqft;
    where.sqft = sqftFilter;
  }

  if (filters.tags && filters.tags.length > 0) {
    where.tags = { hasSome: filters.tags };
  }

  const properties = await prisma.property.findMany({
    where,
    take: input.limit,
    orderBy: { createdAt: "desc" },
    include: propertyInclude,
  });

  const total = await prisma.property.count({ where });

  return {
    query: input.query,
    parsedFilters: filters,
    summary: filters.summary,
    total,
    properties,
    tokensUsed: usage.total_tokens,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// FEATURE 2: Property Description Generator
// ─────────────────────────────────────────────────────────────────────────────
interface GeneratedDescription {
  improvedTitle: string;
  shortDescription: string;
  fullDescription: string;
  highlights: string[];
  seoTags: string[];
  callToAction: string;
  imagePrompt: string;
}

export const generatePropertyDescription = async (
  userId: string,
  role: string,
  input: GenerateDescriptionInput,
) => {
  const allowedRoles = ["AGENT", "ADMIN", "SUPER_ADMIN"];
  if (!allowedRoles.includes(role)) {
    throw new AppError("Only agents can use the description generator", 403);
  }

  // Check if agent profile exists and is approved
  if (role === "AGENT") {
    const agent = await prisma.agent.findUnique({ where: { userId } });
    if (!agent) {
      throw new AppError(
        "Agent profile not found. Please create an agent profile first.",
        403,
      );
    }
    if (agent.status !== AgentStatus.APPROVED) {
      throw new AppError(
        "Agent profile must be approved before using AI features. Please wait for admin approval.",
        403,
      );
    }
  }

  const systemPrompt = `You are an expert real estate copywriter. Generate a property description.

CRITICAL: Your response must be ONLY valid JSON. No text before or after. Start with { end with }.

Return JSON with this exact structure:
{
  "improvedTitle": "Compelling listing title (max 60 chars)",
  "shortDescription": "2-3 sentence preview (max 150 chars)",
  "fullDescription": "SEO-optimized description (150-250 words max). Use paragraphs.",
  "highlights": ["4-5 key selling points"],
  "seoTags": ["8-10 keyword tags"],
  "callToAction": "One call-to-action sentence",
  "imagePrompt": "A highly detailed, photorealistic prompt for an AI image generator to create a stunning exterior or interior photo of this property based on the description. Make it optimized for FLUX model."
}`;

  const userPrompt = `Generate a ${input.tone} property description for:
- Type: ${input.type}
- Title: ${input.title}
- Location: ${input.address}, ${input.city}, ${input.state}
- Bedrooms: ${input.beds} | Bathrooms: ${input.baths}
- Square Footage: ${input.sqft.toLocaleString()} sqft
- Price: $${input.price.toLocaleString()}
${input.yearBuilt ? `- Year Built: ${input.yearBuilt}` : ""}
${input.lotSize ? `- Lot Size: ${input.lotSize} acres` : ""}
${input.tags.length > 0 ? `- Features/Tags: ${input.tags.join(", ")}` : ""}
${input.highlights.length > 0 ? `- Agent Highlights: ${input.highlights.join(", ")}` : ""}`;

  const { data: generated, usage } =
    await getChatResponse<GeneratedDescription>(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      { temperature: 0.1, maxTokens: 2000 },
    );

  // Log AI usage for audit
  await prisma.auditLog.create({
    data: {
      userId,
      action: "AI_DESCRIPTION_GENERATION",
      tokenCount: usage.total_tokens,
      estimatedCost: (usage.total_tokens / 1000) * 0.0001,
    },
  });

  return {
    input,
    generated: {
      ...generated,
      imageUrl: generated.imagePrompt
        ? `https://image.pollinations.ai/prompt/${encodeURIComponent(generated.imagePrompt.substring(0, 500))}?width=1024&height=768&nologo=true&model=flux`
        : undefined,
    },
    tokensUsed: usage.total_tokens,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// FEATURE 3: AI Property Recommendations
// ─────────────────────────────────────────────────────────────────────────────
interface PreferenceProfile {
  preferredTypes: string[];
  priceRange: { min: number; max: number };
  preferredBeds: number;
  preferredBaths: number;
  preferredCities: string[];
  preferredTags: string[];
  reasoning: string;
}

export const generateRecommendations = async (
  userId: string,
  input: GenerateRecommendationsInput,
) => {
  // ── 1. Gather user behavior data ──────────────────────────────────────────
  const [savedProperties, searchPref, recentInquiries, existingRecs] =
    await Promise.all([
      prisma.savedProperty.findMany({
        where: { userId },
        take: 20,
        orderBy: { savedAt: "desc" },
        include: {
          property: {
            select: {
              type: true,
              price: true,
              beds: true,
              baths: true,
              city: true,
              tags: true,
            },
          },
        },
      }),
      prisma.searchPreference.findUnique({ where: { userId } }),
      prisma.inquiry.findMany({
        where: { buyerId: userId },
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          property: {
            select: {
              type: true,
              price: true,
              beds: true,
              baths: true,
              city: true,
              tags: true,
            },
          },
        },
      }),
      prisma.aIRecommendation.findMany({
        where: { userId },
        select: { propertyId: true },
      }),
    ]);

  const alreadyRecommended = existingRecs.map((r) => r.propertyId);
  const savedIds = savedProperties.map((s) => s.propertyId);
  const excludeIds = [...new Set([...alreadyRecommended, ...savedIds])];

  // ── 2. Build behavior summary for AI ─────────────────────────────────────
  const behaviorSummary = {
    savedCount: savedProperties.length,
    savedTypes: savedProperties.map((s) => s.property.type),
    savedPrices: savedProperties.map((s) => Number(s.property.price)),
    savedBeds: savedProperties.map((s) => s.property.beds),
    savedCities: savedProperties.map((s) => s.property.city),
    savedTags: savedProperties.flatMap((s) => s.property.tags),
    inquiredTypes: recentInquiries.map((i) => i.property.type),
    searchKeywords: searchPref?.keywords ?? [],
    searchAvgPrice: searchPref?.avgPrice ? Number(searchPref.avgPrice) : null,
    searchTargetAreas: searchPref?.targetAreas ?? [],
  };

  // ── 3. Ask AI to build preference profile ────────────────────────────────
  const systemPrompt = `You are a real estate recommendation engine. Analyze user behavior data and extract a preference profile.

CRITICAL: Your response must be ONLY valid JSON. Do not include any text before or after the JSON. Do not wrap the JSON in markdown code blocks. Start your response with { and end with }.

Return JSON:
{
  "preferredTypes": ["HOUSE", "APARTMENT", etc],
  "priceRange": { "min": number, "max": number },
  "preferredBeds": number,
  "preferredBaths": number,
  "preferredCities": ["city names"],
  "preferredTags": ["lifestyle keywords"],
  "reasoning": "Brief explanation of the inferred preferences"
}`;

  const { data: profile, usage } = await getChatResponse<PreferenceProfile>(
    [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Analyze this user's real estate behavior and extract preferences:\n${JSON.stringify(behaviorSummary, null, 2)}`,
      },
    ],
    { temperature: 0.3, maxTokens: 500 },
  );

  // ── 4. Query matching properties from DB ─────────────────────────────────
  const where: Prisma.PropertyWhereInput = {
    status: "AVAILABLE",
    ...(excludeIds.length > 0 ? { id: { notIn: excludeIds } } : {}),
  };

  if (profile.preferredTypes.length > 0) {
    where.type = {
      in: profile.preferredTypes as PropertyType[],
    };
  }

  if (profile.priceRange.min || profile.priceRange.max) {
    where.price = {
      gte: profile.priceRange.min || 0,
      lte: profile.priceRange.max || 999999999,
    };
  }

  if (profile.preferredBeds > 0) {
    where.beds = { gte: Math.max(1, profile.preferredBeds - 1) };
  }

  if (profile.preferredCities.length > 0) {
    where.city = { in: profile.preferredCities };
  }

  if (profile.preferredTags.length > 0) {
    where.tags = { hasSome: profile.preferredTags };
  }

  const candidates = await prisma.property.findMany({
    where,
    take: input.limit * 3, // fetch more, then score
    orderBy: { createdAt: "desc" },
    include: propertyInclude,
  });

  if (candidates.length === 0) {
    return {
      profile,
      recommendations: [],
      message:
        "No matching properties found. Try saving more properties to improve recommendations.",
      tokensUsed: usage.total_tokens,
    };
  }

  // ── 5. Score candidates and pick top N ───────────────────────────────────
  const scored = candidates.map((p) => {
    let score = 0.5; // base score

    // Type match
    if (profile.preferredTypes.includes(p.type)) score += 0.2;

    // Beds match
    if (Math.abs(p.beds - profile.preferredBeds) <= 1) score += 0.1;

    // Price in range
    const price = Number(p.price);
    if (price >= profile.priceRange.min && price <= profile.priceRange.max)
      score += 0.15;

    // Tag overlap
    const tagOverlap = p.tags.filter((t) =>
      profile.preferredTags.includes(t),
    ).length;
    score += Math.min(0.15, tagOverlap * 0.05);

    return { property: p, score: Math.min(1, score) };
  });

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, input.limit);

  // ── 6. Persist recommendations to DB ─────────────────────────────────────
  await prisma.aIRecommendation.createMany({
    data: top.map(({ property, score }) => ({
      userId,
      propertyId: property.id,
      reason: profile.reasoning,
      score,
    })),
    skipDuplicates: true,
  });

  // Log AI usage
  await prisma.auditLog.create({
    data: {
      userId,
      action: "AI_RECOMMENDATIONS",
      tokenCount: usage.total_tokens,
      estimatedCost: (usage.total_tokens / 1000) * 0.0001,
    },
  });

  // Notify user
  await prisma.notification.create({
    data: {
      userId,
      type: "AI_RECOMMENDATION",
      title: "New AI Recommendations",
      message: `We found ${top.length} properties that match your preferences.`,
      link: "/recommendations",
    },
  });

  return {
    profile,
    recommendations: top.map(({ property, score }) => ({
      ...property,
      aiScore: score,
    })),
    tokensUsed: usage.total_tokens,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// FEATURE 4: AI Neighborhood Analyzer
// ─────────────────────────────────────────────────────────────────────────────
interface NeighborhoodReport {
  name: string;
  city: string;
  overview: string;
  safety: {
    score: number; // 1-10
    summary: string;
    crimeLevel: "very low" | "low" | "moderate" | "high" | "very high";
  };
  schools: {
    score: number;
    summary: string;
    topSchools: string[];
  };
  amenities: {
    score: number;
    summary: string;
    nearby: string[];
  };
  transportation: {
    score: number;
    summary: string;
    options: string[];
  };
  marketTrends: {
    priceDirection: "rising" | "stable" | "declining";
    avgPricePerSqft: number;
    yearOverYearChange: string;
    demandLevel: "high" | "moderate" | "low";
    summary: string;
  };
  demographics: {
    summary: string;
    highlights: string[];
  };
  livabilityScore: number; // 1-100
  pros: string[];
  cons: string[];
  bestFor: string[];
  aiAnalysis: string;
}

export const analyzeNeighborhood = async (input: NeighborhoodAnalyzerInput) => {
  const locationStr = [input.location, input.city, input.zip]
    .filter(Boolean)
    .join(", ");

  // Check DB cache first (valid for 7 days)
  if (input.zip) {
    const cached = await prisma.neighborhood.findUnique({
      where: { zip: input.zip },
    });

    if (cached && cached.expiresAt && cached.expiresAt > new Date()) {
      return {
        source: "cache",
        data: cached,
        aiAnalysis: cached.aiAnalysis,
      };
    }
  }

  const systemPrompt = `You are an expert real estate neighborhood analyst with deep knowledge of US neighborhoods. Generate a comprehensive, data-informed neighborhood intelligence report.

CRITICAL: Your response must be ONLY valid JSON. Do not include any text before or after the JSON. Do not wrap the JSON in markdown code blocks. Start your response with { and end with }.

Return JSON with this exact structure:
{
  "name": "neighborhood name",
  "city": "city name",
  "overview": "2-3 sentence neighborhood overview",
  "safety": {
    "score": 1-10,
    "summary": "safety summary",
    "crimeLevel": "very low|low|moderate|high|very high"
  },
  "schools": {
    "score": 1-10,
    "summary": "schools summary",
    "topSchools": ["school names"]
  },
  "amenities": {
    "score": 1-10,
    "summary": "amenities summary",
    "nearby": ["list of nearby amenities"]
  },
  "transportation": {
    "score": 1-10,
    "summary": "transit summary",
    "options": ["transit options"]
  },
  "marketTrends": {
    "priceDirection": "rising|stable|declining",
    "avgPricePerSqft": number,
    "yearOverYearChange": "+X% or -X%",
    "demandLevel": "high|moderate|low",
    "summary": "market summary"
  },
  "demographics": {
    "summary": "demographics summary",
    "highlights": ["demographic highlights"]
  },
  "livabilityScore": 1-100,
  "pros": ["top 5 pros"],
  "cons": ["top 3 cons"],
  "bestFor": ["who this neighborhood is best for"],
  "aiAnalysis": "Comprehensive 2-3 paragraph analysis covering lifestyle, investment potential, and who would thrive here"
}

Base your analysis on general knowledge of the area. Be specific and realistic.`;

  const { data: report, usage } = await getChatResponse<NeighborhoodReport>(
    [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Generate a neighborhood intelligence report for: ${locationStr}`,
      },
    ],
    { temperature: 0.2, maxTokens: 1500 },
  );

  // Persist to DB if zip provided
  if (input.zip) {
    await prisma.neighborhood.upsert({
      where: { zip: input.zip },
      update: {
        name: report.name,
        city: report.city,
        safetyScore: report.safety.score,
        schoolScore: report.schools.score,
        transitScore: report.transportation.score,
        marketTrend: report.marketTrends as Prisma.InputJsonValue,
        aiAnalysis: report.aiAnalysis,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
      create: {
        zip: input.zip,
        name: report.name,
        city: report.city,
        safetyScore: report.safety.score,
        schoolScore: report.schools.score,
        transitScore: report.transportation.score,
        marketTrend: report.marketTrends as Prisma.InputJsonValue,
        aiAnalysis: report.aiAnalysis,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
  }

  return {
    source: "ai",
    location: locationStr,
    report,
    tokensUsed: usage.total_tokens,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// FEATURE 5: AI Mortgage Advisor
// ─────────────────────────────────────────────────────────────────────────────

// Interest rate lookup by credit score and term (approximate market rates)
const BASE_RATES: Record<string, Record<number, number>> = {
  excellent: { 10: 6.2, 15: 6.5, 20: 6.8, 30: 7.0 },
  good: { 10: 6.6, 15: 6.9, 20: 7.2, 30: 7.5 },
  fair: { 10: 7.2, 15: 7.6, 20: 7.9, 30: 8.3 },
  poor: { 10: 8.0, 15: 8.5, 20: 8.9, 30: 9.4 },
};

const TERMS = [10, 15, 20, 30] as const;

function calcMonthlyPayment(
  principal: number,
  annualRate: number,
  termYears: number,
): number {
  const r = annualRate / 100 / 12;
  const n = termYears * 12;
  if (r === 0) return principal / n;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

interface MortgageAIInsights {
  aiInsights: string;
  tips: string[];
}

export const getMortgageAdvice = async (input: MortgageAdvisorInput) => {
  const {
    propertyPrice,
    downPayment,
    annualIncome,
    creditScore,
    loanTermYears,
    includeInsurance,
    includePropertyTax,
  } = input;

  const loanAmount = propertyPrice - downPayment;
  if (loanAmount <= 0) {
    throw new AppError("Down payment cannot exceed the property price.", 400);
  }

  const downPaymentPercent = (downPayment / propertyPrice) * 100;
  const monthlyIncome = annualIncome / 12;

  // ── Build loan options for all terms ─────────────────────────────────────
  const rates = (BASE_RATES[creditScore] ?? BASE_RATES["good"])!;

  const loanOptions = TERMS.map((term) => {
    const rate = rates[term] ?? 7.5;
    const monthly = calcMonthlyPayment(loanAmount, rate, term);
    const totalCost = monthly * term * 12;
    return {
      termYears: term,
      interestRate: rate,
      monthlyPayment: Math.round(monthly),
      totalInterest: Math.round(totalCost - loanAmount),
      totalCost: Math.round(totalCost),
      recommended: term === loanTermYears,
    };
  });

  // ── Primary payment (chosen term) ────────────────────────────────────────
  const primaryRate = rates[loanTermYears] ?? 7.5;
  const piPayment = calcMonthlyPayment(loanAmount, primaryRate, loanTermYears);

  const monthlyPropertyTax = includePropertyTax
    ? (propertyPrice * 0.012) / 12 // ~1.2% annual property tax
    : 0;
  const monthlyInsurance = includeInsurance
    ? (propertyPrice * 0.005) / 12 // ~0.5% annual homeowner's insurance
    : 0;

  const totalMonthly = Math.round(
    piPayment + monthlyPropertyTax + monthlyInsurance,
  );

  // ── Affordability metrics ─────────────────────────────────────────────────
  const dti = (totalMonthly / monthlyIncome) * 100;

  // Affordability score: 100 = very comfortable (DTI ≤ 20%), 0 = unaffordable (DTI ≥ 50%)
  const affordabilityScore = Math.max(
    0,
    Math.min(100, Math.round(100 - ((dti - 20) / 30) * 100)),
  );

  type AffordabilityLabel =
    | "Comfortable"
    | "Moderate"
    | "Stretched"
    | "Unaffordable";
  let affordabilityLabel: AffordabilityLabel;
  if (dti <= 28) affordabilityLabel = "Comfortable";
  else if (dti <= 36) affordabilityLabel = "Moderate";
  else if (dti <= 43) affordabilityLabel = "Stretched";
  else affordabilityLabel = "Unaffordable";

  // Max affordable price: back-calculate from 28% DTI rule
  const maxMonthlyForHousing = monthlyIncome * 0.28;
  const maxPIPayment =
    maxMonthlyForHousing - monthlyPropertyTax - monthlyInsurance;
  const r = primaryRate / 100 / 12;
  const n = loanTermYears * 12;
  const maxLoan =
    maxPIPayment > 0
      ? (maxPIPayment * (Math.pow(1 + r, n) - 1)) / (r * Math.pow(1 + r, n))
      : 0;
  const maxAffordablePrice = Math.round(maxLoan + downPayment);

  // ── AI insights ───────────────────────────────────────────────────────────
  const systemPrompt = `You are a senior mortgage advisor. Provide concise, personalised mortgage advice.

CRITICAL: Your response must be ONLY valid JSON. Start with { and end with }.

Return JSON:
{
  "aiInsights": "2-3 paragraph personalised analysis covering: affordability assessment, loan term recommendation, and market context. Be specific with the numbers provided.",
  "tips": ["4-6 actionable tips to improve their mortgage situation or save money"]
}`;

  const userPrompt = `Mortgage scenario:
- Property price: $${propertyPrice.toLocaleString()}
- Down payment: $${downPayment.toLocaleString()} (${downPaymentPercent.toFixed(1)}%)
- Loan amount: $${loanAmount.toLocaleString()}
- Annual income: $${annualIncome.toLocaleString()}
- Monthly income: $${monthlyIncome.toFixed(0)}
- Credit score: ${creditScore}
- Preferred term: ${loanTermYears} years at ${primaryRate}% APR
- Monthly payment (P&I + tax + insurance): $${totalMonthly.toLocaleString()}
- Debt-to-income ratio: ${dti.toFixed(1)}%
- Affordability: ${affordabilityLabel} (score: ${affordabilityScore}/100)
- Max affordable price at 28% DTI: $${maxAffordablePrice.toLocaleString()}`;

  const { data: aiResult } = await getChatResponse<MortgageAIInsights>(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    { temperature: 0.3, maxTokens: 800 },
  );

  return {
    loanAmount,
    downPaymentPercent: Math.round(downPaymentPercent * 10) / 10,
    monthlyPayment: totalMonthly,
    breakdown: {
      principal: Math.round(piPayment * 0.3), // approx principal portion (month 1)
      interest: Math.round(piPayment * 0.7), // approx interest portion (month 1)
      insurance: Math.round(monthlyInsurance),
      propertyTax: Math.round(monthlyPropertyTax),
    },
    loanOptions,
    affordabilityScore,
    affordabilityLabel,
    debtToIncomeRatio: Math.round(dti * 10) / 10,
    maxAffordablePrice,
    aiInsights: aiResult.aiInsights,
    tips: aiResult.tips,
  };
};
