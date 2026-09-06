import { PrismaClient, Platform, LeadStatus, LeadQuality, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const agency = await prisma.agency.upsert({
    where: { id: "agency-buildthegrowth" },
    update: {},
    create: {
      id: "agency-buildthegrowth",
      name: "BuildTheGrowth",
      slug: "buildthegrowth",
      subscriptionStatus: "active",
    },
  });

  const adminPasswordHash = await bcrypt.hash("changeme123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@buildthegrowth.com" },
    update: {},
    create: {
      name: "Agency Admin",
      email: "admin@buildthegrowth.com",
      passwordHash: adminPasswordHash,
      role: Role.agency_admin,
      agencyId: agency.id,
    },
  });

  const clientsData = [
    { name: "Summit Dental Group", industry: "Healthcare / Dental" },
    { name: "Bluepeak Real Estate", industry: "Real Estate" },
  ];

  const clientUserPasswordHash = await bcrypt.hash("clientpass123", 10);

  for (const [i, c] of clientsData.entries()) {
    const client = await prisma.client.upsert({
      where: { id: `seed-client-${i + 1}` },
      update: {},
      create: {
        id: `seed-client-${i + 1}`,
        name: c.name,
        industry: c.industry,
        createdBy: admin.id,
        agencyId: agency.id,
      },
    });

    const clientEmail = `client${i + 1}@${client.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "")
      .slice(0, 20)}.com`;

    await prisma.user.upsert({
      where: { email: clientEmail },
      update: {},
      create: {
        name: `${c.name} Manager`,
        email: clientEmail,
        passwordHash: clientUserPasswordHash,
        role: Role.client_user,
        clientId: client.id,
        agencyId: agency.id,
      },
    });

    const leadSeeds = [
      {
        platform: Platform.meta,
        campaignName: "Spring Promo - Leads",
        adSetName: "Local Awareness 25-54",
        adName: "Carousel - Before/After",
        name: "Jordan Ellis",
        phone: "555-0101",
        email: "jordan.ellis@example.com",
        status: LeadStatus.New,
        quality: null,
      },
      {
        platform: Platform.google,
        campaignName: "Search - Branded",
        adSetName: "Exact Match Terms",
        adName: "RSA - Free Consultation",
        name: "Morgan Price",
        phone: "555-0102",
        email: "morgan.price@example.com",
        status: LeadStatus.Contacted,
        quality: LeadQuality.Warm,
      },
      {
        platform: Platform.meta,
        campaignName: "Retargeting - Website Visitors",
        adSetName: "30 Day Visitors",
        adName: "Single Image - Testimonial",
        name: "Casey Nguyen",
        phone: "555-0103",
        email: null,
        status: LeadStatus.Qualified,
        quality: LeadQuality.Hot,
      },
      {
        platform: Platform.google,
        campaignName: "Search - Non-Branded",
        adSetName: "Broad Match Services",
        adName: "RSA - Same Day Appointments",
        name: "Riley Thompson",
        phone: "555-0104",
        email: "riley.thompson@example.com",
        status: LeadStatus.Lost,
        quality: LeadQuality.Cold,
      },
    ];

    for (const [j, lead] of leadSeeds.entries()) {
      await prisma.lead.upsert({
        where: { id: `seed-lead-${i + 1}-${j + 1}` },
        update: {},
        create: {
          id: `seed-lead-${i + 1}-${j + 1}`,
          clientId: client.id,
          platform: lead.platform,
          campaignName: lead.campaignName,
          adSetName: lead.adSetName,
          adName: lead.adName,
          name: lead.name,
          phone: lead.phone,
          email: lead.email,
          status: lead.status,
          quality: lead.quality,
        },
      });
    }
  }

  console.log("Seed complete.");
  console.log("Agency admin login: admin@buildthegrowth.com / changeme123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
