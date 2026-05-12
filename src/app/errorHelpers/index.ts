import { NextFunction, Request, RequestHandler, Response } from "express";
export { default as AppError } from "./AppError";

export const catchAsync = (fn: RequestHandler) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await fn(req, res, next);
    } catch (error: any) {
      next(error);
    }
  }
}
