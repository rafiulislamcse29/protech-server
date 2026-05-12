import { Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import multer from "multer";
import { v2 as cloudinaryV2 } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { verifyAccessToken } from "../utils/index";
import { AuthRequest, JwtPayload } from "../interfaces/index";
import { Role } from "../../generated/prisma/client";
import { config } from "../config/index";
import AppError from "../errorHelpers/AppError";

// ─── Auth Middleware ──────────────────────────────────────────────────────────
export const authenticate = (
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
): void => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : req.cookies?.["accessToken"];

    if (!token) {
      throw new AppError("Authentication required", 401);
    }

    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch {
    next(new AppError("Invalid or expired token", 401));
  }
};

// ─── Role Guard ───────────────────────────────────────────────────────────────
export const authorize = (...roles: Role[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError("Authentication required", 401));
    }
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action", 403),
      );
    }
    next();
  };
};


// ─── Cloudinary Upload ────────────────────────────────────────────────────────
cloudinaryV2.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

const avatarStorage = new CloudinaryStorage({
  cloudinary: cloudinaryV2,
  params: {
    folder: "proptech/avatars",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 400, height: 400, crop: "fill" }],
  } as object,
});

const propertyStorage = new CloudinaryStorage({
  cloudinary: cloudinaryV2,
  params: {
    folder: "proptech/properties",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 1200, quality: "auto" }],
  } as object,
});

export const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
}).single("avatar");

export const uploadPropertyMedia = multer({
  storage: propertyStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
}).array("media", 20);
