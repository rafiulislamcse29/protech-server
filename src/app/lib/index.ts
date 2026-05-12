import { PrismaClient } from "../../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { v2 as cloudinaryV2 } from "cloudinary";
import nodemailer from "nodemailer";
import { config } from "../config/index";

// ─── Prisma Client (Prisma 7 requires a driver adapter) ───────────────────────
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const adapter = new PrismaPg({ connectionString: config.db.url });

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log:
      config.nodeEnv === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (config.nodeEnv !== "production") globalForPrisma.prisma = prisma;

// ─── Cloudinary ───────────────────────────────────────────────────────────────
cloudinaryV2.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

export const cloudinary = cloudinaryV2;

// ─── Nodemailer ───────────────────────────────────────────────────────────────
export const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.port === 465,
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
});
