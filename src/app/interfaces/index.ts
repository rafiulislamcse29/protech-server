import { Request } from "express";
import { Role } from "../../generated/prisma/client.js";

// Multer extended request
export interface MulterRequest extends Request {
  user?: JwtPayload;
  file?: Express.Multer.File;
  files?: Express.Multer.File[];
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface JwtPayload {
  userId: string;
  email: string;
  role: Role;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

// ─── Pagination ───────────────────────────────────────────────────────────────
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ─── Property Search ──────────────────────────────────────────────────────────
export interface PropertySearchQuery {
  page?: string;
  limit?: string;
  city?: string;
  state?: string;
  zip?: string;
  type?: string;
  status?: string;
  minPrice?: string;
  maxPrice?: string;
  minBeds?: string;
  maxBeds?: string;
  minBaths?: string;
  maxBaths?: string;
  minSqft?: string;
  maxSqft?: string;
  tags?: string;
  agentId?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  q?: string; // natural language search
}
