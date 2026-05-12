import { Router } from "express";
import {
  authenticate,
  authorize,
  uploadPropertyMedia,
} from "../../middleware/index.js";
import {
  createPropertySchema,
  updatePropertySchema,
  addMediaSchema,
  createInquirySchema,
  createReviewSchema,
} from "./property.validation.js";
import * as propertyController from "./property.controller.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { multerUpload } from "@/app/config/multer.config.js";

const router = Router();

// ─── Public Routes ────────────────────────────────────────────────────────────

// GET  /api/properties
router.get("/", propertyController.getProperties);

// GET  /api/properties/neighborhood/:zip
router.get("/neighborhood/:zip", propertyController.getNeighborhood);

// GET  /api/properties/:propertyId
router.get("/:propertyId", propertyController.getPropertyById);

// GET  /api/properties/:propertyId/similar
router.get("/:propertyId/similar", propertyController.getSimilarProperties);

// ─── Agent Routes ─────────────────────────────────────────────────────────────

// GET  /api/properties/my/listings
router.get(
  "/my/listings",
  authenticate,
  authorize("AGENT"),
  propertyController.getMyListings,
);

// POST /api/properties
router.post(
  "/",
  authenticate,
  authorize("AGENT"),
  validateRequest(createPropertySchema),
  propertyController.createProperty,
);

// PUT  /api/properties/:propertyId
router.put(
  "/:propertyId",
  authenticate,
  authorize("AGENT"),
  validateRequest(updatePropertySchema),
  propertyController.updateProperty,
);

// DELETE /api/properties/:propertyId
router.delete(
  "/:propertyId",
  authenticate,
  authorize("AGENT"),
  propertyController.deleteProperty,
);

// POST /api/properties/:propertyId/media
router.post(
  "/:propertyId/media",
  multerUpload.single('file'),
  authenticate,
  authorize("AGENT"),
  validateRequest(addMediaSchema),
  propertyController.addMedia,
);

// POST /api/properties/:propertyId/media/upload
router.post(
  "/:propertyId/media/upload",
  authenticate,
  authorize("AGENT"),
  uploadPropertyMedia,
  propertyController.uploadMedia,
);

// DELETE /api/properties/media/:mediaId
router.delete(
  "/media/:mediaId",
  authenticate,
  authorize("AGENT"),
  propertyController.deleteMedia,
);

// ─── Buyer Routes ─────────────────────────────────────────────────────────────

export default router;
