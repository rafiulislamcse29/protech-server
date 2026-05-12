import AppError from "@/app/errorHelpers/AppError.js";
import { prisma } from "../../lib/index.js";
import { getPaginationParams } from "../../shared/index.js";
import * as agentService from "../agent/agent.service.js";

export const getDashboardStats = async () => {
  const [
    totalUsers,
    totalAgents,
    totalProperties,
    totalInquiries,
    activeListings,
    soldProperties,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.agent.count(),
    prisma.property.count(),
    prisma.inquiry.count(),
    prisma.property.count({ where: { status: "AVAILABLE" } }),
    prisma.property.count({ where: { status: "SOLD" } }),
  ]);

  return {
    totalUsers,
    totalAgents,
    totalProperties,
    totalInquiries,
    activeListings,
    soldProperties,
  };
};

export const getAllUsers = async (query: Record<string, unknown>) => {
  const { page, limit, skip } = getPaginationParams(query);
  const role = query["role"] as string | undefined;
  const search = query["search"] as string | undefined;

  const where = {
    ...(role
      ? { role: role as "BUYER" | "AGENT" | "ADMIN" | "SUPER_ADMIN" }
      : {}),
    ...(search
      ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        avatar: true,
        createdAt: true,
        _count: { select: { sessions: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const getUserById = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      agent: true,
      admin: true,
      _count: {
        select: { sessions: true, inquiries: true, savedProperties: true },
      },
    },
  });
  if (!user) throw new AppError("User not found", 404);
  const { password: _pw, ...safeUser } = user;
  return safeUser;
};

export const toggleUserStatus = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError("User not found", 404);

  return prisma.user.update({
    where: { id: userId },
    data: { isActive: !user.isActive },
    select: { id: true, isActive: true },
  });
};

export const deleteUser = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError("User not found", 404);
  await prisma.user.delete({ where: { id: userId } });
};

export const getAllProperties = async (query: Record<string, unknown>) => {
  const { page, limit, skip } = getPaginationParams(query);
  const status = query["status"] as string | undefined;

  const where = status
    ? { status: status as "AVAILABLE" | "PENDING" | "SOLD" | "RENTED" }
    : {};

  const [items, total] = await Promise.all([
    prisma.property.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        agent: { select: { name: true, email: true } },
        _count: { select: { media: true, inquiries: true, reviews: true } },
      },
    }),
    prisma.property.count({ where }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const deletePropertyAdmin = async (propertyId: string) => {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
  });
  if (!property) throw new AppError("Property not found", 404);
  await prisma.property.delete({ where: { id: propertyId } });
};

export const getAuditLogs = async (query: Record<string, unknown>) => {
  const { page, limit, skip } = getPaginationParams(query);
  const userId = query["userId"] as string | undefined;

  const where = userId ? { userId } : {};

  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const upsertNeighborhood = async (data: any) => {
  const payload = {
    zip: data.zip,
    name: data.name,
    city: data.city,
    safetyScore: data.safetyScore ? Math.floor(Number(data.safetyScore)) : null,
    schoolScore: data.schoolScore ? Math.floor(Number(data.schoolScore)) : null,
    transitScore: data.transitScore ? Math.floor(Number(data.transitScore)) : null,
    marketTrend: data.marketTrend || null,
    aiAnalysis: data.aiAnalysis || null,
    expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
  };

  return prisma.neighborhood.upsert({
    where: { zip: payload.zip },
    update: payload,
    create: payload,
  });
};

export const sendBroadcastNotification = async (data: {
  title: string;
  message: string;
  type:
  | "AI_RECOMMENDATION"
  | "NEW_INQUIRY"
  | "INQUIRY_REPLY"
  | "PRICE_DROP"
  | "SYSTEM_ALERT";
  link?: string;
  role?: "BUYER" | "AGENT" | "ADMIN" | "SUPER_ADMIN";
}) => {
  const users = await prisma.user.findMany({
    where: { isActive: true, ...(data.role ? { role: data.role } : {}) },
    select: { id: true },
  });

  const notifications = users.map((u) => ({
    userId: u.id,
    type: data.type,
    title: data.title,
    message: data.message,
    link: data.link ?? null,
  }));

  return prisma.notification.createMany({ data: notifications });
};

// Agent Approval Management
export const getPendingAgents = async (query: Record<string, unknown>) => {
  return agentService.getPendingAgents(query);
};

export const approveAgent = async (agentId: string, adminId: string, note?: string) => {
  return agentService.approveAgent(agentId, adminId, note);
};

export const rejectAgent = async (agentId: string, adminId: string, reason: string) => {
  return agentService.rejectAgent(agentId, adminId, reason);
};
