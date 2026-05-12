import { Router } from "express";
import {
  authenticate,
  uploadAvatar,
} from "../../middleware/index";
import {
  updateProfileSchema,
  updateSearchPreferenceSchema,
} from "./user.validation";
import * as userController from "./user.controller";
import { validateRequest } from "../../middleware/validateRequest";

const router = Router();

// All user routes require authentication
router.use(authenticate);

// GET  /api/users/profile
router.get("/profile", userController.getProfile);

// PUT  /api/users/profile
router.put(
  "/profile",
  validateRequest(updateProfileSchema),
  userController.updateProfile,
);

// POST /api/users/avatar
router.post("/avatar", uploadAvatar, userController.uploadAvatar);

// GET  /api/users/saved-properties
router.get("/saved-properties", userController.getSavedProperties);

// POST /api/users/saved-properties/:propertyId
router.post("/saved-properties/:propertyId", userController.saveProperty);

// DELETE /api/users/saved-properties/:propertyId
router.delete("/saved-properties/:propertyId", userController.unsaveProperty);

// GET  /api/users/search-preference
router.get("/search-preference", userController.getSearchPreference);

// PUT  /api/users/search-preference
router.put(
  "/search-preference",
  validateRequest(updateSearchPreferenceSchema),
  userController.upsertSearchPreference,
);

// GET  /api/users/recommendations
router.get("/recommendations", userController.getAIRecommendations);

export default router;
