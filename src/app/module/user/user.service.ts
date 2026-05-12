import AppError from "@/app/errorHelpers/AppError.js";
import { prisma } from "../../lib/index.js";
import { getPaginationParams } from "../../shared/index.js";
import {
  UpdateProfileInput,
  UpdateSearchPreferenceInput,
} from "./user.validation.js";

export const getUserProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      agent: {
        select: {
          id: true,
          licenseNumber: true,
          specialties: true,
          bio: true,
          phone: true,
          rating: true,
        },
      },
      searchPreference: true,
    },
  });
  if (!user) throw new AppError("User not found", 404);
  return user;
};

export const updateUserProfile = async (
  userId: string,
  data: UpdateProfileInput,
) => {
  return prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      role: true,
      updatedAt: true,
    },
  });
};

export const updateAvatar = async (userId: string, avatarUrl: string) => {
  return prisma.user.update({
    where: { id: userId },
    data: { avatar: avatarUrl },
    select: { id: true, avatar: true },
  });
};

export const getSavedProperties = async (
  userId: string,
  query: Record<string, unknown>,
) => {
  const { page, limit, skip } = getPaginationParams(query);

  const [items, total] = await Promise.all([
    prisma.savedProperty.findMany({
      where: { userId },
      skip,
      take: limit,
      orderBy: { savedAt: "desc" },
      include: {
        property: {
          include: {
            media: { where: { order: 1 }, take: 1 },
            agent: {
              select: { name: true, email: true, phone: true, rating: true },
            },
          },
        },
      },
    }),
    prisma.savedProperty.count({ where: { userId } }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const saveProperty = async (userId: string, propertyId: string) => {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
  });
  if (!property) throw new AppError("Property not found", 404);

  const existing = await prisma.savedProperty.findUnique({
    where: { userId_propertyId: { userId, propertyId } },
  });
  if (existing) throw new AppError("Property already saved", 409);

  return prisma.savedProperty.create({ data: { userId, propertyId } });
};

export const unsaveProperty = async (userId: string, propertyId: string) => {
  const existing = await prisma.savedProperty.findUnique({
    where: { userId_propertyId: { userId, propertyId } },
  });
  if (!existing) throw new AppError("Saved property not found", 404);
  await prisma.savedProperty.delete({
    where: { userId_propertyId: { userId, propertyId } },
  });
};

export const getSearchPreference = async (userId: string) => {
  return prisma.searchPreference.findUnique({ where: { userId } });
};

export const upsertSearchPreference = async (
  userId: string,
  data: UpdateSearchPreferenceInput,
) => {
  return prisma.searchPreference.upsert({
    where: { userId },
    update: data,
    create: {
      userId,
      keywords: data.keywords ?? [],
      avgPrice: data.avgPrice ?? 0,
      targetAreas: data.targetAreas ?? [],
    },
  });
};

export const getAIRecommendations = async (
  userId: string,
  query: Record<string, unknown>,
) => {
  const { page, limit, skip } = getPaginationParams(query);

  const [items, total] = await Promise.all([
    prisma.aIRecommendation.findMany({
      where: { userId },
      skip,
      take: limit,
      orderBy: { score: "desc" },
      include: {
        property: {
          include: {
            media: { where: { order: 1 }, take: 1 },
            agent: { select: { name: true, rating: true } },
          },
        },
      },
    }),
    prisma.aIRecommendation.count({ where: { userId } }),
  ]);

  // Mark as viewed
  await prisma.aIRecommendation.updateMany({
    where: { userId, viewed: false },
    data: { viewed: true },
  });

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
};
