import { Response } from "express";
import { AuthRequest, MulterRequest } from "../../interfaces/index.js";
import { catchAsync } from "../../errorHelpers/index.js";
import { sendResponse, param } from "../../shared/index.js";
import * as userService from "./user.service.js";

export const getProfile = catchAsync(async (req: AuthRequest, res: Response) => {
  const user = await userService.getUserProfile(req.user!.userId);
  sendResponse({ res, statusCode: 200, success: true, message: "Profile fetched", data: user });
});

export const updateProfile = catchAsync(async (req: AuthRequest, res: Response) => {
  const user = await userService.updateUserProfile(req.user!.userId, req.body);
  sendResponse({ res, statusCode: 200, success: true, message: "Profile updated", data: user });
});

export const uploadAvatar = catchAsync(async (req: MulterRequest, res: Response) => {
  const file = req.file as Express.Multer.File & { path?: string };
  const avatarUrl = file?.path ?? (file as unknown as { secure_url?: string })?.secure_url;
  if (!avatarUrl) {
    res.status(400).json({ success: false, message: "No file uploaded" });
    return;
  }
  const user = await userService.updateAvatar(req.user!.userId, avatarUrl);
  sendResponse({ res, statusCode: 200, success: true, message: "Avatar updated", data: user });
});

export const getSavedProperties = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await userService.getSavedProperties(req.user!.userId, req.query as Record<string, unknown>);
  sendResponse({
    res, statusCode: 200, success: true, message: "Saved properties fetched",
    data: result.items,
    meta: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages },
  });
});

export const saveProperty = catchAsync(async (req: AuthRequest, res: Response) => {
  await userService.saveProperty(req.user!.userId, param(req.params["propertyId"]));
  sendResponse({ res, statusCode: 201, success: true, message: "Property saved" });
});

export const unsaveProperty = catchAsync(async (req: AuthRequest, res: Response) => {
  await userService.unsaveProperty(req.user!.userId, param(req.params["propertyId"]));
  sendResponse({ res, statusCode: 200, success: true, message: "Property removed from saved" });
});

export const getSearchPreference = catchAsync(async (req: AuthRequest, res: Response) => {
  const pref = await userService.getSearchPreference(req.user!.userId);
  sendResponse({ res, statusCode: 200, success: true, message: "Search preference fetched", data: pref });
});

export const upsertSearchPreference = catchAsync(async (req: AuthRequest, res: Response) => {
  const pref = await userService.upsertSearchPreference(req.user!.userId, req.body);
  sendResponse({ res, statusCode: 200, success: true, message: "Search preference saved", data: pref });
});

export const getAIRecommendations = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await userService.getAIRecommendations(req.user!.userId, req.query as Record<string, unknown>);
  sendResponse({
    res, statusCode: 200, success: true, message: "AI recommendations fetched",
    data: result.items,
    meta: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages },
  });
});
