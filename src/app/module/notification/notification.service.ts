import { prisma } from "../../lib/index.js";
import { AppError } from "../../errorHelpers/index.js";
import { getPaginationParams } from "../../shared/index.js";

export const getNotifications = async (userId: string, query: Record<string, unknown>) => {
  const { page, limit, skip } = getPaginationParams(query);
  const unreadOnly = query["unread"] === "true";

  const where = { userId, ...(unreadOnly ? { isRead: false } : {}) };

  const [items, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit), unreadCount };
};

export const markNotificationRead = async (userId: string, notificationId: string) => {
  const notif = await prisma.notification.findFirst({ where: { id: notificationId, userId } });
  if (!notif) throw new AppError("Notification not found", 404);
  return prisma.notification.update({ where: { id: notificationId }, data: { isRead: true } });
};

export const markAllNotificationsRead = async (userId: string) => {
  await prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
};

export const createNotification = async (data: { userId: string, type: string, title: string, message: string, link?: string }) => {
  return prisma.notification.create({ data });
};
