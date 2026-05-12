import { Router } from "express";
import { authenticate } from "../../middleware/index";
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
  seedAdminSchema,
} from "./auth.validation";
import * as authController from "./auth.controller";
import { validateRequest } from "../../middleware/validateRequest";

const router = Router();

// POST /api/auth/seed-super-admin
router.post(
  "/seed-super-admin",
  validateRequest(seedAdminSchema),
  authController.seedAdmin,
);

// POST /api/auth/register
router.post("/register", validateRequest(registerSchema), authController.register);

// POST /api/auth/login
router.post("/login", validateRequest(loginSchema), authController.login);

// POST /api/auth/refresh
router.post("/refresh", authController.refresh);

// POST /api/auth/logout
router.post("/logout", authController.logout);

// POST /api/auth/logout-all
router.post("/logout-all", authenticate, authController.logoutAll);

// PUT /api/auth/change-password
router.put(
  "/change-password",
  authenticate,
  validateRequest(changePasswordSchema),
  authController.changePassword,
);

// GET /api/auth/me
router.get("/me", authenticate, authController.getMe);

export default router;
