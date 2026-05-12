import { Response } from "express";
import { AuthRequest } from "../../interfaces/index.js";
import { catchAsync } from "../../errorHelpers/index.js";
import { sendResponse } from "../../shared/index.js";
import * as aiService from "./ai.service.js";

// ─── Feature 1: Natural Language Search ──────────────────────────────────────
export const naturalLanguageSearch = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const result = await aiService.naturalLanguageSearch(req.body);
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
        tokensUsed: result.tokensUsed,
      },
    });
  },
);

// ─── Feature 2: Property Description Generator ───────────────────────────────
export const generateDescription = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const result = await aiService.generatePropertyDescription(
      req.user!.userId,
      req.user!.role,
      req.body,
    );
    console.log("Generated Description:", result);
    sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: "Property description generated successfully",
      data: result,
    });
  },
);

// ─── Feature 3: AI Recommendations ───────────────────────────────────────────
export const getRecommendations = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const limit = Number(req.query["limit"]) || 6;
    const result = await aiService.generateRecommendations(req.user!.userId, {
      limit,
    });
    sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: `Found ${result.recommendations.length} personalized recommendations`,
      data: {
        profile: result.profile,
        recommendations: result.recommendations,
        tokensUsed: result.tokensUsed,
      },
    });
  },
);

// ─── Feature 4: Neighborhood Analyzer ────────────────────────────────────────
export const analyzeNeighborhood = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const result = await aiService.analyzeNeighborhood(req.body);
    sendResponse({
      res,
      statusCode: 200,
      success: true,
      message:
        result.source === "cache"
          ? "Neighborhood report loaded from cache"
          : "Neighborhood analysis complete",
      data: result,
    });
  },
);

// ─── Feature 5: Mortgage Advisor ─────────────────────────────────────────────
export const getMortgageAdvice = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const result = await aiService.getMortgageAdvice(req.body);
    sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: "Mortgage analysis complete",
      data: result,
    });
  },
);
