/**
 * PSI Talks Seed Script
 * Task: 1.2.1 Testing
 *
 * Run with: npx tsx app/lib/db/seeds/toolbox-talks.seed.ts
 */

import mongoose from "mongoose";
import { ToolboxTalk } from "../models/toolbox-talk.server";
import { AdminUser } from "../models/admin-user.server";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/arl_intranet";

const toolboxTalks = [
  {
    title: "Proper Use of Personal Protective Equipment (PPE)",
    slug: "proper-use-of-ppe",
    content: `<p>Today's PSI talk focuses on the importance of wearing and maintaining your Personal Protective Equipment (PPE) correctly.</p>
<h3>Key Points:</h3>
<ul>
<li><strong>Hard Hats:</strong> Always wear your hard hat in designated areas. Check for cracks or damage before each use.</li>
<li><strong>Safety Glasses:</strong> Protect your eyes from dust, debris, and chemical splashes.</li>
<li><strong>High-Visibility Vests:</strong> Ensure you're visible to vehicle operators and equipment.</li>
<li><strong>Steel-Toed Boots:</strong> Protect your feet from falling objects and crushing hazards.</li>
<li><strong>Gloves:</strong> Use appropriate gloves for the task - chemical resistant, cut resistant, or general purpose.</li>
</ul>
<h3>Remember:</h3>
<p>PPE is your last line of defense. Always inspect your equipment before use and report any damage immediately.</p>`,
    summary: "Learn about the proper use and maintenance of Personal Protective Equipment to stay safe on the job.",
    scheduledDate: new Date(), // Today
    status: "published" as const,
    tags: ["PPE", "Safety", "Equipment"],
    views: 45,
  },
  {
    title: "Heat Stress Prevention in the Mining Environment",
    slug: "heat-stress-prevention",
    content: `<p>Working in Ghana's climate means we need to be extra vigilant about heat-related illnesses.</p>
<h3>Signs of Heat Stress:</h3>
<ul>
<li>Heavy sweating</li>
<li>Weakness or fatigue</li>
<li>Dizziness or confusion</li>
<li>Nausea</li>
<li>Rapid heartbeat</li>
</ul>
<h3>Prevention Tips:</h3>
<ul>
<li><strong>Hydrate:</strong> Drink water every 15-20 minutes, even if you're not thirsty.</li>
<li><strong>Take Breaks:</strong> Rest in shaded or air-conditioned areas.</li>
<li><strong>Wear Light Clothing:</strong> When possible, wear loose-fitting, light-colored clothes.</li>
<li><strong>Know Your Limits:</strong> Report any symptoms immediately to your supervisor.</li>
</ul>`,
    summary: "Stay safe in hot conditions - learn to recognize and prevent heat stress symptoms.",
    scheduledDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
    status: "published" as const,
    tags: ["Heat Safety", "Health", "Hydration"],
    views: 67,
  },
  {
    title: "Hazard Identification and Reporting",
    slug: "hazard-identification-reporting",
    content: `<p>Every employee plays a crucial role in identifying and reporting hazards before they cause incidents.</p>
<h3>Types of Hazards to Look For:</h3>
<ul>
<li><strong>Physical:</strong> Wet floors, blocked exits, damaged equipment</li>
<li><strong>Chemical:</strong> Spills, improper storage, missing labels</li>
<li><strong>Electrical:</strong> Exposed wires, overloaded outlets, damaged cords</li>
<li><strong>Ergonomic:</strong> Poor lifting techniques, repetitive motions</li>
</ul>
<h3>How to Report:</h3>
<ol>
<li>Stop work if there's immediate danger</li>
<li>Notify your supervisor immediately</li>
<li>Complete a hazard report form</li>
<li>Follow up to ensure the hazard is addressed</li>
</ol>
<p><strong>Remember:</strong> No report is too small. Early identification prevents accidents!</p>`,
    summary: "Learn how to identify workplace hazards and the proper procedures for reporting them.",
    scheduledDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    status: "published" as const,
    tags: ["Hazards", "Reporting", "Safety Culture"],
    views: 89,
  },
  {
    title: "Vehicle Safety and Right of Way Rules",
    slug: "vehicle-safety-right-of-way",
    content: `<p>Mining sites have heavy vehicle traffic. Understanding right-of-way rules keeps everyone safe.</p>
<h3>Golden Rules:</h3>
<ul>
<li>Loaded haul trucks ALWAYS have right of way</li>
<li>Pedestrians must use designated walkways</li>
<li>Make eye contact with operators before crossing</li>
<li>Never assume a driver can see you</li>
</ul>
<h3>For Vehicle Operators:</h3>
<ul>
<li>Always perform pre-start checks</li>
<li>Sound horn at intersections</li>
<li>Maintain safe following distances</li>
<li>Never exceed speed limits</li>
</ul>`,
    summary: "Essential vehicle safety rules and right-of-way procedures for the mine site.",
    scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    status: "published" as const,
    tags: ["Vehicles", "Traffic Safety", "Right of Way"],
    views: 23,
  },
  {
    title: "Emergency Evacuation Procedures",
    slug: "emergency-evacuation-procedures",
    content: `<p>Being prepared for emergencies can save lives. Review our evacuation procedures.</p>
<h3>When You Hear the Alarm:</h3>
<ol>
<li>Stop work immediately</li>
<li>Secure any hazardous materials if safe to do so</li>
<li>Proceed to your designated assembly point</li>
<li>Do NOT use elevators</li>
<li>Report to your supervisor for headcount</li>
</ol>
<h3>Assembly Points:</h3>
<p>Know your designated assembly point. Check the emergency maps posted in your work area.</p>
<h3>Important:</h3>
<p>Never re-enter the building until the all-clear is given by emergency response team.</p>`,
    summary: "Know what to do in an emergency - review evacuation procedures and assembly points.",
    scheduledDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    status: "published" as const,
    tags: ["Emergency", "Evacuation", "Procedures"],
    views: 112,
  },
];

async function seedToolboxTalks() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    // Get an admin user to use as author
    let author = await AdminUser.findOne({ role: "superadmin" });

    if (!author) {
      console.log("No admin user found, creating one...");
      author = await AdminUser.create({
        phone: "233241234567",
        name: "Super Admin",
        role: "superadmin",
        isActive: true,
      });
    }

    console.log(`Using author: ${author.name}`);
    console.log("Seeding PSI talks...");

    for (const talkData of toolboxTalks) {
      const existing = await ToolboxTalk.findOne({ slug: talkData.slug });

      if (existing) {
        console.log(`PSI talk "${talkData.title}" already exists, updating...`);
        await ToolboxTalk.updateOne({ slug: talkData.slug }, { ...talkData, author: author._id });
        continue;
      }

      await ToolboxTalk.create({
        ...talkData,
        author: author._id,
      });
      console.log(`Created PSI talk: ${talkData.title}`);
    }

    console.log("PSI talks seeding completed!");
  } catch (error) {
    console.error("Error seeding PSI talks:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

// Run if executed directly
seedToolboxTalks();
