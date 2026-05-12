import AppError from "@/app/errorHelpers/AppError.js";
import { prisma } from "../../lib/index.js";
import { getPaginationParams } from "../../shared/index.js";
import { CreateAgentProfileInput, UpdateAgentProfileInput } from "./agent.validation.js";

export const createAgentProfile = async (userId: string, data: CreateAgentProfileInput) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError("User not found", 404);

  const existing = await prisma.agent.findUnique({ where: { userId } });
  if (existing) throw new AppError("Agent profile already exists", 409);

  // Create agent profile with PENDING status - requires admin approval
  const agent = await prisma.agent.create({
    data: {
      userId,
      licenseNumber: data.licenseNumber,
      specialties: data.specialties,
      bio: data.bio ?? null,
      phone: data.phone ?? null,
      experienceYears: data.experienceYears ?? null,
      name: data.name ?? null,
      email: data.email ?? null,
      status: "PENDING",
    },
  });

  // Note: User role is NOT changed to AGENT yet - requires admin approval

  return agent;
};

export const approveAgent = async (agentId: string, adminId: string, note?: string) => {
  const agent = await prisma.agent.findUnique({ where: { id: agentId } });
  if (!agent) throw new AppError("Agent not found", 404);
  if (agent.status !== "PENDING") throw new AppError("Agent is not in pending status", 400);

  const [updatedAgent] = await prisma.$transaction([
    prisma.agent.update({
      where: { id: agentId },
      data: {
        status: "APPROVED",
        reviewedBy: adminId,
        reviewedAt: new Date(),
        reviewNote: note ?? null,
      },
    }),
    prisma.user.update({
      where: { id: agent.userId },
      data: { role: "AGENT" },
    }),
  ]);

  // Notify user
  await prisma.notification.create({
    data: {
      userId: agent.userId,
      type: "SYSTEM_ALERT",
      title: "Agent Application Approved",
      message: "Your agent application has been approved. You can now list properties.",
      link: "/agent/dashboard",
    },
  });

  return updatedAgent;
};

export const rejectAgent = async (agentId: string, adminId: string, reason: string) => {
  const agent = await prisma.agent.findUnique({ where: { id: agentId } });
  if (!agent) throw new AppError("Agent not found", 404);
  if (agent.status !== "PENDING") throw new AppError("Agent is not in pending status", 400);

  const updatedAgent = await prisma.agent.update({
    where: { id: agentId },
    data: {
      status: "REJECTED",
      reviewedBy: adminId,
      reviewedAt: new Date(),
      reviewNote: reason,
    },
  });

  // Notify user
  await prisma.notification.create({
    data: {
      userId: agent.userId,
      type: "SYSTEM_ALERT",
      title: "Agent Application Rejected",
      message: `Your agent application was rejected. Reason: ${reason}`,
      link: "/profile",
    },
  });

  return updatedAgent;
};

export const getPendingAgents = async (query: Record<string, unknown>) => {
  const { page, limit, skip } = getPaginationParams(query);

  const [items, total] = await Promise.all([
    prisma.agent.findMany({
      where: { status: "PENDING" },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true, avatar: true, createdAt: true } },
      },
    }),
    prisma.agent.count({ where: { status: "PENDING" } }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const getAgentProfile = async (agentId: string) => {
  const agent = await prisma.agent.findUnique({
    where: { id: agentId, status: "APPROVED" },
    include: {
      user: { select: { name: true, email: true, avatar: true, createdAt: true } },
      properties: {
        where: { status: "AVAILABLE" },
        take: 6,
        include: { media: { where: { order: 1 }, take: 1 } },
      },
    },
  });
  if (!agent) throw new AppError("Agent not found", 404);
  return agent;
};

export const getMyAgentProfile = async (userId: string) => {
  const agent = await prisma.agent.findUnique({
    where: { userId },
    include: {
      user: { select: { name: true, email: true, avatar: true } },
    },
  });
  if (!agent) throw new AppError("Agent profile not found", 404);
  return agent;
};

export const updateAgentProfile = async (userId: string, data: UpdateAgentProfileInput) => {
  const agent = await prisma.agent.findUnique({ where: { userId } });
  if (!agent) throw new AppError("Agent profile not found", 404);
  if (agent.status !== "APPROVED") throw new AppError("Agent profile is not approved yet", 403);

  const updateData = Object.fromEntries(
    Object.entries(data).filter(([_, v]) => v !== undefined)
  );

  return prisma.agent.update({ where: { userId }, data: updateData });
};

export const getAllAgents = async (query: Record<string, unknown>) => {
  const { page, limit, skip } = getPaginationParams(query);
  const specialty = query["specialty"] as string | undefined;

  // Only show approved agents publicly
  const where: any = { status: "APPROVED" };
  if (specialty) {
    where.specialties = { has: specialty };
  }

  const [items, total] = await Promise.all([
    prisma.agent.findMany({
      where,
      skip,
      take: limit,
      orderBy: { rating: "desc" },
      include: {
        user: { select: { name: true, email: true, avatar: true } },
        _count: { select: { properties: true } },
      },
    }),
    prisma.agent.count({ where }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const getAgentStats = async (userId: string) => {
  const agent = await prisma.agent.findUnique({ where: { userId } });
  if (!agent) throw new AppError("Agent profile not found", 404);
  if (agent.status !== "APPROVED") throw new AppError("Agent profile is not approved yet", 403);

  const [totalProperties, availableProperties, soldProperties, totalInquiries, pendingInquiries] =
    await Promise.all([
      prisma.property.count({ where: { agentId: agent.id } }),
      prisma.property.count({ where: { agentId: agent.id, status: "AVAILABLE" } }),
      prisma.property.count({ where: { agentId: agent.id, status: "SOLD" } }),
      prisma.inquiry.count({ where: { agentId: agent.id } }),
      prisma.inquiry.count({ where: { agentId: agent.id, status: "PENDING" } }),
    ]);

  return {
    totalProperties,
    availableProperties,
    soldProperties,
    totalInquiries,
    pendingInquiries,
    rating: agent.rating,
  };
};
