import status from "http-status";
import z from "zod";
import { TErrorResponse, TErrorSources } from "../interfaces/error.interface";

export const handleZodError = (err: z.ZodError): TErrorResponse => {
  const statusCode = status.BAD_REQUEST;

  const errorSources: TErrorSources[] = [];

  err.issues.forEach((issue) => {
    errorSources.push({
      path: issue.path.join(" => "),
      message: issue.message,
    });
  });

  const firstIssue = err.issues[0];
  const fieldName = firstIssue?.path?.length
    ? String(firstIssue.path[firstIssue.path.length - 1])
    : null;
  const message = fieldName
    ? `Invalid value for "${fieldName}": ${firstIssue?.message ?? ''}`
    : (firstIssue?.message ?? "Invalid request data");

  return {
    success: false,
    message,
    errorSources,
    statusCode,
  };
};
