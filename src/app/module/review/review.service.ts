import AppError from "@/app/errorHelpers/AppError.js";
import { prisma } from "../../lib/index.js";
import { getPaginationParams } from "../../shared/index.js";
import { CreateReviewInput } from "./review.validation.js";
import e from "express";

export const createReview = async (userId: string, data: CreateReviewInput) => {
  const property = await prisma.property.findUnique({
    where: { id: data.propertyId },
  });
  if (!property) throw new AppError("Property not found", 404);

  const existing = await prisma.review.findFirst({
    where: { userId, propertyId: data.propertyId },
  });
  if (existing) throw new AppError("You have already reviewed this property", 409);

  const review = await prisma.review.create({
    data: { userId, ...data },
    include: { user: { select: { name: true, avatar: true } } },
  });

  // Recalculate agent rating
  const agentReviews = await prisma.review.aggregate({
    where: { property: { agentId: property.agentId } },
    _avg: { rating: true },
  });

  if (agentReviews._avg.rating) {
    await prisma.agent.update({
      where: { id: property.agentId },
      data: { rating: agentReviews._avg.rating },
    });
  }

  return review;
};

export const getPropertyReviews = async (propertyId: string, query: Record<string, unknown>) => {
  const { page, limit, skip } = getPaginationParams(query);

  const [items, total] = await Promise.all([
    prisma.review.findMany({
      where: { propertyId },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, avatar: true } } },
    }),
    prisma.review.count({ where: { propertyId } }),
  ]);

  const avg = await prisma.review.aggregate({
    where: { propertyId },
    _avg: { rating: true },
  });

  return { items, total, page, limit, totalPages: Math.ceil(total / limit), avgRating: avg._avg.rating };
};

export const getUserReviews = async (userId: string, query: Record<string, unknown>) => {
  const { page, limit, skip } = getPaginationParams(query);

  const [items, total] = await Promise.all([
    prisma.review.findMany({
      where: { userId },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { property: { select: { title: true, address: true } } },
    }),
    prisma.review.count({ where: { userId } }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const deleteReview = async (userId: string, reviewId: string) => {
  const review = await prisma.review.findFirst({
    where: { id: reviewId, userId },
  });
  if (!review) throw new AppError("Review not found or not owned by you", 404);
  await prisma.review.delete({ where: { id: reviewId } });
};


export const reviewService = {
  createReview,
  getPropertyReviews,
  getUserReviews,
  deleteReview,
};