/**
 * Executive Message Seed Data
 */

import { ExecutiveMessage } from "~/lib/db/models/executive-message.server";
import { AdminUser } from "~/lib/db/models/admin-user.server";

export async function seedExecutiveMessages() {
  const existingCount = await ExecutiveMessage.countDocuments();
  if (existingCount > 0) {
    console.log("Executive messages already seeded, skipping...");
    return;
  }

  // Get the first admin user for createdBy
  const admin = await AdminUser.findOne();
  if (!admin) {
    console.log("No admin user found, skipping executive messages seeding...");
    return;
  }

  const messages = [
    {
      name: "Angela List",
      title: "CEO, Nguvu Mining Limited",
      photo: "/images/ceo.jpg",
      message: "Together, we are building a safer, stronger, and more connected workplace. This platform is your hub for staying informed, engaged, and part of our mining family. Safety first, always.",
      isActive: true,
      order: 0,
      createdBy: admin._id,
    },
  ];

  await ExecutiveMessage.insertMany(messages);
  console.log(`Seeded ${messages.length} executive messages`);
}
