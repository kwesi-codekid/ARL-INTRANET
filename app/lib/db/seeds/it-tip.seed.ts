/**
 * IT Tip Seed Data
 */

import { ITTip } from "~/lib/db/models/it-tip.server";
import { AdminUser } from "~/lib/db/models/admin-user.server";

export async function seedITTips() {
  const existingCount = await ITTip.countDocuments();
  if (existingCount > 0) {
    console.log("IT tips already seeded, skipping...");
    return;
  }

  // Get the first admin user for createdBy
  const admin = await AdminUser.findOne();
  if (!admin) {
    console.log("No admin user found, skipping IT tips seeding...");
    return;
  }

  const tips = [
    {
      title: "Strong Passwords",
      content: "Use at least 12 characters with a mix of uppercase, lowercase, numbers, and symbols. Never reuse passwords across different accounts.",
      category: "security",
      icon: "shield",
      isPinned: true,
      order: 0,
      createdBy: admin._id,
    },
    {
      title: "Lock Your Screen",
      content: "Press Win+L (Windows) or Ctrl+Cmd+Q (Mac) to lock your computer when stepping away. This prevents unauthorized access.",
      category: "shortcuts",
      icon: "keyboard",
      isPinned: false,
      order: 1,
      createdBy: admin._id,
    },
    {
      title: "Phishing Awareness",
      content: "Never click links in unexpected emails. Verify sender addresses and hover over links before clicking. Report suspicious emails to IT.",
      category: "security",
      icon: "shield",
      isPinned: true,
      order: 2,
      createdBy: admin._id,
    },
    {
      title: "Save Frequently",
      content: "Use Ctrl+S (Cmd+S on Mac) frequently to save your work. Enable auto-save in applications when available.",
      category: "productivity",
      icon: "zap",
      isPinned: false,
      order: 3,
      createdBy: admin._id,
    },
    {
      title: "IT Help Desk",
      content: "For IT support, call Extension 100 or email ithelp@adamusresources.com. Have your employee ID ready for faster assistance.",
      category: "general",
      icon: "help-circle",
      isPinned: false,
      order: 4,
      createdBy: admin._id,
    },
  ];

  await ITTip.insertMany(tips);
  console.log(`Seeded ${tips.length} IT tips`);
}
