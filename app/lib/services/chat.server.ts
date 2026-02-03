/**
 * AI Chatbot Service
 * Task: 1.4.1 - Knowledge Base Chatbot (FAQ-based)
 *
 * This chatbot uses only the database (FAQs, contacts, news) to answer questions.
 * It does not use external AI to generate responses.
 */

import { connectDB } from "~/lib/db/connection.server";
import {
  ChatSession,
  ChatMessage,
  FAQ,
  type IChatMessage,
} from "~/lib/db/models/chat.server";
import { Contact } from "~/lib/db/models/contact.server";
import { News } from "~/lib/db/models/news.server";
import { AppLink } from "~/lib/db/models/app-link.server";

// Rate limiting
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_MESSAGES_PER_WINDOW = 10;
const sessionMessageCounts = new Map<string, { count: number; resetAt: number }>();

export function checkChatRateLimit(sessionId: string): boolean {
  const now = Date.now();
  const record = sessionMessageCounts.get(sessionId);

  if (!record || now > record.resetAt) {
    sessionMessageCounts.set(sessionId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (record.count >= MAX_MESSAGES_PER_WINDOW) {
    return false;
  }

  record.count++;
  return true;
}

// Create or get session
export async function getOrCreateSession(sessionId: string): Promise<string> {
  await connectDB();

  let session = await ChatSession.findOne({ sessionId });

  if (!session) {
    session = await ChatSession.create({ sessionId });
  } else {
    session.lastActivity = new Date();
    await session.save();
  }

  return session._id.toString();
}

// Get chat history for a session
export async function getChatHistory(
  sessionId: string,
  limit: number = 20
): Promise<IChatMessage[]> {
  await connectDB();

  const session = await ChatSession.findOne({ sessionId });
  if (!session) return [];

  return ChatMessage.find({ session: session._id })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}

// Search for matching FAQs from database
async function searchFAQs(query: string): Promise<{ question: string; answer: string }[]> {
  await connectDB();
  const queryLower = query.toLowerCase();
  const keywords = queryLower.split(' ').filter(w => w.length > 2);

  if (keywords.length === 0) return [];

  // Try text search first
  try {
    const faqs = await FAQ.find(
      { $text: { $search: query }, isActive: true },
      { score: { $meta: "textScore" } }
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(3)
      .lean();

    if (faqs.length > 0) {
      return faqs.map(f => ({ question: f.question, answer: f.answer }));
    }
  } catch {
    // Text index might not exist
  }

  // Escape special regex characters in keywords
  const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const safeKeywords = keywords.map(escapeRegex);
  const regexPattern = new RegExp(safeKeywords.join('|'), 'i');

  // Fallback: keyword and regex matching
  const faqs = await FAQ.find({
    isActive: true,
    $or: [
      { keywords: { $in: keywords } },
      { question: regexPattern },
      { answer: regexPattern }
    ]
  })
    .limit(3)
    .lean();

  return faqs.map(f => ({ question: f.question, answer: f.answer }));
}

// Search contacts specifically by position/job title
async function searchContactsByPosition(query: string): Promise<string | null> {
  await connectDB();

  const queryLower = query.toLowerCase().trim();

  // Skip very short queries or common words
  if (queryLower.length < 3) return null;
  const skipWords = ['the', 'and', 'for', 'what', 'how', 'where', 'when', 'why', 'can', 'does', 'will', 'about', 'arl', 'adamus'];
  if (skipWords.includes(queryLower)) return null;

  // Escape special regex characters
  const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Search by position - exact or partial match
  const positionRegex = new RegExp(escapeRegex(query), 'i');
  const contacts = await Contact.find({
    position: positionRegex,
    isActive: true
  })
    .populate('department', 'name')
    .limit(5)
    .lean();

  if (contacts.length > 0) {
    return formatContactsResponse(contacts, `Here's who holds the "${query}" position:`);
  }

  // Also try searching by name in case they typed a person's name
  const nameContacts = await Contact.find({
    name: positionRegex,
    isActive: true
  })
    .populate('department', 'name')
    .limit(5)
    .lean();

  if (nameContacts.length > 0) {
    return formatContactsResponse(nameContacts);
  }

  return null;
}

// Search for contacts from database
async function searchContacts(query: string): Promise<string | null> {
  await connectDB();
  const queryLower = query.toLowerCase();
  const searchTerms = query.split(' ').filter(t => t.length > 2);

  if (searchTerms.length === 0) return null;

  // Escape special regex characters
  const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Check for position-specific queries like "Who is the COO?" or "Who is the HR Manager?"
  const positionPatterns = [
    /who\s+is\s+(?:the\s+)?(.+?)(?:\?|$)/i,
    /who\s+holds\s+(?:the\s+)?(?:position\s+(?:of\s+)?)?(.+?)(?:\?|$)/i,
    /who\s+is\s+(?:our\s+)?(.+?)(?:\?|$)/i,
    /find\s+(?:the\s+)?(.+?)(?:\?|$)/i,
  ];

  for (const pattern of positionPatterns) {
    const match = queryLower.match(pattern);
    if (match) {
      const positionSearch = match[1].trim();
      // Search by position specifically
      const positionRegex = new RegExp(escapeRegex(positionSearch), 'i');
      const contacts = await Contact.find({
        $or: [
          { position: positionRegex },
          { name: positionRegex }
        ],
        isActive: true
      })
        .populate('department', 'name')
        .limit(5)
        .lean();

      if (contacts.length > 0) {
        return formatContactsResponse(contacts);
      }
    }
  }

  // Check for management queries
  if (queryLower.includes('management') || queryLower.includes('managers') || queryLower.includes('executives') || queryLower.includes('leadership')) {
    const contacts = await Contact.find({ isManagement: true, isActive: true })
      .populate('department', 'name')
      .sort({ position: 1 })
      .limit(10)
      .lean();

    if (contacts.length > 0) {
      return formatContactsResponse(contacts, "Here are the management team members:");
    }
  }

  // Check for department-specific queries
  const deptPatterns = [
    /(?:who\s+(?:works?\s+)?in|people\s+in|staff\s+in|contacts?\s+(?:in|for))\s+(?:the\s+)?(.+?)(?:\s+department)?(?:\?|$)/i,
    /(.+?)\s+(?:department\s+)?(?:staff|team|people|contacts?)(?:\?|$)/i,
  ];

  for (const pattern of deptPatterns) {
    const match = queryLower.match(pattern);
    if (match) {
      const deptSearch = match[1].trim();
      // First find matching department
      const { Department } = await import("~/lib/db/models/contact.server");
      const deptRegex = new RegExp(escapeRegex(deptSearch), 'i');
      const dept = await Department.findOne({ name: deptRegex, isActive: true }).lean();

      if (dept) {
        const contacts = await Contact.find({ department: dept._id, isActive: true })
          .populate('department', 'name')
          .sort({ isManagement: -1, name: 1 })
          .limit(10)
          .lean();

        if (contacts.length > 0) {
          return formatContactsResponse(contacts, `Here are the contacts in ${dept.name}:`);
        }
      }
    }
  }

  // Check for location-specific queries
  if (queryLower.includes('accra') || queryLower.includes('head office')) {
    const contacts = await Contact.find({ location: 'head-office', isActive: true })
      .populate('department', 'name')
      .sort({ isManagement: -1, name: 1 })
      .limit(10)
      .lean();

    if (contacts.length > 0) {
      return formatContactsResponse(contacts, "Here are the contacts at Head Office (Accra):");
    }
  }

  if (queryLower.includes('site') && (queryLower.includes('contact') || queryLower.includes('who') || queryLower.includes('staff'))) {
    const contacts = await Contact.find({ location: 'site', isActive: true })
      .populate('department', 'name')
      .sort({ isManagement: -1, name: 1 })
      .limit(10)
      .lean();

    if (contacts.length > 0) {
      return formatContactsResponse(contacts, "Here are some contacts at Site:");
    }
  }

  try {
    // Try text search first
    const contacts = await Contact.find(
      { $text: { $search: query }, isActive: true },
      { score: { $meta: "textScore" } }
    )
      .populate('department', 'name')
      .sort({ score: { $meta: "textScore" } })
      .limit(5)
      .lean();

    if (contacts.length > 0) {
      return formatContactsResponse(contacts);
    }
  } catch {
    // Fallback search
  }

  // Build regex patterns for each search term
  const contacts = await Contact.find({
    isActive: true,
    $or: searchTerms.map(term => {
      const regex = new RegExp(escapeRegex(term), 'i');
      return {
        $or: [
          { name: regex },
          { position: regex }
        ]
      };
    })
  })
    .populate('department', 'name')
    .limit(5)
    .lean();

  if (contacts.length > 0) {
    return formatContactsResponse(contacts);
  }

  return null;
}

function formatContactsResponse(contacts: any[], header?: string): string {
  const parts = [header || "Here are the contacts I found:"];
  contacts.forEach((contact, index) => {
    parts.push("");
    const name = contact.name || contact.fullName;
    const mgmtBadge = contact.isManagement ? " [Management]" : "";
    parts.push(`${index + 1}. ${name}${mgmtBadge}`);
    if (contact.position) parts.push(`   Position: ${contact.position}`);
    if (contact.department) {
      const deptName = typeof contact.department === 'object' ? contact.department.name : contact.department;
      if (deptName) parts.push(`   Department: ${deptName}`);
    }
    if (contact.location) {
      const locationLabel = contact.location === 'head-office' ? 'Head Office (Accra)' : 'Site';
      parts.push(`   Location: ${locationLabel}`);
    }
    if (contact.phone) parts.push(`   Phone: ${contact.phone}`);
    if (contact.phoneExtension) parts.push(`   Extension: ${contact.phoneExtension}`);
    if (contact.email) parts.push(`   Email: ${contact.email}`);
  });
  parts.push("");
  parts.push("Visit the Directory page for more details.");
  return parts.join('\n');
}

// Search for recent news
async function searchNews(): Promise<string | null> {
  await connectDB();

  const news = await News.find({ status: "published" })
    .sort({ publishedAt: -1 })
    .limit(5)
    .select("title excerpt publishedAt slug")
    .lean();

  if (news.length === 0) return null;

  const parts = ["Here are the latest news and announcements:"];
  news.forEach((item, index) => {
    const date = item.publishedAt
      ? new Date(item.publishedAt).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        })
      : 'Recent';
    parts.push("");
    parts.push(`${index + 1}. ${item.title} (${date})`);
    if (item.excerpt) parts.push(`   ${item.excerpt.substring(0, 150)}...`);
  });
  parts.push("");
  parts.push("You can view full articles on the News page.");
  return parts.join('\n');
}

// Search for company apps from database
async function searchApps(query?: string): Promise<string | null> {
  await connectDB();

  const apps = await AppLink.find({ isActive: true })
    .sort({ clicks: -1 })
    .limit(10)
    .lean();

  if (apps.length === 0) return null;

  // If searching for specific app
  if (query) {
    const queryLower = query.toLowerCase();
    const matchedApps = apps.filter(app =>
      app.name.toLowerCase().includes(queryLower) ||
      (app.description && app.description.toLowerCase().includes(queryLower))
    );

    if (matchedApps.length > 0) {
      const parts = ["Here are the matching apps:"];
      matchedApps.forEach((app, index) => {
        parts.push("");
        parts.push(`${index + 1}. ${app.name}`);
        parts.push(`   ${app.url}`);
        if (app.description) parts.push(`   ${app.description}`);
      });
      return parts.join('\n');
    }
  }

  // Return all apps
  const parts = ["Company Apps & Systems:"];
  apps.forEach((app, index) => {
    parts.push(`${index + 1}. ${app.name}: ${app.url}`);
  });
  parts.push("");
  parts.push("You can access all apps from the Apps page on the intranet.");
  return parts.join('\n');
}

// Generate response from database only (FAQs, contacts, news, apps)
async function generateDatabaseResponse(query: string): Promise<string> {
  await connectDB();
  const queryLower = query.toLowerCase();

  // Check for greetings
  const greetings = ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'howdy'];
  if (greetings.some(g => queryLower.includes(g))) {
    return "Hello! I'm the ARL Assistant. I can help you find information about:\n\n• Contacts & Directory - Find staff contact info\n• Company News - Latest announcements\n• Company Apps - Leave, HelpDesk, HSE Suite, Hazard Reporting\n• HR Information - Leave, payroll, benefits\n• IT Support - Help desk, passwords\n• Safety Information - Procedures, emergency contacts\n• Facilities - Canteen, clinic, transport\n\nWhat would you like to know?";
  }

  // CHECK SPECIFIC TOPICS FIRST (with actual app links)

  // IT / HelpDesk queries - check BEFORE contact search
  if (queryLower.includes('it ') || queryLower.includes('helpdesk') || queryLower.includes('help desk') || queryLower.includes('computer') || queryLower.includes('password') || queryLower.includes('wifi') || queryLower.includes('internet') || queryLower.includes('technical support')) {
    const helpdeskApp = await AppLink.findOne({ name: { $regex: /helpdesk/i }, isActive: true }).lean();
    let response = "IT Help Desk\n\n";
    if (helpdeskApp) {
      response += `HelpDesk Portal: ${helpdeskApp.url}\n\n`;
    }
    response += "Extension: 100\nEmail: ithelp@adamusresources.com\nLocation: Admin Building, 1st Floor\nHours: 7:00 AM - 5:00 PM\n\nFor password resets, please have your employee ID ready.";
    return response;
  }

  // Leave queries
  if (queryLower.includes('leave') || queryLower.includes('vacation') || queryLower.includes('time off') || queryLower.includes('annual leave')) {
    const leaveApp = await AppLink.findOne({ name: { $regex: /leave/i }, isActive: true }).lean();
    let response = "Leave Application\n\n";
    if (leaveApp) {
      response += `Leave Portal: ${leaveApp.url}\n\n`;
    }
    response += "Process:\n1. Log into the Leave Portal above\n2. Check your leave balance\n3. Submit leave request to supervisor\n4. After approval, HR will confirm\n\nFor emergency leave, contact HR at Extension 200.";
    return response;
  }

  // Safety / HSE / Hazard queries
  if (queryLower.includes('safety') || queryLower.includes('ppe') || queryLower.includes('hse') || queryLower.includes('hazard') || queryLower.includes('incident') || queryLower.includes('report')) {
    const hseApp = await AppLink.findOne({ name: { $regex: /hse/i }, isActive: true }).lean();
    const hazardApp = await AppLink.findOne({ name: { $regex: /hazard/i }, isActive: true }).lean();

    let response = "Safety & HSE\n\n";
    if (hseApp) response += `HSE Suite: ${hseApp.url}\n`;
    if (hazardApp) response += `Hazard Reporting: ${hazardApp.url}\n\n`;

    response += "Report hazards immediately:\n1. If danger - STOP work, warn others\n2. Report to supervisor\n3. Use Hazard Reporting app above\n\nSafety Dept: Extension 555\nEmergency: 999";
    return response;
  }

  // Medical / Clinic queries
  if (queryLower.includes('clinic') || queryLower.includes('medical') || queryLower.includes('doctor') || queryLower.includes('sick') || queryLower.includes('health') || queryLower.includes('treatment')) {
    const medApp = await AppLink.findOne({ name: { $regex: /med|treatment/i }, isActive: true }).lean();

    let response = "Site Clinic\n\n";
    if (medApp) response += `Med Treatment App: ${medApp.url}\n\n`;

    response += "Location: Next to Admin Building\nEmergency: 24/7 (Extension 444)\nRoutine: 7:30 AM - 4:30 PM\n\nFor emergencies, call 444 or radio 'Medical Emergency'.";
    return response;
  }

  // Apps/Systems query - list all apps
  if (queryLower.match(/\bapps?\b/) || queryLower.includes('systems') || queryLower.includes('portals') || queryLower.includes('software available')) {
    const appsResult = await searchApps();
    if (appsResult) {
      return appsResult;
    }
  }

  // Check for news-related queries
  const newsKeywords = ["news", "announcement", "update", "recent", "latest", "what's new", "happening"];
  if (newsKeywords.some((kw) => queryLower.includes(kw))) {
    const newsResult = await searchNews();
    if (newsResult) {
      return newsResult;
    }
  }

  // Check for contact-related queries (AFTER specific topics)
  const contactKeywords = ["contact", "phone", "email", "reach", "find", "who is", "number", "extension", "call", "manager", "director", "supervisor", "talk to", "speak to", "superintendent", "officer", "engineer", "accountant", "coordinator", "clerk", "assistant", "analyst", "geologist", "surveyor", "operator", "technician", "nurse", "doctor", "driver"];
  if (contactKeywords.some((kw) => queryLower.includes(kw))) {
    const contactResult = await searchContacts(query);
    if (contactResult) {
      return contactResult;
    }
  }

  // Also try to search contacts if query looks like a job title/position
  // This catches queries like "Senior Mine Surveyor" without keywords
  const positionResult = await searchContactsByPosition(query);
  if (positionResult) {
    return positionResult;
  }

  // Search FAQs for the query
  const faqResults = await searchFAQs(query);
  if (faqResults.length > 0) {
    return faqResults[0].answer;
  }

  // Fallback topics
  if (queryLower.includes('emergency') || queryLower.includes('urgent') || queryLower.includes('accident')) {
    return "Emergency Contacts\n\nEmergency Hotline: Extension 999 (or radio Channel 1)\nSite Clinic: Extension 444 (24/7)\nSecurity: Extension 333\nSafety Dept: Extension 555\n\nIn emergency: STOP work, SECURE area, CALL 999, REPORT to supervisor.";
  }

  if (queryLower.includes('hr') || queryLower.includes('human resource')) {
    return "HR Department\n\nMain Office: Extension 200\nHR Manager: Extension 201\nPayroll: Extension 202\nTraining: Extension 203\n\nLocation: Admin Building, Ground Floor\nHours: 7:30 AM - 4:30 PM weekdays";
  }

  if (queryLower.includes('canteen') || queryLower.includes('food') || queryLower.includes('lunch') || queryLower.includes('breakfast') || queryLower.includes('dinner') || queryLower.includes('meal')) {
    return "Canteen Hours\n\nBreakfast: 5:30 AM - 7:30 AM\nLunch: 11:30 AM - 1:30 PM\nDinner: 5:30 PM - 7:30 PM\nNight shift: 12:00 AM - 1:00 AM\n\nMenus posted on Canteen page.";
  }

  if (queryLower.includes('pay') || queryLower.includes('salary') || queryLower.includes('wage') || queryLower.includes('payslip')) {
    return "Payroll\n\nPay day: 25th of each month\nPayslips: Available from 23rd\nQueries: Extension 202";
  }

  if (queryLower.includes('transport') || queryLower.includes('bus') || queryLower.includes('shuttle')) {
    return "Transport Office\n\nExtension: 150\nLocation: Near Main Gate";
  }

  if (queryLower.includes('help') || queryLower.includes('what can you do') || queryLower.includes('assist')) {
    return "I can help you with:\n\n• Company Apps - Leave, HelpDesk, HSE, Hazard Reporting\n• Staff Directory - Find contact info\n• Company News - Latest announcements\n• HR - Leave, payroll, benefits\n• IT Support - Help desk, passwords\n• Safety - HSE, hazard reporting, PPE\n• Facilities - Canteen, clinic, transport\n\nTry asking a specific question!";
  }

  // Default response
  return "I couldn't find that information. Try asking about:\n\n• Apps - 'What apps are available?'\n• Leave - 'How do I apply for leave?'\n• IT - 'How do I contact helpdesk?'\n• Safety - 'How do I report a hazard?'\n• News - 'What's the latest news?'\n\nQuick Contacts:\nEmergency: 999\nHR: 200\nIT Help: 100\nClinic: 444";
}

// Send message and get response (database-only, no external AI)
export async function sendMessage(
  sessionId: string,
  userMessage: string
): Promise<{ response: string; error?: string }> {
  await connectDB();

  // Rate limit check
  if (!checkChatRateLimit(sessionId)) {
    return {
      response: "",
      error: "You're sending messages too quickly. Please wait a moment.",
    };
  }

  // Get or create session
  const session = await ChatSession.findOne({ sessionId });
  if (!session) {
    return { response: "", error: "Session not found" };
  }

  // Save user message
  await ChatMessage.create({
    session: session._id,
    role: "user",
    content: userMessage,
  });

  // Generate response from database only
  const response = await generateDatabaseResponse(userMessage);

  // Save assistant response
  await ChatMessage.create({
    session: session._id,
    role: "assistant",
    content: response,
  });

  // Update session
  session.messageCount += 2;
  session.lastActivity = new Date();
  await session.save();

  return { response };
}

// Clear session
export async function clearSession(sessionId: string): Promise<void> {
  await connectDB();

  const session = await ChatSession.findOne({ sessionId });
  if (session) {
    await ChatMessage.deleteMany({ session: session._id });
    session.messageCount = 0;
    await session.save();
  }
}

// FAQ management functions
export async function getFAQs(category?: string): Promise<any[]> {
  await connectDB();

  const query: Record<string, unknown> = { isActive: true };
  if (category) query.category = category;

  return FAQ.find(query).sort({ category: 1, order: 1 }).lean();
}

export async function getFAQCategories(): Promise<string[]> {
  await connectDB();
  return FAQ.distinct("category", { isActive: true });
}

export async function createFAQ(data: {
  question: string;
  answer: string;
  category: string;
  keywords?: string[];
}): Promise<any> {
  await connectDB();
  return FAQ.create(data);
}

export async function updateFAQ(
  id: string,
  data: Partial<{
    question: string;
    answer: string;
    category: string;
    keywords: string[];
    isActive: boolean;
    order: number;
  }>
): Promise<any> {
  await connectDB();
  return FAQ.findByIdAndUpdate(id, data, { new: true }).lean();
}

export async function deleteFAQ(id: string): Promise<boolean> {
  await connectDB();
  const result = await FAQ.findByIdAndDelete(id);
  return !!result;
}
