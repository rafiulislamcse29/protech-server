import bcrypt from "bcryptjs";
import { prisma } from "../src/app/lib/index";
import { propertiesData } from "../MockData/propertiesData";
import { mediaData } from "../MockData/mediaData";

async function main() {
  console.log("🌱 Starting database seeding...");

  const adminEmail = "admin@proptech.ai";
  const agentEmail = "agent@proptech.ai";

  // --- 1. SUPER ADMIN SEEDING ---
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    console.log("Creating Super Admin...");
    const hashedPassword = await bcrypt.hash("admin123", 10);

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: adminEmail,
          password: hashedPassword,
          name: "Super Admin",
          role: "SUPER_ADMIN",
        },
      });

      await tx.admin.create({
        data: {
          userId: user.id,
          name: "Super Admin",
          email: adminEmail,
          department: "Management",
          accessLevel: 5,
          permissions: ["ALL"],
        },
      });
    });
    console.log(`✅ Super Admin created: ${adminEmail}`);
  } else {
    console.log("ℹ️ Super Admin already exists.");
  }

  // --- 2. AGENT & PROPERTIES SEEDING ---
  let agent = await prisma.agent.findUnique({
    where: { email: agentEmail },
  });

  if (!agent) {
    console.log("Creating Agent and seeding properties...");
    const hashedPassword = await bcrypt.hash("agent123", 10);

    agent = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: agentEmail,
          password: hashedPassword,
          name: "Test Agent",
          role: "AGENT",
        },
      });

      return await tx.agent.create({
        data: {
          userId: user.id,
          name: "Test Agent",
          email: agentEmail,
          phone: "+1234567890",
          licenseNumber: "TEST123",
          experienceYears: 5,
          specialties: ["Residential", "Commercial"],
          bio: "Experienced real estate agent specializing in property marketing.",
        },
      });
    });
    console.log(`✅ Agent created: ${agentEmail}`);
  }

  // --- 3. SEED PROPERTIES ---
  // We check if properties already exist to prevent duplicates if you run seed multiple times
  const properties = await prisma.property.findMany({ where: { agentId: agent!.id } });

  if (properties.length >= 0) {
    console.log("Deleted property")
    await prisma.property.deleteMany({ where: { agentId: agent!.id } });
    await prisma.media.deleteMany({ where: { propertyId: properties[0].id } });
    console.log(`Seeding ${propertiesData.length} properties...`);

    for (const property of propertiesData) {
      const createdProperty = await prisma.property.create({
        data: {
          ...property,
          agentId: agent!.id,
          // 3. Create the media at the same time as the property!
          media: {
            create: mediaData.map((media) => ({
              url: media.url,
              type: media.type,
              order: media.order,
              altText: `${media.altText} - ${property.title}`,
            })),
          },
        },
      });
      console.log(`Created property ${createdProperty.id}`);
    }
    console.log(`✅ Created ${propertiesData.length} properties with media.`);
  } else {
    console.log("ℹ️ Properties already exist, skipping property seed.");
  }

  console.log("✨ Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });