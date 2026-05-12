import { Response } from "express";

interface SendResponseOptions<T> {
  res: Response;
  statusCode: number;
  success: boolean;
  message: string;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export const sendResponse = <T>({
  res,
  statusCode,
  success,
  message,
  data,
  meta,
}: SendResponseOptions<T>): void => {
  const payload: Record<string, unknown> = { success, message };
  if (data !== undefined) payload["data"] = data;
  if (meta !== undefined) payload["meta"] = meta;
  res.status(statusCode).json(payload);
};

export const getPaginationParams = (
  query: Record<string, unknown>,
): { page: number; limit: number; skip: number } => {
  const page = Math.max(1, Number(query["page"]) || 1);
  const limit = Math.min(100, Math.max(1, Number(query["limit"]) || 10));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

export const param = (value: string | string[] | undefined): string => {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
};
