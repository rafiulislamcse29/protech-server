import { Response } from "express";
import { AuthRequest } from "../../interfaces/index.js";
import { catchAsync } from "../../errorHelpers/index.js";
import { sendResponse } from "../../shared/index.js";
import * as notificationService from "./notification.service.js";

export const getNotifications = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await notificationService.getNotifications(req.user!.userId, req.query as Record<string, unknown>);
  sendResponse({ res, statusCode: 200, success: true, message: "Notifications fetched", data: result.items, meta: { ...result, items: undefined } });
});

export const markRead = catchAsync(async (req: AuthRequest, res: Response) => {
  await notificationService.markNotificationRead(req.user!.userId, req.params["id"] as string);
  sendResponse({ res, statusCode: 200, success: true, message: "Notification marked as read" });
});

export const markAllRead = catchAsync(async (req: AuthRequest, res: Response) => {
  await notificationService.markAllNotificationsRead(req.user!.userId);
  sendResponse({ res, statusCode: 200, success: true, message: "All notifications marked as read" });
});
