import { Response } from "express";
import { AuthRequest, MulterRequest, PropertySearchQuery } from "../../interfaces/index.js";
import { catchAsync } from "../../errorHelpers/index.js";
import { sendResponse, param } from "../../shared/index.js";
import * as propertyService from "./property.service.js";

export const createProperty = catchAsync(async (req: AuthRequest, res: Response) => {
  const property = await propertyService.createProperty(req.user!.userId, req.body);
  sendResponse({ res, statusCode: 201, success: true, message: "Property created", data: property });
});

export const getProperties = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await propertyService.getProperties(req.query as PropertySearchQuery);
  sendResponse({
    res, statusCode: 200, success: true, message: "Properties fetched",
    data: result.items,
    meta: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages },
  });
});

export const getPropertyById = catchAsync(async (req: AuthRequest, res: Response) => {
  const property = await propertyService.getPropertyById(param(req.params["propertyId"]));
  sendResponse({ res, statusCode: 200, success: true, message: "Property fetched", data: property });
});

export const updateProperty = catchAsync(async (req: AuthRequest, res: Response) => {
  const property = await propertyService.updateProperty(
    req.user!.userId,
    param(req.params["propertyId"]),
    req.body,
  );
  sendResponse({ res, statusCode: 200, success: true, message: "Property updated", data: property });
});

export const deleteProperty = catchAsync(async (req: AuthRequest, res: Response) => {
  await propertyService.deleteProperty(req.user!.userId, param(req.params["propertyId"]));
  sendResponse({ res, statusCode: 200, success: true, message: "Property deleted" });
});

export const getMyListings = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await propertyService.getMyListings(req.user!.userId, req.query as PropertySearchQuery);
  sendResponse({
    res, statusCode: 200, success: true, message: "My listings fetched",
    data: result.items,
    meta: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages },
  });
});

// ─── Media ────────────────────────────────────────────────────────────────────
export const addMedia = catchAsync(async (req: AuthRequest, res: Response) => {
  const file = req.file;
  // if (!file) {
  //   res.status(400).json({ success: false, message: "No file uploaded" });
  //   return;
  // }
  const data: any = {
    ...req.body,
    type: req.body.type,
    order: req.body.order || 0,
    altText: req.body.altText,
    url: file?.path || req.body.url,
  }
  const media = await propertyService.addMedia(
    req.user!.userId,
    param(req.params["propertyId"]),
    data
  );
  sendResponse({ res, statusCode: 201, success: true, message: "Media added", data: media });
});

export const uploadMedia = catchAsync(async (req: MulterRequest, res: Response) => {
  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) {
    res.status(400).json({ success: false, message: "No files uploaded" });
    return;
  }
  const result = await propertyService.uploadPropertyMedia(
    req.user!.userId,
    param(req.params["propertyId"]),
    files,
  );
  sendResponse({ res, statusCode: 201, success: true, message: "Media uploaded", data: result });
});

export const deleteMedia = catchAsync(async (req: AuthRequest, res: Response) => {
  await propertyService.deleteMedia(req.user!.userId, param(req.params["mediaId"]));
  sendResponse({ res, statusCode: 200, success: true, message: "Media deleted" });
});

// ─── Neighborhood ─────────────────────────────────────────────────────────────
export const getNeighborhood = catchAsync(async (req: AuthRequest, res: Response) => {
  const data = await propertyService.getNeighborhoodByZip(param(req.params["zip"]));
  sendResponse({ res, statusCode: 200, success: true, message: "Neighborhood data fetched", data });
});

// ─── Similar ──────────────────────────────────────────────────────────────────
export const getSimilarProperties = catchAsync(async (req: AuthRequest, res: Response) => {
  const data = await propertyService.getSimilarProperties(param(req.params["propertyId"]));
  sendResponse({ res, statusCode: 200, success: true, message: "Similar properties fetched", data });
});
