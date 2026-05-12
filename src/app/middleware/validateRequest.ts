import { NextFunction, Request, Response } from "express";
import z from "zod";

export const validateRequest = (zodSchema: z.ZodObject) => {
  return (req: Request, res: Response, next: NextFunction) => {
    let bodyToValidate = req.body ?? {};

    // Handle multipart/form-data where JSON is sent as a field named "data"
    // e.g. formData.append("data", JSON.stringify(payload))
    // Multer may also include trailing whitespace in field names, so we trim.
    const dataKey = Object.keys(req.body || {}).find(
      (key) => key.trim() === "data",
    );

    if (dataKey && typeof req.body[dataKey] === "string") {
      try {
        bodyToValidate = JSON.parse(req.body[dataKey]);
      } catch {
        // Not valid JSON — fall through and validate the raw body as-is
      }
    }

    if (bodyToValidate === undefined || bodyToValidate === null) {
      bodyToValidate = {};
    }

    console.log("Body to validate:", bodyToValidate);

    const parsedResult = zodSchema.safeParse(bodyToValidate);

    if (!parsedResult.success) {
      return next(parsedResult.error);
    }

    // Sanitize: only keep fields defined in the schema
    req.body = parsedResult.data;

    next();
  };
};
