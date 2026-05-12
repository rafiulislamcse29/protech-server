import { Router } from "express";
import {
  authRoutes,
  userRoutes,
  agentRoutes,
  propertyRoutes,
  adminRoutes,
  aiRoutes,
  reviewRoutes,
  inquiryRoutes,
  notificationRoutes,
} from "../module";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/agents", agentRoutes);
router.use("/properties", propertyRoutes);
router.use("/admin", adminRoutes);
router.use("/ai", aiRoutes);
router.use("/reviews", reviewRoutes);
router.use("/inquiries", inquiryRoutes);
router.use("/notifications", notificationRoutes);

export default router;
