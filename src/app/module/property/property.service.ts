import { Prisma } from "../../../generated/prisma/client.js";
import { PropertyStatus, PropertyType } from "../../../generated/prisma/enums.js";
import { prisma } from "../../lib/index.js";

import { getPaginationParams } from "../../shared/index.js";
import { PropertySearchQuery } from "../../interfaces/index.js";
import {
  CreatePropertyInput,
  UpdatePropertyInput,
  AddMediaInput,
  CreateInquiryInput,
  CreateReviewInput,
} from "./property.validation.js";
import AppError from "@/app/errorHelpers/AppError.js";
import { deleteFileFromCloudinary } from "@/app/config/cloudinary.config.js";

// ─── Build search where clause ────────────────────────────────────────────────
const buildPropertyWhere = (
  query: PropertySearchQuery,
): Prisma.PropertyWhereInput => {
  const where: Prisma.PropertyWhereInput = {};

  if (query.city) where.city = { contains: query.city, mode: "insensitive" };
  if (query.state) where.state = { contains: query.state, mode: "insensitive" };
  if (query.zip) where.zip = query.zip;
  if (query.type) where.type = { equals: query.type as PropertyType };
  if (query.status) where.status = { equals: query.status as PropertyStatus };
  if (query.agentId) where.agentId = query.agentId;

  if (query.minPrice || query.maxPrice) {
    const priceFilter: Prisma.DecimalFilter = {};
    if (query.minPrice) priceFilter.gte = Number(query.minPrice);
    if (query.maxPrice) priceFilter.lte = Number(query.maxPrice);
    where.price = priceFilter;
  }

  if (query.minBeds || query.maxBeds) {
    const bedsFilter: Prisma.IntFilter = {};
    if (query.minBeds) bedsFilter.gte = Number(query.minBeds);
    if (query.maxBeds) bedsFilter.lte = Number(query.maxBeds);
    where.beds = bedsFilter;
  }

  if (query.minBaths || query.maxBaths) {
    const bathsFilter: Prisma.IntFilter = {};
    if (query.minBaths) bathsFilter.gte = Number(query.minBaths);
    if (query.maxBaths) bathsFilter.lte = Number(query.maxBaths);
    where.baths = bathsFilter;
  }

  if (query.minSqft || query.maxSqft) {
    const sqftFilter: Prisma.IntFilter = {};
    if (query.minSqft) sqftFilter.gte = Number(query.minSqft);
    if (query.maxSqft) sqftFilter.lte = Number(query.maxSqft);
    where.sqft = sqftFilter;
  }

  if (query.tags) {
    const tagList = query.tags.split(",").map((t) => t.trim());
    where.tags = { hasSome: tagList };
  }

  if (query.q) {
    where.OR = [
      { title: { contains: query.q, mode: "insensitive" } },
      { description: { contains: query.q, mode: "insensitive" } },
      { address: { contains: query.q, mode: "insensitive" } },
      { city: { contains: query.q, mode: "insensitive" } },
      { tags: { has: query.q } },
    ];
  }

  return where;
};

const propertyInclude = {
  media: { orderBy: { order: "asc" as const } },
  agent: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      rating: true,
      user: { select: { avatar: true } },
    },
  },
  _count: { select: { reviews: true, inquiries: true, savedBy: true } },
};

// ─── CRUD ─────────────────────────────────────────────────────────────────────
export const createProperty = async (
  userId: string,
  data: CreatePropertyInput,
) => {
  const agent = await prisma.agent.findUnique({ where: { userId } });
  if (!agent)
    throw new AppError("Agent profile required to create a listing", 403);

  if (agent.status !== "APPROVED")
    throw new AppError("Agent profile must be approved before creating listings. Please wait for admin approval.", 403);

  const { aiImageUrl, ...propertyData } = data as CreatePropertyInput & { aiImageUrl?: string };

  const property = await prisma.property.create({
    data: {
      ...propertyData,
      agentId: agent.id,
      price: propertyData.price,
      lotSize: propertyData.lotSize ?? null,
      yearBuilt: propertyData.yearBuilt ?? null,
      aiFeatures: (propertyData.aiFeatures ?? {}) as Prisma.InputJsonValue,
    },
    include: propertyInclude,
  });

  if (aiImageUrl) {
    await prisma.media.create({
      data: {
        propertyId: property.id,
        url: aiImageUrl,
        type: "IMAGE",
        order: 1,
        altText: "AI Generated Property Image",
      },
    });
  }

  return property;
};

export const getProperties = async (query: PropertySearchQuery) => {
  const { page, limit, skip } = getPaginationParams(
    query as Record<string, unknown>,
  );
  const where = buildPropertyWhere(query);

  const orderBy: Prisma.PropertyOrderByWithRelationInput = {};
  const sortBy = query.sortBy ?? "createdAt";
  const sortOrder = query.sortOrder ?? "desc";
  (orderBy as Record<string, string>)[sortBy] = sortOrder;

  const [items, total] = await Promise.all([
    prisma.property.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: propertyInclude,
    }),
    prisma.property.count({ where }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const getPropertyById = async (propertyId: string) => {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    include: {
      ...propertyInclude,
      reviews: {
        take: 10,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true, avatar: true } } },
      },
      similarFrom: {
        take: 6,
        orderBy: { similarityScore: "desc" },
        include: {
          similar: { include: { media: { where: { order: 1 }, take: 1 } } },
        },
      },
    },
  });
  if (!property) throw new AppError("Property not found", 404);
  return property;
};

export const updateProperty = async (
  userId: string,
  propertyId: string,
  data: UpdatePropertyInput,
) => {
  const agent = await prisma.agent.findUnique({ where: { userId } });
  if (!agent) throw new AppError("Agent profile not found", 403);

  const property = await prisma.property.findFirst({
    where: { id: propertyId, agentId: agent.id },
  });
  if (!property)
    throw new AppError("Property not found or not owned by you", 404);

  const updateData = Object.fromEntries(
    Object.entries(data).filter(([_, value]) => value !== undefined)
  );

  return prisma.property.update({
    where: { id: propertyId },
    data: updateData,
    include: propertyInclude,
  });
};

export const deleteProperty = async (userId: string, propertyId: string) => {
  const agent = await prisma.agent.findUnique({ where: { userId } });
  if (!agent) throw new AppError("Agent profile not found", 403);

  const property = await prisma.property.findFirst({
    where: { id: propertyId, agentId: agent.id },
  });
  if (!property)
    throw new AppError("Property not found or not owned by you", 404);

  const media = await prisma.media.findMany({ where: { propertyId: property.id } })
  media.forEach(async (item) => {
    if (item.url.includes("cloudinary.com")) {
      await deleteFileFromCloudinary(item.url);
    }
  })
  await prisma.property.delete({ where: { id: propertyId } });
};

// ─── Media ────────────────────────────────────────────────────────────────────
export const addMedia = async (
  userId: string,
  propertyId: string,
  payload: AddMediaInput,
) => {
  const agent = await prisma.agent.findUnique({ where: { userId } });
  if (!agent) throw new AppError("Agent profile not found", 403);

  const property = await prisma.property.findFirst({
    where: { id: propertyId, agentId: agent.id },
  });
  if (!property)
    throw new AppError("Property not found or not owned by you", 404);

  return prisma.media.create({ data: { propertyId, ...payload } });
};

export const uploadPropertyMedia = async (
  userId: string,
  propertyId: string,
  files: Express.Multer.File[],
) => {
  const agent = await prisma.agent.findUnique({ where: { userId } });
  if (!agent) throw new AppError("Agent profile not found", 403);

  const property = await prisma.property.findFirst({
    where: { id: propertyId, agentId: agent.id },
  });
  if (!property)
    throw new AppError("Property not found or not owned by you", 404);

  const existingCount = await prisma.media.count({ where: { propertyId } });

  const mediaData = files.map((file, i) => {
    const url =
      (file as unknown as { path?: string; secure_url?: string }).path ??
      (file as unknown as { secure_url?: string }).secure_url ??
      file.filename;
    return {
      propertyId,
      url,
      type: "IMAGE" as const,
      order: existingCount + i + 1,
    };
  });

  return prisma.media.createMany({ data: mediaData });
};

export const deleteMedia = async (userId: string, mediaId: string) => {
  const agent = await prisma.agent.findUnique({ where: { userId } });
  if (!agent) throw new AppError("Agent profile not found", 403);

  const media = await prisma.media.findFirst({
    where: { id: mediaId, property: { agentId: agent.id } },
  });

  if (!media) throw new AppError("Media not found or not owned by you", 404);

  if (media.url.includes("cloudinary.com")) {
    await deleteFileFromCloudinary(media.url);
  }
  await prisma.media.delete({ where: { id: mediaId } });
};

// ─── Neighborhood ─────────────────────────────────────────────────────────────
export const getNeighborhoodByZip = async (zip: string) => {
  const neighborhood = await prisma.neighborhood.findUnique({ where: { zip } });
  if (!neighborhood)
    throw new AppError("Neighborhood data not found for this zip code", 404);
  return neighborhood;
};

// ─── Similar Properties ───────────────────────────────────────────────────────
export const getSimilarProperties = async (propertyId: string) => {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
  });
  if (!property) throw new AppError("Property not found", 404);

  const similar = await prisma.similarProperty.findMany({
    where: { propertyId },
    orderBy: { similarityScore: "desc" },
    take: 6,
    include: {
      similar: {
        include: {
          media: { where: { order: 1 }, take: 1 },
          agent: { select: { name: true, rating: true } },
        },
      },
    },
  });

  return similar.map((s) => ({
    ...s.similar,
    similarityScore: s.similarityScore,
  }));
};

// ─── Agent's own listings ─────────────────────────────────────────────────────
export const getMyListings = async (
  userId: string,
  query: PropertySearchQuery,
) => {
  const agent = await prisma.agent.findUnique({ where: { userId } });
  if (!agent) throw new AppError("Agent profile not found", 403);

  const { page, limit, skip } = getPaginationParams(
    query as Record<string, unknown>,
  );
  const where: Prisma.PropertyWhereInput = { agentId: agent.id };
  if (query.status) {
    where.status = { equals: query.status as PropertyStatus };
  }

  const [items, total] = await Promise.all([
    prisma.property.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: propertyInclude,
    }),
    prisma.property.count({ where }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
};
