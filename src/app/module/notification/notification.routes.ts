import { Router } from "express";
import { authenticate } from "../../middleware/index.js";
import * as notificationController from "./notification.controller.js";

const router = Router();

router.use(authenticate);

router.get("/", notificationController.getNotifications);
router.patch("/read-all", notificationController.markAllRead);
router.patch("/:id/read", notificationController.markRead);

export default router;
