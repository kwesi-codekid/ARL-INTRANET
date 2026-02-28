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
    // --- Security Tips ---
    {
      title: "Enable Two-Factor Authentication",
      content: "Turn on 2FA for your email and work accounts. It adds a second layer of protection even if your password is stolen.",
      category: "security",
      icon: "shield",
      isPinned: false,
      order: 5,
      createdBy: admin._id,
    },
    {
      title: "Don't Share Your Password",
      content: "Never share your password with anyone, including IT staff. IT will never ask for your password. If someone does, report it immediately.",
      category: "security",
      icon: "shield",
      isPinned: false,
      order: 6,
      createdBy: admin._id,
    },
    {
      title: "Be Careful with USB Drives",
      content: "Don't plug in unknown USB drives. They can carry viruses. Always scan USB drives with antivirus before opening files.",
      category: "security",
      icon: "shield",
      isPinned: false,
      order: 7,
      createdBy: admin._id,
    },
    {
      title: "Log Out of Shared Computers",
      content: "Always log out when you finish using a shared computer. Don't just close the browser — click Sign Out from your accounts.",
      category: "security",
      icon: "shield",
      isPinned: false,
      order: 8,
      createdBy: admin._id,
    },
    // --- Productivity Tips ---
    {
      title: "Use Ctrl+Z to Undo",
      content: "Made a mistake? Press Ctrl+Z to undo your last action. Works in most apps including Word, Excel, and browsers.",
      category: "productivity",
      icon: "zap",
      isPinned: false,
      order: 9,
      createdBy: admin._id,
    },
    {
      title: "Search Files Quickly",
      content: "Press Win+S to search for files, apps, or settings on your computer. Type what you need and it appears instantly.",
      category: "productivity",
      icon: "zap",
      isPinned: false,
      order: 10,
      createdBy: admin._id,
    },
    {
      title: "Pin Frequent Apps to Taskbar",
      content: "Right-click any app and select 'Pin to Taskbar' for quick access. Keep your most-used apps one click away.",
      category: "productivity",
      icon: "zap",
      isPinned: false,
      order: 11,
      createdBy: admin._id,
    },
    {
      title: "Use Snipping Tool for Screenshots",
      content: "Press Win+Shift+S to capture part of your screen. You can then paste it into emails, Word, or chat with Ctrl+V.",
      category: "productivity",
      icon: "zap",
      isPinned: false,
      order: 12,
      createdBy: admin._id,
    },
    {
      title: "Switch Between Open Windows",
      content: "Press Alt+Tab to quickly switch between open windows. Hold Alt and tap Tab to cycle through all your open apps.",
      category: "productivity",
      icon: "zap",
      isPinned: false,
      order: 13,
      createdBy: admin._id,
    },
    // --- Shortcuts Tips ---
    {
      title: "Copy, Cut, and Paste",
      content: "Ctrl+C copies, Ctrl+X cuts, and Ctrl+V pastes. These work everywhere — emails, documents, file explorer, and more.",
      category: "shortcuts",
      icon: "keyboard",
      isPinned: false,
      order: 14,
      createdBy: admin._id,
    },
    {
      title: "Select All Text",
      content: "Press Ctrl+A to select all text in a document or all files in a folder. Great for copying entire emails or documents.",
      category: "shortcuts",
      icon: "keyboard",
      isPinned: false,
      order: 15,
      createdBy: admin._id,
    },
    {
      title: "Open Task Manager",
      content: "Press Ctrl+Shift+Esc to open Task Manager. Use it to close frozen apps or check what's slowing down your computer.",
      category: "shortcuts",
      icon: "keyboard",
      isPinned: false,
      order: 16,
      createdBy: admin._id,
    },
    {
      title: "Zoom In and Out",
      content: "Hold Ctrl and scroll your mouse wheel to zoom in or out in browsers, PDFs, and documents. Press Ctrl+0 to reset zoom.",
      category: "shortcuts",
      icon: "keyboard",
      isPinned: false,
      order: 17,
      createdBy: admin._id,
    },
    // --- Software Tips ---
    {
      title: "Keep Software Updated",
      content: "Always install updates when prompted. Updates fix security holes and bugs. Restart your computer after updates to apply them.",
      category: "software",
      icon: "lightbulb",
      isPinned: false,
      order: 18,
      createdBy: admin._id,
    },
    {
      title: "Clear Browser Cache",
      content: "If a website isn't loading properly, press Ctrl+Shift+Delete in your browser to clear cached data, then refresh the page.",
      category: "software",
      icon: "lightbulb",
      isPinned: false,
      order: 19,
      createdBy: admin._id,
    },
    {
      title: "Use Bookmarks for Frequent Sites",
      content: "Press Ctrl+D to bookmark any webpage. Organise bookmarks into folders so you can find important sites quickly.",
      category: "software",
      icon: "lightbulb",
      isPinned: false,
      order: 20,
      createdBy: admin._id,
    },
    {
      title: "Recover Closed Browser Tabs",
      content: "Accidentally closed a tab? Press Ctrl+Shift+T to reopen the last closed tab. You can press it multiple times to restore more.",
      category: "software",
      icon: "lightbulb",
      isPinned: false,
      order: 21,
      createdBy: admin._id,
    },
    // --- Hardware Tips ---
    {
      title: "Restart Your Computer Weekly",
      content: "Restart your computer at least once a week. This clears temporary files, frees up memory, and keeps things running smoothly.",
      category: "hardware",
      icon: "lightbulb",
      isPinned: false,
      order: 22,
      createdBy: admin._id,
    },
    {
      title: "Don't Block Air Vents",
      content: "Keep your laptop or desktop vents clear of papers and dust. Blocked vents cause overheating which slows down your computer.",
      category: "hardware",
      icon: "lightbulb",
      isPinned: false,
      order: 23,
      createdBy: admin._id,
    },
    {
      title: "Charge Your Laptop Properly",
      content: "Don't let your laptop battery drain to 0% regularly. Plug in when it reaches 20% and unplug around 80% to extend battery life.",
      category: "hardware",
      icon: "lightbulb",
      isPinned: false,
      order: 24,
      createdBy: admin._id,
    },
    {
      title: "Keep Your Desk Cable-Free",
      content: "Use cable ties or clips to organise your desk cables. Tangled cables can cause tripping hazards and damage to equipment.",
      category: "hardware",
      icon: "lightbulb",
      isPinned: false,
      order: 25,
      createdBy: admin._id,
    },
    // --- General Tips ---
    {
      title: "Save Files to OneDrive",
      content: "Save important files to OneDrive or the shared network drive — not just your desktop. This ensures your files are backed up.",
      category: "general",
      icon: "help-circle",
      isPinned: false,
      order: 26,
      createdBy: admin._id,
    },
    {
      title: "Use Strong Wi-Fi Connections",
      content: "Always connect to the official company Wi-Fi. Avoid using public or unknown Wi-Fi networks for work — they are not secure.",
      category: "general",
      icon: "help-circle",
      isPinned: false,
      order: 27,
      createdBy: admin._id,
    },
    {
      title: "Name Files Clearly",
      content: "Use clear file names like 'Safety_Report_Jan2026.pdf' instead of 'Document1.pdf'. It saves time when searching for files later.",
      category: "general",
      icon: "help-circle",
      isPinned: false,
      order: 28,
      createdBy: admin._id,
    },
    {
      title: "Check Your Email Attachments",
      content: "Before sending an email, double-check that you've attached the right file. Review the recipient list to avoid sending to the wrong person.",
      category: "general",
      icon: "help-circle",
      isPinned: false,
      order: 29,
      createdBy: admin._id,
    },
  ];

  await ITTip.insertMany(tips);
  console.log(`Seeded ${tips.length} IT tips`);
}
