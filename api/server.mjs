var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/app.ts
import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

// src/app/config/index.ts
import "dotenv/config";
var config = {
  port: process.env["PORT"] || 5e3,
  nodeEnv: process.env["NODE_ENV"] || "development",
  db: {
    url: process.env["DATABASE_URL"]
  },
  jwt: {
    accessSecret: process.env["JWT_ACCESS_SECRET"] || "access_secret_change_me",
    refreshSecret: process.env["JWT_REFRESH_SECRET"] || "refresh_secret_change_me",
    accessExpiresIn: process.env["JWT_ACCESS_EXPIRES_IN"] || "15m",
    refreshExpiresIn: process.env["JWT_REFRESH_EXPIRES_IN"] || "7d"
  },
  cloudinary: {
    cloudName: process.env["CLOUDINARY_CLOUD_NAME"],
    apiKey: process.env["CLOUDINARY_API_KEY"],
    apiSecret: process.env["CLOUDINARY_API_SECRET"]
  },
  email: {
    host: process.env["EMAIL_HOST"] || "smtp.gmail.com",
    port: Number(process.env["EMAIL_PORT"]) || 587,
    user: process.env["EMAIL_USER"],
    pass: process.env["EMAIL_PASS"],
    from: process.env["EMAIL_FROM"] || "noreply@proptech.ai"
  },
  cors: {
    origin: process.env["CLIENT_URL"] || "http://localhost:3000"
  },
  openRouter: {
    apiKey: process.env["OPENROUTER_API_KEY"],
    baseUrl: "https://openrouter.ai/api/v1",
    model: process.env["OPENROUTER_MODEL"] || "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
    siteUrl: process.env["CLIENT_URL"] || "http://localhost:3000",
    siteName: "PropTech AI"
  }
};

// src/app/routes/index.ts
import { Router as Router10 } from "express";

// src/app/module/auth/auth.routes.ts
import { Router } from "express";

// src/app/middleware/index.ts
import multer from "multer";
import { v2 as cloudinaryV2 } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

// src/app/utils/index.ts
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
var hashPassword = async (password) => {
  return bcrypt.hash(password, 12);
};
var comparePassword = async (plain, hashed) => {
  return bcrypt.compare(plain, hashed);
};
var signAccessToken = (payload) => {
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn
  });
};
var signRefreshToken = (payload) => {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn
  });
};
var verifyAccessToken = (token) => {
  return jwt.verify(token, config.jwt.accessSecret);
};
var verifyRefreshToken = (token) => {
  return jwt.verify(token, config.jwt.refreshSecret);
};
var addDays = (days) => {
  const date = /* @__PURE__ */ new Date();
  date.setDate(date.getDate() + days);
  return date;
};

// src/app/errorHelpers/AppError.ts
var AppError = class extends Error {
  statusCode;
  status;
  constructor(message, statusCode, stack = "") {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
};
var AppError_default = AppError;

// src/app/middleware/index.ts
var authenticate = (req, _res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : req.cookies?.["accessToken"];
    if (!token) {
      throw new AppError_default("Authentication required", 401);
    }
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch {
    next(new AppError_default("Invalid or expired token", 401));
  }
};
var authorize = (...roles) => {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new AppError_default("Authentication required", 401));
    }
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError_default("You do not have permission to perform this action", 403)
      );
    }
    next();
  };
};
cloudinaryV2.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret
});
var avatarStorage = new CloudinaryStorage({
  cloudinary: cloudinaryV2,
  params: {
    folder: "proptech/avatars",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 400, height: 400, crop: "fill" }]
  }
});
var propertyStorage = new CloudinaryStorage({
  cloudinary: cloudinaryV2,
  params: {
    folder: "proptech/properties",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 1200, quality: "auto" }]
  }
});
var uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 }
  // 5MB
}).single("avatar");
var uploadPropertyMedia = multer({
  storage: propertyStorage,
  limits: { fileSize: 10 * 1024 * 1024 }
  // 10MB
}).array("media", 20);

// src/app/module/auth/auth.validation.ts
import { z } from "zod";
var registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["BUYER", "AGENT"]).default("BUYER")
});
var loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters long")
});
var refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required")
});
var changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters")
});
var seedAdminSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  seedSecret: z.string(),
  department: z.string().optional()
});

// src/app/errorHelpers/index.ts
var catchAsync = (fn) => {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};

// src/app/shared/index.ts
var sendResponse = ({
  res,
  statusCode,
  success,
  message,
  data,
  meta
}) => {
  const payload = { success, message };
  if (data !== void 0) payload["data"] = data;
  if (meta !== void 0) payload["meta"] = meta;
  res.status(statusCode).json(payload);
};
var getPaginationParams = (query) => {
  const page = Math.max(1, Number(query["page"]) || 1);
  const limit = Math.min(100, Math.max(1, Number(query["limit"]) || 10));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};
var param = (value) => {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
};

// src/generated/prisma/client.ts
import * as path from "path";
import { fileURLToPath } from "url";

// src/generated/prisma/internal/class.ts
import * as runtime from "@prisma/client/runtime/client";
var config2 = {
  "previewFeatures": [],
  "clientVersion": "7.8.0",
  "engineVersion": "3c6e192761c0362d496ed980de936e2f3cebcd3a",
  "activeProvider": "postgresql",
  "inlineSchema": 'model User {\n  id               String             @id @default(uuid()) @db.Uuid\n  email            String             @unique\n  password         String\n  name             String\n  role             Role\n  isActive         Boolean            @default(true)\n  avatar           String?\n  createdAt        DateTime           @default(now())\n  updatedAt        DateTime           @updatedAt\n  sessions         Session[]\n  agent            Agent?\n  reviews          Review[]\n  inquiries        Inquiry[]          @relation("BuyerInquiries")\n  savedProperties  SavedProperty[]\n  searchPreference SearchPreference?\n  recommendations  AIRecommendation[]\n  auditLogs        AuditLog[]\n  notifications    Notification[]\n  admin            Admin?\n\n  @@index([email])\n  @@map("users")\n}\n\nmodel Session {\n  id        String   @id @default(uuid()) @db.Uuid\n  userId    String   @db.Uuid\n  token     String   @unique\n  ipAddress String?\n  userAgent String?\n  expiresAt DateTime\n  createdAt DateTime @default(now())\n  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@index([userId])\n  @@index([token])\n  @@map("sessions")\n}\n\nenum AgentStatus {\n  PENDING\n  APPROVED\n  REJECTED\n}\n\nmodel Agent {\n  id              String      @id @default(uuid()) @db.Uuid\n  userId          String      @unique @db.Uuid\n  licenseNumber   String      @unique\n  specialties     String[]\n  name            String?\n  email           String?     @unique\n  bio             String?     @db.Text\n  phone           String?\n  experienceYears Int?\n  rating          Float       @default(0.0)\n  status          AgentStatus @default(PENDING)\n  reviewedBy      String?     @db.Uuid\n  reviewedAt      DateTime?\n  reviewNote      String?     @db.Text\n  createdAt       DateTime    @default(now())\n  updatedAt       DateTime    @updatedAt\n  user            User        @relation(fields: [userId], references: [id], onDelete: Cascade)\n  properties      Property[]\n  agentInquiries  Inquiry[]   @relation("AgentInquiries")\n\n  @@index([userId])\n  @@index([status])\n  @@map("agents")\n}\n\nmodel Admin {\n  id            String    @id @default(uuid()) @db.Uuid\n  name          String?\n  email         String?   @unique\n  profilePhoto  String?\n  contactNumber String?\n  isDeleted     Boolean   @default(false)\n  deletedAt     DateTime?\n  userId        String    @unique @db.Uuid\n  permissions   String[]\n  department    String?\n  accessLevel   Int       @default(1)\n  createdAt     DateTime  @default(now())\n  updatedAt     DateTime  @updatedAt\n  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@index([userId])\n  @@map("admins")\n}\n\nmodel AuditLog {\n  id            String   @id @default(uuid()) @db.Uuid\n  userId        String   @db.Uuid\n  action        String\n  tokenCount    Int\n  estimatedCost Decimal  @db.Decimal(10, 4)\n  createdAt     DateTime @default(now())\n  updatedAt     DateTime @updatedAt\n  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@index([userId])\n  @@index([action])\n  @@map("audit_logs")\n}\n\nenum Role {\n  BUYER\n  AGENT\n  ADMIN\n  SUPER_ADMIN\n}\n\nenum InquiryStatus {\n  PENDING\n  VIEWED\n  REPLIED\n  ARCHIVED\n}\n\nenum NotificationType {\n  AI_RECOMMENDATION\n  NEW_INQUIRY\n  INQUIRY_REPLY\n  PRICE_DROP\n  SYSTEM_ALERT\n}\n\nenum PropertyType {\n  HOUSE\n  APARTMENT\n  CONDO\n  TOWNHOUSE\n  LAND\n  COMMERCIAL\n}\n\nenum PropertyStatus {\n  AVAILABLE\n  PENDING\n  SOLD\n  RENTED\n}\n\nenum MediaType {\n  IMAGE\n  VIDEO\n  VIRTUAL_TOUR\n  LINK\n  YOUTUBE\n  MAP\n}\n\nmodel Review {\n  id         String   @id @default(uuid()) @db.Uuid\n  rating     Int\n  comment    String?  @db.Text\n  sentiment  Float?\n  aiSummary  String?\n  userId     String   @db.Uuid\n  propertyId String   @db.Uuid\n  createdAt  DateTime @default(now())\n  updatedAt  DateTime @updatedAt\n  user       User     @relation(fields: [userId], references: [id])\n  property   Property @relation(fields: [propertyId], references: [id])\n\n  @@index([userId])\n  @@index([propertyId])\n  @@map("reviews")\n}\n\nmodel SavedProperty {\n  userId     String   @db.Uuid\n  propertyId String   @db.Uuid\n  savedAt    DateTime @default(now())\n  createdAt  DateTime @default(now())\n  updatedAt  DateTime @updatedAt\n  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)\n  property   Property @relation(fields: [propertyId], references: [id], onDelete: Cascade)\n\n  @@id([userId, propertyId])\n  @@index([userId])\n  @@index([propertyId])\n  @@map("saved_properties")\n}\n\nmodel Inquiry {\n  id         String        @id @default(uuid()) @db.Uuid\n  buyerId    String        @db.Uuid\n  agentId    String        @db.Uuid\n  propertyId String        @db.Uuid\n  message    String        @db.Text\n  status     InquiryStatus @default(PENDING)\n  createdAt  DateTime      @default(now())\n  updatedAt  DateTime      @updatedAt\n  buyer      User          @relation("BuyerInquiries", fields: [buyerId], references: [id])\n  agent      Agent         @relation("AgentInquiries", fields: [agentId], references: [id])\n  property   Property      @relation(fields: [propertyId], references: [id])\n\n  @@index([buyerId])\n  @@index([agentId])\n  @@index([propertyId])\n  @@map("inquiries")\n}\n\nmodel Notification {\n  id        String           @id @default(uuid()) @db.Uuid\n  userId    String           @db.Uuid\n  type      NotificationType\n  title     String\n  message   String\n  link      String?\n  metadata  Json?\n  isRead    Boolean          @default(false)\n  createdAt DateTime         @default(now())\n  updatedAt DateTime         @updatedAt\n  user      User             @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@index([userId])\n  @@map("notifications")\n}\n\nmodel SearchPreference {\n  id          String   @id @default(uuid()) @db.Uuid\n  userId      String   @unique @db.Uuid\n  keywords    String[]\n  avgPrice    Decimal  @db.Decimal(12, 2)\n  targetAreas String[]\n  createdAt   DateTime @default(now())\n  updatedAt   DateTime @updatedAt\n  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@index([userId])\n  @@map("search_preferences")\n}\n\nmodel AIRecommendation {\n  id         String   @id @default(uuid()) @db.Uuid\n  userId     String   @db.Uuid\n  propertyId String   @db.Uuid\n  reason     String\n  score      Float\n  viewed     Boolean  @default(false)\n  createdAt  DateTime @default(now())\n  updatedAt  DateTime @updatedAt\n  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)\n  property   Property @relation(fields: [propertyId], references: [id], onDelete: Cascade)\n\n  @@index([userId])\n  @@index([propertyId])\n  @@map("ai_recommendations")\n}\n\nmodel Property {\n  id               String             @id @default(uuid()) @db.Uuid\n  title            String\n  description      String             @db.Text\n  shortDescription String?            @db.Text\n  price            Decimal            @db.Decimal(12, 2)\n  address          String\n  city             String\n  state            String\n  zip              String\n  lat              Float?\n  lng              Float?\n  beds             Int\n  baths            Float\n  sqft             Int\n  lotSize          Float?\n  yearBuilt        Int?\n  type             PropertyType\n  status           PropertyStatus\n  agentId          String             @db.Uuid\n  aiFeatures       Json               @default("{}")\n  tags             String[]\n  highlights       String[]\n  createdAt        DateTime           @default(now())\n  updatedAt        DateTime           @updatedAt\n  agent            Agent              @relation(fields: [agentId], references: [id])\n  media            Media[]\n  reviews          Review[]\n  savedBy          SavedProperty[]\n  inquiries        Inquiry[]\n  recommendations  AIRecommendation[]\n  similarFrom      SimilarProperty[]  @relation("PropertySimilar")\n  similarTo        SimilarProperty[]  @relation("SimilarToProperty")\n\n  @@index([agentId])\n  @@index([city])\n  @@index([zip])\n  @@index([type])\n  @@index([status])\n  @@index([beds, price, status])\n  @@map("properties")\n}\n\nmodel Media {\n  id         String    @id @default(uuid()) @db.Uuid\n  propertyId String    @db.Uuid\n  url        String\n  type       MediaType\n  order      Int?\n  altText    String?\n  createdAt  DateTime  @default(now())\n  updatedAt  DateTime  @updatedAt\n  property   Property  @relation(fields: [propertyId], references: [id], onDelete: Cascade)\n\n  @@index([propertyId])\n  @@map("media")\n}\n\nmodel SimilarProperty {\n  id              String   @id @default(uuid()) @db.Uuid\n  propertyId      String   @db.Uuid\n  similarId       String   @db.Uuid\n  similarityScore Float\n  matchCriteria   Json?\n  updatedAt       DateTime @updatedAt\n  property        Property @relation("PropertySimilar", fields: [propertyId], references: [id])\n  similar         Property @relation("SimilarToProperty", fields: [similarId], references: [id])\n\n  @@index([propertyId])\n  @@index([similarId])\n  @@map("similar_properties")\n}\n\nmodel Neighborhood {\n  id           String    @id @default(uuid()) @db.Uuid\n  zip          String?   @unique\n  name         String?\n  city         String?\n  safetyScore  Int?\n  schoolScore  Int?\n  transitScore Int?\n  marketTrend  Json?\n  aiAnalysis   String?   @db.Text\n  expiresAt    DateTime?\n  createdAt    DateTime  @default(now())\n  updatedAt    DateTime  @updatedAt\n\n  @@index([zip])\n  @@map("neighborhoods")\n}\n\n// This is your Prisma schema file,\n// learn more about it in the docs: https://pris.ly/d/prisma-schema\n\n// Get a free hosted Postgres database in seconds: `npx create-db`\n\ngenerator client {\n  provider = "prisma-client"\n  output   = "../../src/generated/prisma"\n}\n\ndatasource db {\n  provider = "postgresql"\n}\n',
  "runtimeDataModel": {
    "models": {},
    "enums": {},
    "types": {}
  },
  "parameterizationSchema": {
    "strings": [],
    "graph": ""
  }
};
config2.runtimeDataModel = JSON.parse('{"models":{"User":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"email","kind":"scalar","type":"String"},{"name":"password","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"role","kind":"enum","type":"Role"},{"name":"isActive","kind":"scalar","type":"Boolean"},{"name":"avatar","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"sessions","kind":"object","type":"Session","relationName":"SessionToUser"},{"name":"agent","kind":"object","type":"Agent","relationName":"AgentToUser"},{"name":"reviews","kind":"object","type":"Review","relationName":"ReviewToUser"},{"name":"inquiries","kind":"object","type":"Inquiry","relationName":"BuyerInquiries"},{"name":"savedProperties","kind":"object","type":"SavedProperty","relationName":"SavedPropertyToUser"},{"name":"searchPreference","kind":"object","type":"SearchPreference","relationName":"SearchPreferenceToUser"},{"name":"recommendations","kind":"object","type":"AIRecommendation","relationName":"AIRecommendationToUser"},{"name":"auditLogs","kind":"object","type":"AuditLog","relationName":"AuditLogToUser"},{"name":"notifications","kind":"object","type":"Notification","relationName":"NotificationToUser"},{"name":"admin","kind":"object","type":"Admin","relationName":"AdminToUser"}],"dbName":"users"},"Session":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"token","kind":"scalar","type":"String"},{"name":"ipAddress","kind":"scalar","type":"String"},{"name":"userAgent","kind":"scalar","type":"String"},{"name":"expiresAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"user","kind":"object","type":"User","relationName":"SessionToUser"}],"dbName":"sessions"},"Agent":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"licenseNumber","kind":"scalar","type":"String"},{"name":"specialties","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"email","kind":"scalar","type":"String"},{"name":"bio","kind":"scalar","type":"String"},{"name":"phone","kind":"scalar","type":"String"},{"name":"experienceYears","kind":"scalar","type":"Int"},{"name":"rating","kind":"scalar","type":"Float"},{"name":"status","kind":"enum","type":"AgentStatus"},{"name":"reviewedBy","kind":"scalar","type":"String"},{"name":"reviewedAt","kind":"scalar","type":"DateTime"},{"name":"reviewNote","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"user","kind":"object","type":"User","relationName":"AgentToUser"},{"name":"properties","kind":"object","type":"Property","relationName":"AgentToProperty"},{"name":"agentInquiries","kind":"object","type":"Inquiry","relationName":"AgentInquiries"}],"dbName":"agents"},"Admin":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"email","kind":"scalar","type":"String"},{"name":"profilePhoto","kind":"scalar","type":"String"},{"name":"contactNumber","kind":"scalar","type":"String"},{"name":"isDeleted","kind":"scalar","type":"Boolean"},{"name":"deletedAt","kind":"scalar","type":"DateTime"},{"name":"userId","kind":"scalar","type":"String"},{"name":"permissions","kind":"scalar","type":"String"},{"name":"department","kind":"scalar","type":"String"},{"name":"accessLevel","kind":"scalar","type":"Int"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"user","kind":"object","type":"User","relationName":"AdminToUser"}],"dbName":"admins"},"AuditLog":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"action","kind":"scalar","type":"String"},{"name":"tokenCount","kind":"scalar","type":"Int"},{"name":"estimatedCost","kind":"scalar","type":"Decimal"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"user","kind":"object","type":"User","relationName":"AuditLogToUser"}],"dbName":"audit_logs"},"Review":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"rating","kind":"scalar","type":"Int"},{"name":"comment","kind":"scalar","type":"String"},{"name":"sentiment","kind":"scalar","type":"Float"},{"name":"aiSummary","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"propertyId","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"user","kind":"object","type":"User","relationName":"ReviewToUser"},{"name":"property","kind":"object","type":"Property","relationName":"PropertyToReview"}],"dbName":"reviews"},"SavedProperty":{"fields":[{"name":"userId","kind":"scalar","type":"String"},{"name":"propertyId","kind":"scalar","type":"String"},{"name":"savedAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"user","kind":"object","type":"User","relationName":"SavedPropertyToUser"},{"name":"property","kind":"object","type":"Property","relationName":"PropertyToSavedProperty"}],"dbName":"saved_properties"},"Inquiry":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"buyerId","kind":"scalar","type":"String"},{"name":"agentId","kind":"scalar","type":"String"},{"name":"propertyId","kind":"scalar","type":"String"},{"name":"message","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"InquiryStatus"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"buyer","kind":"object","type":"User","relationName":"BuyerInquiries"},{"name":"agent","kind":"object","type":"Agent","relationName":"AgentInquiries"},{"name":"property","kind":"object","type":"Property","relationName":"InquiryToProperty"}],"dbName":"inquiries"},"Notification":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"type","kind":"enum","type":"NotificationType"},{"name":"title","kind":"scalar","type":"String"},{"name":"message","kind":"scalar","type":"String"},{"name":"link","kind":"scalar","type":"String"},{"name":"metadata","kind":"scalar","type":"Json"},{"name":"isRead","kind":"scalar","type":"Boolean"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"user","kind":"object","type":"User","relationName":"NotificationToUser"}],"dbName":"notifications"},"SearchPreference":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"keywords","kind":"scalar","type":"String"},{"name":"avgPrice","kind":"scalar","type":"Decimal"},{"name":"targetAreas","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"user","kind":"object","type":"User","relationName":"SearchPreferenceToUser"}],"dbName":"search_preferences"},"AIRecommendation":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"propertyId","kind":"scalar","type":"String"},{"name":"reason","kind":"scalar","type":"String"},{"name":"score","kind":"scalar","type":"Float"},{"name":"viewed","kind":"scalar","type":"Boolean"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"user","kind":"object","type":"User","relationName":"AIRecommendationToUser"},{"name":"property","kind":"object","type":"Property","relationName":"AIRecommendationToProperty"}],"dbName":"ai_recommendations"},"Property":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"title","kind":"scalar","type":"String"},{"name":"description","kind":"scalar","type":"String"},{"name":"shortDescription","kind":"scalar","type":"String"},{"name":"price","kind":"scalar","type":"Decimal"},{"name":"address","kind":"scalar","type":"String"},{"name":"city","kind":"scalar","type":"String"},{"name":"state","kind":"scalar","type":"String"},{"name":"zip","kind":"scalar","type":"String"},{"name":"lat","kind":"scalar","type":"Float"},{"name":"lng","kind":"scalar","type":"Float"},{"name":"beds","kind":"scalar","type":"Int"},{"name":"baths","kind":"scalar","type":"Float"},{"name":"sqft","kind":"scalar","type":"Int"},{"name":"lotSize","kind":"scalar","type":"Float"},{"name":"yearBuilt","kind":"scalar","type":"Int"},{"name":"type","kind":"enum","type":"PropertyType"},{"name":"status","kind":"enum","type":"PropertyStatus"},{"name":"agentId","kind":"scalar","type":"String"},{"name":"aiFeatures","kind":"scalar","type":"Json"},{"name":"tags","kind":"scalar","type":"String"},{"name":"highlights","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"agent","kind":"object","type":"Agent","relationName":"AgentToProperty"},{"name":"media","kind":"object","type":"Media","relationName":"MediaToProperty"},{"name":"reviews","kind":"object","type":"Review","relationName":"PropertyToReview"},{"name":"savedBy","kind":"object","type":"SavedProperty","relationName":"PropertyToSavedProperty"},{"name":"inquiries","kind":"object","type":"Inquiry","relationName":"InquiryToProperty"},{"name":"recommendations","kind":"object","type":"AIRecommendation","relationName":"AIRecommendationToProperty"},{"name":"similarFrom","kind":"object","type":"SimilarProperty","relationName":"PropertySimilar"},{"name":"similarTo","kind":"object","type":"SimilarProperty","relationName":"SimilarToProperty"}],"dbName":"properties"},"Media":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"propertyId","kind":"scalar","type":"String"},{"name":"url","kind":"scalar","type":"String"},{"name":"type","kind":"enum","type":"MediaType"},{"name":"order","kind":"scalar","type":"Int"},{"name":"altText","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"property","kind":"object","type":"Property","relationName":"MediaToProperty"}],"dbName":"media"},"SimilarProperty":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"propertyId","kind":"scalar","type":"String"},{"name":"similarId","kind":"scalar","type":"String"},{"name":"similarityScore","kind":"scalar","type":"Float"},{"name":"matchCriteria","kind":"scalar","type":"Json"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"property","kind":"object","type":"Property","relationName":"PropertySimilar"},{"name":"similar","kind":"object","type":"Property","relationName":"SimilarToProperty"}],"dbName":"similar_properties"},"Neighborhood":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"zip","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"city","kind":"scalar","type":"String"},{"name":"safetyScore","kind":"scalar","type":"Int"},{"name":"schoolScore","kind":"scalar","type":"Int"},{"name":"transitScore","kind":"scalar","type":"Int"},{"name":"marketTrend","kind":"scalar","type":"Json"},{"name":"aiAnalysis","kind":"scalar","type":"String"},{"name":"expiresAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":"neighborhoods"}},"enums":{},"types":{}}');
config2.parameterizationSchema = {
  strings: JSON.parse('["where","orderBy","cursor","user","sessions","agent","property","media","reviews","savedBy","buyer","inquiries","recommendations","similar","similarFrom","similarTo","_count","properties","agentInquiries","savedProperties","searchPreference","auditLogs","notifications","admin","User.findUnique","User.findUniqueOrThrow","User.findFirst","User.findFirstOrThrow","User.findMany","data","User.createOne","User.createMany","User.createManyAndReturn","User.updateOne","User.updateMany","User.updateManyAndReturn","create","update","User.upsertOne","User.deleteOne","User.deleteMany","having","_min","_max","User.groupBy","User.aggregate","Session.findUnique","Session.findUniqueOrThrow","Session.findFirst","Session.findFirstOrThrow","Session.findMany","Session.createOne","Session.createMany","Session.createManyAndReturn","Session.updateOne","Session.updateMany","Session.updateManyAndReturn","Session.upsertOne","Session.deleteOne","Session.deleteMany","Session.groupBy","Session.aggregate","Agent.findUnique","Agent.findUniqueOrThrow","Agent.findFirst","Agent.findFirstOrThrow","Agent.findMany","Agent.createOne","Agent.createMany","Agent.createManyAndReturn","Agent.updateOne","Agent.updateMany","Agent.updateManyAndReturn","Agent.upsertOne","Agent.deleteOne","Agent.deleteMany","_avg","_sum","Agent.groupBy","Agent.aggregate","Admin.findUnique","Admin.findUniqueOrThrow","Admin.findFirst","Admin.findFirstOrThrow","Admin.findMany","Admin.createOne","Admin.createMany","Admin.createManyAndReturn","Admin.updateOne","Admin.updateMany","Admin.updateManyAndReturn","Admin.upsertOne","Admin.deleteOne","Admin.deleteMany","Admin.groupBy","Admin.aggregate","AuditLog.findUnique","AuditLog.findUniqueOrThrow","AuditLog.findFirst","AuditLog.findFirstOrThrow","AuditLog.findMany","AuditLog.createOne","AuditLog.createMany","AuditLog.createManyAndReturn","AuditLog.updateOne","AuditLog.updateMany","AuditLog.updateManyAndReturn","AuditLog.upsertOne","AuditLog.deleteOne","AuditLog.deleteMany","AuditLog.groupBy","AuditLog.aggregate","Review.findUnique","Review.findUniqueOrThrow","Review.findFirst","Review.findFirstOrThrow","Review.findMany","Review.createOne","Review.createMany","Review.createManyAndReturn","Review.updateOne","Review.updateMany","Review.updateManyAndReturn","Review.upsertOne","Review.deleteOne","Review.deleteMany","Review.groupBy","Review.aggregate","SavedProperty.findUnique","SavedProperty.findUniqueOrThrow","SavedProperty.findFirst","SavedProperty.findFirstOrThrow","SavedProperty.findMany","SavedProperty.createOne","SavedProperty.createMany","SavedProperty.createManyAndReturn","SavedProperty.updateOne","SavedProperty.updateMany","SavedProperty.updateManyAndReturn","SavedProperty.upsertOne","SavedProperty.deleteOne","SavedProperty.deleteMany","SavedProperty.groupBy","SavedProperty.aggregate","Inquiry.findUnique","Inquiry.findUniqueOrThrow","Inquiry.findFirst","Inquiry.findFirstOrThrow","Inquiry.findMany","Inquiry.createOne","Inquiry.createMany","Inquiry.createManyAndReturn","Inquiry.updateOne","Inquiry.updateMany","Inquiry.updateManyAndReturn","Inquiry.upsertOne","Inquiry.deleteOne","Inquiry.deleteMany","Inquiry.groupBy","Inquiry.aggregate","Notification.findUnique","Notification.findUniqueOrThrow","Notification.findFirst","Notification.findFirstOrThrow","Notification.findMany","Notification.createOne","Notification.createMany","Notification.createManyAndReturn","Notification.updateOne","Notification.updateMany","Notification.updateManyAndReturn","Notification.upsertOne","Notification.deleteOne","Notification.deleteMany","Notification.groupBy","Notification.aggregate","SearchPreference.findUnique","SearchPreference.findUniqueOrThrow","SearchPreference.findFirst","SearchPreference.findFirstOrThrow","SearchPreference.findMany","SearchPreference.createOne","SearchPreference.createMany","SearchPreference.createManyAndReturn","SearchPreference.updateOne","SearchPreference.updateMany","SearchPreference.updateManyAndReturn","SearchPreference.upsertOne","SearchPreference.deleteOne","SearchPreference.deleteMany","SearchPreference.groupBy","SearchPreference.aggregate","AIRecommendation.findUnique","AIRecommendation.findUniqueOrThrow","AIRecommendation.findFirst","AIRecommendation.findFirstOrThrow","AIRecommendation.findMany","AIRecommendation.createOne","AIRecommendation.createMany","AIRecommendation.createManyAndReturn","AIRecommendation.updateOne","AIRecommendation.updateMany","AIRecommendation.updateManyAndReturn","AIRecommendation.upsertOne","AIRecommendation.deleteOne","AIRecommendation.deleteMany","AIRecommendation.groupBy","AIRecommendation.aggregate","Property.findUnique","Property.findUniqueOrThrow","Property.findFirst","Property.findFirstOrThrow","Property.findMany","Property.createOne","Property.createMany","Property.createManyAndReturn","Property.updateOne","Property.updateMany","Property.updateManyAndReturn","Property.upsertOne","Property.deleteOne","Property.deleteMany","Property.groupBy","Property.aggregate","Media.findUnique","Media.findUniqueOrThrow","Media.findFirst","Media.findFirstOrThrow","Media.findMany","Media.createOne","Media.createMany","Media.createManyAndReturn","Media.updateOne","Media.updateMany","Media.updateManyAndReturn","Media.upsertOne","Media.deleteOne","Media.deleteMany","Media.groupBy","Media.aggregate","SimilarProperty.findUnique","SimilarProperty.findUniqueOrThrow","SimilarProperty.findFirst","SimilarProperty.findFirstOrThrow","SimilarProperty.findMany","SimilarProperty.createOne","SimilarProperty.createMany","SimilarProperty.createManyAndReturn","SimilarProperty.updateOne","SimilarProperty.updateMany","SimilarProperty.updateManyAndReturn","SimilarProperty.upsertOne","SimilarProperty.deleteOne","SimilarProperty.deleteMany","SimilarProperty.groupBy","SimilarProperty.aggregate","Neighborhood.findUnique","Neighborhood.findUniqueOrThrow","Neighborhood.findFirst","Neighborhood.findFirstOrThrow","Neighborhood.findMany","Neighborhood.createOne","Neighborhood.createMany","Neighborhood.createManyAndReturn","Neighborhood.updateOne","Neighborhood.updateMany","Neighborhood.updateManyAndReturn","Neighborhood.upsertOne","Neighborhood.deleteOne","Neighborhood.deleteMany","Neighborhood.groupBy","Neighborhood.aggregate","AND","OR","NOT","id","zip","name","city","safetyScore","schoolScore","transitScore","marketTrend","aiAnalysis","expiresAt","createdAt","updatedAt","equals","in","notIn","lt","lte","gt","gte","not","string_contains","string_starts_with","string_ends_with","array_starts_with","array_ends_with","array_contains","contains","startsWith","endsWith","propertyId","similarId","similarityScore","matchCriteria","url","MediaType","type","order","altText","title","description","shortDescription","price","address","state","lat","lng","beds","baths","sqft","lotSize","yearBuilt","PropertyType","PropertyStatus","status","agentId","aiFeatures","tags","highlights","has","hasEvery","hasSome","userId","reason","score","viewed","keywords","avgPrice","targetAreas","NotificationType","message","link","metadata","isRead","buyerId","InquiryStatus","savedAt","rating","comment","sentiment","aiSummary","action","tokenCount","estimatedCost","email","profilePhoto","contactNumber","isDeleted","deletedAt","permissions","department","accessLevel","licenseNumber","specialties","bio","phone","experienceYears","AgentStatus","reviewedBy","reviewedAt","reviewNote","every","some","none","token","ipAddress","userAgent","password","Role","role","isActive","avatar","userId_propertyId","is","isNot","connectOrCreate","upsert","createMany","set","disconnect","delete","connect","updateMany","deleteMany","push","increment","decrement","multiply","divide"]'),
  graph: "ggiQAfABFgQAAP4DACAFAAD_AwAgCAAAgAQAIAsAAPQDACAMAACDBAAgEwAAgQQAIBQAAIIEACAVAACEBAAgFgAAhQQAIBcAAIYEACCQAgAA-wMAMJECAABIABCSAgAA-wMAMJMCAQAAAAGVAgEA_AMAIZ0CQAC1AwAhngJAALUDACHmAgEAAAAB_QIBAPwDACH_AgAA_QP_AiKAAyAA5wMAIYEDAQCxAwAhAQAAAAEAIAsDAADZAwAgkAIAAJwEADCRAgAAAwAQkgIAAJwEADCTAgEAsAMAIZwCQAC1AwAhnQJAALUDACHQAgEAsAMAIfoCAQD8AwAh-wIBALEDACH8AgEAsQMAIQMDAADHBQAg-wIAAJ0EACD8AgAAnQQAIAsDAADZAwAgkAIAAJwEADCRAgAAAwAQkgIAAJwEADCTAgEAAAABnAJAALUDACGdAkAAtQMAIdACAQCwAwAh-gIBAAAAAfsCAQCxAwAh_AIBALEDACEDAAAAAwAgAQAABAAwAgAABQAgFgMAANkDACARAADzAwAgEgAA9AMAIJACAADvAwAwkQIAAAcAEJICAADvAwAwkwIBALADACGVAgEAsQMAIZ0CQAC1AwAhngJAALUDACHIAgAA8QP0AiLQAgEAsAMAId8CCADwAwAh5gIBALEDACHuAgEA_AMAIe8CAADIAwAg8AIBALEDACHxAgEAsQMAIfICAgCyAwAh9AIBAPIDACH1AkAAtAMAIfYCAQCxAwAhAQAAAAcAICMFAACPBAAgBwAAmgQAIAgAAIAEACAJAACBBAAgCwAA9AMAIAwAAIMEACAOAACbBAAgDwAAmwQAIJACAACWBAAwkQIAAAkAEJICAACWBAAwkwIBALADACGUAgEA_AMAIZYCAQD8AwAhnQJAALUDACGeAkAAtQMAIbYCAACXBMcCIrkCAQD8AwAhugIBAPwDACG7AgEAsQMAIbwCEADYAwAhvQIBAPwDACG-AgEA_AMAIb8CCACTBAAhwAIIAJMEACHBAgIA6AMAIcICCADwAwAhwwICAOgDACHEAggAkwQAIcUCAgCyAwAhyAIAAJgEyAIiyQIBALADACHKAgAAmQQAIMsCAADIAwAgzAIAAMgDACANBQAAiQcAIAcAAJIHACAIAACKBwAgCQAAiwcAIAsAAJMGACAMAACNBwAgDgAAkwcAIA8AAJMHACC7AgAAnQQAIL8CAACdBAAgwAIAAJ0EACDEAgAAnQQAIMUCAACdBAAgIwUAAI8EACAHAACaBAAgCAAAgAQAIAkAAIEEACALAAD0AwAgDAAAgwQAIA4AAJsEACAPAACbBAAgkAIAAJYEADCRAgAACQAQkgIAAJYEADCTAgEAAAABlAIBAPwDACGWAgEA_AMAIZ0CQAC1AwAhngJAALUDACG2AgAAlwTHAiK5AgEA_AMAIboCAQD8AwAhuwIBALEDACG8AhAA2AMAIb0CAQD8AwAhvgIBAPwDACG_AggAkwQAIcACCACTBAAhwQICAOgDACHCAggA8AMAIcMCAgDoAwAhxAIIAJMEACHFAgIAsgMAIcgCAACYBMgCIskCAQCwAwAhygIAAJkEACDLAgAAyAMAIMwCAADIAwAgAwAAAAkAIAEAAAoAMAIAAAsAIAwGAACLBAAgkAIAAJQEADCRAgAADQAQkgIAAJQEADCTAgEAsAMAIZ0CQAC1AwAhngJAALUDACGwAgEAsAMAIbQCAQD8AwAhtgIAAJUEtgIitwICALIDACG4AgEAsQMAIQMGAACRBwAgtwIAAJ0EACC4AgAAnQQAIAwGAACLBAAgkAIAAJQEADCRAgAADQAQkgIAAJQEADCTAgEAAAABnQJAALUDACGeAkAAtQMAIbACAQCwAwAhtAIBAPwDACG2AgAAlQS2AiK3AgIAsgMAIbgCAQCxAwAhAwAAAA0AIAEAAA4AMAIAAA8AIA4DAADZAwAgBgAAiwQAIJACAACSBAAwkQIAABEAEJICAACSBAAwkwIBALADACGdAkAAtQMAIZ4CQAC1AwAhsAIBALADACHQAgEAsAMAId8CAgDoAwAh4AIBALEDACHhAggAkwQAIeICAQCxAwAhBQMAAMcFACAGAACRBwAg4AIAAJ0EACDhAgAAnQQAIOICAACdBAAgDgMAANkDACAGAACLBAAgkAIAAJIEADCRAgAAEQAQkgIAAJIEADCTAgEAAAABnQJAALUDACGeAkAAtQMAIbACAQCwAwAh0AIBALADACHfAgIA6AMAIeACAQCxAwAh4QIIAJMEACHiAgEAsQMAIQMAAAARACABAAASADACAAATACAKAwAA2QMAIAYAAIsEACCQAgAAkQQAMJECAAAVABCSAgAAkQQAMJ0CQAC1AwAhngJAALUDACGwAgEAsAMAIdACAQCwAwAh3gJAALUDACECAwAAxwUAIAYAAJEHACALAwAA2QMAIAYAAIsEACCQAgAAkQQAMJECAAAVABCSAgAAkQQAMJ0CQAC1AwAhngJAALUDACGwAgEAsAMAIdACAQCwAwAh3gJAALUDACGCAwAAkAQAIAMAAAAVACABAAAWADACAAAXACAOBQAAjwQAIAYAAIsEACAKAADZAwAgkAIAAI0EADCRAgAAGQAQkgIAAI0EADCTAgEAsAMAIZ0CQAC1AwAhngJAALUDACGwAgEAsAMAIcgCAACOBN4CIskCAQCwAwAh2AIBAPwDACHcAgEAsAMAIQMFAACJBwAgBgAAkQcAIAoAAMcFACAOBQAAjwQAIAYAAIsEACAKAADZAwAgkAIAAI0EADCRAgAAGQAQkgIAAI0EADCTAgEAAAABnQJAALUDACGeAkAAtQMAIbACAQCwAwAhyAIAAI4E3gIiyQIBALADACHYAgEA_AMAIdwCAQCwAwAhAwAAABkAIAEAABoAMAIAABsAIA0DAADZAwAgBgAAiwQAIJACAACMBAAwkQIAAB0AEJICAACMBAAwkwIBALADACGdAkAAtQMAIZ4CQAC1AwAhsAIBALADACHQAgEAsAMAIdECAQD8AwAh0gIIAPADACHTAiAA5wMAIQIDAADHBQAgBgAAkQcAIA0DAADZAwAgBgAAiwQAIJACAACMBAAwkQIAAB0AEJICAACMBAAwkwIBAAAAAZ0CQAC1AwAhngJAALUDACGwAgEAsAMAIdACAQCwAwAh0QIBAPwDACHSAggA8AMAIdMCIADnAwAhAwAAAB0AIAEAAB4AMAIAAB8AIAsGAACLBAAgDQAAiwQAIJACAACKBAAwkQIAACEAEJICAACKBAAwkwIBALADACGeAkAAtQMAIbACAQCwAwAhsQIBALADACGyAggA8AMAIbMCAACzAwAgAwYAAJEHACANAACRBwAgswIAAJ0EACALBgAAiwQAIA0AAIsEACCQAgAAigQAMJECAAAhABCSAgAAigQAMJMCAQAAAAGeAkAAtQMAIbACAQCwAwAhsQIBALADACGyAggA8AMAIbMCAACzAwAgAwAAACEAIAEAACIAMAIAACMAIAMAAAAhACABAAAiADACAAAjACABAAAADQAgAQAAABEAIAEAAAAVACABAAAAGQAgAQAAAB0AIAEAAAAhACABAAAAIQAgAwAAABkAIAEAABoAMAIAABsAIAEAAAAJACABAAAAGQAgAwAAABEAIAEAABIAMAIAABMAIAMAAAAZACABAAAaADACAAAbACADAAAAFQAgAQAAFgAwAgAAFwAgCwMAANkDACCQAgAA1wMAMJECAAAzABCSAgAA1wMAMJMCAQCwAwAhnQJAALUDACGeAkAAtQMAIdACAQCwAwAh1AIAAMgDACDVAhAA2AMAIdYCAADIAwAgAQAAADMAIAMAAAAdACABAAAeADACAAAfACALAwAA2QMAIJACAACJBAAwkQIAADYAEJICAACJBAAwkwIBALADACGdAkAAtQMAIZ4CQAC1AwAh0AIBALADACHjAgEA_AMAIeQCAgDoAwAh5QIQANgDACEBAwAAxwUAIAsDAADZAwAgkAIAAIkEADCRAgAANgAQkgIAAIkEADCTAgEAAAABnQJAALUDACGeAkAAtQMAIdACAQCwAwAh4wIBAPwDACHkAgIA6AMAIeUCEADYAwAhAwAAADYAIAEAADcAMAIAADgAIA4DAADZAwAgkAIAAIcEADCRAgAAOgAQkgIAAIcEADCTAgEAsAMAIZ0CQAC1AwAhngJAALUDACG2AgAAiATYAiK5AgEA_AMAIdACAQCwAwAh2AIBAPwDACHZAgEAsQMAIdoCAACzAwAg2wIgAOcDACEDAwAAxwUAINkCAACdBAAg2gIAAJ0EACAOAwAA2QMAIJACAACHBAAwkQIAADoAEJICAACHBAAwkwIBAAAAAZ0CQAC1AwAhngJAALUDACG2AgAAiATYAiK5AgEA_AMAIdACAQCwAwAh2AIBAPwDACHZAgEAsQMAIdoCAACzAwAg2wIgAOcDACEDAAAAOgAgAQAAOwAwAgAAPAAgEQMAANkDACCQAgAA5gMAMJECAAA-ABCSAgAA5gMAMJMCAQCwAwAhlQIBALEDACGdAkAAtQMAIZ4CQAC1AwAh0AIBALADACHmAgEAsQMAIecCAQCxAwAh6AIBALEDACHpAiAA5wMAIeoCQAC0AwAh6wIAAMgDACDsAgEAsQMAIe0CAgDoAwAhAQAAAD4AIAEAAAADACABAAAAEQAgAQAAABkAIAEAAAAVACABAAAAHQAgAQAAADYAIAEAAAA6ACABAAAAAQAgFgQAAP4DACAFAAD_AwAgCAAAgAQAIAsAAPQDACAMAACDBAAgEwAAgQQAIBQAAIIEACAVAACEBAAgFgAAhQQAIBcAAIYEACCQAgAA-wMAMJECAABIABCSAgAA-wMAMJMCAQCwAwAhlQIBAPwDACGdAkAAtQMAIZ4CQAC1AwAh5gIBAPwDACH9AgEA_AMAIf8CAAD9A_8CIoADIADnAwAhgQMBALEDACELBAAAiAcAIAUAAIkHACAIAACKBwAgCwAAkwYAIAwAAI0HACATAACLBwAgFAAAjAcAIBUAAI4HACAWAACPBwAgFwAAkAcAIIEDAACdBAAgAwAAAEgAIAEAAEkAMAIAAAEAIAMAAABIACABAABJADACAAABACADAAAASAAgAQAASQAwAgAAAQAgEwQAAP4GACAFAAD_BgAgCAAAgAcAIAsAAIEHACAMAACEBwAgEwAAggcAIBQAAIMHACAVAACFBwAgFgAAhgcAIBcAAIcHACCTAgEAAAABlQIBAAAAAZ0CQAAAAAGeAkAAAAAB5gIBAAAAAf0CAQAAAAH_AgAAAP8CAoADIAAAAAGBAwEAAAABAR0AAE0AIAmTAgEAAAABlQIBAAAAAZ0CQAAAAAGeAkAAAAAB5gIBAAAAAf0CAQAAAAH_AgAAAP8CAoADIAAAAAGBAwEAAAABAR0AAE8AMAEdAABPADATBAAAnQYAIAUAAJ4GACAIAACfBgAgCwAAoAYAIAwAAKMGACATAAChBgAgFAAAogYAIBUAAKQGACAWAAClBgAgFwAApgYAIJMCAQCjBAAhlQIBAKMEACGdAkAApwQAIZ4CQACnBAAh5gIBAKMEACH9AgEAowQAIf8CAACcBv8CIoADIADtBAAhgQMBAKQEACECAAAAAQAgHQAAUgAgCZMCAQCjBAAhlQIBAKMEACGdAkAApwQAIZ4CQACnBAAh5gIBAKMEACH9AgEAowQAIf8CAACcBv8CIoADIADtBAAhgQMBAKQEACECAAAASAAgHQAAVAAgAgAAAEgAIB0AAFQAIAMAAAABACAkAABNACAlAABSACABAAAAAQAgAQAAAEgAIAQQAACZBgAgKgAAmwYAICsAAJoGACCBAwAAnQQAIAyQAgAA9wMAMJECAABbABCSAgAA9wMAMJMCAQCcAwAhlQIBALwDACGdAkAAoQMAIZ4CQAChAwAh5gIBALwDACH9AgEAvAMAIf8CAAD4A_8CIoADIADTAwAhgQMBAJ0DACEDAAAASAAgAQAAWgAwKQAAWwAgAwAAAEgAIAEAAEkAMAIAAAEAIAEAAAAFACABAAAABQAgAwAAAAMAIAEAAAQAMAIAAAUAIAMAAAADACABAAAEADACAAAFACADAAAAAwAgAQAABAAwAgAABQAgCAMAAJgGACCTAgEAAAABnAJAAAAAAZ0CQAAAAAHQAgEAAAAB-gIBAAAAAfsCAQAAAAH8AgEAAAABAR0AAGMAIAeTAgEAAAABnAJAAAAAAZ0CQAAAAAHQAgEAAAAB-gIBAAAAAfsCAQAAAAH8AgEAAAABAR0AAGUAMAEdAABlADAIAwAAlwYAIJMCAQCjBAAhnAJAAKcEACGdAkAApwQAIdACAQCjBAAh-gIBAKMEACH7AgEApAQAIfwCAQCkBAAhAgAAAAUAIB0AAGgAIAeTAgEAowQAIZwCQACnBAAhnQJAAKcEACHQAgEAowQAIfoCAQCjBAAh-wIBAKQEACH8AgEApAQAIQIAAAADACAdAABqACACAAAAAwAgHQAAagAgAwAAAAUAICQAAGMAICUAAGgAIAEAAAAFACABAAAAAwAgBRAAAJQGACAqAACWBgAgKwAAlQYAIPsCAACdBAAg_AIAAJ0EACAKkAIAAPYDADCRAgAAcQAQkgIAAPYDADCTAgEAnAMAIZwCQAChAwAhnQJAAKEDACHQAgEAnAMAIfoCAQC8AwAh-wIBAJ0DACH8AgEAnQMAIQMAAAADACABAABwADApAABxACADAAAAAwAgAQAABAAwAgAABQAgFgMAANkDACARAADzAwAgEgAA9AMAIJACAADvAwAwkQIAAAcAEJICAADvAwAwkwIBAAAAAZUCAQCxAwAhnQJAALUDACGeAkAAtQMAIcgCAADxA_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_AQAgCZMCAQAAAAGdAkAAAAABngJAAAAAAbACAQAAAAHQAgEAAAAB3wICAAAAAeACAQAAAAHhAggAAAAB4gIBAAAAAQEdAADBAQAwAR0AAMEBADALAwAAnAUAIAYAAN0FACCTAgEAowQAIZ0CQACnBAAhngJAAKcEACGwAgEAowQAIdACAQCjBAAh3wICAMEEACHgAgEApAQAIeECCADABAAh4gIBAKQEACECAAAAEwAgHQAAxAEAIAmTAgEAowQAIZ0CQACnBAAhngJAAKcEACGwAgEAowQAIdACAQCjBAAh3wICAMEEACHgAgEApAQAIeECCADABAAh4gIBAKQEACECAAAAEQAgHQAAxgEAIAIAAAARACAdAADGAQAgAwAAABMAICQAAL8BACAlAADEAQAgAQAAABMAIAEAAAARACAIEAAA2AUAICoAANsFACArAADaBQAgTAAA2QUAIE0AANwFACDgAgAAnQQAIOECAACdBAAg4gIAAJ0EACAMkAIAAOMDADCRAgAAzQEAEJICAADjAwAwkwIBAJwDACGdAkAAoQMAIZ4CQAChAwAhsAIBAJwDACHQAgEAnAMAId8CAgDEAwAh4AIBAJ0DACHhAggAwwMAIeICAQCdAwAhAwAAABEAIAEAAMwBADApAADNAQAgAwAAABEAIAEAABIAMAIAABMAIAEAAAAXACABAAAAFwAgAwAAABUAIAEAABYAMAIAABcAIAMAAAAVACABAAAWADACAAAXACADAAAAFQAgAQAAFgAwAgAAFwAgBwMAAJAFACAGAADXBQAgnQJAAAAAAZ4CQAAAAAGwAgEAAAAB0AIBAAAAAd4CQAAAAAEBHQAA1QEAIAWdAkAAAAABngJAAAAAAbACAQAAAAHQAgEAAAAB3gJAAAAAAQEdAADXAQAwAR0AANcBADAHAwAAjgUAIAYAANYFACCdAkAApwQAIZ4CQACnBAAhsAIBAKMEACHQAgEAowQAId4CQACnBAAhAgAAABcAIB0AANoBACAFnQJAAKcEACGeAkAApwQAIbACAQCjBAAh0AIBAKMEACHeAkAApwQAIQIAAAAVACAdAADcAQAgAgAAABUAIB0AANwBACADAAAAFwAgJAAA1QEAICUAANoBACABAAAAFwAgAQAAABUAIAMQAADTBQAgKgAA1QUAICsAANQFACAIkAIAAOIDADCRAgAA4wEAEJICAADiAwAwnQJAAKEDACGeAkAAoQMAIbACAQCcAwAh0AIBAJwDACHeAkAAoQMAIQMAAAAVACABAADiAQAwKQAA4wEAIAMAAAAVACABAAAWADACAAAXACABAAAAGwAgAQAAABsAIAMAAAAZACABAAAaADACAAAbACADAAAAGQAgAQAAGgAwAgAAGwAgAwAAABkAIAEAABoAMAIAABsAIAsFAACCBQAgBgAA0gUAIAoAAIEFACCTAgEAAAABnQJAAAAAAZ4CQAAAAAGwAgEAAAAByAIAAADeAgLJAgEAAAAB2AIBAAAAAdwCAQAAAAEBHQAA6wEAIAiTAgEAAAABnQJAAAAAAZ4CQAAAAAGwAgEAAAAByAIAAADeAgLJAgEAAAAB2AIBAAAAAdwCAQAAAAEBHQAA7QEAMAEdAADtAQAwCwUAAP8EACAGAADRBQAgCgAA_gQAIJMCAQCjBAAhnQJAAKcEACGeAkAApwQAIbACAQCjBAAhyAIAAPwE3gIiyQIBAKMEACHYAgEAowQAIdwCAQCjBAAhAgAAABsAIB0AAPABACAIkwIBAKMEACGdAkAApwQAIZ4CQACnBAAhsAIBAKMEACHIAgAA_ATeAiLJAgEAowQAIdgCAQCjBAAh3AIBAKMEACECAAAAGQAgHQAA8gEAIAIAAAAZACAdAADyAQAgAwAAABsAICQAAOsBACAlAADwAQAgAQAAABsAIAEAAAAZACADEAAAzgUAICoAANAFACArAADPBQAgC5ACAADeAwAwkQIAAPkBABCSAgAA3gMAMJMCAQCcAwAhnQJAAKEDACGeAkAAoQMAIbACAQCcAwAhyAIAAN8D3gIiyQIBAJwDACHYAgEAvAMAIdwCAQCcAwAhAwAAABkAIAEAAPgBADApAAD5AQAgAwAAABkAIAEAABoAMAIAABsAIAEAAAA8ACABAAAAPAAgAwAAADoAIAEAADsAMAIAADwAIAMAAAA6ACABAAA7ADACAAA8ACADAAAAOgAgAQAAOwAwAgAAPAAgCwMAAM0FACCTAgEAAAABnQJAAAAAAZ4CQAAAAAG2AgAAANgCArkCAQAAAAHQAgEAAAAB2AIBAAAAAdkCAQAAAAHaAoAAAAAB2wIgAAAAAQEdAACBAgAgCpMCAQAAAAGdAkAAAAABngJAAAAAAbYCAAAA2AICuQIBAAAAAdACAQAAAAHYAgEAAAAB2QIBAAAAAdoCgAAAAAHbAiAAAAABAR0AAIMCADABHQAAgwIAMAsDAADMBQAgkwIBAKMEACGdAkAApwQAIZ4CQACnBAAhtgIAAMsF2AIiuQIBAKMEACHQAgEAowQAIdgCAQCjBAAh2QIBAKQEACHaAoAAAAAB2wIgAO0EACECAAAAPAAgHQAAhgIAIAqTAgEAowQAIZ0CQACnBAAhngJAAKcEACG2AgAAywXYAiK5AgEAowQAIdACAQCjBAAh2AIBAKMEACHZAgEApAQAIdoCgAAAAAHbAiAA7QQAIQIAAAA6ACAdAACIAgAgAgAAADoAIB0AAIgCACADAAAAPAAgJAAAgQIAICUAAIYCACABAAAAPAAgAQAAADoAIAUQAADIBQAgKgAAygUAICsAAMkFACDZAgAAnQQAINoCAACdBAAgDZACAADaAwAwkQIAAI8CABCSAgAA2gMAMJMCAQCcAwAhnQJAAKEDACGeAkAAoQMAIbYCAADbA9gCIrkCAQC8AwAh0AIBAJwDACHYAgEAvAMAIdkCAQCdAwAh2gIAAJ8DACDbAiAA0wMAIQMAAAA6ACABAACOAgAwKQAAjwIAIAMAAAA6ACABAAA7ADACAAA8ACALAwAA2QMAIJACAADXAwAwkQIAADMAEJICAADXAwAwkwIBAAAAAZ0CQAC1AwAhngJAALUDACHQAgEAAAAB1AIAAMgDACDVAhAA2AMAIdYCAADIAwAgAQAAAJICACABAAAAkgIAIAEDAADHBQAgAwAAADMAIAEAAJUCADACAACSAgAgAwAAADMAIAEAAJUCADACAACSAgAgAwAAADMAIAEAAJUCADACAACSAgAgCAMAAMYFACCTAgEAAAABnQJAAAAAAZ4CQAAAAAHQAgEAAAAB1AIAAMQFACDVAhAAAAAB1gIAAMUFACABHQAAmQIAIAeTAgEAAAABnQJAAAAAAZ4CQAAAAAHQAgEAAAAB1AIAAMQFACDVAhAAAAAB1gIAAMUFACABHQAAmwIAMAEdAACbAgAwCAMAAMMFACCTAgEAowQAIZ0CQACnBAAhngJAAKcEACHQAgEAowQAIdQCAADBBQAg1QIQAL8EACHWAgAAwgUAIAIAAACSAgAgHQAAngIAIAeTAgEAowQAIZ0CQACnBAAhngJAAKcEACHQAgEAowQAIdQCAADBBQAg1QIQAL8EACHWAgAAwgUAIAIAAAAzACAdAACgAgAgAgAAADMAIB0AAKACACADAAAAkgIAICQAAJkCACAlAACeAgAgAQAAAJICACABAAAAMwAgBRAAALwFACAqAAC_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_BAAhvQIBAKMEACG-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_AgAQkgIAALcDADCTAgEAnAMAIZ4CQAChAwAhsAIBAJwDACGxAgEAnAMAIbICCAC4AwAhswIAAJ8DACADAAAAIQAgAQAA_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_wIAEJICAAC3AwAwkwIBAJwDACGeAkAAoQMAIbACAQCcAwAhsQIBAJwDACGyAggAuAMAIbMCAACfAwAgDRAAAKMDACAqAAC6AwAgKwAAugMAIEwAALoDACBNAAC6AwAgnwIIAAAAAaACCAAAAAShAggAAAAEogIIAAAAAaMCCAAAAAGkAggAAAABpQIIAAAAAaYCCAC5AwAhDRAAAKMDACAqAAC6AwAgKwAAugMAIEwAALoDACBNAAC6AwAgnwIIAAAAAaACCAAAAAShAggAAAAEogIIAAAAAaMCCAAAAAGkAggAAAABpQIIAAAAAaYCCAC5AwAhCJ8CCAAAAAGgAggAAAAEoQIIAAAABKICCAAAAAGjAggAAAABpAIIAAAAAaUCCAAAAAGmAggAugMAIQuQAgAAuwMAMJECAADpAgAQkgIAALsDADCTAgEAnAMAIZ0CQAChAwAhngJAAKEDACGwAgEAnAMAIbQCAQC8AwAhtgIAAL0DtgIitwICAJ4DACG4AgEAnQMAIQ4QAACjAwAgKgAArgMAICsAAK4DACCfAgEAAAABoAIBAAAABKECAQAAAASiAgEAAAABowIBAAAAAaQCAQAAAAGlAgEAAAABpgIBAMADACGtAgEAAAABrgIBAAAAAa8CAQAAAAEHEAAAowMAICoAAL8DACArAAC_AwAgnwIAAAC2AgKgAgAAALYCCKECAAAAtgIIpgIAAL4DtgIiBxAAAKMDACAqAAC_AwAgKwAAvwMAIJ8CAAAAtgICoAIAAAC2AgihAgAAALYCCKYCAAC-A7YCIgSfAgAAALYCAqACAAAAtgIIoQIAAAC2AgimAgAAvwO2AiIOEAAAowMAICoAAK4DACArAACuAwAgnwIBAAAAAaACAQAAAAShAgEAAAAEogIBAAAAAaMCAQAAAAGkAgEAAAABpQIBAAAAAaYCAQDAAwAhrQIBAAAAAa4CAQAAAAGvAgEAAAABG5ACAADBAwAwkQIAANMCABCSAgAAwQMAMJMCAQCcAwAhlAIBALwDACGWAgEAvAMAIZ0CQAChAwAhngJAAKEDACG2AgAAxQPHAiK5AgEAvAMAIboCAQC8AwAhuwIBAJ0DACG8AhAAwgMAIb0CAQC8AwAhvgIBALwDACG_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_gMAIAUAAP8DACAIAACABAAgCwAA9AMAIAwAAIMEACATAACBBAAgFAAAggQAIBUAAIQEACAWAACFBAAgFwAAhgQAIJACAAD7AwAwkQIAAEgAEJICAAD7AwAwkwIBALADACGVAgEA_AMAIZ0CQAC1AwAhngJAALUDACHmAgEA_AMAIf0CAQD8AwAh_wIAAP0D_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_AMAIe8CAADIAwAg8AIBALEDACHxAgEAsQMAIfICAgCyAwAh9AIBAPIDACH1AkAAtAMAIfYCAQCxAwAhCJ8CCAAAAAGgAggAAAAEoQIIAAAABKICCAAAAAGjAggAAAABpAIIAAAAAaUCCAAAAAGmAggAugMAIQSfAgAAAPQCAqACAAAA9AIIoQIAAAD0AgimAgAA7gP0AiIInwIBAAAAAaACAQAAAAWhAgEAAAAFogIBAAAAAaMCAQAAAAGkAgEAAAABpQIBAAAAAaYCAQD1AwAhA_cCAAAJACD4AgAACQAg-QIAAAkAIAP3AgAAGQAg-AIAABkAIPkCAAAZACAInwIBAAAAAaACAQAAAAWhAgEAAAAFogIBAAAAAaMCAQAAAAGkAgEAAAABpQIBAAAAAaYCAQD1AwAhCpACAAD2AwAwkQIAAHEAEJICAAD2AwAwkwIBAJwDACGcAkAAoQMAIZ0CQAChAwAh0AIBAJwDACH6AgEAvAMAIfsCAQCdAwAh_AIBAJ0DACEMkAIAAPcDADCRAgAAWwAQkgIAAPcDADCTAgEAnAMAIZUCAQC8AwAhnQJAAKEDACGeAkAAoQMAIeYCAQC8AwAh_QIBALwDACH_AgAA-AP_AiKAAyAA0wMAIYEDAQCdAwAhBxAAAKMDACAqAAD6AwAgKwAA-gMAIJ8CAAAA_wICoAIAAAD_AgihAgAAAP8CCKYCAAD5A_8CIgcQAACjAwAgKgAA-gMAICsAAPoDACCfAgAAAP8CAqACAAAA_wIIoQIAAAD_AgimAgAA-QP_AiIEnwIAAAD_AgKgAgAAAP8CCKECAAAA_wIIpgIAAPoD_wIiFgQAAP4DACAFAAD_AwAgCAAAgAQAIAsAAPQDACAMAACDBAAgEwAAgQQAIBQAAIIEACAVAACEBAAgFgAAhQQAIBcAAIYEACCQAgAA-wMAMJECAABIABCSAgAA-wMAMJMCAQCwAwAhlQIBAPwDACGdAkAAtQMAIZ4CQAC1AwAh5gIBAPwDACH9AgEA_AMAIf8CAAD9A_8CIoADIADnAwAhgQMBALEDACELnwIBAAAAAaACAQAAAAShAgEAAAAEogIBAAAAAaMCAQAAAAGkAgEAAAABpQIBAAAAAaYCAQCuAwAhrQIBAAAAAa4CAQAAAAGvAgEAAAABBJ8CAAAA_wICoAIAAAD_AgihAgAAAP8CCKYCAAD6A_8CIgP3AgAAAwAg-AIAAAMAIPkCAAADACAYAwAA2QMAIBEAAPMDACASAAD0AwAgkAIAAO8DADCRAgAABwAQkgIAAO8DADCTAgEAsAMAIZUCAQCxAwAhnQJAALUDACGeAkAAtQMAIcgCAADxA_QCItACAQCwAwAh3wIIAPADACHmAgEAsQMAIe4CAQD8AwAh7wIAAMgDACDwAgEAsQMAIfECAQCxAwAh8gICALIDACH0AgEA8gMAIfUCQAC0AwAh9gIBALEDACGDAwAABwAghAMAAAcAIAP3AgAAEQAg-AIAABEAIPkCAAARACAD9wIAABUAIPgCAAAVACD5AgAAFQAgDQMAANkDACCQAgAA1wMAMJECAAAzABCSAgAA1wMAMJMCAQCwAwAhnQJAALUDACGeAkAAtQMAIdACAQCwAwAh1AIAAMgDACDVAhAA2AMAIdYCAADIAwAggwMAADMAIIQDAAAzACAD9wIAAB0AIPgCAAAdACD5AgAAHQAgA_cCAAA2ACD4AgAANgAg-QIAADYAIAP3AgAAOgAg-AIAADoAIPkCAAA6ACATAwAA2QMAIJACAADmAwAwkQIAAD4AEJICAADmAwAwkwIBALADACGVAgEAsQMAIZ0CQAC1AwAhngJAALUDACHQAgEAsAMAIeYCAQCxAwAh5wIBALEDACHoAgEAsQMAIekCIADnAwAh6gJAALQDACHrAgAAyAMAIOwCAQCxAwAh7QICAOgDACGDAwAAPgAghAMAAD4AIA4DAADZAwAgkAIAAIcEADCRAgAAOgAQkgIAAIcEADCTAgEAsAMAIZ0CQAC1AwAhngJAALUDACG2AgAAiATYAiK5AgEA_AMAIdACAQCwAwAh2AIBAPwDACHZAgEAsQMAIdoCAACzAwAg2wIgAOcDACEEnwIAAADYAgKgAgAAANgCCKECAAAA2AIIpgIAAN0D2AIiCwMAANkDACCQAgAAiQQAMJECAAA2ABCSAgAAiQQAMJMCAQCwAwAhnQJAALUDACGeAkAAtQMAIdACAQCwAwAh4wIBAPwDACHkAgIA6AMAIeUCEADYAwAhCwYAAIsEACANAACLBAAgkAIAAIoEADCRAgAAIQAQkgIAAIoEADCTAgEAsAMAIZ4CQAC1AwAhsAIBALADACGxAgEAsAMAIbICCADwAwAhswIAALMDACAlBQAAjwQAIAcAAJoEACAIAACABAAgCQAAgQQAIAsAAPQDACAMAACDBAAgDgAAmwQAIA8AAJsEACCQAgAAlgQAMJECAAAJABCSAgAAlgQAMJMCAQCwAwAhlAIBAPwDACGWAgEA_AMAIZ0CQAC1AwAhngJAALUDACG2AgAAlwTHAiK5AgEA_AMAIboCAQD8AwAhuwIBALEDACG8AhAA2AMAIb0CAQD8AwAhvgIBAPwDACG_AggAkwQAIcACCACTBAAhwQICAOgDACHCAggA8AMAIcMCAgDoAwAhxAIIAJMEACHFAgIAsgMAIcgCAACYBMgCIskCAQCwAwAhygIAAJkEACDLAgAAyAMAIMwCAADIAwAggwMAAAkAIIQDAAAJACANAwAA2QMAIAYAAIsEACCQAgAAjAQAMJECAAAdABCSAgAAjAQAMJMCAQCwAwAhnQJAALUDACGeAkAAtQMAIbACAQCwAwAh0AIBALADACHRAgEA_AMAIdICCADwAwAh0wIgAOcDACEOBQAAjwQAIAYAAIsEACAKAADZAwAgkAIAAI0EADCRAgAAGQAQkgIAAI0EADCTAgEAsAMAIZ0CQAC1AwAhngJAALUDACGwAgEAsAMAIcgCAACOBN4CIskCAQCwAwAh2AIBAPwDACHcAgEAsAMAIQSfAgAAAN4CAqACAAAA3gIIoQIAAADeAgimAgAA4QPeAiIYAwAA2QMAIBEAAPMDACASAAD0AwAgkAIAAO8DADCRAgAABwAQkgIAAO8DADCTAgEAsAMAIZUCAQCxAwAhnQJAALUDACGeAkAAtQMAIcgCAADxA_QCItACAQCwAwAh3wIIAPADACHmAgEAsQMAIe4CAQD8AwAh7wIAAMgDACDwAgEAsQMAIfECAQCxAwAh8gICALIDACH0AgEA8gMAIfUCQAC0AwAh9gIBALEDACGDAwAABwAghAMAAAcAIAKwAgEAAAAB0AIBAAAAAQoDAADZAwAgBgAAiwQAIJACAACRBAAwkQIAABUAEJICAACRBAAwnQJAALUDACGeAkAAtQMAIbACAQCwAwAh0AIBALADACHeAkAAtQMAIQ4DAADZAwAgBgAAiwQAIJACAACSBAAwkQIAABEAEJICAACSBAAwkwIBALADACGdAkAAtQMAIZ4CQAC1AwAhsAIBALADACHQAgEAsAMAId8CAgDoAwAh4AIBALEDACHhAggAkwQAIeICAQCxAwAhCJ8CCAAAAAGgAggAAAAFoQIIAAAABaICCAAAAAGjAggAAAABpAIIAAAAAaUCCAAAAAGmAggAqgMAIQwGAACLBAAgkAIAAJQEADCRAgAADQAQkgIAAJQEADCTAgEAsAMAIZ0CQAC1AwAhngJAALUDACGwAgEAsAMAIbQCAQD8AwAhtgIAAJUEtgIitwICALIDACG4AgEAsQMAIQSfAgAAALYCAqACAAAAtgIIoQIAAAC2AgimAgAAvwO2AiIjBQAAjwQAIAcAAJoEACAIAACABAAgCQAAgQQAIAsAAPQDACAMAACDBAAgDgAAmwQAIA8AAJsEACCQAgAAlgQAMJECAAAJABCSAgAAlgQAMJMCAQCwAwAhlAIBAPwDACGWAgEA_AMAIZ0CQAC1AwAhngJAALUDACG2AgAAlwTHAiK5AgEA_AMAIboCAQD8AwAhuwIBALEDACG8AhAA2AMAIb0CAQD8AwAhvgIBAPwDACG_AggAkwQAIcACCACTBAAhwQICAOgDACHCAggA8AMAIcMCAgDoAwAhxAIIAJMEACHFAgIAsgMAIcgCAACYBMgCIskCAQCwAwAhygIAAJkEACDLAgAAyAMAIMwCAADIAwAgBJ8CAAAAxwICoAIAAADHAgihAgAAAMcCCKYCAADNA8cCIgSfAgAAAMgCAqACAAAAyAIIoQIAAADIAgimAgAAywPIAiIMnwKAAAAAAaICgAAAAAGjAoAAAAABpAKAAAAAAaUCgAAAAAGmAoAAAAABpwIBAAAAAagCAQAAAAGpAgEAAAABqgKAAAAAAasCgAAAAAGsAoAAAAABA_cCAAANACD4AgAADQAg-QIAAA0AIAP3AgAAIQAg-AIAACEAIPkCAAAhACALAwAA2QMAIJACAACcBAAwkQIAAAMAEJICAACcBAAwkwIBALADACGcAkAAtQMAIZ0CQAC1AwAh0AIBALADACH6AgEA_AMAIfsCAQCxAwAh_AIBALEDACEAAAAAAAABiAMBAAAAAQGIAwEAAAABBYgDAgAAAAGPAwIAAAABkAMCAAAAAZEDAgAAAAGSAwIAAAABAYgDQAAAAAEBiANAAAAAAQAAAAAABYgDCAAAAAGPAwgAAAABkAMIAAAAAZEDCAAAAAGSAwgAAAABBSQAAPsHACAlAACBCAAghQMAAPwHACCGAwAAgAgAIIsDAAALACAFJAAA-QcAICUAAP4HACCFAwAA-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_AMAIdICCADwAwAh0wIgAOcDACELkAIAAOoEADCRAgAA6wQAEJICAADqBAAwkwIBALADACGdAkAAtQMAIZ4CQAC1AwAhsAIBALADACHQAgEAsAMAIdECAQD8AwAh0gIIAPADACHTAiAA5wMAIQeTAgEAowQAIZ0CQACnBAAhngJAAKcEACHQAgEAowQAIdECAQCjBAAh0gIIAK0EACHTAiAA7QQAIQGIAyAAAAABCAMAAO8EACCTAgEAowQAIZ0CQACnBAAhngJAAKcEACHQAgEAowQAIdECAQCjBAAh0gIIAK0EACHTAiAA7QQAIQUkAADpBwAgJQAA7AcAIIUDAADqBwAghgMAAOsHACCLAwAAAQAgCAMAAPEEACCTAgEAAAABnQJAAAAAAZ4CQAAAAAHQAgEAAAAB0QIBAAAAAdICCAAAAAHTAiAAAAABAyQAAOkHACCFAwAA6gcAIIsDAAABACAJBQAAggUAIAoAAIEFACCTAgEAAAABnQJAAAAAAZ4CQAAAAAHIAgAAAN4CAskCAQAAAAHYAgEAAAAB3AIBAAAAAQIAAAAbACAkAACABQAgAwAAABsAICQAAIAFACAlAAD9BAAgAR0AAOgHADAOBQAAjwQAIAYAAIsEACAKAADZAwAgkAIAAI0EADCRAgAAGQAQkgIAAI0EADCTAgEAAAABnQJAALUDACGeAkAAtQMAIbACAQCwAwAhyAIAAI4E3gIiyQIBALADACHYAgEA_AMAIdwCAQCwAwAhAgAAABsAIB0AAP0EACACAAAA-gQAIB0AAPsEACALkAIAAPkEADCRAgAA-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_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_QUAMIUDAAD6BQAwhgMAAPsFADCHAwAA_AUAIIgDAAD2BAAwiQMAAPYEADCKAwAA9gQAMIsDAAD2BAAwjAMAAP4FADCNAwAA-QQAMAkGAADSBQAgCgAAgQUAIJMCAQAAAAGdAkAAAAABngJAAAAAAbACAQAAAAHIAgAAAN4CAtgCAQAAAAHcAgEAAAABAgAAABsAICQAAIEGACADAAAAGwAgJAAAgQYAICUAAIAGACABHQAAowcAMAIAAAAbACAdAACABgAgAgAAAPoEACAdAAD_BQAgB5MCAQCjBAAhnQJAAKcEACGeAkAApwQAIbACAQCjBAAhyAIAAPwE3gIi2AIBAKMEACHcAgEAowQAIQkGAADRBQAgCgAA_gQAIJMCAQCjBAAhnQJAAKcEACGeAkAApwQAIbACAQCjBAAhyAIAAPwE3gIi2AIBAKMEACHcAgEAowQAIQkGAADSBQAgCgAAgQUAIJMCAQAAAAGdAkAAAAABngJAAAAAAbACAQAAAAHIAgAAAN4CAtgCAQAAAAHcAgEAAAABHgcAAK4FACAIAACvBQAgCQAAsAUAIAsAALEFACAMAACyBQAgDgAAswUAIA8AALQFACCTAgEAAAABlAIBAAAAAZYCAQAAAAGdAkAAAAABngJAAAAAAbYCAAAAxwICuQIBAAAAAboCAQAAAAG7AgEAAAABvAIQAAAAAb0CAQAAAAG-AgEAAAABvwIIAAAAAcACCAAAAAHBAgIAAAABwgIIAAAAAcMCAgAAAAHEAggAAAABxQICAAAAAcgCAAAAyAICygKAAAAAAcsCAACrBQAgzAIAAKwFACACAAAACwAgJAAAjQYAIAMAAAALACAkAACNBgAgJQAAjAYAIAEdAACiBwAwIwUAAI8EACAHAACaBAAgCAAAgAQAIAkAAIEEACALAAD0AwAgDAAAgwQAIA4AAJsEACAPAACbBAAgkAIAAJYEADCRAgAACQAQkgIAAJYEADCTAgEAAAABlAIBAPwDACGWAgEA_AMAIZ0CQAC1AwAhngJAALUDACG2AgAAlwTHAiK5AgEA_AMAIboCAQD8AwAhuwIBALEDACG8AhAA2AMAIb0CAQD8AwAhvgIBAPwDACG_AggAkwQAIcACCACTBAAhwQICAOgDACHCAggA8AMAIcMCAgDoAwAhxAIIAJMEACHFAgIAsgMAIcgCAACYBMgCIskCAQCwAwAhygIAAJkEACDLAgAAyAMAIMwCAADIAwAgAgAAAAsAIB0AAIwGACACAAAAigYAIB0AAIsGACAbkAIAAIkGADCRAgAAigYAEJICAACJBgAwkwIBALADACGUAgEA_AMAIZYCAQD8AwAhnQJAALUDACGeAkAAtQMAIbYCAACXBMcCIrkCAQD8AwAhugIBAPwDACG7AgEAsQMAIbwCEADYAwAhvQIBAPwDACG-AgEA_AMAIb8CCACTBAAhwAIIAJMEACHBAgIA6AMAIcICCADwAwAhwwICAOgDACHEAggAkwQAIcUCAgCyAwAhyAIAAJgEyAIiyQIBALADACHKAgAAmQQAIMsCAADIAwAgzAIAAMgDACAbkAIAAIkGADCRAgAAigYAEJICAACJBgAwkwIBALADACGUAgEA_AMAIZYCAQD8AwAhnQJAALUDACGeAkAAtQMAIbYCAACXBMcCIrkCAQD8AwAhugIBAPwDACG7AgEAsQMAIbwCEADYAwAhvQIBAPwDACG-AgEA_AMAIb8CCACTBAAhwAIIAJMEACHBAgIA6AMAIcICCADwAwAhwwICAOgDACHEAggAkwQAIcUCAgCyAwAhyAIAAJgEyAIiyQIBALADACHKAgAAmQQAIMsCAADIAwAgzAIAAMgDACAXkwIBAKMEACGUAgEAowQAIZYCAQCjBAAhnQJAAKcEACGeAkAApwQAIbYCAADCBMcCIrkCAQCjBAAhugIBAKMEACG7AgEApAQAIbwCEAC_BAAhvQIBAKMEACG-AgEAowQAIb8CCADABAAhwAIIAMAEACHBAgIAwQQAIcICCACtBAAhwwICAMEEACHEAggAwAQAIcUCAgClBAAhyAIAAMMEyAIiygKAAAAAAcsCAADEBAAgzAIAAMUEACAeBwAAxwQAIAgAAMgEACAJAADJBAAgCwAAygQAIAwAAMsEACAOAADMBAAgDwAAzQQAIJMCAQCjBAAhlAIBAKMEACGWAgEAowQAIZ0CQACnBAAhngJAAKcEACG2AgAAwgTHAiK5AgEAowQAIboCAQCjBAAhuwIBAKQEACG8AhAAvwQAIb0CAQCjBAAhvgIBAKMEACG_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_AMAIdACAQCwAwAh2AIBAPwDACHZAgEAsQMAIdoCAACzAwAg2wIgAOcDACECAAAAPAAgHQAAtgYAIAIAAAC0BgAgHQAAtQYAIA2QAgAAswYAMJECAAC0BgAQkgIAALMGADCTAgEAsAMAIZ0CQAC1AwAhngJAALUDACG2AgAAiATYAiK5AgEA_AMAIdACAQCwAwAh2AIBAPwDACHZAgEAsQMAIdoCAACzAwAg2wIgAOcDACENkAIAALMGADCRAgAAtAYAEJICAACzBgAwkwIBALADACGdAkAAtQMAIZ4CQAC1AwAhtgIAAIgE2AIiuQIBAPwDACHQAgEAsAMAIdgCAQD8AwAh2QIBALEDACHaAgAAswMAINsCIADnAwAhCZMCAQCjBAAhnQJAAKcEACGeAkAApwQAIbYCAADLBdgCIrkCAQCjBAAh2AIBAKMEACHZAgEApAQAIdoCgAAAAAHbAiAA7QQAIQmTAgEAowQAIZ0CQACnBAAhngJAAKcEACG2AgAAywXYAiK5AgEAowQAIdgCAQCjBAAh2QIBAKQEACHaAoAAAAAB2wIgAO0EACEJkwIBAAAAAZ0CQAAAAAGeAkAAAAABtgIAAADYAgK5AgEAAAAB2AIBAAAAAdkCAQAAAAHaAoAAAAAB2wIgAAAAAQaTAgEAAAABnQJAAAAAAZ4CQAAAAAHjAgEAAAAB5AICAAAAAeUCEAAAAAECAAAAOAAgJAAAwwYAIAMAAAA4ACAkAADDBgAgJQAAwgYAIAEdAACZBwAwCwMAANkDACCQAgAAiQQAMJECAAA2ABCSAgAAiQQAMJMCAQAAAAGdAkAAtQMAIZ4CQAC1AwAh0AIBALADACHjAgEA_AMAIeQCAgDoAwAh5QIQANgDACECAAAAOAAgHQAAwgYAIAIAAADABgAgHQAAwQYAIAqQAgAAvwYAMJECAADABgAQkgIAAL8GADCTAgEAsAMAIZ0CQAC1AwAhngJAALUDACHQAgEAsAMAIeMCAQD8AwAh5AICAOgDACHlAhAA2AMAIQqQAgAAvwYAMJECAADABgAQkgIAAL8GADCTAgEAsAMAIZ0CQAC1AwAhngJAALUDACHQAgEAsAMAIeMCAQD8AwAh5AICAOgDACHlAhAA2AMAIQaTAgEAowQAIZ0CQACnBAAhngJAAKcEACHjAgEAowQAIeQCAgDBBAAh5QIQAL8EACEGkwIBAKMEACGdAkAApwQAIZ4CQACnBAAh4wIBAKMEACHkAgIAwQQAIeUCEAC_BAAhBpMCAQAAAAGdAkAAAAABngJAAAAAAeMCAQAAAAHkAgIAAAAB5QIQAAAAAQgGAAC7BQAgkwIBAAAAAZ0CQAAAAAGeAkAAAAABsAIBAAAAAdECAQAAAAHSAggAAAAB0wIgAAAAAQIAAAAfACAkAADMBgAgAwAAAB8AICQAAMwGACAlAADLBgAgAR0AAJgHADACAAAAHwAgHQAAywYAIAIAAADrBAAgHQAAygYAIAeTAgEAowQAIZ0CQACnBAAhngJAAKcEACGwAgEAowQAIdECAQCjBAAh0gIIAK0EACHTAiAA7QQAIQgGAAC6BQAgkwIBAKMEACGdAkAApwQAIZ4CQACnBAAhsAIBAKMEACHRAgEAowQAIdICCACtBAAh0wIgAO0EACEIBgAAuwUAIJMCAQAAAAGdAkAAAAABngJAAAAAAbACAQAAAAHRAgEAAAAB0gIIAAAAAdMCIAAAAAEGkwIBAAAAAZ0CQAAAAAGeAkAAAAAB1AIAAMQFACDVAhAAAAAB1gIAAMUFACACAAAAkgIAICQAAM0GACADAAAAMwAgJAAAzQYAICUAANEGACAIAAAAMwAgHQAA0QYAIJMCAQCjBAAhnQJAAKcEACGeAkAApwQAIdQCAADBBQAg1QIQAL8EACHWAgAAwgUAIAaTAgEAowQAIZ0CQACnBAAhngJAAKcEACHUAgAAwQUAINUCEAC_BAAh1gIAAMIFACAFBgAA1wUAIJ0CQAAAAAGeAkAAAAABsAIBAAAAAd4CQAAAAAECAAAAFwAgJAAA2gYAIAMAAAAXACAkAADaBgAgJQAA2QYAIAEdAACXBwAwAgAAABcAIB0AANkGACACAAAAiwUAIB0AANgGACAEnQJAAKcEACGeAkAApwQAIbACAQCjBAAh3gJAAKcEACEFBgAA1gUAIJ0CQACnBAAhngJAAKcEACGwAgEAowQAId4CQACnBAAhBQYAANcFACCdAkAAAAABngJAAAAAAbACAQAAAAHeAkAAAAABCQUAAIIFACAGAADSBQAgkwIBAAAAAZ0CQAAAAAGeAkAAAAABsAIBAAAAAcgCAAAA3gICyQIBAAAAAdgCAQAAAAECAAAAGwAgJAAA4wYAIAMAAAAbACAkAADjBgAgJQAA4gYAIAEdAACWBwAwAgAAABsAIB0AAOIGACACAAAA-gQAIB0AAOEGACAHkwIBAKMEACGdAkAApwQAIZ4CQACnBAAhsAIBAKMEACHIAgAA_ATeAiLJAgEAowQAIdgCAQCjBAAhCQUAAP8EACAGAADRBQAgkwIBAKMEACGdAkAApwQAIZ4CQACnBAAhsAIBAKMEACHIAgAA_ATeAiLJAgEAowQAIdgCAQCjBAAhCQUAAIIFACAGAADSBQAgkwIBAAAAAZ0CQAAAAAGeAkAAAAABsAIBAAAAAcgCAAAA3gICyQIBAAAAAdgCAQAAAAEJBgAA3gUAIJMCAQAAAAGdAkAAAAABngJAAAAAAbACAQAAAAHfAgIAAAAB4AIBAAAAAeECCAAAAAHiAgEAAAABAgAAABMAICQAAOwGACADAAAAEwAgJAAA7AYAICUAAOsGACABHQAAlQcAMAIAAAATACAdAADrBgAgAgAAAJkFACAdAADqBgAgCJMCAQCjBAAhnQJAAKcEACGeAkAApwQAIbACAQCjBAAh3wICAMEEACHgAgEApAQAIeECCADABAAh4gIBAKQEACEJBgAA3QUAIJMCAQCjBAAhnQJAAKcEACGeAkAApwQAIbACAQCjBAAh3wICAMEEACHgAgEApAQAIeECCADABAAh4gIBAKQEACEJBgAA3gUAIJMCAQAAAAGdAkAAAAABngJAAAAAAbACAQAAAAHfAgIAAAAB4AIBAAAAAeECCAAAAAHiAgEAAAABEREAAJAGACASAACRBgAgkwIBAAAAAZUCAQAAAAGdAkAAAAABngJAAAAAAcgCAAAA9AIC3wIIAAAAAeYCAQAAAAHuAgEAAAAB7wIAAI4GACDwAgEAAAAB8QIBAAAAAfICAgAAAAH0AgEAAAAB9QJAAAAAAfYCAQAAAAECAAAAdAAgJAAA7QYAIAMAAAAHACAkAADtBgAgJQAA8QYAIBMAAAAHACARAAD3BQAgEgAA-AUAIB0AAPEGACCTAgEAowQAIZUCAQCkBAAhnQJAAKcEACGeAkAApwQAIcgCAAD1BfQCIt8CCACtBAAh5gIBAKQEACHuAgEAowQAIe8CAAD0BQAg8AIBAKQEACHxAgEApAQAIfICAgClBAAh9AIBAKQEACH1AkAApgQAIfYCAQCkBAAhEREAAPcFACASAAD4BQAgkwIBAKMEACGVAgEApAQAIZ0CQACnBAAhngJAAKcEACHIAgAA9QX0AiLfAggArQQAIeYCAQCkBAAh7gIBAKMEACHvAgAA9AUAIPACAQCkBAAh8QIBAKQEACHyAgIApQQAIfQCAQCkBAAh9QJAAKYEACH2AgEApAQAIQaTAgEAAAABnAJAAAAAAZ0CQAAAAAH6AgEAAAAB-wIBAAAAAfwCAQAAAAECAAAABQAgJAAA_QYAIAMAAAAFACAkAAD9BgAgJQAA_AYAIAEdAACUBwAwCwMAANkDACCQAgAAnAQAMJECAAADABCSAgAAnAQAMJMCAQAAAAGcAkAAtQMAIZ0CQAC1AwAh0AIBALADACH6AgEAAAAB-wIBALEDACH8AgEAsQMAIQIAAAAFACAdAAD8BgAgAgAAAPoGACAdAAD7BgAgCpACAAD5BgAwkQIAAPoGABCSAgAA-QYAMJMCAQCwAwAhnAJAALUDACGdAkAAtQMAIdACAQCwAwAh-gIBAPwDACH7AgEAsQMAIfwCAQCxAwAhCpACAAD5BgAwkQIAAPoGABCSAgAA-QYAMJMCAQCwAwAhnAJAALUDACGdAkAAtQMAIdACAQCwAwAh-gIBAPwDACH7AgEAsQMAIfwCAQCxAwAhBpMCAQCjBAAhnAJAAKcEACGdAkAApwQAIfoCAQCjBAAh-wIBAKQEACH8AgEApAQAIQaTAgEAowQAIZwCQACnBAAhnQJAAKcEACH6AgEAowQAIfsCAQCkBAAh_AIBAKQEACEGkwIBAAAAAZwCQAAAAAGdAkAAAAAB-gIBAAAAAfsCAQAAAAH8AgEAAAABBCQAAPIGADCFAwAA8wYAMIcDAAD1BgAgiwMAAPYGADADJAAA7QYAIIUDAADuBgAgiwMAAHQAIAQkAADkBgAwhQMAAOUGADCHAwAA5wYAIIsDAACVBQAwBCQAANsGADCFAwAA3AYAMIcDAADeBgAgiwMAAPYEADAEJAAA0gYAMIUDAADTBgAwhwMAANUGACCLAwAAhwUAMAMkAADNBgAghQMAAM4GACCLAwAAkgIAIAQkAADEBgAwhQMAAMUGADCHAwAAxwYAIIsDAADnBAAwBCQAALgGADCFAwAAuQYAMIcDAAC7BgAgiwMAALwGADAEJAAArAYAMIUDAACtBgAwhwMAAK8GACCLAwAAsAYAMAMkAACnBgAghQMAAKgGACCLAwAAjAEAIAALAwAAxwUAIBEAAJIGACASAACTBgAglQIAAJ0EACDmAgAAnQQAIPACAACdBAAg8QIAAJ0EACDyAgAAnQQAIPQCAACdBAAg9QIAAJ0EACD2AgAAnQQAIAAAAQMAAMcFACAAAAAHAwAAxwUAIJUCAACdBAAg5gIAAJ0EACDnAgAAnQQAIOgCAACdBAAg6gIAAJ0EACDsAgAAnQQAIA0FAACJBwAgBwAAkgcAIAgAAIoHACAJAACLBwAgCwAAkwYAIAwAAI0HACAOAACTBwAgDwAAkwcAILsCAACdBAAgvwIAAJ0EACDAAgAAnQQAIMQCAACdBAAgxQIAAJ0EACAAAAaTAgEAAAABnAJAAAAAAZ0CQAAAAAH6AgEAAAAB-wIBAAAAAfwCAQAAAAEIkwIBAAAAAZ0CQAAAAAGeAkAAAAABsAIBAAAAAd8CAgAAAAHgAgEAAAAB4QIIAAAAAeICAQAAAAEHkwIBAAAAAZ0CQAAAAAGeAkAAAAABsAIBAAAAAcgCAAAA3gICyQIBAAAAAdgCAQAAAAEEnQJAAAAAAZ4CQAAAAAGwAgEAAAAB3gJAAAAAAQeTAgEAAAABnQJAAAAAAZ4CQAAAAAGwAgEAAAAB0QIBAAAAAdICCAAAAAHTAiAAAAABBpMCAQAAAAGdAkAAAAABngJAAAAAAeMCAQAAAAHkAgIAAAAB5QIQAAAAAQmTAgEAAAABnQJAAAAAAZ4CQAAAAAG2AgAAANgCArkCAQAAAAHYAgEAAAAB2QIBAAAAAdoCgAAAAAHbAiAAAAABEgUAAP8GACAIAACABwAgCwAAgQcAIAwAAIQHACATAACCBwAgFAAAgwcAIBUAAIUHACAWAACGBwAgFwAAhwcAIJMCAQAAAAGVAgEAAAABnQJAAAAAAZ4CQAAAAAHmAgEAAAAB_QIBAAAAAf8CAAAA_wICgAMgAAAAAYEDAQAAAAECAAAAAQAgJAAAmwcAIAMAAABIACAkAACbBwAgJQAAnwcAIBQAAABIACAFAACeBgAgCAAAnwYAIAsAAKAGACAMAACjBgAgEwAAoQYAIBQAAKIGACAVAACkBgAgFgAApQYAIBcAAKYGACAdAACfBwAgkwIBAKMEACGVAgEAowQAIZ0CQACnBAAhngJAAKcEACHmAgEAowQAIf0CAQCjBAAh_wIAAJwG_wIigAMgAO0EACGBAwEApAQAIRIFAACeBgAgCAAAnwYAIAsAAKAGACAMAACjBgAgEwAAoQYAIBQAAKIGACAVAACkBgAgFgAApQYAIBcAAKYGACCTAgEAowQAIZUCAQCjBAAhnQJAAKcEACGeAkAApwQAIeYCAQCjBAAh_QIBAKMEACH_AgAAnAb_AiKAAyAA7QQAIYEDAQCkBAAhEgQAAP4GACAIAACABwAgCwAAgQcAIAwAAIQHACATAACCBwAgFAAAgwcAIBUAAIUHACAWAACGBwAgFwAAhwcAIJMCAQAAAAGVAgEAAAABnQJAAAAAAZ4CQAAAAAHmAgEAAAAB_QIBAAAAAf8CAAAA_wICgAMgAAAAAYEDAQAAAAECAAAAAQAgJAAAoAcAIBeTAgEAAAABlAIBAAAAAZYCAQAAAAGdAkAAAAABngJAAAAAAbYCAAAAxwICuQIBAAAAAboCAQAAAAG7AgEAAAABvAIQAAAAAb0CAQAAAAG-AgEAAAABvwIIAAAAAcACCAAAAAHBAgIAAAABwgIIAAAAAcMCAgAAAAHEAggAAAABxQICAAAAAcgCAAAAyAICygKAAAAAAcsCAACrBQAgzAIAAKwFACAHkwIBAAAAAZ0CQAAAAAGeAkAAAAABsAIBAAAAAcgCAAAA3gIC2AIBAAAAAdwCAQAAAAEDAAAASAAgJAAAoAcAICUAAKYHACAUAAAASAAgBAAAnQYAIAgAAJ8GACALAACgBgAgDAAAowYAIBMAAKEGACAUAACiBgAgFQAApAYAIBYAAKUGACAXAACmBgAgHQAApgcAIJMCAQCjBAAhlQIBAKMEACGdAkAApwQAIZ4CQACnBAAh5gIBAKMEACH9AgEAowQAIf8CAACcBv8CIoADIADtBAAhgQMBAKQEACESBAAAnQYAIAgAAJ8GACALAACgBgAgDAAAowYAIBMAAKEGACAUAACiBgAgFQAApAYAIBYAAKUGACAXAACmBgAgkwIBAKMEACGVAgEAowQAIZ0CQACnBAAhngJAAKcEACHmAgEAowQAIf0CAQCjBAAh_wIAAJwG_wIigAMgAO0EACGBAwEApAQAIRIEAAD-BgAgBQAA_wYAIAgAAIAHACALAACBBwAgDAAAhAcAIBMAAIIHACAUAACDBwAgFQAAhQcAIBYAAIYHACCTAgEAAAABlQIBAAAAAZ0CQAAAAAGeAkAAAAAB5gIBAAAAAf0CAQAAAAH_AgAAAP8CAoADIAAAAAGBAwEAAAABAgAAAAEAICQAAKcHACADAAAASAAgJAAApwcAICUAAKsHACAUAAAASAAgBAAAnQYAIAUAAJ4GACAIAACfBgAgCwAAoAYAIAwAAKMGACATAAChBgAgFAAAogYAIBUAAKQGACAWAAClBgAgHQAAqwcAIJMCAQCjBAAhlQIBAKMEACGdAkAApwQAIZ4CQACnBAAh5gIBAKMEACH9AgEAowQAIf8CAACcBv8CIoADIADtBAAhgQMBAKQEACESBAAAnQYAIAUAAJ4GACAIAACfBgAgCwAAoAYAIAwAAKMGACATAAChBgAgFAAAogYAIBUAAKQGACAWAAClBgAgkwIBAKMEACGVAgEAowQAIZ0CQACnBAAhngJAAKcEACHmAgEAowQAIf0CAQCjBAAh_wIAAJwG_wIigAMgAO0EACGBAwEApAQAIRIEAAD-BgAgBQAA_wYAIAgAAIAHACALAACBBwAgDAAAhAcAIBMAAIIHACAUAACDBwAgFgAAhgcAIBcAAIcHACCTAgEAAAABlQIBAAAAAZ0CQAAAAAGeAkAAAAAB5gIBAAAAAf0CAQAAAAH_AgAAAP8CAoADIAAAAAGBAwEAAAABAgAAAAEAICQAAKwHACADAAAASAAgJAAArAcAICUAALAHACAUAAAASAAgBAAAnQYAIAUAAJ4GACAIAACfBgAgCwAAoAYAIAwAAKMGACATAAChBgAgFAAAogYAIBYAAKUGACAXAACmBgAgHQAAsAcAIJMCAQCjBAAhlQIBAKMEACGdAkAApwQAIZ4CQACnBAAh5gIBAKMEACH9AgEAowQAIf8CAACcBv8CIoADIADtBAAhgQMBAKQEACESBAAAnQYAIAUAAJ4GACAIAACfBgAgCwAAoAYAIAwAAKMGACATAAChBgAgFAAAogYAIBYAAKUGACAXAACmBgAgkwIBAKMEACGVAgEAowQAIZ0CQACnBAAhngJAAKcEACHmAgEAowQAIf0CAQCjBAAh_wIAAJwG_wIigAMgAO0EACGBAwEApAQAIR8FAACtBQAgBwAArgUAIAkAALAFACALAACxBQAgDAAAsgUAIA4AALMFACAPAAC0BQAgkwIBAAAAAZQCAQAAAAGWAgEAAAABnQJAAAAAAZ4CQAAAAAG2AgAAAMcCArkCAQAAAAG6AgEAAAABuwIBAAAAAbwCEAAAAAG9AgEAAAABvgIBAAAAAb8CCAAAAAHAAggAAAABwQICAAAAAcICCAAAAAHDAgIAAAABxAIIAAAAAcUCAgAAAAHIAgAAAMgCAskCAQAAAAHKAoAAAAABywIAAKsFACDMAgAArAUAIAIAAAALACAkAACxBwAgAwAAAAkAICQAALEHACAlAAC1BwAgIQAAAAkAIAUAAMYEACAHAADHBAAgCQAAyQQAIAsAAMoEACAMAADLBAAgDgAAzAQAIA8AAM0EACAdAAC1BwAgkwIBAKMEACGUAgEAowQAIZYCAQCjBAAhnQJAAKcEACGeAkAApwQAIbYCAADCBMcCIrkCAQCjBAAhugIBAKMEACG7AgEApAQAIbwCEAC_BAAhvQIBAKMEACG-AgEAowQAIb8CCADABAAhwAIIAMAEACHBAgIAwQQAIcICCACtBAAhwwICAMEEACHEAggAwAQAIcUCAgClBAAhyAIAAMMEyAIiyQIBAKMEACHKAoAAAAABywIAAMQEACDMAgAAxQQAIB8FAADGBAAgBwAAxwQAIAkAAMkEACALAADKBAAgDAAAywQAIA4AAMwEACAPAADNBAAgkwIBAKMEACGUAgEAowQAIZYCAQCjBAAhnQJAAKcEACGeAkAApwQAIbYCAADCBMcCIrkCAQCjBAAhugIBAKMEACG7AgEApAQAIbwCEAC_BAAhvQIBAKMEACG-AgEAowQAIb8CCADABAAhwAIIAMAEACHBAgIAwQQAIcICCACtBAAhwwICAMEEACHEAggAwAQAIcUCAgClBAAhyAIAAMMEyAIiyQIBAKMEACHKAoAAAAABywIAAMQEACDMAgAAxQQAIB8FAACtBQAgBwAArgUAIAgAAK8FACALAACxBQAgDAAAsgUAIA4AALMFACAPAAC0BQAgkwIBAAAAAZQCAQAAAAGWAgEAAAABnQJAAAAAAZ4CQAAAAAG2AgAAAMcCArkCAQAAAAG6AgEAAAABuwIBAAAAAbwCEAAAAAG9AgEAAAABvgIBAAAAAb8CCAAAAAHAAggAAAABwQICAAAAAcICCAAAAAHDAgIAAAABxAIIAAAAAcUCAgAAAAHIAgAAAMgCAskCAQAAAAHKAoAAAAABywIAAKsFACDMAgAArAUAIAIAAAALACAkAAC2BwAgAwAAAAkAICQAALYHACAlAAC6BwAgIQAAAAkAIAUAAMYEACAHAADHBAAgCAAAyAQAIAsAAMoEACAMAADLBAAgDgAAzAQAIA8AAM0EACAdAAC6BwAgkwIBAKMEACGUAgEAowQAIZYCAQCjBAAhnQJAAKcEACGeAkAApwQAIbYCAADCBMcCIrkCAQCjBAAhugIBAKMEACG7AgEApAQAIbwCEAC_BAAhvQIBAKMEACG-AgEAowQAIb8CCADABAAhwAIIAMAEACHBAgIAwQQAIcICCACtBAAhwwICAMEEACHEAggAwAQAIcUCAgClBAAhyAIAAMMEyAIiyQIBAKMEACHKAoAAAAABywIAAMQEACDMAgAAxQQAIB8FAADGBAAgBwAAxwQAIAgAAMgEACALAADKBAAgDAAAywQAIA4AAMwEACAPAADNBAAgkwIBAKMEACGUAgEAowQAIZYCAQCjBAAhnQJAAKcEACGeAkAApwQAIbYCAADCBMcCIrkCAQCjBAAhugIBAKMEACG7AgEApAQAIbwCEAC_BAAhvQIBAKMEACG-AgEAowQAIb8CCADABAAhwAIIAMAEACHBAgIAwQQAIcICCACtBAAhwwICAMEEACHEAggAwAQAIcUCAgClBAAhyAIAAMMEyAIiyQIBAKMEACHKAoAAAAABywIAAMQEACDMAgAAxQQAIB8FAACtBQAgBwAArgUAIAgAAK8FACAJAACwBQAgDAAAsgUAIA4AALMFACAPAAC0BQAgkwIBAAAAAZQCAQAAAAGWAgEAAAABnQJAAAAAAZ4CQAAAAAG2AgAAAMcCArkCAQAAAAG6AgEAAAABuwIBAAAAAbwCEAAAAAG9AgEAAAABvgIBAAAAAb8CCAAAAAHAAggAAAABwQICAAAAAcICCAAAAAHDAgIAAAABxAIIAAAAAcUCAgAAAAHIAgAAAMgCAskCAQAAAAHKAoAAAAABywIAAKsFACDMAgAArAUAIAIAAAALACAkAAC7BwAgAwAAAAkAICQAALsHACAlAAC_BwAgIQAAAAkAIAUAAMYEACAHAADHBAAgCAAAyAQAIAkAAMkEACAMAADLBAAgDgAAzAQAIA8AAM0EACAdAAC_BwAgkwIBAKMEACGUAgEAowQAIZYCAQCjBAAhnQJAAKcEACGeAkAApwQAIbYCAADCBMcCIrkCAQCjBAAhugIBAKMEACG7AgEApAQAIbwCEAC_BAAhvQIBAKMEACG-AgEAowQAIb8CCADABAAhwAIIAMAEACHBAgIAwQQAIcICCACtBAAhwwICAMEEACHEAggAwAQAIcUCAgClBAAhyAIAAMMEyAIiyQIBAKMEACHKAoAAAAABywIAAMQEACDMAgAAxQQAIB8FAADGBAAgBwAAxwQAIAgAAMgEACAJAADJBAAgDAAAywQAIA4AAMwEACAPAADNBAAgkwIBAKMEACGUAgEAowQAIZYCAQCjBAAhnQJAAKcEACGeAkAApwQAIbYCAADCBMcCIrkCAQCjBAAhugIBAKMEACG7AgEApAQAIbwCEAC_BAAhvQIBAKMEACG-AgEAowQAIb8CCADABAAhwAIIAMAEACHBAgIAwQQAIcICCACtBAAhwwICAMEEACHEAggAwAQAIcUCAgClBAAhyAIAAMMEyAIiyQIBAKMEACHKAoAAAAABywIAAMQEACDMAgAAxQQAIBIEAAD-BgAgBQAA_wYAIAgAAIAHACALAACBBwAgDAAAhAcAIBMAAIIHACAUAACDBwAgFQAAhQcAIBcAAIcHACCTAgEAAAABlQIBAAAAAZ0CQAAAAAGeAkAAAAAB5gIBAAAAAf0CAQAAAAH_AgAAAP8CAoADIAAAAAGBAwEAAAABAgAAAAEAICQAAMAHACADAAAASAAgJAAAwAcAICUAAMQHACAUAAAASAAgBAAAnQYAIAUAAJ4GACAIAACfBgAgCwAAoAYAIAwAAKMGACATAAChBgAgFAAAogYAIBUAAKQGACAXAACmBgAgHQAAxAcAIJMCAQCjBAAhlQIBAKMEACGdAkAApwQAIZ4CQACnBAAh5gIBAKMEACH9AgEAowQAIf8CAACcBv8CIoADIADtBAAhgQMBAKQEACESBAAAnQYAIAUAAJ4GACAIAACfBgAgCwAAoAYAIAwAAKMGACATAAChBgAgFAAAogYAIBUAAKQGACAXAACmBgAgkwIBAKMEACGVAgEAowQAIZ0CQACnBAAhngJAAKcEACHmAgEAowQAIf0CAQCjBAAh_wIAAJwG_wIigAMgAO0EACGBAwEApAQAIRIEAAD-BgAgBQAA_wYAIAgAAIAHACALAACBBwAgDAAAhAcAIBMAAIIHACAVAACFBwAgFgAAhgcAIBcAAIcHACCTAgEAAAABlQIBAAAAAZ0CQAAAAAGeAkAAAAAB5gIBAAAAAf0CAQAAAAH_AgAAAP8CAoADIAAAAAGBAwEAAAABAgAAAAEAICQAAMUHACADAAAASAAgJAAAxQcAICUAAMkHACAUAAAASAAgBAAAnQYAIAUAAJ4GACAIAACfBgAgCwAAoAYAIAwAAKMGACATAAChBgAgFQAApAYAIBYAAKUGACAXAACmBgAgHQAAyQcAIJMCAQCjBAAhlQIBAKMEACGdAkAApwQAIZ4CQACnBAAh5gIBAKMEACH9AgEAowQAIf8CAACcBv8CIoADIADtBAAhgQMBAKQEACESBAAAnQYAIAUAAJ4GACAIAACfBgAgCwAAoAYAIAwAAKMGACATAAChBgAgFQAApAYAIBYAAKUGACAXAACmBgAgkwIBAKMEACGVAgEAowQAIZ0CQACnBAAhngJAAKcEACHmAgEAowQAIf0CAQCjBAAh_wIAAJwG_wIigAMgAO0EACGBAwEApAQAIR8FAACtBQAgBwAArgUAIAgAAK8FACAJAACwBQAgCwAAsQUAIA4AALMFACAPAAC0BQAgkwIBAAAAAZQCAQAAAAGWAgEAAAABnQJAAAAAAZ4CQAAAAAG2AgAAAMcCArkCAQAAAAG6AgEAAAABuwIBAAAAAbwCEAAAAAG9AgEAAAABvgIBAAAAAb8CCAAAAAHAAggAAAABwQICAAAAAcICCAAAAAHDAgIAAAABxAIIAAAAAcUCAgAAAAHIAgAAAMgCAskCAQAAAAHKAoAAAAABywIAAKsFACDMAgAArAUAIAIAAAALACAkAADKBwAgAwAAAAkAICQAAMoHACAlAADOBwAgIQAAAAkAIAUAAMYEACAHAADHBAAgCAAAyAQAIAkAAMkEACALAADKBAAgDgAAzAQAIA8AAM0EACAdAADOBwAgkwIBAKMEACGUAgEAowQAIZYCAQCjBAAhnQJAAKcEACGeAkAApwQAIbYCAADCBMcCIrkCAQCjBAAhugIBAKMEACG7AgEApAQAIbwCEAC_BAAhvQIBAKMEACG-AgEAowQAIb8CCADABAAhwAIIAMAEACHBAgIAwQQAIcICCACtBAAhwwICAMEEACHEAggAwAQAIcUCAgClBAAhyAIAAMMEyAIiyQIBAKMEACHKAoAAAAABywIAAMQEACDMAgAAxQQAIB8FAADGBAAgBwAAxwQAIAgAAMgEACAJAADJBAAgCwAAygQAIA4AAMwEACAPAADNBAAgkwIBAKMEACGUAgEAowQAIZYCAQCjBAAhnQJAAKcEACGeAkAApwQAIbYCAADCBMcCIrkCAQCjBAAhugIBAKMEACG7AgEApAQAIbwCEAC_BAAhvQIBAKMEACG-AgEAowQAIb8CCADABAAhwAIIAMAEACHBAgIAwQQAIcICCACtBAAhwwICAMEEACHEAggAwAQAIcUCAgClBAAhyAIAAMMEyAIiyQIBAKMEACHKAoAAAAABywIAAMQEACDMAgAAxQQAIBIDAACPBgAgEgAAkQYAIJMCAQAAAAGVAgEAAAABnQJAAAAAAZ4CQAAAAAHIAgAAAPQCAtACAQAAAAHfAggAAAAB5gIBAAAAAe4CAQAAAAHvAgAAjgYAIPACAQAAAAHxAgEAAAAB8gICAAAAAfQCAQAAAAH1AkAAAAAB9gIBAAAAAQIAAAB0ACAkAADPBwAgB5MCAQAAAAGdAkAAAAABngJAAAAAAbQCAQAAAAG2AgAAALYCArcCAgAAAAG4AgEAAAABEgQAAP4GACAFAAD_BgAgCwAAgQcAIAwAAIQHACATAACCBwAgFAAAgwcAIBUAAIUHACAWAACGBwAgFwAAhwcAIJMCAQAAAAGVAgEAAAABnQJAAAAAAZ4CQAAAAAHmAgEAAAAB_QIBAAAAAf8CAAAA_wICgAMgAAAAAYEDAQAAAAECAAAAAQAgJAAA0gcAIAMAAABIACAkAADSBwAgJQAA1gcAIBQAAABIACAEAACdBgAgBQAAngYAIAsAAKAGACAMAACjBgAgEwAAoQYAIBQAAKIGACAVAACkBgAgFgAApQYAIBcAAKYGACAdAADWBwAgkwIBAKMEACGVAgEAowQAIZ0CQACnBAAhngJAAKcEACHmAgEAowQAIf0CAQCjBAAh_wIAAJwG_wIigAMgAO0EACGBAwEApAQAIRIEAACdBgAgBQAAngYAIAsAAKAGACAMAACjBgAgEwAAoQYAIBQAAKIGACAVAACkBgAgFgAApQYAIBcAAKYGACCTAgEAowQAIZUCAQCjBAAhnQJAAKcEACGeAkAApwQAIeYCAQCjBAAh_QIBAKMEACH_AgAAnAb_AiKAAyAA7QQAIYEDAQCkBAAhCJMCAQAAAAGdAkAAAAABngJAAAAAAdACAQAAAAHfAgIAAAAB4AIBAAAAAeECCAAAAAHiAgEAAAABEgQAAP4GACAFAAD_BgAgCAAAgAcAIAsAAIEHACAMAACEBwAgFAAAgwcAIBUAAIUHACAWAACGBwAgFwAAhwcAIJMCAQAAAAGVAgEAAAABnQJAAAAAAZ4CQAAAAAHmAgEAAAAB_QIBAAAAAf8CAAAA_wICgAMgAAAAAYEDAQAAAAECAAAAAQAgJAAA2AcAIAMAAABIACAkAADYBwAgJQAA3AcAIBQAAABIACAEAACdBgAgBQAAngYAIAgAAJ8GACALAACgBgAgDAAAowYAIBQAAKIGACAVAACkBgAgFgAApQYAIBcAAKYGACAdAADcBwAgkwIBAKMEACGVAgEAowQAIZ0CQACnBAAhngJAAKcEACHmAgEAowQAIf0CAQCjBAAh_wIAAJwG_wIigAMgAO0EACGBAwEApAQAIRIEAACdBgAgBQAAngYAIAgAAJ8GACALAACgBgAgDAAAowYAIBQAAKIGACAVAACkBgAgFgAApQYAIBcAAKYGACCTAgEAowQAIZUCAQCjBAAhnQJAAKcEACGeAkAApwQAIeYCAQCjBAAh_QIBAKMEACH_AgAAnAb_AiKAAyAA7QQAIYEDAQCkBAAhBJ0CQAAAAAGeAkAAAAAB0AIBAAAAAd4CQAAAAAESAwAAjwYAIBEAAJAGACCTAgEAAAABlQIBAAAAAZ0CQAAAAAGeAkAAAAAByAIAAAD0AgLQAgEAAAAB3wIIAAAAAeYCAQAAAAHuAgEAAAAB7wIAAI4GACDwAgEAAAAB8QIBAAAAAfICAgAAAAH0AgEAAAAB9QJAAAAAAfYCAQAAAAECAAAAdAAgJAAA3gcAIBIEAAD-BgAgBQAA_wYAIAgAAIAHACAMAACEBwAgEwAAggcAIBQAAIMHACAVAACFBwAgFgAAhgcAIBcAAIcHACCTAgEAAAABlQIBAAAAAZ0CQAAAAAGeAkAAAAAB5gIBAAAAAf0CAQAAAAH_AgAAAP8CAoADIAAAAAGBAwEAAAABAgAAAAEAICQAAOAHACADAAAABwAgJAAA3gcAICUAAOQHACAUAAAABwAgAwAA9gUAIBEAAPcFACAdAADkBwAgkwIBAKMEACGVAgEApAQAIZ0CQACnBAAhngJAAKcEACHIAgAA9QX0AiLQAgEAowQAId8CCACtBAAh5gIBAKQEACHuAgEAowQAIe8CAAD0BQAg8AIBAKQEACHxAgEApAQAIfICAgClBAAh9AIBAKQEACH1AkAApgQAIfYCAQCkBAAhEgMAAPYFACARAAD3BQAgkwIBAKMEACGVAgEApAQAIZ0CQACnBAAhngJAAKcEACHIAgAA9QX0AiLQAgEAowQAId8CCACtBAAh5gIBAKQEACHuAgEAowQAIe8CAAD0BQAg8AIBAKQEACHxAgEApAQAIfICAgClBAAh9AIBAKQEACH1AkAApgQAIfYCAQCkBAAhAwAAAEgAICQAAOAHACAlAADnBwAgFAAAAEgAIAQAAJ0GACAFAACeBgAgCAAAnwYAIAwAAKMGACATAAChBgAgFAAAogYAIBUAAKQGACAWAAClBgAgFwAApgYAIB0AAOcHACCTAgEAowQAIZUCAQCjBAAhnQJAAKcEACGeAkAApwQAIeYCAQCjBAAh_QIBAKMEACH_AgAAnAb_AiKAAyAA7QQAIYEDAQCkBAAhEgQAAJ0GACAFAACeBgAgCAAAnwYAIAwAAKMGACATAAChBgAgFAAAogYAIBUAAKQGACAWAAClBgAgFwAApgYAIJMCAQCjBAAhlQIBAKMEACGdAkAApwQAIZ4CQACnBAAh5gIBAKMEACH9AgEAowQAIf8CAACcBv8CIoADIADtBAAhgQMBAKQEACEHkwIBAAAAAZ0CQAAAAAGeAkAAAAAByAIAAADeAgLJAgEAAAAB2AIBAAAAAdwCAQAAAAESBAAA_gYAIAUAAP8GACAIAACABwAgCwAAgQcAIBMAAIIHACAUAACDBwAgFQAAhQcAIBYAAIYHACAXAACHBwAgkwIBAAAAAZUCAQAAAAGdAkAAAAABngJAAAAAAeYCAQAAAAH9AgEAAAAB_wIAAAD_AgKAAyAAAAABgQMBAAAAAQIAAAABACAkAADpBwAgAwAAAEgAICQAAOkHACAlAADtBwAgFAAAAEgAIAQAAJ0GACAFAACeBgAgCAAAnwYAIAsAAKAGACATAAChBgAgFAAAogYAIBUAAKQGACAWAAClBgAgFwAApgYAIB0AAO0HACCTAgEAowQAIZUCAQCjBAAhnQJAAKcEACGeAkAApwQAIeYCAQCjBAAh_QIBAKMEACH_AgAAnAb_AiKAAyAA7QQAIYEDAQCkBAAhEgQAAJ0GACAFAACeBgAgCAAAnwYAIAsAAKAGACATAAChBgAgFAAAogYAIBUAAKQGACAWAAClBgAgFwAApgYAIJMCAQCjBAAhlQIBAKMEACGdAkAApwQAIZ4CQACnBAAh5gIBAKMEACH9AgEAowQAIf8CAACcBv8CIoADIADtBAAhgQMBAKQEACEHkwIBAAAAAZ0CQAAAAAGeAkAAAAAB0AIBAAAAAdECAQAAAAHSAggAAAAB0wIgAAAAAQWTAgEAAAABngJAAAAAAbECAQAAAAGyAggAAAABswKAAAAAAQWTAgEAAAABngJAAAAAAbACAQAAAAGyAggAAAABswKAAAAAAQMAAAAHACAkAADPBwAgJQAA8wcAIBQAAAAHACADAAD2BQAgEgAA-AUAIB0AAPMHACCTAgEAowQAIZUCAQCkBAAhnQJAAKcEACGeAkAApwQAIcgCAAD1BfQCItACAQCjBAAh3wIIAK0EACHmAgEApAQAIe4CAQCjBAAh7wIAAPQFACDwAgEApAQAIfECAQCkBAAh8gICAKUEACH0AgEApAQAIfUCQACmBAAh9gIBAKQEACESAwAA9gUAIBIAAPgFACCTAgEAowQAIZUCAQCkBAAhnQJAAKcEACGeAkAApwQAIcgCAAD1BfQCItACAQCjBAAh3wIIAK0EACHmAgEApAQAIe4CAQCjBAAh7wIAAPQFACDwAgEApAQAIfECAQCkBAAh8gICAKUEACH0AgEApAQAIfUCQACmBAAh9gIBAKQEACEfBQAArQUAIAgAAK8FACAJAACwBQAgCwAAsQUAIAwAALIFACAOAACzBQAgDwAAtAUAIJMCAQAAAAGUAgEAAAABlgIBAAAAAZ0CQAAAAAGeAkAAAAABtgIAAADHAgK5AgEAAAABugIBAAAAAbsCAQAAAAG8AhAAAAABvQIBAAAAAb4CAQAAAAG_AggAAAABwAIIAAAAAcECAgAAAAHCAggAAAABwwICAAAAAcQCCAAAAAHFAgIAAAAByAIAAADIAgLJAgEAAAABygKAAAAAAcsCAACrBQAgzAIAAKwFACACAAAACwAgJAAA9AcAIAMAAAAJACAkAAD0BwAgJQAA-AcAICEAAAAJACAFAADGBAAgCAAAyAQAIAkAAMkEACALAADKBAAgDAAAywQAIA4AAMwEACAPAADNBAAgHQAA-AcAIJMCAQCjBAAhlAIBAKMEACGWAgEAowQAIZ0CQACnBAAhngJAAKcEACG2AgAAwgTHAiK5AgEAowQAIboCAQCjBAAhuwIBAKQEACG8AhAAvwQAIb0CAQCjBAAhvgIBAKMEACG_AggAwAQAIcACCADABAAhwQICAMEEACHCAggArQQAIcMCAgDBBAAhxAIIAMAEACHFAgIApQQAIcgCAADDBMgCIskCAQCjBAAhygKAAAAAAcsCAADEBAAgzAIAAMUEACAfBQAAxgQAIAgAAMgEACAJAADJBAAgCwAAygQAIAwAAMsEACAOAADMBAAgDwAAzQQAIJMCAQCjBAAhlAIBAKMEACGWAgEAowQAIZ0CQACnBAAhngJAAKcEACG2AgAAwgTHAiK5AgEAowQAIboCAQCjBAAhuwIBAKQEACG8AhAAvwQAIb0CAQCjBAAhvgIBAKMEACG_AggAwAQAIcACCADABAAhwQICAMEEACHCAggArQQAIcMCAgDBBAAhxAIIAMAEACHFAgIApQQAIcgCAADDBMgCIskCAQCjBAAhygKAAAAAAcsCAADEBAAgzAIAAMUEACAfBQAArQUAIAcAAK4FACAIAACvBQAgCQAAsAUAIAsAALEFACAMAACyBQAgDgAAswUAIJMCAQAAAAGUAgEAAAABlgIBAAAAAZ0CQAAAAAGeAkAAAAABtgIAAADHAgK5AgEAAAABugIBAAAAAbsCAQAAAAG8AhAAAAABvQIBAAAAAb4CAQAAAAG_AggAAAABwAIIAAAAAcECAgAAAAHCAggAAAABwwICAAAAAcQCCAAAAAHFAgIAAAAByAIAAADIAgLJAgEAAAABygKAAAAAAcsCAACrBQAgzAIAAKwFACACAAAACwAgJAAA-QcAIB8FAACtBQAgBwAArgUAIAgAAK8FACAJAACwBQAgCwAAsQUAIAwAALIFACAPAAC0BQAgkwIBAAAAAZQCAQAAAAGWAgEAAAABnQJAAAAAAZ4CQAAAAAG2AgAAAMcCArkCAQAAAAG6AgEAAAABuwIBAAAAAbwCEAAAAAG9AgEAAAABvgIBAAAAAb8CCAAAAAHAAggAAAABwQICAAAAAcICCAAAAAHDAgIAAAABxAIIAAAAAcUCAgAAAAHIAgAAAMgCAskCAQAAAAHKAoAAAAABywIAAKsFACDMAgAArAUAIAIAAAALACAkAAD7BwAgAwAAAAkAICQAAPkHACAlAAD_BwAgIQAAAAkAIAUAAMYEACAHAADHBAAgCAAAyAQAIAkAAMkEACALAADKBAAgDAAAywQAIA4AAMwEACAdAAD_BwAgkwIBAKMEACGUAgEAowQAIZYCAQCjBAAhnQJAAKcEACGeAkAApwQAIbYCAADCBMcCIrkCAQCjBAAhugIBAKMEACG7AgEApAQAIbwCEAC_BAAhvQIBAKMEACG-AgEAowQAIb8CCADABAAhwAIIAMAEACHBAgIAwQQAIcICCACtBAAhwwICAMEEACHEAggAwAQAIcUCAgClBAAhyAIAAMMEyAIiyQIBAKMEACHKAoAAAAABywIAAMQEACDMAgAAxQQAIB8FAADGBAAgBwAAxwQAIAgAAMgEACAJAADJBAAgCwAAygQAIAwAAMsEACAOAADMBAAgkwIBAKMEACGUAgEAowQAIZYCAQCjBAAhnQJAAKcEACGeAkAApwQAIbYCAADCBMcCIrkCAQCjBAAhugIBAKMEACG7AgEApAQAIbwCEAC_BAAhvQIBAKMEACG-AgEAowQAIb8CCADABAAhwAIIAMAEACHBAgIAwQQAIcICCACtBAAhwwICAMEEACHEAggAwAQAIcUCAgClBAAhyAIAAMMEyAIiyQIBAKMEACHKAoAAAAABywIAAMQEACDMAgAAxQQAIAMAAAAJACAkAAD7BwAgJQAAgggAICEAAAAJACAFAADGBAAgBwAAxwQAIAgAAMgEACAJAADJBAAgCwAAygQAIAwAAMsEACAPAADNBAAgHQAAgggAIJMCAQCjBAAhlAIBAKMEACGWAgEAowQAIZ0CQACnBAAhngJAAKcEACG2AgAAwgTHAiK5AgEAowQAIboCAQCjBAAhuwIBAKQEACG8AhAAvwQAIb0CAQCjBAAhvgIBAKMEACG_AggAwAQAIcACCADABAAhwQICAMEEACHCAggArQQAIcMCAgDBBAAhxAIIAMAEACHFAgIApQQAIcgCAADDBMgCIskCAQCjBAAhygKAAAAAAcsCAADEBAAgzAIAAMUEACAfBQAAxgQAIAcAAMcEACAIAADIBAAgCQAAyQQAIAsAAMoEACAMAADLBAAgDwAAzQQAIJMCAQCjBAAhlAIBAKMEACGWAgEAowQAIZ0CQACnBAAhngJAAKcEACG2AgAAwgTHAiK5AgEAowQAIboCAQCjBAAhuwIBAKQEACG8AhAAvwQAIb0CAQCjBAAhvgIBAKMEACG_AggAwAQAIcACCADABAAhwQICAMEEACHCAggArQQAIcMCAgDBBAAhxAIIAMAEACHFAgIApQQAIcgCAADDBMgCIskCAQCjBAAhygKAAAAAAcsCAADEBAAgzAIAAMUEACALBAYCBQgDCDAGCzEIDDUJEAAREzIHFDQNFTkOFj0PFz8QAQMAAQQDAAEQAAwRDAQSLQgJBQADBxAFCBQGCRgHCxwIDCAJDiQKDyUKEAALAQYABAIDAAEGAAQCAwABBgAEAwUAAwYABAoAAQIDAAEGAAQCBgAEDQAEBwcmAAgnAAkoAAspAAwqAA4rAA8sAAIRLgASLwABAwABAQMAAQEDAAEBAwABBwRAAAhBAAtCAAxEABNDABVFABZGAAAAAAMQABYqABcrABgAAAADEAAWKgAXKwAYAQMAAQEDAAEDEAAdKgAeKwAfAAAAAxAAHSoAHisAHwEDAAEBAwABBRAAJCoAJysAKEwAJU0AJgAAAAAABRAAJCoAJysAKEwAJU0AJgEDAAEBAwABBRAALSoAMCsAMUwALk0ALwAAAAAABRAALSoAMCsAMUwALk0ALwEDAAEBAwABBRAANioAOSsAOkwAN00AOAAAAAAABRAANioAOSsAOkwAN00AOAIDAAEGAAQCAwABBgAEBRAAPyoAQisAQ0wAQE0AQQAAAAAABRAAPyoAQisAQ0wAQE0AQQIDAAEGAAQCAwABBgAEAxAASCoASSsASgAAAAMQAEgqAEkrAEoDBQADBgAECgABAwUAAwYABAoAAQMQAE8qAFArAFEAAAADEABPKgBQKwBRAQMAAQEDAAEDEABWKgBXKwBYAAAAAxAAVioAVysAWAEDAAEBAwABBRAAXSoAYCsAYUwAXk0AXwAAAAAABRAAXSoAYCsAYUwAXk0AXwIDAAEGAAQCAwABBgAEBRAAZioAaSsAakwAZ00AaAAAAAAABRAAZioAaSsAakwAZ00AaAEFAAMBBQADBRAAbyoAcisAc0wAcE0AcQAAAAAABRAAbyoAcisAc0wAcE0AcQEGAAQBBgAEBRAAeCoAeysAfEwAeU0AegAAAAAABRAAeCoAeysAfEwAeU0AegIGAAQNAAQCBgAEDQAEBRAAgQEqAIQBKwCFAUwAggFNAIMBAAAAAAAFEACBASoAhAErAIUBTACCAU0AgwEAAAAFEACLASoAjgErAI8BTACMAU0AjQEAAAAAAAUQAIsBKgCOASsAjwFMAIwBTQCNARgCARlHARpKARtLARxMAR5OAR9QEiBREyFTASJVEiNWFCZXASdYAShZEixcFS1dGS5eAi9fAjBgAjFhAjJiAjNkAjRmEjVnGjZpAjdrEjhsGzltAjpuAjtvEjxyHD1zID51Az92A0B4A0F5A0J6A0N8A0R-EkV_IUaBAQNHgwESSIQBIkmFAQNKhgEDS4cBEk6KASNPiwEpUI0BEFGOARBSkAEQU5EBEFSSARBVlAEQVpYBEleXASpYmQEQWZsBElqcAStbnQEQXJ4BEF2fARJeogEsX6MBMmCkAQ5hpQEOYqYBDmOnAQ5kqAEOZaoBDmasARJnrQEzaK8BDmmxARJqsgE0a7MBDmy0AQ5ttQESbrgBNW-5ATtwugEGcbsBBnK8AQZzvQEGdL4BBnXAAQZ2wgESd8MBPHjFAQZ5xwESesgBPXvJAQZ8ygEGfcsBEn7OAT5_zwFEgAHQAQeBAdEBB4IB0gEHgwHTAQeEAdQBB4UB1gEHhgHYARKHAdkBRYgB2wEHiQHdARKKAd4BRosB3wEHjAHgAQeNAeEBEo4B5AFHjwHlAUuQAeYBCJEB5wEIkgHoAQiTAekBCJQB6gEIlQHsAQiWAe4BEpcB7wFMmAHxAQiZAfMBEpoB9AFNmwH1AQicAfYBCJ0B9wESngH6AU6fAfsBUqAB_AEPoQH9AQ-iAf4BD6MB_wEPpAGAAg-lAYICD6YBhAISpwGFAlOoAYcCD6kBiQISqgGKAlSrAYsCD6wBjAIPrQGNAhKuAZACVa8BkQJZsAGTAg2xAZQCDbIBlgINswGXAg20AZgCDbUBmgINtgGcAhK3AZ0CWrgBnwINuQGhAhK6AaICW7sBowINvAGkAg29AaUCEr4BqAJcvwGpAmLAAaoCCcEBqwIJwgGsAgnDAa0CCcQBrgIJxQGwAgnGAbICEscBswJjyAG1AgnJAbcCEsoBuAJkywG5AgnMAboCCc0BuwISzgG-AmXPAb8Ca9ABwAIE0QHBAgTSAcICBNMBwwIE1AHEAgTVAcYCBNYByAIS1wHJAmzYAcsCBNkBzQIS2gHOAm3bAc8CBNwB0AIE3QHRAhLeAdQCbt8B1QJ04AHWAgXhAdcCBeIB2AIF4wHZAgXkAdoCBeUB3AIF5gHeAhLnAd8CdegB4QIF6QHjAhLqAeQCdusB5QIF7AHmAgXtAecCEu4B6gJ37wHrAn3wAewCCvEB7QIK8gHuAgrzAe8CCvQB8AIK9QHyAgr2AfQCEvcB9QJ--AH3Agr5AfkCEvoB-gJ_-wH7Agr8AfwCCv0B_QIS_gGAA4AB_wGBA4YBgAKDA4cBgQKEA4cBggKHA4cBgwKIA4cBhAKJA4cBhQKLA4cBhgKNAxKHAo4DiAGIApADhwGJApIDEooCkwOJAYsClAOHAYwClQOHAY0ClgMSjgKZA4oBjwKaA5AB"
};
async function decodeBase64AsWasm(wasmBase64) {
  const { Buffer: Buffer2 } = await import("buffer");
  const wasmArray = Buffer2.from(wasmBase64, "base64");
  return new WebAssembly.Module(wasmArray);
}
config2.compilerWasm = {
  getRuntime: async () => await import("@prisma/client/runtime/query_compiler_fast_bg.postgresql.mjs"),
  getQueryCompilerWasmModule: async () => {
    const { wasm } = await import("@prisma/client/runtime/query_compiler_fast_bg.postgresql.wasm-base64.mjs");
    return await decodeBase64AsWasm(wasm);
  },
  importName: "./query_compiler_fast_bg.js"
};
function getPrismaClientClass() {
  return runtime.getPrismaClient(config2);
}

// src/generated/prisma/internal/prismaNamespace.ts
var prismaNamespace_exports = {};
__export(prismaNamespace_exports, {
  AIRecommendationScalarFieldEnum: () => AIRecommendationScalarFieldEnum,
  AdminScalarFieldEnum: () => AdminScalarFieldEnum,
  AgentScalarFieldEnum: () => AgentScalarFieldEnum,
  AnyNull: () => AnyNull2,
  AuditLogScalarFieldEnum: () => AuditLogScalarFieldEnum,
  DbNull: () => DbNull2,
  Decimal: () => Decimal2,
  InquiryScalarFieldEnum: () => InquiryScalarFieldEnum,
  JsonNull: () => JsonNull2,
  JsonNullValueFilter: () => JsonNullValueFilter,
  JsonNullValueInput: () => JsonNullValueInput,
  MediaScalarFieldEnum: () => MediaScalarFieldEnum,
  ModelName: () => ModelName,
  NeighborhoodScalarFieldEnum: () => NeighborhoodScalarFieldEnum,
  NotificationScalarFieldEnum: () => NotificationScalarFieldEnum,
  NullTypes: () => NullTypes2,
  NullableJsonNullValueInput: () => NullableJsonNullValueInput,
  NullsOrder: () => NullsOrder,
  PrismaClientInitializationError: () => PrismaClientInitializationError2,
  PrismaClientKnownRequestError: () => PrismaClientKnownRequestError2,
  PrismaClientRustPanicError: () => PrismaClientRustPanicError2,
  PrismaClientUnknownRequestError: () => PrismaClientUnknownRequestError2,
  PrismaClientValidationError: () => PrismaClientValidationError2,
  PropertyScalarFieldEnum: () => PropertyScalarFieldEnum,
  QueryMode: () => QueryMode,
  ReviewScalarFieldEnum: () => ReviewScalarFieldEnum,
  SavedPropertyScalarFieldEnum: () => SavedPropertyScalarFieldEnum,
  SearchPreferenceScalarFieldEnum: () => SearchPreferenceScalarFieldEnum,
  SessionScalarFieldEnum: () => SessionScalarFieldEnum,
  SimilarPropertyScalarFieldEnum: () => SimilarPropertyScalarFieldEnum,
  SortOrder: () => SortOrder,
  Sql: () => Sql2,
  TransactionIsolationLevel: () => TransactionIsolationLevel,
  UserScalarFieldEnum: () => UserScalarFieldEnum,
  defineExtension: () => defineExtension,
  empty: () => empty2,
  getExtensionContext: () => getExtensionContext,
  join: () => join2,
  prismaVersion: () => prismaVersion,
  raw: () => raw2,
  sql: () => sql
});
import * as runtime2 from "@prisma/client/runtime/client";
var PrismaClientKnownRequestError2 = runtime2.PrismaClientKnownRequestError;
var PrismaClientUnknownRequestError2 = runtime2.PrismaClientUnknownRequestError;
var PrismaClientRustPanicError2 = runtime2.PrismaClientRustPanicError;
var PrismaClientInitializationError2 = runtime2.PrismaClientInitializationError;
var PrismaClientValidationError2 = runtime2.PrismaClientValidationError;
var sql = runtime2.sqltag;
var empty2 = runtime2.empty;
var join2 = runtime2.join;
var raw2 = runtime2.raw;
var Sql2 = runtime2.Sql;
var Decimal2 = runtime2.Decimal;
var getExtensionContext = runtime2.Extensions.getExtensionContext;
var prismaVersion = {
  client: "7.8.0",
  engine: "3c6e192761c0362d496ed980de936e2f3cebcd3a"
};
var NullTypes2 = {
  DbNull: runtime2.NullTypes.DbNull,
  JsonNull: runtime2.NullTypes.JsonNull,
  AnyNull: runtime2.NullTypes.AnyNull
};
var DbNull2 = runtime2.DbNull;
var JsonNull2 = runtime2.JsonNull;
var AnyNull2 = runtime2.AnyNull;
var ModelName = {
  User: "User",
  Session: "Session",
  Agent: "Agent",
  Admin: "Admin",
  AuditLog: "AuditLog",
  Review: "Review",
  SavedProperty: "SavedProperty",
  Inquiry: "Inquiry",
  Notification: "Notification",
  SearchPreference: "SearchPreference",
  AIRecommendation: "AIRecommendation",
  Property: "Property",
  Media: "Media",
  SimilarProperty: "SimilarProperty",
  Neighborhood: "Neighborhood"
};
var TransactionIsolationLevel = runtime2.makeStrictEnum({
  ReadUncommitted: "ReadUncommitted",
  ReadCommitted: "ReadCommitted",
  RepeatableRead: "RepeatableRead",
  Serializable: "Serializable"
});
var UserScalarFieldEnum = {
  id: "id",
  email: "email",
  password: "password",
  name: "name",
  role: "role",
  isActive: "isActive",
  avatar: "avatar",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var SessionScalarFieldEnum = {
  id: "id",
  userId: "userId",
  token: "token",
  ipAddress: "ipAddress",
  userAgent: "userAgent",
  expiresAt: "expiresAt",
  createdAt: "createdAt"
};
var AgentScalarFieldEnum = {
  id: "id",
  userId: "userId",
  licenseNumber: "licenseNumber",
  specialties: "specialties",
  name: "name",
  email: "email",
  bio: "bio",
  phone: "phone",
  experienceYears: "experienceYears",
  rating: "rating",
  status: "status",
  reviewedBy: "reviewedBy",
  reviewedAt: "reviewedAt",
  reviewNote: "reviewNote",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var AdminScalarFieldEnum = {
  id: "id",
  name: "name",
  email: "email",
  profilePhoto: "profilePhoto",
  contactNumber: "contactNumber",
  isDeleted: "isDeleted",
  deletedAt: "deletedAt",
  userId: "userId",
  permissions: "permissions",
  department: "department",
  accessLevel: "accessLevel",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var AuditLogScalarFieldEnum = {
  id: "id",
  userId: "userId",
  action: "action",
  tokenCount: "tokenCount",
  estimatedCost: "estimatedCost",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var ReviewScalarFieldEnum = {
  id: "id",
  rating: "rating",
  comment: "comment",
  sentiment: "sentiment",
  aiSummary: "aiSummary",
  userId: "userId",
  propertyId: "propertyId",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var SavedPropertyScalarFieldEnum = {
  userId: "userId",
  propertyId: "propertyId",
  savedAt: "savedAt",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var InquiryScalarFieldEnum = {
  id: "id",
  buyerId: "buyerId",
  agentId: "agentId",
  propertyId: "propertyId",
  message: "message",
  status: "status",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var NotificationScalarFieldEnum = {
  id: "id",
  userId: "userId",
  type: "type",
  title: "title",
  message: "message",
  link: "link",
  metadata: "metadata",
  isRead: "isRead",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var SearchPreferenceScalarFieldEnum = {
  id: "id",
  userId: "userId",
  keywords: "keywords",
  avgPrice: "avgPrice",
  targetAreas: "targetAreas",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var AIRecommendationScalarFieldEnum = {
  id: "id",
  userId: "userId",
  propertyId: "propertyId",
  reason: "reason",
  score: "score",
  viewed: "viewed",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var PropertyScalarFieldEnum = {
  id: "id",
  title: "title",
  description: "description",
  shortDescription: "shortDescription",
  price: "price",
  address: "address",
  city: "city",
  state: "state",
  zip: "zip",
  lat: "lat",
  lng: "lng",
  beds: "beds",
  baths: "baths",
  sqft: "sqft",
  lotSize: "lotSize",
  yearBuilt: "yearBuilt",
  type: "type",
  status: "status",
  agentId: "agentId",
  aiFeatures: "aiFeatures",
  tags: "tags",
  highlights: "highlights",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var MediaScalarFieldEnum = {
  id: "id",
  propertyId: "propertyId",
  url: "url",
  type: "type",
  order: "order",
  altText: "altText",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var SimilarPropertyScalarFieldEnum = {
  id: "id",
  propertyId: "propertyId",
  similarId: "similarId",
  similarityScore: "similarityScore",
  matchCriteria: "matchCriteria",
  updatedAt: "updatedAt"
};
var NeighborhoodScalarFieldEnum = {
  id: "id",
  zip: "zip",
  name: "name",
  city: "city",
  safetyScore: "safetyScore",
  schoolScore: "schoolScore",
  transitScore: "transitScore",
  marketTrend: "marketTrend",
  aiAnalysis: "aiAnalysis",
  expiresAt: "expiresAt",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var SortOrder = {
  asc: "asc",
  desc: "desc"
};
var NullableJsonNullValueInput = {
  DbNull: DbNull2,
  JsonNull: JsonNull2
};
var JsonNullValueInput = {
  JsonNull: JsonNull2
};
var QueryMode = {
  default: "default",
  insensitive: "insensitive"
};
var NullsOrder = {
  first: "first",
  last: "last"
};
var JsonNullValueFilter = {
  DbNull: DbNull2,
  JsonNull: JsonNull2,
  AnyNull: AnyNull2
};
var defineExtension = runtime2.Extensions.defineExtension;

// src/generated/prisma/enums.ts
var AgentStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED"
};

// src/generated/prisma/client.ts
globalThis["__dirname"] = path.dirname(fileURLToPath(import.meta.url));
var PrismaClient = getPrismaClientClass();

// src/app/lib/index.ts
import { PrismaPg } from "@prisma/adapter-pg";
import { v2 as cloudinaryV22 } from "cloudinary";
import nodemailer from "nodemailer";
var globalForPrisma = globalThis;
var adapter = new PrismaPg({ connectionString: config.db.url });
var prisma = globalForPrisma.prisma ?? new PrismaClient({
  adapter,
  log: config.nodeEnv === "development" ? ["query", "error", "warn"] : ["error"]
});
if (config.nodeEnv !== "production") globalForPrisma.prisma = prisma;
cloudinaryV22.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret
});
var transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.port === 465,
  auth: {
    user: config.email.user,
    pass: config.email.pass
  }
});

// src/app/module/auth/auth.service.ts
var seedSuperAdmin = async (data) => {
  if (data.seedSecret !== process.env["ADMIN_SEED_SECRET"]) {
    throw new AppError_default("Invalid seed secret", 403);
  }
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new AppError_default("User already exists", 409);
  const hashed = await hashPassword(data.password);
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashed,
        role: "SUPER_ADMIN"
      }
    });
    const admin = await tx.admin.create({
      data: {
        userId: user.id,
        name: data.name,
        email: data.email,
        department: data.department ?? "Management",
        accessLevel: 5,
        permissions: ["ALL"]
      }
    });
    return { user, admin };
  });
  return result;
};
var registerUser = async (data) => {
  const existing = await prisma.user.findUnique({
    where: { email: data.email }
  });
  if (existing) throw new AppError_default("Email already in use", 409);
  const hashed = await hashPassword(data.password);
  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashed,
        role: data.role
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true }
    });
    if (data.role === "AGENT") {
      await tx.agent.create({
        data: {
          userId: created.id,
          name: data.name,
          email: data.email,
          licenseNumber: `PENDING-${created.id.slice(0, 8).toUpperCase()}`,
          specialties: []
        }
      });
    }
    return created;
  });
  return user;
};
var loginUser = async (data, ipAddress, userAgent) => {
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) throw new AppError_default("Invalid email or password", 401);
  if (!user.isActive) throw new AppError_default("Account is deactivated", 403);
  const valid = await comparePassword(data.password, user.password);
  if (!valid) throw new AppError_default("Invalid email or password", 401);
  const payload = { userId: user.id, email: user.email, role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  await prisma.session.create({
    data: {
      userId: user.id,
      token: refreshToken,
      ipAddress: ipAddress ?? null,
      userAgent: userAgent ?? null,
      expiresAt: addDays(7)
    }
  });
  const { password: _pw, ...safeUser } = user;
  return { accessToken, refreshToken, user: safeUser };
};
var refreshAccessToken = async (refreshToken) => {
  const session = await prisma.session.findUnique({
    where: { token: refreshToken }
  });
  if (!session || session.expiresAt < /* @__PURE__ */ new Date()) {
    throw new AppError_default("Invalid or expired refresh token", 401);
  }
  const payload = verifyRefreshToken(refreshToken);
  await prisma.session.delete({
    where: { token: refreshToken }
  });
  const cleanPayload = {
    userId: payload.userId,
    email: payload.email,
    role: payload.role
  };
  const accessToken = signAccessToken(cleanPayload);
  const generateRefreshToken = signRefreshToken(cleanPayload);
  await prisma.session.create({
    data: {
      userId: cleanPayload.userId,
      token: generateRefreshToken,
      ipAddress: null,
      userAgent: null,
      expiresAt: addDays(7)
    }
  });
  return { accessToken, refreshToken: generateRefreshToken };
};
var logoutUser = async (refreshToken) => {
  await prisma.session.deleteMany({ where: { token: refreshToken } });
};
var logoutAllSessions = async (userId) => {
  await prisma.session.deleteMany({ where: { userId } });
};
var changePassword = async (userId, data) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError_default("User not found", 404);
  const valid = await comparePassword(data.currentPassword, user.password);
  if (!valid) throw new AppError_default("Current password is incorrect", 400);
  const hashed = await hashPassword(data.newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashed }
  });
  await prisma.session.deleteMany({ where: { userId } });
};
var getMe = async (userId) => {
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
          experienceYears: true
        }
      }
    }
  });
  if (!user) throw new AppError_default("User not found", 404);
  return user;
};

// src/app/module/auth/auth.controller.ts
var seedAdmin = catchAsync(async (req, res) => {
  const result = await seedSuperAdmin(req.body);
  sendResponse({
    res,
    statusCode: 201,
    success: true,
    message: "Super Admin seeded successfully",
    data: result
  });
});
var register = catchAsync(async (req, res) => {
  const user = await registerUser(req.body);
  sendResponse({
    res,
    statusCode: 201,
    success: true,
    message: "Registration successful",
    data: user
  });
});
var login = catchAsync(async (req, res) => {
  const { accessToken, refreshToken, user } = await loginUser(
    req.body,
    req.ip,
    req.headers["user-agent"]
  );
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env["NODE_ENV"] === "production",
    sameSite: "strict",
    maxAge: 3 * 24 * 60 * 60 * 1e3
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env["NODE_ENV"] === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1e3
  });
  sendResponse({
    res,
    statusCode: 200,
    success: true,
    message: "Login successful",
    data: { accessToken, refreshToken, user }
  });
});
var refresh = catchAsync(async (req, res) => {
  const token = req?.body?.refreshToken || req.cookies?.["refreshToken"];
  const { accessToken, refreshToken } = await refreshAccessToken(token);
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env["NODE_ENV"] === "production",
    sameSite: "strict",
    maxAge: 15 * 60 * 1e3
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env["NODE_ENV"] === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1e3
  });
  sendResponse({
    res,
    statusCode: 200,
    success: true,
    message: "Token refreshed",
    data: { accessToken, refreshToken }
  });
});
var logout = catchAsync(async (req, res) => {
  const token = req?.body?.refreshToken || req.cookies?.["refreshToken"];
  await logoutUser(token);
  res.clearCookie("refreshToken");
  sendResponse({
    res,
    statusCode: 200,
    success: true,
    message: "Logged out successfully"
  });
});
var logoutAll = catchAsync(async (req, res) => {
  await logoutAllSessions(req.user.userId);
  res.clearCookie("refreshToken");
  sendResponse({
    res,
    statusCode: 200,
    success: true,
    message: "All sessions terminated"
  });
});
var changePassword2 = catchAsync(
  async (req, res) => {
    await changePassword(req.user.userId, req.body);
    res.clearCookie("refreshToken");
    sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: "Password changed successfully"
    });
  }
);
var getMe2 = catchAsync(async (req, res) => {
  const user = await getMe(req.user.userId);
  sendResponse({
    res,
    statusCode: 200,
    success: true,
    message: "Profile fetched",
    data: user
  });
});

// src/app/middleware/validateRequest.ts
var validateRequest = (zodSchema) => {
  return (req, res, next) => {
    let bodyToValidate = req.body ?? {};
    const dataKey = Object.keys(req.body || {}).find(
      (key) => key.trim() === "data"
    );
    if (dataKey && typeof req.body[dataKey] === "string") {
      try {
        bodyToValidate = JSON.parse(req.body[dataKey]);
      } catch {
      }
    }
    if (bodyToValidate === void 0 || bodyToValidate === null) {
      bodyToValidate = {};
    }
    console.log("Body to validate:", bodyToValidate);
    const parsedResult = zodSchema.safeParse(bodyToValidate);
    if (!parsedResult.success) {
      return next(parsedResult.error);
    }
    req.body = parsedResult.data;
    next();
  };
};

// src/app/module/auth/auth.routes.ts
var router = Router();
router.post(
  "/seed-super-admin",
  validateRequest(seedAdminSchema),
  seedAdmin
);
router.post("/register", validateRequest(registerSchema), register);
router.post("/login", validateRequest(loginSchema), login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.post("/logout-all", authenticate, logoutAll);
router.put(
  "/change-password",
  authenticate,
  validateRequest(changePasswordSchema),
  changePassword2
);
router.get("/me", authenticate, getMe2);
var auth_routes_default = router;

// src/app/module/user/user.routes.ts
import { Router as Router2 } from "express";

// src/app/module/user/user.validation.ts
import { z as z2 } from "zod";
var updateProfileSchema = z2.object({
  name: z2.string().min(2).optional(),
  avatar: z2.string().url().optional()
});
var updateSearchPreferenceSchema = z2.object({
  keywords: z2.array(z2.string()).optional(),
  avgPrice: z2.number().positive().optional(),
  targetAreas: z2.array(z2.string()).optional()
});

// src/app/module/user/user.service.ts
var getUserProfile = async (userId) => {
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
          rating: true
        }
      },
      searchPreference: true
    }
  });
  if (!user) throw new AppError_default("User not found", 404);
  return user;
};
var updateUserProfile = async (userId, data) => {
  return prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      role: true,
      updatedAt: true
    }
  });
};
var updateAvatar = async (userId, avatarUrl) => {
  return prisma.user.update({
    where: { id: userId },
    data: { avatar: avatarUrl },
    select: { id: true, avatar: true }
  });
};
var getSavedProperties = async (userId, query) => {
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
              select: { name: true, email: true, phone: true, rating: true }
            }
          }
        }
      }
    }),
    prisma.savedProperty.count({ where: { userId } })
  ]);
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
};
var saveProperty = async (userId, propertyId) => {
  const property = await prisma.property.findUnique({
    where: { id: propertyId }
  });
  if (!property) throw new AppError_default("Property not found", 404);
  const existing = await prisma.savedProperty.findUnique({
    where: { userId_propertyId: { userId, propertyId } }
  });
  if (existing) throw new AppError_default("Property already saved", 409);
  return prisma.savedProperty.create({ data: { userId, propertyId } });
};
var unsaveProperty = async (userId, propertyId) => {
  const existing = await prisma.savedProperty.findUnique({
    where: { userId_propertyId: { userId, propertyId } }
  });
  if (!existing) throw new AppError_default("Saved property not found", 404);
  await prisma.savedProperty.delete({
    where: { userId_propertyId: { userId, propertyId } }
  });
};
var getSearchPreference = async (userId) => {
  return prisma.searchPreference.findUnique({ where: { userId } });
};
var upsertSearchPreference = async (userId, data) => {
  return prisma.searchPreference.upsert({
    where: { userId },
    update: data,
    create: {
      userId,
      keywords: data.keywords ?? [],
      avgPrice: data.avgPrice ?? 0,
      targetAreas: data.targetAreas ?? []
    }
  });
};
var getAIRecommendations = async (userId, query) => {
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
            agent: { select: { name: true, rating: true } }
          }
        }
      }
    }),
    prisma.aIRecommendation.count({ where: { userId } })
  ]);
  await prisma.aIRecommendation.updateMany({
    where: { userId, viewed: false },
    data: { viewed: true }
  });
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
};

// src/app/module/user/user.controller.ts
var getProfile = catchAsync(async (req, res) => {
  const user = await getUserProfile(req.user.userId);
  sendResponse({ res, statusCode: 200, success: true, message: "Profile fetched", data: user });
});
var updateProfile = catchAsync(async (req, res) => {
  const user = await updateUserProfile(req.user.userId, req.body);
  sendResponse({ res, statusCode: 200, success: true, message: "Profile updated", data: user });
});
var uploadAvatar2 = catchAsync(async (req, res) => {
  const file = req.file;
  const avatarUrl = file?.path ?? file?.secure_url;
  if (!avatarUrl) {
    res.status(400).json({ success: false, message: "No file uploaded" });
    return;
  }
  const user = await updateAvatar(req.user.userId, avatarUrl);
  sendResponse({ res, statusCode: 200, success: true, message: "Avatar updated", data: user });
});
var getSavedProperties2 = catchAsync(async (req, res) => {
  const result = await getSavedProperties(req.user.userId, req.query);
  sendResponse({
    res,
    statusCode: 200,
    success: true,
    message: "Saved properties fetched",
    data: result.items,
    meta: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages }
  });
});
var saveProperty2 = catchAsync(async (req, res) => {
  await saveProperty(req.user.userId, param(req.params["propertyId"]));
  sendResponse({ res, statusCode: 201, success: true, message: "Property saved" });
});
var unsaveProperty2 = catchAsync(async (req, res) => {
  await unsaveProperty(req.user.userId, param(req.params["propertyId"]));
  sendResponse({ res, statusCode: 200, success: true, message: "Property removed from saved" });
});
var getSearchPreference2 = catchAsync(async (req, res) => {
  const pref = await getSearchPreference(req.user.userId);
  sendResponse({ res, statusCode: 200, success: true, message: "Search preference fetched", data: pref });
});
var upsertSearchPreference2 = catchAsync(async (req, res) => {
  const pref = await upsertSearchPreference(req.user.userId, req.body);
  sendResponse({ res, statusCode: 200, success: true, message: "Search preference saved", data: pref });
});
var getAIRecommendations2 = catchAsync(async (req, res) => {
  const result = await getAIRecommendations(req.user.userId, req.query);
  sendResponse({
    res,
    statusCode: 200,
    success: true,
    message: "AI recommendations fetched",
    data: result.items,
    meta: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages }
  });
});

// src/app/module/user/user.routes.ts
var router2 = Router2();
router2.use(authenticate);
router2.get("/profile", getProfile);
router2.put(
  "/profile",
  validateRequest(updateProfileSchema),
  updateProfile
);
router2.post("/avatar", uploadAvatar, uploadAvatar2);
router2.get("/saved-properties", getSavedProperties2);
router2.post("/saved-properties/:propertyId", saveProperty2);
router2.delete("/saved-properties/:propertyId", unsaveProperty2);
router2.get("/search-preference", getSearchPreference2);
router2.put(
  "/search-preference",
  validateRequest(updateSearchPreferenceSchema),
  upsertSearchPreference2
);
router2.get("/recommendations", getAIRecommendations2);
var user_routes_default = router2;

// src/app/module/agent/agent.routes.ts
import { Router as Router3 } from "express";

// src/app/module/agent/agent.validation.ts
import { z as z3 } from "zod";
var createAgentProfileSchema = z3.object({
  licenseNumber: z3.string().min(3, "License number is required"),
  specialties: z3.array(z3.string()).min(1, "At least one specialty is required"),
  bio: z3.string().optional(),
  phone: z3.string().optional(),
  experienceYears: z3.number().int().min(0).optional(),
  name: z3.string().optional(),
  email: z3.email().optional()
});
var updateAgentProfileSchema = createAgentProfileSchema.partial();

// src/app/module/agent/agent.service.ts
var createAgentProfile = async (userId, data) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError_default("User not found", 404);
  const existing = await prisma.agent.findUnique({ where: { userId } });
  if (existing) throw new AppError_default("Agent profile already exists", 409);
  const agent = await prisma.agent.create({
    data: {
      userId,
      licenseNumber: data.licenseNumber,
      specialties: data.specialties,
      bio: data.bio ?? null,
      phone: data.phone ?? null,
      experienceYears: data.experienceYears ?? null,
      name: data.name ?? null,
      email: data.email ?? null,
      status: "PENDING"
    }
  });
  return agent;
};
var approveAgent = async (agentId, adminId, note) => {
  const agent = await prisma.agent.findUnique({ where: { id: agentId } });
  if (!agent) throw new AppError_default("Agent not found", 404);
  if (agent.status !== "PENDING") throw new AppError_default("Agent is not in pending status", 400);
  const [updatedAgent] = await prisma.$transaction([
    prisma.agent.update({
      where: { id: agentId },
      data: {
        status: "APPROVED",
        reviewedBy: adminId,
        reviewedAt: /* @__PURE__ */ new Date(),
        reviewNote: note ?? null
      }
    }),
    prisma.user.update({
      where: { id: agent.userId },
      data: { role: "AGENT" }
    })
  ]);
  await prisma.notification.create({
    data: {
      userId: agent.userId,
      type: "SYSTEM_ALERT",
      title: "Agent Application Approved",
      message: "Your agent application has been approved. You can now list properties.",
      link: "/agent/dashboard"
    }
  });
  return updatedAgent;
};
var rejectAgent = async (agentId, adminId, reason) => {
  const agent = await prisma.agent.findUnique({ where: { id: agentId } });
  if (!agent) throw new AppError_default("Agent not found", 404);
  if (agent.status !== "PENDING") throw new AppError_default("Agent is not in pending status", 400);
  const updatedAgent = await prisma.agent.update({
    where: { id: agentId },
    data: {
      status: "REJECTED",
      reviewedBy: adminId,
      reviewedAt: /* @__PURE__ */ new Date(),
      reviewNote: reason
    }
  });
  await prisma.notification.create({
    data: {
      userId: agent.userId,
      type: "SYSTEM_ALERT",
      title: "Agent Application Rejected",
      message: `Your agent application was rejected. Reason: ${reason}`,
      link: "/profile"
    }
  });
  return updatedAgent;
};
var getPendingAgents = async (query) => {
  const { page, limit, skip } = getPaginationParams(query);
  const [items, total] = await Promise.all([
    prisma.agent.findMany({
      where: { status: "PENDING" },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true, avatar: true, createdAt: true } }
      }
    }),
    prisma.agent.count({ where: { status: "PENDING" } })
  ]);
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
};
var getAgentProfile = async (agentId) => {
  const agent = await prisma.agent.findUnique({
    where: { id: agentId, status: "APPROVED" },
    include: {
      user: { select: { name: true, email: true, avatar: true, createdAt: true } },
      properties: {
        where: { status: "AVAILABLE" },
        take: 6,
        include: { media: { where: { order: 1 }, take: 1 } }
      }
    }
  });
  if (!agent) throw new AppError_default("Agent not found", 404);
  return agent;
};
var getMyAgentProfile = async (userId) => {
  const agent = await prisma.agent.findUnique({
    where: { userId },
    include: {
      user: { select: { name: true, email: true, avatar: true } }
    }
  });
  if (!agent) throw new AppError_default("Agent profile not found", 404);
  return agent;
};
var updateAgentProfile = async (userId, data) => {
  const agent = await prisma.agent.findUnique({ where: { userId } });
  if (!agent) throw new AppError_default("Agent profile not found", 404);
  if (agent.status !== "APPROVED") throw new AppError_default("Agent profile is not approved yet", 403);
  const updateData = Object.fromEntries(
    Object.entries(data).filter(([_, v]) => v !== void 0)
  );
  return prisma.agent.update({ where: { userId }, data: updateData });
};
var getAllAgents = async (query) => {
  const { page, limit, skip } = getPaginationParams(query);
  const specialty = query["specialty"];
  const where = { status: "APPROVED" };
  if (specialty) {
    where.specialties = { has: specialty };
  }
  const [items, total] = await Promise.all([
    prisma.agent.findMany({
      where,
      skip,
      take: limit,
      orderBy: { rating: "desc" },
      include: {
        user: { select: { name: true, email: true, avatar: true } },
        _count: { select: { properties: true } }
      }
    }),
    prisma.agent.count({ where })
  ]);
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
};
var getAgentStats = async (userId) => {
  const agent = await prisma.agent.findUnique({ where: { userId } });
  if (!agent) throw new AppError_default("Agent profile not found", 404);
  if (agent.status !== "APPROVED") throw new AppError_default("Agent profile is not approved yet", 403);
  const [totalProperties, availableProperties, soldProperties, totalInquiries, pendingInquiries] = await Promise.all([
    prisma.property.count({ where: { agentId: agent.id } }),
    prisma.property.count({ where: { agentId: agent.id, status: "AVAILABLE" } }),
    prisma.property.count({ where: { agentId: agent.id, status: "SOLD" } }),
    prisma.inquiry.count({ where: { agentId: agent.id } }),
    prisma.inquiry.count({ where: { agentId: agent.id, status: "PENDING" } })
  ]);
  return {
    totalProperties,
    availableProperties,
    soldProperties,
    totalInquiries,
    pendingInquiries,
    rating: agent.rating
  };
};

// src/app/module/agent/agent.controller.ts
var createAgentProfile2 = catchAsync(async (req, res) => {
  const agent = await createAgentProfile(req.user.userId, req.body);
  sendResponse({ res, statusCode: 201, success: true, message: "Agent profile created", data: agent });
});
var getMyAgentProfile2 = catchAsync(async (req, res) => {
  const agent = await getMyAgentProfile(req.user.userId);
  sendResponse({ res, statusCode: 200, success: true, message: "Agent profile fetched", data: agent });
});
var updateAgentProfile2 = catchAsync(async (req, res) => {
  const agent = await updateAgentProfile(req.user.userId, req.body);
  sendResponse({ res, statusCode: 200, success: true, message: "Agent profile updated", data: agent });
});
var getAgentById = catchAsync(async (req, res) => {
  const agent = await getAgentProfile(param(req.params["agentId"]));
  sendResponse({ res, statusCode: 200, success: true, message: "Agent fetched", data: agent });
});
var getAllAgents2 = catchAsync(async (req, res) => {
  const result = await getAllAgents(req.query);
  sendResponse({
    res,
    statusCode: 200,
    success: true,
    message: "Agents fetched",
    data: result.items,
    meta: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages }
  });
});
var getAgentStats2 = catchAsync(async (req, res) => {
  const stats = await getAgentStats(req.user.userId);
  sendResponse({ res, statusCode: 200, success: true, message: "Agent stats fetched", data: stats });
});

// src/app/module/agent/agent.routes.ts
var router3 = Router3();
router3.get("/", getAllAgents2);
router3.get("/:agentId", getAgentById);
router3.post(
  "/profile",
  authenticate,
  validateRequest(createAgentProfileSchema),
  createAgentProfile2
);
router3.get("/profile/me", authenticate, getMyAgentProfile2);
router3.put(
  "/profile/me",
  authenticate,
  authorize("AGENT"),
  validateRequest(updateAgentProfileSchema),
  updateAgentProfile2
);
router3.get(
  "/stats/me",
  authenticate,
  authorize("AGENT"),
  getAgentStats2
);
var agent_routes_default = router3;

// src/app/module/property/property.routes.ts
import { Router as Router4 } from "express";

// src/app/module/property/property.validation.ts
import { z as z4 } from "zod";
var createPropertySchema = z4.object({
  title: z4.string().min(5, "Title must be at least 5 characters"),
  description: z4.string().min(20, "Description must be at least 20 characters"),
  shortDescription: z4.string().max(300).optional(),
  price: z4.number().min(0, "Price must be at least 0"),
  address: z4.string().min(5),
  city: z4.string().min(2),
  state: z4.string().min(2),
  zip: z4.string().min(3),
  lat: z4.number().optional(),
  lng: z4.number().optional(),
  beds: z4.number().int().min(0),
  baths: z4.number().min(0),
  sqft: z4.number().int().min(1),
  lotSize: z4.number().optional(),
  yearBuilt: z4.number().int().min(1800).max((/* @__PURE__ */ new Date()).getFullYear()).optional(),
  type: z4.enum(["HOUSE", "APARTMENT", "CONDO", "TOWNHOUSE", "LAND", "COMMERCIAL"]),
  status: z4.enum(["AVAILABLE", "PENDING", "SOLD", "RENTED"]).default("AVAILABLE"),
  tags: z4.array(z4.string()).default([]),
  highlights: z4.array(z4.string()).default([]),
  aiFeatures: z4.record(z4.string(), z4.unknown()).default({}),
  aiImageUrl: z4.string().optional()
});
var updatePropertySchema = createPropertySchema.partial();
var addMediaSchema = z4.object({
  url: z4.url().optional(),
  type: z4.enum(["IMAGE", "VIDEO", "VIRTUAL_TOUR", "LINK", "YOUTUBE", "MAP"]),
  order: z4.number().int().min(1),
  altText: z4.string().optional()
});
var createInquirySchema = z4.object({
  message: z4.string().min(10, "Message must be at least 10 characters")
});
var createReviewSchema = z4.object({
  rating: z4.number().int().min(1).max(5),
  comment: z4.string().optional()
});

// src/app/config/cloudinary.config.ts
import { v2 as cloudinary } from "cloudinary";
import status from "http-status";
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret
});
var deleteFileFromCloudinary = async (url) => {
  try {
    const regex = /\/v\d+\/(.+?)(?:\.[a-zA-Z0-9]+)+$/;
    const match = url.match(regex);
    if (match && match[1]) {
      const publicId = match[1];
      await cloudinary.uploader.destroy(
        publicId,
        {
          resource_type: "image"
        }
      );
      console.log(`File ${publicId} deleted from cloudinary`);
    }
  } catch (error) {
    console.error("Error deleting file from Cloudinary:", error);
    throw new AppError_default("Failed to delete file from Cloudinary", status.INTERNAL_SERVER_ERROR);
  }
};
var cloudinaryUpload = cloudinary;

// src/app/module/property/property.service.ts
var buildPropertyWhere = (query) => {
  const where = {};
  if (query.city) where.city = { contains: query.city, mode: "insensitive" };
  if (query.state) where.state = { contains: query.state, mode: "insensitive" };
  if (query.zip) where.zip = query.zip;
  if (query.type) where.type = { equals: query.type };
  if (query.status) where.status = { equals: query.status };
  if (query.agentId) where.agentId = query.agentId;
  if (query.minPrice || query.maxPrice) {
    const priceFilter = {};
    if (query.minPrice) priceFilter.gte = Number(query.minPrice);
    if (query.maxPrice) priceFilter.lte = Number(query.maxPrice);
    where.price = priceFilter;
  }
  if (query.minBeds || query.maxBeds) {
    const bedsFilter = {};
    if (query.minBeds) bedsFilter.gte = Number(query.minBeds);
    if (query.maxBeds) bedsFilter.lte = Number(query.maxBeds);
    where.beds = bedsFilter;
  }
  if (query.minBaths || query.maxBaths) {
    const bathsFilter = {};
    if (query.minBaths) bathsFilter.gte = Number(query.minBaths);
    if (query.maxBaths) bathsFilter.lte = Number(query.maxBaths);
    where.baths = bathsFilter;
  }
  if (query.minSqft || query.maxSqft) {
    const sqftFilter = {};
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
      { tags: { has: query.q } }
    ];
  }
  return where;
};
var propertyInclude = {
  media: { orderBy: { order: "asc" } },
  agent: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      rating: true,
      user: { select: { avatar: true } }
    }
  },
  _count: { select: { reviews: true, inquiries: true, savedBy: true } }
};
var createProperty = async (userId, data) => {
  const agent = await prisma.agent.findUnique({ where: { userId } });
  if (!agent)
    throw new AppError_default("Agent profile required to create a listing", 403);
  if (agent.status !== "APPROVED")
    throw new AppError_default("Agent profile must be approved before creating listings. Please wait for admin approval.", 403);
  const { aiImageUrl, ...propertyData } = data;
  const property = await prisma.property.create({
    data: {
      ...propertyData,
      agentId: agent.id,
      price: propertyData.price,
      lotSize: propertyData.lotSize ?? null,
      yearBuilt: propertyData.yearBuilt ?? null,
      aiFeatures: propertyData.aiFeatures ?? {}
    },
    include: propertyInclude
  });
  if (aiImageUrl) {
    await prisma.media.create({
      data: {
        propertyId: property.id,
        url: aiImageUrl,
        type: "IMAGE",
        order: 1,
        altText: "AI Generated Property Image"
      }
    });
  }
  return property;
};
var getProperties = async (query) => {
  const { page, limit, skip } = getPaginationParams(
    query
  );
  const where = buildPropertyWhere(query);
  const orderBy = {};
  const sortBy = query.sortBy ?? "createdAt";
  const sortOrder = query.sortOrder ?? "desc";
  orderBy[sortBy] = sortOrder;
  const [items, total] = await Promise.all([
    prisma.property.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: propertyInclude
    }),
    prisma.property.count({ where })
  ]);
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
};
var getPropertyById = async (propertyId) => {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    include: {
      ...propertyInclude,
      reviews: {
        take: 10,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true, avatar: true } } }
      },
      similarFrom: {
        take: 6,
        orderBy: { similarityScore: "desc" },
        include: {
          similar: { include: { media: { where: { order: 1 }, take: 1 } } }
        }
      }
    }
  });
  if (!property) throw new AppError_default("Property not found", 404);
  return property;
};
var updateProperty = async (userId, propertyId, data) => {
  const agent = await prisma.agent.findUnique({ where: { userId } });
  if (!agent) throw new AppError_default("Agent profile not found", 403);
  const property = await prisma.property.findFirst({
    where: { id: propertyId, agentId: agent.id }
  });
  if (!property)
    throw new AppError_default("Property not found or not owned by you", 404);
  const updateData = Object.fromEntries(
    Object.entries(data).filter(([_, value]) => value !== void 0)
  );
  return prisma.property.update({
    where: { id: propertyId },
    data: updateData,
    include: propertyInclude
  });
};
var deleteProperty = async (userId, propertyId) => {
  const agent = await prisma.agent.findUnique({ where: { userId } });
  if (!agent) throw new AppError_default("Agent profile not found", 403);
  const property = await prisma.property.findFirst({
    where: { id: propertyId, agentId: agent.id }
  });
  if (!property)
    throw new AppError_default("Property not found or not owned by you", 404);
  const media = await prisma.media.findMany({ where: { propertyId: property.id } });
  media.forEach(async (item) => {
    if (item.url.includes("cloudinary.com")) {
      await deleteFileFromCloudinary(item.url);
    }
  });
  await prisma.property.delete({ where: { id: propertyId } });
};
var addMedia = async (userId, propertyId, payload) => {
  const agent = await prisma.agent.findUnique({ where: { userId } });
  if (!agent) throw new AppError_default("Agent profile not found", 403);
  const property = await prisma.property.findFirst({
    where: { id: propertyId, agentId: agent.id }
  });
  if (!property)
    throw new AppError_default("Property not found or not owned by you", 404);
  return prisma.media.create({ data: { propertyId, ...payload } });
};
var uploadPropertyMedia2 = async (userId, propertyId, files) => {
  const agent = await prisma.agent.findUnique({ where: { userId } });
  if (!agent) throw new AppError_default("Agent profile not found", 403);
  const property = await prisma.property.findFirst({
    where: { id: propertyId, agentId: agent.id }
  });
  if (!property)
    throw new AppError_default("Property not found or not owned by you", 404);
  const existingCount = await prisma.media.count({ where: { propertyId } });
  const mediaData = files.map((file, i) => {
    const url = file.path ?? file.secure_url ?? file.filename;
    return {
      propertyId,
      url,
      type: "IMAGE",
      order: existingCount + i + 1
    };
  });
  return prisma.media.createMany({ data: mediaData });
};
var deleteMedia = async (userId, mediaId) => {
  const agent = await prisma.agent.findUnique({ where: { userId } });
  if (!agent) throw new AppError_default("Agent profile not found", 403);
  const media = await prisma.media.findFirst({
    where: { id: mediaId, property: { agentId: agent.id } }
  });
  if (!media) throw new AppError_default("Media not found or not owned by you", 404);
  if (media.url.includes("cloudinary.com")) {
    await deleteFileFromCloudinary(media.url);
  }
  await prisma.media.delete({ where: { id: mediaId } });
};
var getNeighborhoodByZip = async (zip) => {
  const neighborhood = await prisma.neighborhood.findUnique({ where: { zip } });
  if (!neighborhood)
    throw new AppError_default("Neighborhood data not found for this zip code", 404);
  return neighborhood;
};
var getSimilarProperties = async (propertyId) => {
  const property = await prisma.property.findUnique({
    where: { id: propertyId }
  });
  if (!property) throw new AppError_default("Property not found", 404);
  const similar = await prisma.similarProperty.findMany({
    where: { propertyId },
    orderBy: { similarityScore: "desc" },
    take: 6,
    include: {
      similar: {
        include: {
          media: { where: { order: 1 }, take: 1 },
          agent: { select: { name: true, rating: true } }
        }
      }
    }
  });
  return similar.map((s) => ({
    ...s.similar,
    similarityScore: s.similarityScore
  }));
};
var getMyListings = async (userId, query) => {
  const agent = await prisma.agent.findUnique({ where: { userId } });
  if (!agent) throw new AppError_default("Agent profile not found", 403);
  const { page, limit, skip } = getPaginationParams(
    query
  );
  const where = { agentId: agent.id };
  if (query.status) {
    where.status = { equals: query.status };
  }
  const [items, total] = await Promise.all([
    prisma.property.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: propertyInclude
    }),
    prisma.property.count({ where })
  ]);
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
};

// src/app/module/property/property.controller.ts
var createProperty2 = catchAsync(async (req, res) => {
  const property = await createProperty(req.user.userId, req.body);
  sendResponse({ res, statusCode: 201, success: true, message: "Property created", data: property });
});
var getProperties2 = catchAsync(async (req, res) => {
  const result = await getProperties(req.query);
  sendResponse({
    res,
    statusCode: 200,
    success: true,
    message: "Properties fetched",
    data: result.items,
    meta: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages }
  });
});
var getPropertyById2 = catchAsync(async (req, res) => {
  const property = await getPropertyById(param(req.params["propertyId"]));
  sendResponse({ res, statusCode: 200, success: true, message: "Property fetched", data: property });
});
var updateProperty2 = catchAsync(async (req, res) => {
  const property = await updateProperty(
    req.user.userId,
    param(req.params["propertyId"]),
    req.body
  );
  sendResponse({ res, statusCode: 200, success: true, message: "Property updated", data: property });
});
var deleteProperty2 = catchAsync(async (req, res) => {
  await deleteProperty(req.user.userId, param(req.params["propertyId"]));
  sendResponse({ res, statusCode: 200, success: true, message: "Property deleted" });
});
var getMyListings2 = catchAsync(async (req, res) => {
  const result = await getMyListings(req.user.userId, req.query);
  sendResponse({
    res,
    statusCode: 200,
    success: true,
    message: "My listings fetched",
    data: result.items,
    meta: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages }
  });
});
var addMedia2 = catchAsync(async (req, res) => {
  const file = req.file;
  const data = {
    ...req.body,
    type: req.body.type,
    order: req.body.order || 0,
    altText: req.body.altText,
    url: file?.path || req.body.url
  };
  const media = await addMedia(
    req.user.userId,
    param(req.params["propertyId"]),
    data
  );
  sendResponse({ res, statusCode: 201, success: true, message: "Media added", data: media });
});
var uploadMedia = catchAsync(async (req, res) => {
  const files = req.files;
  if (!files || files.length === 0) {
    res.status(400).json({ success: false, message: "No files uploaded" });
    return;
  }
  const result = await uploadPropertyMedia2(
    req.user.userId,
    param(req.params["propertyId"]),
    files
  );
  sendResponse({ res, statusCode: 201, success: true, message: "Media uploaded", data: result });
});
var deleteMedia2 = catchAsync(async (req, res) => {
  await deleteMedia(req.user.userId, param(req.params["mediaId"]));
  sendResponse({ res, statusCode: 200, success: true, message: "Media deleted" });
});
var getNeighborhood = catchAsync(async (req, res) => {
  const data = await getNeighborhoodByZip(param(req.params["zip"]));
  sendResponse({ res, statusCode: 200, success: true, message: "Neighborhood data fetched", data });
});
var getSimilarProperties2 = catchAsync(async (req, res) => {
  const data = await getSimilarProperties(param(req.params["propertyId"]));
  sendResponse({ res, statusCode: 200, success: true, message: "Similar properties fetched", data });
});

// src/app/config/multer.config.ts
import { CloudinaryStorage as CloudinaryStorage2 } from "multer-storage-cloudinary";
import multer2 from "multer";
var storage = new CloudinaryStorage2({
  cloudinary: cloudinaryUpload,
  params: async (req, file) => {
    const originName = file.originalname;
    const extension = originName.split(".").pop()?.toLocaleLowerCase();
    const fileNameWithoutExtension = originName.split(".").slice(0, -1).join(".").toLocaleLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "");
    const uniqueName = Math.random().toString(36).substring(2) + "-" + Date.now() + "-" + fileNameWithoutExtension;
    const folder = extension === "pdf" ? "pdfs" : "images";
    return {
      folder: `proptech/${folder}`,
      public_id: uniqueName,
      resource_type: "auto"
    };
  }
});
var multerUpload = multer2({ storage });

// src/app/module/property/property.routes.ts
var router4 = Router4();
router4.get("/", getProperties2);
router4.get("/neighborhood/:zip", getNeighborhood);
router4.get("/:propertyId", getPropertyById2);
router4.get("/:propertyId/similar", getSimilarProperties2);
router4.get(
  "/my/listings",
  authenticate,
  authorize("AGENT"),
  getMyListings2
);
router4.post(
  "/",
  authenticate,
  authorize("AGENT"),
  validateRequest(createPropertySchema),
  createProperty2
);
router4.put(
  "/:propertyId",
  authenticate,
  authorize("AGENT"),
  validateRequest(updatePropertySchema),
  updateProperty2
);
router4.delete(
  "/:propertyId",
  authenticate,
  authorize("AGENT"),
  deleteProperty2
);
router4.post(
  "/:propertyId/media",
  multerUpload.single("file"),
  authenticate,
  authorize("AGENT"),
  validateRequest(addMediaSchema),
  addMedia2
);
router4.post(
  "/:propertyId/media/upload",
  authenticate,
  authorize("AGENT"),
  uploadPropertyMedia,
  uploadMedia
);
router4.delete(
  "/media/:mediaId",
  authenticate,
  authorize("AGENT"),
  deleteMedia2
);
var property_routes_default = router4;

// src/app/module/admin/admin.routes.ts
import { Router as Router5 } from "express";

// src/app/module/admin/admin.service.ts
var getDashboardStats = async () => {
  const [
    totalUsers,
    totalAgents,
    totalProperties,
    totalInquiries,
    activeListings,
    soldProperties
  ] = await Promise.all([
    prisma.user.count(),
    prisma.agent.count(),
    prisma.property.count(),
    prisma.inquiry.count(),
    prisma.property.count({ where: { status: "AVAILABLE" } }),
    prisma.property.count({ where: { status: "SOLD" } })
  ]);
  return {
    totalUsers,
    totalAgents,
    totalProperties,
    totalInquiries,
    activeListings,
    soldProperties
  };
};
var getAllUsers = async (query) => {
  const { page, limit, skip } = getPaginationParams(query);
  const role = query["role"];
  const search = query["search"];
  const where = {
    ...role ? { role } : {},
    ...search ? {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } }
      ]
    } : {}
  };
  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        avatar: true,
        createdAt: true,
        _count: { select: { sessions: true } }
      }
    }),
    prisma.user.count({ where })
  ]);
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
};
var getUserById = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      agent: true,
      admin: true,
      _count: {
        select: { sessions: true, inquiries: true, savedProperties: true }
      }
    }
  });
  if (!user) throw new AppError_default("User not found", 404);
  const { password: _pw, ...safeUser } = user;
  return safeUser;
};
var toggleUserStatus = async (userId) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError_default("User not found", 404);
  return prisma.user.update({
    where: { id: userId },
    data: { isActive: !user.isActive },
    select: { id: true, isActive: true }
  });
};
var deleteUser = async (userId) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError_default("User not found", 404);
  await prisma.user.delete({ where: { id: userId } });
};
var getAllProperties = async (query) => {
  const { page, limit, skip } = getPaginationParams(query);
  const status6 = query["status"];
  const where = status6 ? { status: status6 } : {};
  const [items, total] = await Promise.all([
    prisma.property.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        agent: { select: { name: true, email: true } },
        _count: { select: { media: true, inquiries: true, reviews: true } }
      }
    }),
    prisma.property.count({ where })
  ]);
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
};
var deletePropertyAdmin = async (propertyId) => {
  const property = await prisma.property.findUnique({
    where: { id: propertyId }
  });
  if (!property) throw new AppError_default("Property not found", 404);
  await prisma.property.delete({ where: { id: propertyId } });
};
var getAuditLogs = async (query) => {
  const { page, limit, skip } = getPaginationParams(query);
  const userId = query["userId"];
  const where = userId ? { userId } : {};
  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, email: true } } }
    }),
    prisma.auditLog.count({ where })
  ]);
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
};
var upsertNeighborhood = async (data) => {
  const payload = {
    zip: data.zip,
    name: data.name,
    city: data.city,
    safetyScore: data.safetyScore ? Math.floor(Number(data.safetyScore)) : null,
    schoolScore: data.schoolScore ? Math.floor(Number(data.schoolScore)) : null,
    transitScore: data.transitScore ? Math.floor(Number(data.transitScore)) : null,
    marketTrend: data.marketTrend || null,
    aiAnalysis: data.aiAnalysis || null,
    expiresAt: data.expiresAt ? new Date(data.expiresAt) : null
  };
  return prisma.neighborhood.upsert({
    where: { zip: payload.zip },
    update: payload,
    create: payload
  });
};
var sendBroadcastNotification = async (data) => {
  const users = await prisma.user.findMany({
    where: { isActive: true, ...data.role ? { role: data.role } : {} },
    select: { id: true }
  });
  const notifications = users.map((u) => ({
    userId: u.id,
    type: data.type,
    title: data.title,
    message: data.message,
    link: data.link ?? null
  }));
  return prisma.notification.createMany({ data: notifications });
};
var getPendingAgents2 = async (query) => {
  return getPendingAgents(query);
};
var approveAgent2 = async (agentId, adminId, note) => {
  return approveAgent(agentId, adminId, note);
};
var rejectAgent2 = async (agentId, adminId, reason) => {
  return rejectAgent(agentId, adminId, reason);
};

// src/app/module/admin/admin.controller.ts
var getDashboardStats2 = catchAsync(async (_req, res) => {
  const stats = await getDashboardStats();
  sendResponse({ res, statusCode: 200, success: true, message: "Dashboard stats fetched", data: stats });
});
var getAllUsers2 = catchAsync(async (req, res) => {
  const result = await getAllUsers(req.query);
  sendResponse({
    res,
    statusCode: 200,
    success: true,
    message: "Users fetched",
    data: result.items,
    meta: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages }
  });
});
var getUserById2 = catchAsync(async (req, res) => {
  const user = await getUserById(param(req.params["userId"]));
  sendResponse({ res, statusCode: 200, success: true, message: "User fetched", data: user });
});
var toggleUserStatus2 = catchAsync(async (req, res) => {
  const user = await toggleUserStatus(param(req.params["userId"]));
  sendResponse({ res, statusCode: 200, success: true, message: "User status updated", data: user });
});
var deleteUser2 = catchAsync(async (req, res) => {
  await deleteUser(param(req.params["userId"]));
  sendResponse({ res, statusCode: 200, success: true, message: "User deleted" });
});
var getAllProperties2 = catchAsync(async (req, res) => {
  const result = await getAllProperties(req.query);
  sendResponse({
    res,
    statusCode: 200,
    success: true,
    message: "Properties fetched",
    data: result.items,
    meta: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages }
  });
});
var deleteProperty3 = catchAsync(async (req, res) => {
  await deletePropertyAdmin(param(req.params["propertyId"]));
  sendResponse({ res, statusCode: 200, success: true, message: "Property deleted" });
});
var getAuditLogs2 = catchAsync(async (req, res) => {
  const result = await getAuditLogs(req.query);
  sendResponse({
    res,
    statusCode: 200,
    success: true,
    message: "Audit logs fetched",
    data: result.items,
    meta: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages }
  });
});
var upsertNeighborhood2 = catchAsync(async (req, res) => {
  const neighborhood = await upsertNeighborhood(req.body);
  sendResponse({ res, statusCode: 200, success: true, message: "Neighborhood data saved", data: neighborhood });
});
var sendBroadcastNotification2 = catchAsync(async (req, res) => {
  const result = await sendBroadcastNotification(req.body);
  sendResponse({ res, statusCode: 200, success: true, message: "Notification broadcast sent", data: result });
});
var getPendingAgents3 = catchAsync(async (req, res) => {
  const result = await getPendingAgents2(req.query);
  sendResponse({
    res,
    statusCode: 200,
    success: true,
    message: "Pending agents fetched",
    data: result.items,
    meta: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages }
  });
});
var approveAgent3 = catchAsync(async (req, res) => {
  const agent = await approveAgent2(param(req.params["agentId"]), req.user.userId, req.body.note);
  sendResponse({ res, statusCode: 200, success: true, message: "Agent approved successfully", data: agent });
});
var rejectAgent3 = catchAsync(async (req, res) => {
  const agent = await rejectAgent2(param(req.params["agentId"]), req.user.userId, req.body.reason);
  sendResponse({ res, statusCode: 200, success: true, message: "Agent rejected", data: agent });
});

// src/app/module/admin/admin.validation.ts
import { z as z5 } from "zod";
var approveAgentSchema = z5.object({
  note: z5.string().optional()
});
var rejectAgentSchema = z5.object({
  reason: z5.string().min(1, "Rejection reason is required")
});

// src/app/module/admin/admin.routes.ts
var router5 = Router5();
router5.use(authenticate, authorize("ADMIN", "SUPER_ADMIN"));
router5.get("/dashboard", getDashboardStats2);
router5.get("/users", getAllUsers2);
router5.get("/users/:userId", getUserById2);
router5.patch("/users/:userId/toggle-status", toggleUserStatus2);
router5.delete("/users/:userId", deleteUser2);
router5.get("/properties", getAllProperties2);
router5.delete("/properties/:propertyId", deleteProperty3);
router5.get("/audit-logs", getAuditLogs2);
router5.put("/neighborhood", upsertNeighborhood2);
router5.post(
  "/notifications/broadcast",
  sendBroadcastNotification2
);
router5.get("/agents/pending", getPendingAgents3);
router5.post(
  "/agents/:agentId/approve",
  validateRequest(approveAgentSchema),
  approveAgent3
);
router5.post(
  "/agents/:agentId/reject",
  validateRequest(rejectAgentSchema),
  rejectAgent3
);
var admin_routes_default = router5;

// src/app/module/ai/ai.routes.ts
import { Router as Router6 } from "express";

// src/app/module/ai/ai.validation.ts
import { z as z6 } from "zod";
var naturalLanguageSearchSchema = z6.object({
  query: z6.string().min(5, "Search query must be at least 5 characters").max(500),
  limit: z6.number().int().min(1).max(50).default(10)
});
var generateDescriptionSchema = z6.object({
  title: z6.string().min(1).default(""),
  beds: z6.number().int().min(0).default(0),
  baths: z6.number().int().min(0).default(0),
  sqft: z6.number().int().min(0).default(0),
  price: z6.number().min(0).default(0),
  address: z6.string().default(""),
  city: z6.string().default(""),
  state: z6.string().default(""),
  type: z6.enum(["HOUSE", "APARTMENT", "CONDO", "TOWNHOUSE", "LAND", "COMMERCIAL"]).default("HOUSE"),
  yearBuilt: z6.number().int().optional(),
  lotSize: z6.number().optional(),
  tags: z6.array(z6.string()).default([]),
  highlights: z6.array(z6.string()).default([]),
  tone: z6.string().transform((v) => v.toLowerCase()).pipe(
    z6.enum(["professional", "luxury", "friendly", "investment", "casual"])
  ).default("professional")
});
var generateRecommendationsSchema = z6.object({
  limit: z6.number().int().min(1).max(20).default(6)
});
var neighborhoodAnalyzerSchema = z6.object({
  location: z6.string().min(2, "Location is required").max(200),
  city: z6.string().optional(),
  zip: z6.string().optional()
});
var mortgageAdvisorSchema = z6.object({
  propertyPrice: z6.number().positive("Property price must be positive"),
  downPayment: z6.number().min(0, "Down payment cannot be negative"),
  annualIncome: z6.number().positive("Annual income must be positive"),
  creditScore: z6.enum(["excellent", "good", "fair", "poor"]).default("good"),
  loanTermYears: z6.union([z6.literal(10), z6.literal(15), z6.literal(20), z6.literal(30)]).default(30),
  includeInsurance: z6.boolean().default(true),
  includePropertyTax: z6.boolean().default(true)
});

// src/app/lib/openrouter.ts
var chatCompletion = async (messages, options = {}) => {
  if (!config.openRouter.apiKey) {
    throw new AppError_default("OpenRouter API key is not configured", 500);
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9e4);
  let response;
  try {
    response = await fetch(
      `${config.openRouter.baseUrl}/chat/completions`,
      {
        method: "POST",
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${config.openRouter.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": config.openRouter.siteUrl,
          "X-Title": config.openRouter.siteName
        },
        body: JSON.stringify({
          model: config.openRouter.model,
          messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 1500,
          transforms: ["middle-out"]
        })
      }
    );
  } catch (err) {
    if (err.name === "AbortError") {
      throw new AppError_default("AI request timed out after 60 seconds. Please try again.", 504);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
  if (!response.ok) {
    const error = await response.text();
    throw new AppError_default(
      `OpenRouter API error: ${response.status} \u2014 ${error}`,
      502
    );
  }
  const data = await response.json();
  const content = data.choices[0]?.message?.content ?? "";
  return { content, usage: data.usage };
};
var getChatResponse = async (messages, options = {}) => {
  const maxRetries = options.retries ?? 2;
  let lastError;
  for (let i = 0; i <= maxRetries; i++) {
    try {
      const { content, usage } = await chatCompletion(messages, options);
      const data = parseJsonFromAI(content);
      return { data, usage };
    } catch (error) {
      lastError = error;
      console.warn(
        `AI Attempt ${i + 1} failed. ${i < maxRetries ? "Retrying..." : "All attempts exhausted."}`,
        error instanceof Error ? error.message : error
      );
      if (i < maxRetries) {
        await new Promise(
          (resolve) => setTimeout(resolve, 1e3 * Math.pow(2, i))
        );
      }
    }
  }
  throw lastError || new AppError_default(
    "Failed to get a valid response from AI after multiple attempts.",
    502
  );
};
var parseJsonFromAI = (raw3) => {
  if (!raw3 || raw3.trim() === "") {
    throw new AppError_default("AI returned an empty response. Please try again.", 502);
  }
  let cleaned = raw3.trim();
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const firstBrace = cleaned.indexOf("{");
  const firstBracket = cleaned.indexOf("[");
  const lastBrace = cleaned.lastIndexOf("}");
  const lastBracket = cleaned.lastIndexOf("]");
  let start = -1;
  let end = -1;
  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    start = firstBrace;
    end = lastBrace;
  } else if (firstBracket !== -1) {
    start = firstBracket;
    end = lastBracket;
  }
  if (start !== -1 && end !== -1 && end > start) {
    cleaned = cleaned.substring(start, end + 1);
  }
  try {
    return JSON.parse(cleaned);
  } catch (error) {
    try {
      const repaired = repairTruncatedJson(cleaned);
      return JSON.parse(repaired);
    } catch {
    }
    console.error("--- AI JSON Parse Error ---");
    console.error("Raw content:", raw3);
    console.error("Cleaned content:", cleaned);
    console.error("Error:", error);
    console.error("---------------------------");
    throw new AppError_default(
      `AI returned invalid JSON structure. Parse error: ${error instanceof Error ? error.message : "Unknown error"}`,
      502
    );
  }
};
var repairTruncatedJson = (s) => {
  let result = s.trimEnd();
  result = result.replace(/,\s*$/, "");
  let openBraces = 0;
  let openBrackets = 0;
  let inString = false;
  let escape = false;
  for (const ch of result) {
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === "\\" && inString) {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === "{") openBraces++;
    else if (ch === "}") openBraces--;
    else if (ch === "[") openBrackets++;
    else if (ch === "]") openBrackets--;
  }
  if (inString) result += '"';
  result = result.replace(/,\s*$/, "");
  result += "]".repeat(Math.max(0, openBrackets));
  result += "}".repeat(Math.max(0, openBraces));
  return result;
};

// src/app/module/ai/ai.service.ts
var propertyInclude2 = {
  media: { where: { order: 1 }, take: 1 },
  agent: {
    select: {
      id: true,
      name: true,
      rating: true,
      user: { select: { avatar: true } }
    }
  },
  _count: { select: { reviews: true, savedBy: true } }
};
var naturalLanguageSearch = async (input) => {
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
- Map property types: house/home\u2192HOUSE, apartment/flat\u2192APARTMENT, condo\u2192CONDO, townhouse/townhome\u2192TOWNHOUSE, land/lot\u2192LAND
- Tags should capture lifestyle keywords: "modern kitchen", "good schools", "quiet", "park nearby", "pool", etc.`;
  const { data: filters, usage } = await getChatResponse(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: input.query }
    ],
    { temperature: 0.1, maxTokens: 600 }
  );
  if (filters.isRealEstateQuery === false) {
    return {
      query: input.query,
      parsedFilters: filters,
      summary: "That doesn't look like a property search. Try describing a home, location, price, or lifestyle.",
      total: 0,
      properties: [],
      tokensUsed: usage.total_tokens,
      notRealEstate: true
    };
  }
  const hasFilter = filters.city || filters.state || filters.zip || filters.type || filters.minBeds || filters.maxBeds || filters.minBaths || filters.maxBaths || filters.minPrice || filters.maxPrice || filters.minSqft || filters.maxSqft || filters.tags && filters.tags.length > 0;
  if (!hasFilter) {
    return {
      query: input.query,
      parsedFilters: filters,
      summary: "Please be more specific \u2014 mention a location, property type, price range, or number of bedrooms.",
      total: 0,
      properties: [],
      tokensUsed: usage.total_tokens,
      notRealEstate: true
    };
  }
  const where = { status: "AVAILABLE" };
  if (filters.city)
    where.city = { contains: filters.city, mode: "insensitive" };
  if (filters.state)
    where.state = { contains: filters.state, mode: "insensitive" };
  if (filters.zip) where.zip = filters.zip;
  if (filters.type) where.type = filters.type;
  if (filters.status) where.status = filters.status;
  if (filters.minPrice || filters.maxPrice) {
    const priceFilter = {};
    if (filters.minPrice) priceFilter.gte = filters.minPrice;
    if (filters.maxPrice) priceFilter.lte = filters.maxPrice;
    where.price = priceFilter;
  }
  if (filters.minBeds || filters.maxBeds) {
    const bedsFilter = {};
    if (filters.minBeds) bedsFilter.gte = filters.minBeds;
    if (filters.maxBeds) bedsFilter.lte = filters.maxBeds;
    where.beds = bedsFilter;
  }
  if (filters.minBaths || filters.maxBaths) {
    const bathsFilter = {};
    if (filters.minBaths) bathsFilter.gte = filters.minBaths;
    if (filters.maxBaths) bathsFilter.lte = filters.maxBaths;
    where.baths = bathsFilter;
  }
  if (filters.minSqft || filters.maxSqft) {
    const sqftFilter = {};
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
    include: propertyInclude2
  });
  const total = await prisma.property.count({ where });
  return {
    query: input.query,
    parsedFilters: filters,
    summary: filters.summary,
    total,
    properties,
    tokensUsed: usage.total_tokens
  };
};
var generatePropertyDescription = async (userId, role, input) => {
  const allowedRoles = ["AGENT", "ADMIN", "SUPER_ADMIN"];
  if (!allowedRoles.includes(role)) {
    throw new AppError_default("Only agents can use the description generator", 403);
  }
  if (role === "AGENT") {
    const agent = await prisma.agent.findUnique({ where: { userId } });
    if (!agent) {
      throw new AppError_default(
        "Agent profile not found. Please create an agent profile first.",
        403
      );
    }
    if (agent.status !== AgentStatus.APPROVED) {
      throw new AppError_default(
        "Agent profile must be approved before using AI features. Please wait for admin approval.",
        403
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
  const { data: generated, usage } = await getChatResponse(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    { temperature: 0.1, maxTokens: 2e3 }
  );
  await prisma.auditLog.create({
    data: {
      userId,
      action: "AI_DESCRIPTION_GENERATION",
      tokenCount: usage.total_tokens,
      estimatedCost: usage.total_tokens / 1e3 * 1e-4
    }
  });
  return {
    input,
    generated: {
      ...generated,
      imageUrl: generated.imagePrompt ? `https://image.pollinations.ai/prompt/${encodeURIComponent(generated.imagePrompt.substring(0, 500))}?width=1024&height=768&nologo=true&model=flux` : void 0
    },
    tokensUsed: usage.total_tokens
  };
};
var generateRecommendations = async (userId, input) => {
  const [savedProperties, searchPref, recentInquiries, existingRecs] = await Promise.all([
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
            tags: true
          }
        }
      }
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
            tags: true
          }
        }
      }
    }),
    prisma.aIRecommendation.findMany({
      where: { userId },
      select: { propertyId: true }
    })
  ]);
  const alreadyRecommended = existingRecs.map((r) => r.propertyId);
  const savedIds = savedProperties.map((s) => s.propertyId);
  const excludeIds = [.../* @__PURE__ */ new Set([...alreadyRecommended, ...savedIds])];
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
    searchTargetAreas: searchPref?.targetAreas ?? []
  };
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
  const { data: profile, usage } = await getChatResponse(
    [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Analyze this user's real estate behavior and extract preferences:
${JSON.stringify(behaviorSummary, null, 2)}`
      }
    ],
    { temperature: 0.3, maxTokens: 500 }
  );
  const where = {
    status: "AVAILABLE",
    ...excludeIds.length > 0 ? { id: { notIn: excludeIds } } : {}
  };
  if (profile.preferredTypes.length > 0) {
    where.type = {
      in: profile.preferredTypes
    };
  }
  if (profile.priceRange.min || profile.priceRange.max) {
    where.price = {
      gte: profile.priceRange.min || 0,
      lte: profile.priceRange.max || 999999999
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
    take: input.limit * 3,
    // fetch more, then score
    orderBy: { createdAt: "desc" },
    include: propertyInclude2
  });
  if (candidates.length === 0) {
    return {
      profile,
      recommendations: [],
      message: "No matching properties found. Try saving more properties to improve recommendations.",
      tokensUsed: usage.total_tokens
    };
  }
  const scored = candidates.map((p) => {
    let score = 0.5;
    if (profile.preferredTypes.includes(p.type)) score += 0.2;
    if (Math.abs(p.beds - profile.preferredBeds) <= 1) score += 0.1;
    const price = Number(p.price);
    if (price >= profile.priceRange.min && price <= profile.priceRange.max)
      score += 0.15;
    const tagOverlap = p.tags.filter(
      (t) => profile.preferredTags.includes(t)
    ).length;
    score += Math.min(0.15, tagOverlap * 0.05);
    return { property: p, score: Math.min(1, score) };
  });
  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, input.limit);
  await prisma.aIRecommendation.createMany({
    data: top.map(({ property, score }) => ({
      userId,
      propertyId: property.id,
      reason: profile.reasoning,
      score
    })),
    skipDuplicates: true
  });
  await prisma.auditLog.create({
    data: {
      userId,
      action: "AI_RECOMMENDATIONS",
      tokenCount: usage.total_tokens,
      estimatedCost: usage.total_tokens / 1e3 * 1e-4
    }
  });
  await prisma.notification.create({
    data: {
      userId,
      type: "AI_RECOMMENDATION",
      title: "New AI Recommendations",
      message: `We found ${top.length} properties that match your preferences.`,
      link: "/recommendations"
    }
  });
  return {
    profile,
    recommendations: top.map(({ property, score }) => ({
      ...property,
      aiScore: score
    })),
    tokensUsed: usage.total_tokens
  };
};
var analyzeNeighborhood = async (input) => {
  const locationStr = [input.location, input.city, input.zip].filter(Boolean).join(", ");
  if (input.zip) {
    const cached = await prisma.neighborhood.findUnique({
      where: { zip: input.zip }
    });
    if (cached && cached.expiresAt && cached.expiresAt > /* @__PURE__ */ new Date()) {
      return {
        source: "cache",
        data: cached,
        aiAnalysis: cached.aiAnalysis
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
  const { data: report, usage } = await getChatResponse(
    [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Generate a neighborhood intelligence report for: ${locationStr}`
      }
    ],
    { temperature: 0.2, maxTokens: 1500 }
  );
  if (input.zip) {
    await prisma.neighborhood.upsert({
      where: { zip: input.zip },
      update: {
        name: report.name,
        city: report.city,
        safetyScore: report.safety.score,
        schoolScore: report.schools.score,
        transitScore: report.transportation.score,
        marketTrend: report.marketTrends,
        aiAnalysis: report.aiAnalysis,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3)
        // 7 days
      },
      create: {
        zip: input.zip,
        name: report.name,
        city: report.city,
        safetyScore: report.safety.score,
        schoolScore: report.schools.score,
        transitScore: report.transportation.score,
        marketTrend: report.marketTrends,
        aiAnalysis: report.aiAnalysis,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3)
      }
    });
  }
  return {
    source: "ai",
    location: locationStr,
    report,
    tokensUsed: usage.total_tokens
  };
};
var BASE_RATES = {
  excellent: { 10: 6.2, 15: 6.5, 20: 6.8, 30: 7 },
  good: { 10: 6.6, 15: 6.9, 20: 7.2, 30: 7.5 },
  fair: { 10: 7.2, 15: 7.6, 20: 7.9, 30: 8.3 },
  poor: { 10: 8, 15: 8.5, 20: 8.9, 30: 9.4 }
};
var TERMS = [10, 15, 20, 30];
function calcMonthlyPayment(principal, annualRate, termYears) {
  const r = annualRate / 100 / 12;
  const n = termYears * 12;
  if (r === 0) return principal / n;
  return principal * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
}
var getMortgageAdvice = async (input) => {
  const {
    propertyPrice,
    downPayment,
    annualIncome,
    creditScore,
    loanTermYears,
    includeInsurance,
    includePropertyTax
  } = input;
  const loanAmount = propertyPrice - downPayment;
  if (loanAmount <= 0) {
    throw new AppError_default("Down payment cannot exceed the property price.", 400);
  }
  const downPaymentPercent = downPayment / propertyPrice * 100;
  const monthlyIncome = annualIncome / 12;
  const rates = BASE_RATES[creditScore] ?? BASE_RATES["good"];
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
      recommended: term === loanTermYears
    };
  });
  const primaryRate = rates[loanTermYears] ?? 7.5;
  const piPayment = calcMonthlyPayment(loanAmount, primaryRate, loanTermYears);
  const monthlyPropertyTax = includePropertyTax ? propertyPrice * 0.012 / 12 : 0;
  const monthlyInsurance = includeInsurance ? propertyPrice * 5e-3 / 12 : 0;
  const totalMonthly = Math.round(
    piPayment + monthlyPropertyTax + monthlyInsurance
  );
  const dti = totalMonthly / monthlyIncome * 100;
  const affordabilityScore = Math.max(
    0,
    Math.min(100, Math.round(100 - (dti - 20) / 30 * 100))
  );
  let affordabilityLabel;
  if (dti <= 28) affordabilityLabel = "Comfortable";
  else if (dti <= 36) affordabilityLabel = "Moderate";
  else if (dti <= 43) affordabilityLabel = "Stretched";
  else affordabilityLabel = "Unaffordable";
  const maxMonthlyForHousing = monthlyIncome * 0.28;
  const maxPIPayment = maxMonthlyForHousing - monthlyPropertyTax - monthlyInsurance;
  const r = primaryRate / 100 / 12;
  const n = loanTermYears * 12;
  const maxLoan = maxPIPayment > 0 ? maxPIPayment * (Math.pow(1 + r, n) - 1) / (r * Math.pow(1 + r, n)) : 0;
  const maxAffordablePrice = Math.round(maxLoan + downPayment);
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
  const { data: aiResult } = await getChatResponse(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    { temperature: 0.3, maxTokens: 800 }
  );
  return {
    loanAmount,
    downPaymentPercent: Math.round(downPaymentPercent * 10) / 10,
    monthlyPayment: totalMonthly,
    breakdown: {
      principal: Math.round(piPayment * 0.3),
      // approx principal portion (month 1)
      interest: Math.round(piPayment * 0.7),
      // approx interest portion (month 1)
      insurance: Math.round(monthlyInsurance),
      propertyTax: Math.round(monthlyPropertyTax)
    },
    loanOptions,
    affordabilityScore,
    affordabilityLabel,
    debtToIncomeRatio: Math.round(dti * 10) / 10,
    maxAffordablePrice,
    aiInsights: aiResult.aiInsights,
    tips: aiResult.tips
  };
};

// src/app/module/ai/ai.controller.ts
var naturalLanguageSearch2 = catchAsync(
  async (req, res) => {
    const result = await naturalLanguageSearch(req.body);
    sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: result.summary,
      data: {
        query: result.query,
        parsedFilters: result.parsedFilters,
        total: result.total,
        properties: result.properties,
        tokensUsed: result.tokensUsed
      }
    });
  }
);
var generateDescription = catchAsync(
  async (req, res) => {
    const result = await generatePropertyDescription(
      req.user.userId,
      req.user.role,
      req.body
    );
    console.log("Generated Description:", result);
    sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: "Property description generated successfully",
      data: result
    });
  }
);
var getRecommendations = catchAsync(
  async (req, res) => {
    const limit = Number(req.query["limit"]) || 6;
    const result = await generateRecommendations(req.user.userId, {
      limit
    });
    sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: `Found ${result.recommendations.length} personalized recommendations`,
      data: {
        profile: result.profile,
        recommendations: result.recommendations,
        tokensUsed: result.tokensUsed
      }
    });
  }
);
var analyzeNeighborhood2 = catchAsync(
  async (req, res) => {
    const result = await analyzeNeighborhood(req.body);
    sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: result.source === "cache" ? "Neighborhood report loaded from cache" : "Neighborhood analysis complete",
      data: result
    });
  }
);
var getMortgageAdvice2 = catchAsync(
  async (req, res) => {
    const result = await getMortgageAdvice(req.body);
    sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: "Mortgage analysis complete",
      data: result
    });
  }
);

// src/app/module/ai/ai.routes.ts
var router6 = Router6();
router6.post(
  "/search",
  validateRequest(naturalLanguageSearchSchema),
  naturalLanguageSearch2
);
router6.post(
  "/generate-description",
  authenticate,
  validateRequest(generateDescriptionSchema),
  generateDescription
);
router6.get("/recommendations", authenticate, getRecommendations);
router6.post(
  "/neighborhood",
  validateRequest(neighborhoodAnalyzerSchema),
  analyzeNeighborhood2
);
router6.post(
  "/mortgage-advisor",
  authenticate,
  validateRequest(mortgageAdvisorSchema),
  getMortgageAdvice2
);
var ai_routes_default = router6;

// src/app/module/review/review.routes.ts
import { Router as Router7 } from "express";

// src/app/module/review/review.validation.ts
import { z as z7 } from "zod";
var createReviewSchema3 = z7.object({
  propertyId: z7.string().uuid("Invalid property ID"),
  rating: z7.number().int().min(1).max(5),
  comment: z7.string().optional()
});
var updateReviewSchema = createReviewSchema3.partial();

// src/app/module/review/review.service.ts
var createReview = async (userId, data) => {
  const property = await prisma.property.findUnique({
    where: { id: data.propertyId }
  });
  if (!property) throw new AppError_default("Property not found", 404);
  const existing = await prisma.review.findFirst({
    where: { userId, propertyId: data.propertyId }
  });
  if (existing) throw new AppError_default("You have already reviewed this property", 409);
  const review = await prisma.review.create({
    data: { userId, ...data },
    include: { user: { select: { name: true, avatar: true } } }
  });
  const agentReviews = await prisma.review.aggregate({
    where: { property: { agentId: property.agentId } },
    _avg: { rating: true }
  });
  if (agentReviews._avg.rating) {
    await prisma.agent.update({
      where: { id: property.agentId },
      data: { rating: agentReviews._avg.rating }
    });
  }
  return review;
};
var getPropertyReviews = async (propertyId, query) => {
  const { page, limit, skip } = getPaginationParams(query);
  const [items, total] = await Promise.all([
    prisma.review.findMany({
      where: { propertyId },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, avatar: true } } }
    }),
    prisma.review.count({ where: { propertyId } })
  ]);
  const avg = await prisma.review.aggregate({
    where: { propertyId },
    _avg: { rating: true }
  });
  return { items, total, page, limit, totalPages: Math.ceil(total / limit), avgRating: avg._avg.rating };
};
var getUserReviews = async (userId, query) => {
  const { page, limit, skip } = getPaginationParams(query);
  const [items, total] = await Promise.all([
    prisma.review.findMany({
      where: { userId },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { property: { select: { title: true, address: true } } }
    }),
    prisma.review.count({ where: { userId } })
  ]);
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
};
var deleteReview = async (userId, reviewId) => {
  const review = await prisma.review.findFirst({
    where: { id: reviewId, userId }
  });
  if (!review) throw new AppError_default("Review not found or not owned by you", 404);
  await prisma.review.delete({ where: { id: reviewId } });
};
var reviewService = {
  createReview,
  getPropertyReviews,
  getUserReviews,
  deleteReview
};

// src/app/module/review/review.controller.ts
var createReview2 = catchAsync(async (req, res) => {
  const result = await reviewService.createReview(req.user.userId, req.body);
  sendResponse({ res, statusCode: 201, success: true, message: "Review submitted successfully", data: result });
});
var getPropertyReviews2 = catchAsync(async (req, res) => {
  const propertyId = req.params["propertyId"];
  const result = await reviewService.getPropertyReviews(propertyId, req.query);
  sendResponse({ res, statusCode: 200, success: true, message: "Reviews fetched", data: result.items, meta: { ...result, items: void 0 } });
});
var getMyReviews = catchAsync(async (req, res) => {
  const result = await reviewService.getUserReviews(req.user.userId, req.query);
  sendResponse({ res, statusCode: 200, success: true, message: "Your reviews fetched", data: result.items, meta: { ...result, items: void 0 } });
});
var deleteReview2 = catchAsync(async (req, res) => {
  await reviewService.deleteReview(req.user.userId, req.params["reviewId"]);
  sendResponse({ res, statusCode: 200, success: true, message: "Review deleted" });
});

// src/app/module/review/review.routes.ts
var router7 = Router7();
router7.get("/property/:propertyId", getPropertyReviews2);
router7.use(authenticate);
router7.post("/", validateRequest(createReviewSchema3), createReview2);
router7.get("/me", getMyReviews);
router7.delete("/:reviewId", deleteReview2);
var review_routes_default = router7;

// src/app/module/inquiry/inquiry.routes.ts
import { Router as Router8 } from "express";

// src/app/module/inquiry/inquiry.validation.ts
import { z as z8 } from "zod";
var createInquirySchema3 = z8.object({
  propertyId: z8.string().uuid("Invalid property ID"),
  message: z8.string().min(10, "Message must be at least 10 characters")
});
var updateInquiryStatusSchema = z8.object({
  status: z8.enum(["PENDING", "VIEWED", "REPLIED", "ARCHIVED"])
});

// src/app/module/inquiry/inquiry.service.ts
var createInquiry = async (buyerId, data) => {
  const property = await prisma.property.findUnique({
    where: { id: data.propertyId },
    include: { agent: true }
  });
  if (!property) throw new AppError_default("Property not found", 404);
  const inquiry = await prisma.inquiry.create({
    data: {
      buyerId,
      agentId: property.agentId,
      propertyId: data.propertyId,
      message: data.message
    },
    include: {
      property: { select: { title: true, address: true } },
      agent: { select: { name: true, email: true } }
    }
  });
  await prisma.notification.create({
    data: {
      userId: property.agent.userId,
      type: "NEW_INQUIRY",
      title: "New Inquiry",
      message: `You have a new inquiry for "${property.title}"`,
      link: `/properties/${data.propertyId}`
    }
  });
  return inquiry;
};
var getAgentInquiries = async (userId, query) => {
  const agent = await prisma.agent.findUnique({ where: { userId } });
  if (!agent) throw new AppError_default("Agent profile not found", 404);
  if (agent.status !== "APPROVED") throw new AppError_default("Agent profile is not approved yet", 403);
  const { page, limit, skip } = getPaginationParams(query);
  const status6 = query["status"];
  const where = { agentId: agent.id, ...status6 ? { status: status6 } : {} };
  const [items, total] = await Promise.all([
    prisma.inquiry.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        buyer: { select: { name: true, email: true, avatar: true } },
        property: { select: { id: true, title: true, address: true } }
      }
    }),
    prisma.inquiry.count({ where })
  ]);
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
};
var getBuyerInquiries = async (userId, query) => {
  const { page, limit, skip } = getPaginationParams(query);
  const [items, total] = await Promise.all([
    prisma.inquiry.findMany({
      where: { buyerId: userId },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        property: { select: { id: true, title: true, address: true } },
        agent: { select: { name: true, email: true, phone: true } }
      }
    }),
    prisma.inquiry.count({ where: { buyerId: userId } })
  ]);
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
};
var updateInquiryStatus = async (userId, inquiryId, status6) => {
  const agent = await prisma.agent.findUnique({ where: { userId } });
  if (!agent) throw new AppError_default("Agent profile not found", 404);
  if (agent.status !== "APPROVED") throw new AppError_default("Agent profile is not approved yet", 403);
  const inquiry = await prisma.inquiry.findFirst({ where: { id: inquiryId, agentId: agent.id } });
  if (!inquiry) throw new AppError_default("Inquiry not found", 404);
  return prisma.inquiry.update({ where: { id: inquiryId }, data: { status: status6 } });
};

// src/app/module/inquiry/inquiry.controller.ts
var createInquiry2 = catchAsync(
  async (req, res) => {
    const result = await createInquiry(
      req.user.userId,
      req.body
    );
    sendResponse({
      res,
      statusCode: 201,
      success: true,
      message: "Inquiry sent successfully",
      data: result
    });
  }
);
var getAgentInquiries2 = catchAsync(
  async (req, res) => {
    const result = await getAgentInquiries(
      req.user.userId,
      req.query
    );
    sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: "Inquiries fetched",
      data: result.items,
      meta: { ...result, items: void 0 }
    });
  }
);
var getMyInquiries = catchAsync(
  async (req, res) => {
    const result = await getBuyerInquiries(
      req.user.userId,
      req.query
    );
    sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: "Your inquiries fetched",
      data: result.items,
      meta: { ...result, items: void 0 }
    });
  }
);
var updateInquiryStatus2 = catchAsync(
  async (req, res) => {
    const result = await updateInquiryStatus(
      req.user.userId,
      req.params["inquiryId"],
      req.body.status
    );
    sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: "Inquiry status updated",
      data: result
    });
  }
);

// src/app/module/inquiry/inquiry.routes.ts
var router8 = Router8();
router8.use(authenticate);
router8.post("/", validateRequest(createInquirySchema3), createInquiry2);
router8.get("/my-inquiries", getMyInquiries);
router8.get("/agent-list", authorize("AGENT"), getAgentInquiries2);
router8.patch("/:inquiryId/status", authorize("AGENT"), validateRequest(updateInquiryStatusSchema), updateInquiryStatus2);
var inquiry_routes_default = router8;

// src/app/module/notification/notification.routes.ts
import { Router as Router9 } from "express";

// src/app/module/notification/notification.service.ts
var getNotifications = async (userId, query) => {
  const { page, limit, skip } = getPaginationParams(query);
  const unreadOnly = query["unread"] === "true";
  const where = { userId, ...unreadOnly ? { isRead: false } : {} };
  const [items, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" }
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId, isRead: false } })
  ]);
  return { items, total, page, limit, totalPages: Math.ceil(total / limit), unreadCount };
};
var markNotificationRead = async (userId, notificationId) => {
  const notif = await prisma.notification.findFirst({ where: { id: notificationId, userId } });
  if (!notif) throw new AppError_default("Notification not found", 404);
  return prisma.notification.update({ where: { id: notificationId }, data: { isRead: true } });
};
var markAllNotificationsRead = async (userId) => {
  await prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
};

// src/app/module/notification/notification.controller.ts
var getNotifications2 = catchAsync(async (req, res) => {
  const result = await getNotifications(req.user.userId, req.query);
  sendResponse({ res, statusCode: 200, success: true, message: "Notifications fetched", data: result.items, meta: { ...result, items: void 0 } });
});
var markRead = catchAsync(async (req, res) => {
  await markNotificationRead(req.user.userId, req.params["id"]);
  sendResponse({ res, statusCode: 200, success: true, message: "Notification marked as read" });
});
var markAllRead = catchAsync(async (req, res) => {
  await markAllNotificationsRead(req.user.userId);
  sendResponse({ res, statusCode: 200, success: true, message: "All notifications marked as read" });
});

// src/app/module/notification/notification.routes.ts
var router9 = Router9();
router9.use(authenticate);
router9.get("/", getNotifications2);
router9.patch("/read-all", markAllRead);
router9.patch("/:id/read", markRead);
var notification_routes_default = router9;

// src/app/routes/index.ts
var router10 = Router10();
router10.use("/auth", auth_routes_default);
router10.use("/users", user_routes_default);
router10.use("/agents", agent_routes_default);
router10.use("/properties", property_routes_default);
router10.use("/admin", admin_routes_default);
router10.use("/ai", ai_routes_default);
router10.use("/reviews", review_routes_default);
router10.use("/inquiries", inquiry_routes_default);
router10.use("/notifications", notification_routes_default);
var routes_default = router10;

// src/app/middleware/globalErrorHandler.ts
import status4 from "http-status";
import z9 from "zod";

// src/app/errorHelpers/handleZodError.ts
import status2 from "http-status";
var handleZodError = (err) => {
  const statusCode = status2.BAD_REQUEST;
  const errorSources = [];
  err.issues.forEach((issue) => {
    errorSources.push({
      path: issue.path.join(" => "),
      message: issue.message
    });
  });
  const firstIssue = err.issues[0];
  const fieldName = firstIssue?.path?.length ? String(firstIssue.path[firstIssue.path.length - 1]) : null;
  const message = fieldName ? `Invalid value for "${fieldName}": ${firstIssue?.message ?? ""}` : firstIssue?.message ?? "Invalid request data";
  return {
    success: false,
    message,
    errorSources,
    statusCode
  };
};

// src/app/errorHelpers/handlePrismaErrors.ts
import status3 from "http-status";
var getStatusCodeFromPrismaError = (errorCode) => {
  if (errorCode === "P2002") {
    return status3.CONFLICT;
  }
  if (["P2025", "P2001", "P2015", "P2018"].includes(errorCode)) {
    return status3.NOT_FOUND;
  }
  if (["P1000", "P6002"].includes(errorCode)) {
    return status3.UNAUTHORIZED;
  }
  if (["P1010", "P6010"].includes(errorCode)) {
    return status3.FORBIDDEN;
  }
  if (errorCode === "P6003") {
    return status3.PAYMENT_REQUIRED;
  }
  if (["P1008", "P2004", "P6004"].includes(errorCode)) {
    return status3.GATEWAY_TIMEOUT;
  }
  if (errorCode === "P5011") {
    return status3.TOO_MANY_REQUESTS;
  }
  if (errorCode === "P6009") {
    return 413;
  }
  if (errorCode.startsWith("P1") || ["P2024", "P2037", "P6008"].includes(errorCode)) {
    return status3.SERVICE_UNAVAILABLE;
  }
  if (errorCode.startsWith("P2")) {
    return status3.BAD_REQUEST;
  }
  if (errorCode.startsWith("P3") || errorCode.startsWith("P4")) {
    return status3.INTERNAL_SERVER_ERROR;
  }
  return status3.INTERNAL_SERVER_ERROR;
};
var formatErrorMeta = (meta) => {
  if (!meta) return "";
  const parts = [];
  if (meta.target) {
    parts.push(`Field(s): ${String(meta.target)}`);
  }
  if (meta.field_name) {
    parts.push(`Field: ${String(meta.field_name)}`);
  }
  if (meta.column_name) {
    parts.push(`Column: ${String(meta.column_name)}`);
  }
  if (meta.table) {
    parts.push(`Table: ${String(meta.table)}`);
  }
  if (meta.model_name) {
    parts.push(`Model: ${String(meta.model_name)}`);
  }
  if (meta.relation_name) {
    parts.push(`Relation: ${String(meta.relation_name)}`);
  }
  if (meta.constraint) {
    parts.push(`Constraint: ${String(meta.constraint)}`);
  }
  if (meta.database_error) {
    parts.push(`Database Error: ${String(meta.database_error)}`);
  }
  return parts.length > 0 ? parts.join(" |") : "";
};
var handlePrismaClientKnownRequestError = (error) => {
  const statusCode = getStatusCodeFromPrismaError(error.code);
  const metaInfo = formatErrorMeta(error.meta);
  let cleanMessage = error.message;
  cleanMessage = cleanMessage.replace(/Invalid `.*?` invocation:?\s*/i, "");
  const lines = cleanMessage.split("\n").filter((line) => line.trim());
  const mainMessage = lines[0] || "An error occurred with the database operation.";
  const errorSources = [
    {
      path: error.code,
      message: metaInfo ? `${mainMessage} | ${metaInfo}` : mainMessage
    }
  ];
  if (error.meta?.cause) {
    errorSources.push({
      path: "cause",
      message: String(error.meta.cause)
    });
  }
  return {
    success: false,
    statusCode,
    message: `Prisma Client Known Request Error: ${mainMessage}`,
    errorSources
  };
};
var handlePrismaClientUnknownError = (error) => {
  let cleanMessage = error.message;
  cleanMessage = cleanMessage.replace(/Invalid `.*?` invocation:?\s*/i, "");
  const lines = cleanMessage.split("\n").filter((line) => line.trim());
  const mainMessage = lines[0] || "An unknown error occurred with the database operation.";
  const errorSources = [
    {
      path: "Unknown Prisma Error",
      message: mainMessage
    }
  ];
  return {
    success: false,
    statusCode: status3.INTERNAL_SERVER_ERROR,
    message: `Prisma Client Unknown Request Error: ${mainMessage}`,
    errorSources
  };
};
var handlePrismaClientValidationError = (error) => {
  let cleanMessage = error.message;
  cleanMessage = cleanMessage.replace(/Invalid `.*?` invocation:?\s*/i, "");
  const lines = cleanMessage.split("\n").filter((line) => line.trim());
  const errorSources = [];
  const fieldMatch = cleanMessage.match(/Argument `(\w+)`/i);
  const fieldName = fieldMatch ? fieldMatch[1] : "Unknown Field";
  const mainMessage = lines.find(
    (line) => !line.includes("Argument") && !line.includes("\u2192") && line.length > 10
  ) || lines[0] || "Invalid query parameters provided to the database operation.";
  errorSources.push({
    path: fieldName,
    message: mainMessage
  });
  return {
    success: false,
    statusCode: status3.BAD_REQUEST,
    message: `Prisma Client Validation Error: ${mainMessage}`,
    errorSources
  };
};
var handlerPrismaClientInitializationError = (error) => {
  const statusCode = error.errorCode ? getStatusCodeFromPrismaError(error.errorCode) : status3.SERVICE_UNAVAILABLE;
  const cleanMessage = error.message;
  cleanMessage.replace(/Invalid `.*?` invocation:?\s*/i, "");
  const lines = cleanMessage.split("\n").filter((line) => line.trim());
  const mainMessage = lines[0] || "An error occurred while initializing the Prisma Client.";
  const errorSources = [
    {
      path: error.errorCode || "Initialization Error",
      message: mainMessage
    }
  ];
  return {
    success: false,
    statusCode,
    message: `Prisma Client Initialization Error: ${mainMessage}`,
    errorSources
  };
};
var handlerPrismaClientRustPanicError = () => {
  const errorSources = [{
    path: "Rust Engine Crashed",
    message: "The database engine encountered a fatal error and crashed. This is usually due to an internal bug in the Prisma engine or an unexpected edge case in the database operation. Please check the Prisma logs for more details and consider reporting this issue to the Prisma team if it persists."
  }];
  return {
    success: false,
    statusCode: status3.INTERNAL_SERVER_ERROR,
    message: "Prisma Client Rust Panic Error: The database engine crashed due to a fatal error.",
    errorSources
  };
};

// src/app/middleware/globalErrorHandler.ts
var globalErrorHandler = async (err, req, res, next) => {
  if (config.nodeEnv === "development") {
    console.log("Error from Global Error Handler", err);
  }
  let errorSources = [];
  let statusCode = status4.INTERNAL_SERVER_ERROR;
  let message = "Internal Server Error";
  let stack = void 0;
  if (err instanceof prismaNamespace_exports.PrismaClientKnownRequestError) {
    const simplifiedError = handlePrismaClientKnownRequestError(err);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorSources = [...simplifiedError.errorSources];
    stack = err.stack;
  } else if (err instanceof prismaNamespace_exports.PrismaClientUnknownRequestError) {
    const simplifiedError = handlePrismaClientUnknownError(err);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorSources = [...simplifiedError.errorSources];
    stack = err.stack;
  } else if (err instanceof prismaNamespace_exports.PrismaClientValidationError) {
    const simplifiedError = handlePrismaClientValidationError(err);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorSources = [...simplifiedError.errorSources];
    stack = err.stack;
  } else if (err instanceof prismaNamespace_exports.PrismaClientRustPanicError) {
    const simplifiedError = handlerPrismaClientRustPanicError();
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorSources = [...simplifiedError.errorSources];
    stack = err.stack;
  } else if (err instanceof prismaNamespace_exports.PrismaClientInitializationError) {
    const simplifiedError = handlerPrismaClientInitializationError(err);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorSources = [...simplifiedError.errorSources];
    stack = err.stack;
  } else if (err instanceof z9.ZodError || err?.name === "ZodError") {
    const simplifiedError = handleZodError(err);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorSources = [...simplifiedError.errorSources];
    stack = err.stack;
  } else if (err instanceof AppError_default) {
    statusCode = err.statusCode;
    message = err.message;
    stack = err.stack;
    errorSources = [
      {
        path: "",
        message: err.message
      }
    ];
  } else if (err instanceof Error) {
    statusCode = status4.INTERNAL_SERVER_ERROR;
    message = err.message;
    stack = err.stack;
    errorSources = [
      {
        path: "",
        message: err.message
      }
    ];
  }
  const errorResponse = {
    success: false,
    message,
    errorSources,
    error: config.nodeEnv === "development" ? err : void 0,
    stack: config.nodeEnv === "development" ? stack : void 0
  };
  res.status(statusCode).json(errorResponse);
};

// src/app/middleware/notFound.ts
import status5 from "http-status";
var notFound = (req, res) => {
  res.status(status5.NOT_FOUND).json({
    success: false,
    message: `Route ${req.originalUrl} Not Found`
  });
};

// src/app.ts
import qs from "qs";
var app = express();
app.set("query parser", (str) => qs.parse(str));
app.use(
  cors({
    origin: config.cors.origin,
    credentials: true
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use((req, _res, next) => {
  console.log(
    `
[${(/* @__PURE__ */ new Date()).toLocaleTimeString()}] \u{1F680} ${req.method} ${req.url}`
  );
  if (req.body && Object.keys(req.body).length > 0) {
    console.log("\u{1F4E6} Body:", JSON.stringify(req.body, null, 2));
  }
  next();
});
app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "PropTech AI API is running",
    version: "1.0.0",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
app.use("/api", routes_default);
app.use(notFound);
app.use(globalErrorHandler);
var app_default = app;

// src/server.ts
var server;
var bootstrap = async () => {
  try {
    await prisma.$connect();
    console.log("\u2705 Database connected");
    server = app_default.listen(config.port, () => {
      console.log(`\u{1F680} Server running on http://localhost:${config.port}`);
      console.log(`\u{1F4E6} Environment: ${config.nodeEnv}`);
    });
    const shutdown = async (signal) => {
      console.log(`
${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        await prisma.$disconnect();
        console.log("\u{1F4A4} Server closed");
        process.exit(0);
      });
    };
    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (error) {
    console.error("\u274C Failed to start server:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
};
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received. Shutting down server...");
  if (server) {
    server.close(() => {
      console.log("Server closed gracefully.");
      process.exit(1);
    });
  }
  process.exit(1);
});
process.on("SIGINT", () => {
  console.log("SIGINT signal received.");
  if (server) {
    server.close(() => {
      console.log("Server closed gracefully.");
      process.exit(0);
    });
  } else {
    process.exit(1);
  }
});
process.on("uncaughtException", (error) => {
  console.log("Uncaught Exception Detected... Shutting down server", error);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  }
  process.exit(1);
});
process.on("unhandledRejection", (error) => {
  console.log("Unhandled Rejection Detected... Shutting down server", error);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  }
  process.exit(1);
});
bootstrap();
