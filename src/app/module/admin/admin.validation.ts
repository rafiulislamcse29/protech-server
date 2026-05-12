import { z } from "zod";

export const approveAgentSchema = z.object({
  note: z.string().optional(),
});

export const rejectAgentSchema = z.object({
  reason: z.string().min(1, "Rejection reason is required"),
});

export type ApproveAgentInput = z.infer<typeof approveAgentSchema>;
export type RejectAgentInput = z.infer<typeof rejectAgentSchema>;
