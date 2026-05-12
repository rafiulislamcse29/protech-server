import AppError from "@/app/errorHelpers/AppError.js";
import { prisma } from "../../lib/index.js";
import { getPaginationParams } from "../../shared/index.js";
import { CreateInquiryInput } from "./inquiry.validation.js";


export const createInquiry = async (buyerId: string, data: CreateInquiryInput) => {
  const property = await prisma.property.findUnique({
    where: { id: data.propertyId },
    include: { agent: true },
  });
  if (!property) throw new AppError("Property not found", 404);

  const inquiry = await prisma.inquiry.create({
    data: {
      buyerId,
      agentId: property.agentId,
      propertyId: data.propertyId,
      message: data.message,
    },
    include: {
      property: { select: { title: true, address: true } },
      agent: { select: { name: true, email: true } },
    },
  });

  // Create notification for agent
  await prisma.notification.create({
    data: {
      userId: property.agent.userId,
      type: "NEW_INQUIRY",
      title: "New Inquiry",
      message: `You have a new inquiry for "${property.title}"`,
      link: `/properties/${data.propertyId}`,
    },
  });

  return inquiry;
};

export const getAgentInquiries = async (userId: string, query: Record<string, unknown>) => {
  const agent = await prisma.agent.findUnique({ where: { userId } });
  if (!agent) throw new AppError("Agent profile not found", 404);
  if (agent.status !== "APPROVED") throw new AppError("Agent profile is not approved yet", 403);

  const { page, limit, skip } = getPaginationParams(query);
  const status = query["status"] as any;

  const where = { agentId: agent.id, ...(status ? { status } : {}) };

  const [items, total] = await Promise.all([
    prisma.inquiry.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        buyer: { select: { name: true, email: true, avatar: true } },
        property: { select: { id: true, title: true, address: true } },
      },
    }),
    prisma.inquiry.count({ where }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const getBuyerInquiries = async (userId: string, query: Record<string, unknown>) => {
  const { page, limit, skip } = getPaginationParams(query);

  const [items, total] = await Promise.all([
    prisma.inquiry.findMany({
      where: { buyerId: userId },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        property: { select: { id: true, title: true, address: true } },
        agent: { select: { name: true, email: true, phone: true } },
      },
    }),
    prisma.inquiry.count({ where: { buyerId: userId } }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const updateInquiryStatus = async (
  userId: string,
  inquiryId: string,
  status: "PENDING" | "VIEWED" | "REPLIED" | "ARCHIVED"
) => {
  const agent = await prisma.agent.findUnique({ where: { userId } });
  if (!agent) throw new AppError("Agent profile not found", 404);
  if (agent.status !== "APPROVED") throw new AppError("Agent profile is not approved yet", 403);

  const inquiry = await prisma.inquiry.findFirst({ where: { id: inquiryId, agentId: agent.id } });
  if (!inquiry) throw new AppError("Inquiry not found", 404);

  return prisma.inquiry.update({ where: { id: inquiryId }, data: { status } });
};
