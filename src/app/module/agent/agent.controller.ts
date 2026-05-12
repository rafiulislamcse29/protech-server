import { Response } from "express";
import { AuthRequest } from "../../interfaces/index.js";
import { catchAsync } from "../../errorHelpers/index.js";
import { sendResponse, param } from "../../shared/index.js";
import * as agentService from "./agent.service.js";

export const createAgentProfile = catchAsync(async (req: AuthRequest, res: Response) => {
  const agent = await agentService.createAgentProfile(req.user!.userId, req.body);
  sendResponse({ res, statusCode: 201, success: true, message: "Agent profile created", data: agent });
});

export const getMyAgentProfile = catchAsync(async (req: AuthRequest, res: Response) => {
  const agent = await agentService.getMyAgentProfile(req.user!.userId);
  sendResponse({ res, statusCode: 200, success: true, message: "Agent profile fetched", data: agent });
});

export const updateAgentProfile = catchAsync(async (req: AuthRequest, res: Response) => {
  const agent = await agentService.updateAgentProfile(req.user!.userId, req.body);
  sendResponse({ res, statusCode: 200, success: true, message: "Agent profile updated", data: agent });
});

export const getAgentById = catchAsync(async (req: AuthRequest, res: Response) => {
  const agent = await agentService.getAgentProfile(param(req.params["agentId"]));
  sendResponse({ res, statusCode: 200, success: true, message: "Agent fetched", data: agent });
});

export const getAllAgents = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await agentService.getAllAgents(req.query as Record<string, unknown>);
  sendResponse({
    res, statusCode: 200, success: true, message: "Agents fetched",
    data: result.items,
    meta: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages },
  });
});

// export const getAgentInquiries = catchAsync(async (req: AuthRequest, res: Response) => {
//   const result = await agentService.getAgentInquiries(req.user!.userId, req.query as Record<string, unknown>);
//   sendResponse({
//     res, statusCode: 200, success: true, message: "Inquiries fetched",
//     data: result.items,
//     meta: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages },
//   });
// });

// export const updateInquiryStatus = catchAsync(async (req: AuthRequest, res: Response) => {
//   const inquiry = await agentService.updateInquiryStatus(
//     req.user!.userId,
//     param(req.params["inquiryId"]),
//     req.body.status,
//   );
//   sendResponse({ res, statusCode: 200, success: true, message: "Inquiry status updated", data: inquiry });
// });

export const getAgentStats = catchAsync(async (req: AuthRequest, res: Response) => {
  const stats = await agentService.getAgentStats(req.user!.userId);
  sendResponse({ res, statusCode: 200, success: true, message: "Agent stats fetched", data: stats });
});
