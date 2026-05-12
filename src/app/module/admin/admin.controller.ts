import { Response } from "express";
import { AuthRequest } from "../../interfaces/index.js";
import { catchAsync } from "../../errorHelpers/index.js";
import { sendResponse, param } from "../../shared/index.js";
import * as adminService from "./admin.service.js";

export const getDashboardStats = catchAsync(async (_req: AuthRequest, res: Response) => {
  const stats = await adminService.getDashboardStats();
  sendResponse({ res, statusCode: 200, success: true, message: "Dashboard stats fetched", data: stats });
});

export const getAllUsers = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await adminService.getAllUsers(req.query as Record<string, unknown>);
  sendResponse({
    res, statusCode: 200, success: true, message: "Users fetched",
    data: result.items,
    meta: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages },
  });
});

export const getUserById = catchAsync(async (req: AuthRequest, res: Response) => {
  const user = await adminService.getUserById(param(req.params["userId"]));
  sendResponse({ res, statusCode: 200, success: true, message: "User fetched", data: user });
});

export const toggleUserStatus = catchAsync(async (req: AuthRequest, res: Response) => {
  const user = await adminService.toggleUserStatus(param(req.params["userId"]));
  sendResponse({ res, statusCode: 200, success: true, message: "User status updated", data: user });
});

export const deleteUser = catchAsync(async (req: AuthRequest, res: Response) => {
  await adminService.deleteUser(param(req.params["userId"]));
  sendResponse({ res, statusCode: 200, success: true, message: "User deleted" });
});

export const getAllProperties = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await adminService.getAllProperties(req.query as Record<string, unknown>);
  sendResponse({
    res, statusCode: 200, success: true, message: "Properties fetched",
    data: result.items,
    meta: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages },
  });
});

export const deleteProperty = catchAsync(async (req: AuthRequest, res: Response) => {
  await adminService.deletePropertyAdmin(param(req.params["propertyId"]));
  sendResponse({ res, statusCode: 200, success: true, message: "Property deleted" });
});

export const getAuditLogs = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await adminService.getAuditLogs(req.query as Record<string, unknown>);
  sendResponse({
    res, statusCode: 200, success: true, message: "Audit logs fetched",
    data: result.items,
    meta: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages },
  });
});

export const upsertNeighborhood = catchAsync(async (req: AuthRequest, res: Response) => {
  const neighborhood = await adminService.upsertNeighborhood(req.body);
  sendResponse({ res, statusCode: 200, success: true, message: "Neighborhood data saved", data: neighborhood });
});

export const sendBroadcastNotification = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await adminService.sendBroadcastNotification(req.body);
  sendResponse({ res, statusCode: 200, success: true, message: "Notification broadcast sent", data: result });
});

// Agent Approval Management
export const getPendingAgents = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await adminService.getPendingAgents(req.query as Record<string, unknown>);
  sendResponse({
    res, statusCode: 200, success: true, message: "Pending agents fetched",
    data: result.items,
    meta: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages },
  });
});

export const approveAgent = catchAsync(async (req: AuthRequest, res: Response) => {
  const agent = await adminService.approveAgent(param(req.params["agentId"]), req.user!.userId, req.body.note);
  sendResponse({ res, statusCode: 200, success: true, message: "Agent approved successfully", data: agent });
});

export const rejectAgent = catchAsync(async (req: AuthRequest, res: Response) => {
  const agent = await adminService.rejectAgent(param(req.params["agentId"]), req.user!.userId, req.body.reason);
  sendResponse({ res, statusCode: 200, success: true, message: "Agent rejected", data: agent });
});
