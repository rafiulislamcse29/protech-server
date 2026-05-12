import { Response } from "express";
import { AuthRequest } from "../../interfaces/index.js";
import { catchAsync } from "../../errorHelpers/index.js";
import { sendResponse } from "../../shared/index.js";
import { reviewService } from "./review.service.js";

export const createReview = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await reviewService.createReview(req.user!.userId, req.body);
  sendResponse({ res, statusCode: 201, success: true, message: "Review submitted successfully", data: result });
});

export const getPropertyReviews = catchAsync(async (req: AuthRequest, res: Response) => {
  const propertyId = req.params["propertyId"];
  const result = await reviewService.getPropertyReviews(propertyId as string, req.query as Record<string, unknown>);
  sendResponse({ res, statusCode: 200, success: true, message: "Reviews fetched", data: result.items, meta: { ...result, items: undefined } });
});

export const getMyReviews = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await reviewService.getUserReviews(req.user!.userId, req.query as Record<string, unknown>);
  sendResponse({ res, statusCode: 200, success: true, message: "Your reviews fetched", data: result.items, meta: { ...result, items: undefined } });
});

export const deleteReview = catchAsync(async (req: AuthRequest, res: Response) => {
  await reviewService.deleteReview(req.user!.userId, req.params["reviewId"] as string);
  sendResponse({ res, statusCode: 200, success: true, message: "Review deleted" });
});
