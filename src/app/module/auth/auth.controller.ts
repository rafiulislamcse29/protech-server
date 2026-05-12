import { Response, NextFunction } from "express";
import { AuthRequest } from "../../interfaces/index.js";
import { catchAsync } from "../../errorHelpers/index.js";
import { sendResponse } from "../../shared/index.js";
import * as authService from "./auth.service.js";

export const seedAdmin = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await authService.seedSuperAdmin(req.body);
  sendResponse({
    res,
    statusCode: 201,
    success: true,
    message: "Super Admin seeded successfully",
    data: result,
  });
});

export const register = catchAsync(async (req: AuthRequest, res: Response) => {
  const user = await authService.registerUser(req.body);
  sendResponse({
    res,
    statusCode: 201,
    success: true,
    message: "Registration successful",
    data: user,
  });
});

export const login = catchAsync(async (req: AuthRequest, res: Response) => {
  const { accessToken, refreshToken, user } = await authService.loginUser(
    req.body,
    req.ip,
    req.headers["user-agent"],
  );


  // Example change in auth.controller.ts
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env["NODE_ENV"] === "production",
    sameSite: "strict",
    maxAge: 3 * 24 * 60 * 60 * 1000,
  });


  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env["NODE_ENV"] === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  sendResponse({
    res,
    statusCode: 200,
    success: true,
    message: "Login successful",
    data: { accessToken, refreshToken, user },
  });
});

export const refresh = catchAsync(async (req: AuthRequest, res: Response) => {
  const token = req?.body?.refreshToken || req.cookies?.["refreshToken"];
  const { accessToken, refreshToken } = await authService.refreshAccessToken(token);

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env["NODE_ENV"] === "production",
    sameSite: "strict",
    maxAge: 15 * 60 * 1000,
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env["NODE_ENV"] === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  sendResponse({
    res,
    statusCode: 200,
    success: true,
    message: "Token refreshed",
    data: { accessToken, refreshToken },
  });
});

export const logout = catchAsync(async (req: AuthRequest, res: Response) => {
  const token = req?.body?.refreshToken || req.cookies?.["refreshToken"];
  await authService.logoutUser(token);
  res.clearCookie("refreshToken");
  sendResponse({
    res,
    statusCode: 200,
    success: true,
    message: "Logged out successfully",
  });
});

export const logoutAll = catchAsync(async (req: AuthRequest, res: Response) => {
  await authService.logoutAllSessions(req.user!.userId);
  res.clearCookie("refreshToken");
  sendResponse({
    res,
    statusCode: 200,
    success: true,
    message: "All sessions terminated",
  });
});

export const changePassword = catchAsync(
  async (req: AuthRequest, res: Response) => {
    await authService.changePassword(req.user!.userId, req.body);
    res.clearCookie("refreshToken");
    sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: "Password changed successfully",
    });
  },
);

export const getMe = catchAsync(async (req: AuthRequest, res: Response) => {
  const user = await authService.getMe(req.user!.userId);
  sendResponse({
    res,
    statusCode: 200,
    success: true,
    message: "Profile fetched",
    data: user,
  });
});
