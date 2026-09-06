"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAgencyAdmin } from "@/lib/session";
import { formatStatusLabel } from "@/lib/utils";

async function requireOwnedLead(leadId: string, agencyId: string) {
  const lead = await prisma.lead.findFirst({
    where: { id: leadId, client: { agencyId } },
  });
  if (!lead) {
    throw new Error("Lead not found.");
  }
  return lead;
}

export async function updateLeadStatus(leadId: string, status: string) {
  const session = await requireAgencyAdmin();
  const lead = await requireOwnedLead(leadId, session.user.agencyId!);
  if (lead.status === status) return;

  await prisma.$transaction([
    prisma.lead.update({
      where: { id: leadId },
      data: { status: status as any },
    }),
    prisma.activityLog.create({
      data: {
        leadId,
        userId: session.user.id,
        action: `Status changed from ${formatStatusLabel(lead.status)} to ${formatStatusLabel(status)}`,
      },
    }),
  ]);

  revalidatePath("/admin/leads");
  revalidatePath(`/admin/clients/${lead.clientId}`);
}

export async function updateLeadQuality(leadId: string, quality: string) {
  const session = await requireAgencyAdmin();
  const lead = await requireOwnedLead(leadId, session.user.agencyId!);

  const nextQuality = quality === "" ? null : quality;
  if (lead.quality === nextQuality) return;

  await prisma.$transaction([
    prisma.lead.update({
      where: { id: leadId },
      data: { quality: nextQuality as any },
    }),
    prisma.activityLog.create({
      data: {
        leadId,
        userId: session.user.id,
        action: `Quality changed to ${nextQuality ?? "unset"}`,
      },
    }),
  ]);

  revalidatePath("/admin/leads");
  revalidatePath(`/admin/clients/${lead.clientId}`);
}

export async function assignLead(leadId: string, userId: string) {
  const session = await requireAgencyAdmin();
  const lead = await requireOwnedLead(leadId, session.user.agencyId!);

  const nextAssignee = userId === "" ? null : userId;

  if (nextAssignee) {
    const assignee = await prisma.user.findFirst({
      where: { id: nextAssignee, agencyId: session.user.agencyId!, role: "agency_admin" },
    });
    if (!assignee) {
      throw new Error("Assignee not found.");
    }
  }

  await prisma.$transaction([
    prisma.lead.update({
      where: { id: leadId },
      data: { assignedTo: nextAssignee },
    }),
    prisma.activityLog.create({
      data: {
        leadId,
        userId: session.user.id,
        action: nextAssignee ? "Lead reassigned" : "Lead unassigned",
      },
    }),
  ]);

  revalidatePath("/admin/leads");
  revalidatePath(`/admin/clients/${lead.clientId}`);
}
