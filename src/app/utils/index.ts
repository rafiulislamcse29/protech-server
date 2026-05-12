import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../config/index";
import { JwtPayload } from "../interfaces/index";

// ─── Password ─────────────────────────────────────────────────────────────────
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

export const comparePassword = async (
  plain: string,
  hashed: string,
): Promise<boolean> => {
  return bcrypt.compare(plain, hashed);
};

// ─── JWT ──────────────────────────────────────────────────────────────────────
export const signAccessToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn as jwt.SignOptions["expiresIn"],
  });
};

export const signRefreshToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn as jwt.SignOptions["expiresIn"],
  });
};

export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, config.jwt.accessSecret) as JwtPayload;
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  return jwt.verify(token, config.jwt.refreshSecret) as JwtPayload;
};

// ─── Date ─────────────────────────────────────────────────────────────────────
export const addDays = (days: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

export const addMinutes = (minutes: number): Date => {
  return new Date(Date.now() + minutes * 60 * 1000);
};

// ─── String ───────────────────────────────────────────────────────────────────
export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
};

export const generateOtp = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
