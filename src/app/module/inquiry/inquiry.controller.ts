import { Response } from "express";
import { AuthRequest } from "../../interfaces/index.js";
import { catchAsync } from "../../errorHelpers/index.js";
import { sendResponse } from "../../shared/index.js";
import * as inquiryService from "./inquiry.service.js";

export const createInquiry = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const result = await inquiryService.createInquiry(
      req.user!.userId,
      req.body,
    );
    sendResponse({
      res,
      statusCode: 201,
      success: true,
      message: "Inquiry sent successfully",
      data: result,
    });
  },
);

export const getAgentInquiries = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const result = await inquiryService.getAgentInquiries(
      req.user!.userId,
      req.query as Record<string, unknown>,
    );
    sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: "Inquiries fetched",
      data: result.items,
      meta: { ...result, items: undefined },
    });
  },
);

export const getMyInquiries = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const result = await inquiryService.getBuyerInquiries(
      req.user!.userId,
      req.query as Record<string, unknown>,
    );
    sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: "Your inquiries fetched",
      data: result.items,
      meta: { ...result, items: undefined },
    });
  },
);

export const updateInquiryStatus = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const result = await inquiryService.updateInquiryStatus(
      req.user!.userId,
      req.params["inquiryId"] as string,
      req.body.status,
    );
    sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: "Inquiry status updated",
      data: result,
    });
  },
);
