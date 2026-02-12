/**
 * FAQ Seed Data for AI Chatbot
 * Comprehensive knowledge base for ARL Intranet Assistant
 * Task: 1.4.1.2.2 - Build FAQ seeding script
 */

import { FAQ } from "../models/chat.server";

const faqData = [
  // ========== COMPANY INFORMATION ==========
  {
    question: "What is Adamus Resources Limited?",
    answer:
      "Adamus Resources Limited (ARL) is a gold mining company located in the Nzema area of Ghana's Western Region. We are part of the Nguvu Mining group and are committed to responsible mining practices, safety excellence, environmental stewardship, and community development. The mine produces gold through open-pit mining and processing operations.",
    category: "Company",
    keywords: ["adamus", "arl", "company", "about", "nguvu", "mining", "gold"],
  },
  {
    question: "Where is ARL located?",
    answer:
      "ARL's mine site is located in the Nzema area of Ghana's Western Region, approximately 280km west of Accra. The nearest major town is Takoradi. Our head office and all operational facilities are situated on the mine site premises.",
    category: "Company",
    keywords: ["location", "address", "where", "nzema", "western region", "ghana", "takoradi"],
  },
  {
    question: "What is the company mission?",
    answer:
      "ARL's mission is to be a leading gold producer committed to: 1) Safe and responsible mining operations, 2) Environmental stewardship and sustainable practices, 3) Community development and stakeholder engagement, 4) Employee development and welfare, 5) Creating value for shareholders through operational excellence.",
    category: "Company",
    keywords: ["mission", "vision", "values", "goals", "purpose"],
  },
  {
    question: "Who is the Managing Director?",
    answer:
      "For current leadership information, please check the Company Directory on the intranet or contact the Corporate Communications department. The executive team includes the Managing Director, Operations Manager, Finance Director, HR Director, and other senior leaders.",
    category: "Company",
    keywords: ["md", "managing director", "ceo", "boss", "leader", "executive"],
  },
  {
    question: "What departments are in ARL?",
    answer:
      "ARL has several departments including: Mining Operations, Processing Plant, Maintenance, Safety & Environment, Human Resources (HR), Finance, IT, Supply Chain, Security, Corporate Communications, Community Relations, and Technical Services. Each department plays a vital role in our mining operations.",
    category: "Company",
    keywords: ["departments", "sections", "divisions", "units", "teams"],
  },

  // ========== SAFETY ==========
  {
    question: "What is the emergency number?",
    answer:
      "For ANY emergency on site, call the Emergency Hotline immediately: Extension 999 or radio Channel 1. For Medical emergencies, contact the Site Clinic at Extension 444. Security Control Room can be reached at Extension 333. Remember: In an emergency, STOP work, SECURE the area, CALL for help, and REPORT to your supervisor.",
    category: "Safety",
    keywords: ["emergency", "number", "contact", "help", "urgent", "911", "999", "hotline"],
  },
  {
    question: "How do I report a safety incident?",
    answer:
      "Report ALL incidents immediately: 1) Verbal report to your supervisor RIGHT AWAY, 2) Call the Safety Department at Extension 555, 3) Complete an Incident Report Form within 24 hours, 4) Cooperate with any investigation. Remember: Near-misses are just as important to report as actual incidents. No blame culture - reporting saves lives!",
    category: "Safety",
    keywords: ["report", "incident", "safety", "accident", "hazard", "near miss"],
  },
  {
    question: "What PPE is required on site?",
    answer:
      "Minimum PPE required in ALL operational areas: Hard hat, Steel-toe safety boots, High-visibility vest, Safety glasses. Additional PPE by area: Processing Plant - ear protection, dust mask; Workshop - welding shield, gloves; Pit area - full PPE plus radio. PPE must be worn correctly at ALL times. Damaged PPE must be replaced immediately - contact your supervisor.",
    category: "Safety",
    keywords: ["ppe", "equipment", "protective", "safety gear", "hard hat", "boots", "vest"],
  },
  {
    question: "What are the Golden Safety Rules?",
    answer:
      "ARL's Golden Safety Rules (violations may result in dismissal): 1) Never work under the influence of alcohol or drugs, 2) Always wear required PPE, 3) Never bypass safety devices, 4) Always follow LOTO procedures, 5) No unauthorized entry to restricted areas, 6) Always use fall protection at heights, 7) Follow vehicle and driving rules, 8) Report all incidents and hazards.",
    category: "Safety",
    keywords: ["golden rules", "safety rules", "cardinal rules", "critical", "dismissal"],
  },
  {
    question: "What is LOTO?",
    answer:
      "LOTO stands for Lock Out Tag Out - a critical safety procedure to ensure equipment is properly shut off and cannot be started up again before maintenance or repair work is completed. Steps: 1) Identify all energy sources, 2) Notify affected personnel, 3) Shut down equipment, 4) Apply your personal lock and tag, 5) Verify zero energy state, 6) Perform work, 7) Remove locks in reverse order. NEVER remove another person's lock!",
    category: "Safety",
    keywords: ["loto", "lockout", "tagout", "energy isolation", "maintenance safety"],
  },
  {
    question: "What is a PSI Talk?",
    answer:
      "A PSI Talk is a short safety meeting (5-15 minutes) held at the start of a shift or before a specific task. Topics include: hazards for the day, safety reminders, lessons from recent incidents, and new procedures. All workers must attend and sign the attendance sheet. Current week's PSI Talk topic is displayed on the intranet homepage.",
    category: "Safety",
    keywords: ["PSI talk", "safety meeting", "pre-start", "briefing", "tbt"],
  },
  {
    question: "How do I report a hazard?",
    answer:
      "Report hazards immediately: 1) If immediate danger - stop work and warn others, 2) Report verbally to your supervisor, 3) Fill out a Hazard Report Card (available at all notice boards), 4) Submit to Safety Department or your supervisor. You can also report hazards through the Safety section on the intranet. All hazard reports are investigated within 24 hours.",
    category: "Safety",
    keywords: ["hazard", "danger", "unsafe", "risk", "report hazard"],
  },
  {
    question: "What do I do in case of fire?",
    answer:
      "In case of fire, remember RACE: R - Rescue anyone in immediate danger (only if safe), A - Alarm - activate fire alarm and call Emergency (999), C - Contain - close doors to limit spread, E - Evacuate - follow evacuation routes to assembly points. Know your nearest fire extinguisher and assembly point. Never use lifts during fire evacuation.",
    category: "Safety",
    keywords: ["fire", "evacuation", "alarm", "emergency", "assembly point"],
  },

  // ========== HR & EMPLOYMENT ==========
  {
    question: "How do I apply for leave?",
    answer:
      "Leave application process: 1) Check your leave balance on the HR portal, 2) Complete Leave Application Form, 3) Submit to your supervisor at least 2 weeks in advance (annual leave), 4) After supervisor approval, submit to HR, 5) Receive confirmation. Emergency leave - contact HR immediately. Leave types: Annual, Sick (with medical certificate), Maternity/Paternity, Compassionate, Study leave.",
    category: "HR",
    keywords: ["leave", "vacation", "time off", "holiday", "application", "annual leave"],
  },
  {
    question: "What are the working hours?",
    answer:
      "Working hours vary by role: Office staff - 7:30 AM to 4:30 PM (Mon-Fri), Operations (Day shift) - 6:00 AM to 6:00 PM, Operations (Night shift) - 6:00 PM to 6:00 AM. Roster patterns vary (e.g., 14 days on, 7 days off for some roles). Overtime must be approved by your supervisor in advance. Check your employment contract for your specific schedule.",
    category: "HR",
    keywords: ["hours", "schedule", "shift", "working time", "start", "roster", "overtime"],
  },
  {
    question: "How do I contact HR?",
    answer:
      "HR Department contacts: Main HR Office - Extension 200, HR Manager - Extension 201, Payroll queries - Extension 202, Training & Development - Extension 203, Recruitment - Extension 204. Email: hr@adamusresources.com. HR office is located in the Admin Building, Ground Floor. Office hours: 7:30 AM - 4:30 PM weekdays.",
    category: "HR",
    keywords: ["hr", "human resources", "contact", "personnel", "extension"],
  },
  {
    question: "When is payday?",
    answer:
      "Salaries are paid on the 25th of each month. If the 25th falls on a weekend or public holiday, payment is made on the last working day before. Payslips are available on the HR portal from the 23rd. For payroll queries, contact the Payroll section at Extension 202 or email payroll@adamusresources.com.",
    category: "HR",
    keywords: ["payday", "salary", "payment", "payslip", "wages", "25th"],
  },
  {
    question: "What employee benefits does ARL offer?",
    answer:
      "ARL employee benefits include: Medical insurance (employee + dependents), Life insurance, Provident fund contribution, Housing allowance (where applicable), Transport allowance, Annual bonus (performance-based), Training and development programs, Canteen meals, PPE provided free, Recreation facilities. Details vary by employment level - check your contract or contact HR.",
    category: "HR",
    keywords: ["benefits", "insurance", "medical", "allowance", "bonus", "perks"],
  },
  {
    question: "How do I update my personal information?",
    answer:
      "To update personal information (address, phone, emergency contact, bank details): 1) Complete a Personal Information Update Form from HR, 2) Attach supporting documents if required, 3) Submit to HR. For bank account changes, allow 2 pay cycles for processing. Keep your emergency contact information current - it's crucial for safety!",
    category: "HR",
    keywords: ["update", "personal", "information", "address", "bank", "emergency contact"],
  },
  {
    question: "What is the dress code?",
    answer:
      "Dress code varies by work area: Office - Business casual (no jeans, no open shoes), Site/Operations - Company-issued PPE and work clothes only, Visitors - Closed shoes, long pants required; PPE provided for site visits. All clothing must be appropriate for a professional workplace. Company branded items are encouraged.",
    category: "HR",
    keywords: ["dress code", "uniform", "clothing", "attire", "what to wear"],
  },

  // ========== IT SUPPORT ==========
  {
    question: "How do I reset my password?",
    answer:
      "To reset your network/email password: 1) Call IT Help Desk at Extension 100, 2) Or email ithelp@adamusresources.com, 3) Or visit IT office in Admin Building, 1st Floor. Have your employee ID ready. Passwords must be changed every 90 days. Requirements: minimum 8 characters, uppercase, lowercase, number, special character. Never share your password!",
    category: "IT",
    keywords: ["password", "reset", "login", "forgot", "access", "locked out"],
  },
  {
    question: "How do I report an IT issue?",
    answer:
      "Report IT issues: 1) Call IT Help Desk - Extension 100 (fastest for urgent issues), 2) Email ithelp@adamusresources.com (include error screenshots), 3) Submit ticket via IT portal on intranet. Provide: your name, location, description of problem, any error messages. IT support hours: 7:00 AM - 5:00 PM. After-hours emergencies: contact Security who will reach on-call IT.",
    category: "IT",
    keywords: ["it", "computer", "technical", "support", "problem", "issue", "help desk"],
  },
  {
    question: "How do I connect to WiFi?",
    answer:
      "Corporate WiFi networks: 'ARL-Corporate' - for company devices (auto-connects with domain credentials), 'ARL-Guest' - for visitors (request password from IT). Personal devices are not permitted on the corporate network. WiFi coverage is available in office areas, canteen, and recreation facilities. Report dead spots to IT.",
    category: "IT",
    keywords: ["wifi", "internet", "wireless", "network", "connect"],
  },
  {
    question: "How do I access my email?",
    answer:
      "Company email access: On computer - Outlook application (pre-installed), Web - go to mail.adamusresources.com, Mobile - contact IT to set up approved email app. Your email is firstname.lastname@adamusresources.com. Email is for business use only. Check IT policy for email retention and acceptable use guidelines.",
    category: "IT",
    keywords: ["email", "outlook", "webmail", "mail", "inbox"],
  },
  {
    question: "How do I request new software?",
    answer:
      "To request software: 1) Submit Software Request Form (available on IT portal), 2) Include business justification, 3) Get supervisor approval, 4) Submit to IT for review. Only approved software may be installed on company devices. Standard software requests take 3-5 business days. Licensed software may require budget approval.",
    category: "IT",
    keywords: ["software", "install", "application", "program", "request"],
  },

  // ========== FACILITIES ==========
  {
    question: "What are the canteen operating hours?",
    answer:
      "Canteen operating hours: Breakfast - 5:30 AM to 7:30 AM, Lunch - 11:30 AM to 1:30 PM, Dinner - 5:30 PM to 7:30 PM, Night shift meal - 12:00 AM to 1:00 AM. Menus rotate weekly and are posted on the intranet and canteen notice board. Special dietary requirements can be accommodated - speak to the canteen manager.",
    category: "Facilities",
    keywords: ["canteen", "food", "lunch", "dining", "meals", "cafeteria", "breakfast", "dinner"],
  },
  {
    question: "Where is the clinic located?",
    answer:
      "The Site Clinic is located next to the Admin Building, clearly marked with medical signs. Operating hours: 24/7 for emergencies, Routine consultations: 7:30 AM - 4:30 PM. Services include: first aid, basic medical care, pre-employment medicals, fitness assessments, occupational health. For emergencies, call Extension 444 or radio 'Medical Emergency'.",
    category: "Facilities",
    keywords: ["clinic", "medical", "health", "doctor", "nurse", "hospital", "sick"],
  },
  {
    question: "Where are the assembly points?",
    answer:
      "Emergency Assembly Points: Point A - Main Gate car park (for Admin building), Point B - Processing Plant parking area, Point C - Mining workshop area, Point D - Explosives magazine gate. Know YOUR nearest assembly point! Assembly points have green signs with letters. During evacuation drills or emergencies, proceed calmly to your designated point and await roll call.",
    category: "Facilities",
    keywords: ["assembly point", "evacuation", "muster", "emergency", "meeting point"],
  },
  {
    question: "Is there a gym or fitness facility?",
    answer:
      "Yes! The Recreation Center includes: Gym with cardio and weight equipment (6 AM - 8 PM), Football/soccer field, Basketball court, Table tennis. Located near the accommodation village. Free for all employees. Gym induction required before first use - contact Recreation Officer. Sports equipment can be borrowed from the recreation office.",
    category: "Facilities",
    keywords: ["gym", "fitness", "exercise", "sports", "recreation", "football", "basketball"],
  },
  {
    question: "Where can I pray?",
    answer:
      "Prayer facilities: Multi-faith Prayer Room located in the Welfare Building (open 24 hours). Muslim prayer times are announced via the PA system. Christian chapel services held Sundays at 9 AM in the Recreation Hall. All faiths are respected and accommodated. Speak to HR if you need specific arrangements for religious observances.",
    category: "Facilities",
    keywords: ["prayer", "mosque", "church", "worship", "religious", "faith", "muslim", "christian"],
  },
  {
    question: "How do I book a meeting room?",
    answer:
      "Meeting room booking: 1) Check availability on Outlook calendar (meeting rooms are listed as resources), 2) Send meeting invite including the room, 3) Or contact Admin/Reception at Extension 111. Available rooms: Boardroom (20 people), Meeting Room 1 (10 people), Meeting Room 2 (6 people), Training Room (30 people). Book in advance for large meetings.",
    category: "Facilities",
    keywords: ["meeting room", "conference room", "book", "reserve", "boardroom"],
  },

  // ========== TRANSPORT & LOGISTICS ==========
  {
    question: "How does the staff bus work?",
    answer:
      "Staff buses run from Takoradi and nearby towns to site. Pickup points and times are posted on notice boards and the intranet. Contact Transport Office (Extension 150) to register for bus service. Buses depart ON TIME - be at the stop 5 minutes early. If you miss the bus, alternative arrangements are your responsibility. Report any issues with bus service to Transport.",
    category: "Transport",
    keywords: ["bus", "transport", "shuttle", "pickup", "travel", "takoradi"],
  },
  {
    question: "What are the site driving rules?",
    answer:
      "Site driving rules: Maximum speed 40 km/h (20 km/h near buildings), Seatbelts mandatory at all times, No mobile phone use while driving, Headlights on at all times, Give way to all mining equipment, No unauthorized passengers, Valid ARL driving permit required. Violations may result in permit suspension. Fatigue management - no driving if tired!",
    category: "Transport",
    keywords: ["driving", "vehicle", "speed limit", "rules", "car", "permit"],
  },
  {
    question: "How do I get a site driving permit?",
    answer:
      "Site driving permit process: 1) Must have valid Ghana driver's license, 2) Complete Defensive Driving course (arranged by Training dept), 3) Pass practical driving assessment, 4) Submit permit application to Transport Office. Permits are valid for 1 year and must be renewed. Different categories for light vehicles, trucks, and heavy equipment. Allow 2 weeks for processing.",
    category: "Transport",
    keywords: ["driving permit", "license", "authorization", "vehicle permit"],
  },

  // ========== TRAINING & DEVELOPMENT ==========
  {
    question: "What training programs are available?",
    answer:
      "Training programs include: Mandatory safety inductions, Job-specific technical training, Leadership development, Computer skills, First aid certification, Defensive driving, Supervisor development program. Check the Training Calendar on the intranet or contact Training Department (Extension 203) to nominate yourself. Discuss career development with your supervisor.",
    category: "Training",
    keywords: ["training", "course", "learning", "development", "skills", "education"],
  },
  {
    question: "How do I request training?",
    answer:
      "To request training: 1) Discuss with your supervisor first, 2) Complete Training Request Form, 3) Get supervisor and HOD approval, 4) Submit to Training Department. Budget and time off will be considered. Internal training is generally approved quickly. External training requires more lead time. IDP (Individual Development Plan) discussions happen annually.",
    category: "Training",
    keywords: ["request training", "course", "nominate", "attend", "develop"],
  },

  // ========== INTRANET & SYSTEMS ==========
  {
    question: "What can I do on the intranet?",
    answer:
      "The ARL Intranet allows you to: Read company news and announcements, View staff directory and contacts, Check canteen menus, See upcoming events, Access the photo gallery, Find safety information and PSI talks, View documents and policies, Submit suggestions anonymously, Use the AI chat assistant. More features are being added regularly!",
    category: "Intranet",
    keywords: ["intranet", "website", "portal", "system", "features"],
  },
  {
    question: "How do I submit a suggestion?",
    answer:
      "Submit suggestions through the Suggestion Box on the intranet: 1) Click on 'Suggestions' in the menu, 2) Select a category, 3) Write your suggestion (minimum 20 characters), 4) Submit - it's completely anonymous! All suggestions are reviewed by management. Good ideas may be implemented and recognized. Don't hesitate to share your thoughts!",
    category: "Intranet",
    keywords: ["suggestion", "idea", "feedback", "improve", "anonymous"],
  },
  {
    question: "How do I find a colleague's contact?",
    answer:
      "Find colleague contacts: 1) Use the Directory on the intranet - search by name or department, 2) Check the printed phone directory at reception, 3) Ask me! I can help find contacts if you tell me the person's name or role. The directory includes phone extensions, email addresses, and department information.",
    category: "Intranet",
    keywords: ["contact", "directory", "phone", "extension", "colleague", "find person"],
  },

  // ========== GENERAL QUERIES ==========
  {
    question: "What is today's PSI talk topic?",
    answer:
      "The current week's PSI Talk topic is displayed on the intranet homepage in the right sidebar widget. Topics change weekly and cover important safety subjects. Past PSI talks are archived and can be viewed in the Safety section. Make sure you attend your department's PSI talk session and sign the attendance sheet!",
    category: "Safety",
    keywords: ["PSI talk", "topic", "today", "this week", "safety topic"],
  },
  {
    question: "What is the WiFi password?",
    answer:
      "For security reasons, WiFi passwords are not shared publicly. Corporate WiFi (ARL-Corporate) connects automatically for company devices. For guest WiFi access, please contact IT Help Desk at Extension 100 or your host if you're a visitor. Remember: personal devices are not allowed on the corporate network.",
    category: "IT",
    keywords: ["wifi password", "wireless", "internet password", "connect wifi"],
  },
  {
    question: "Can you help me?",
    answer:
      "Yes! I'm ARL Assistant and I'm here to help you with: Finding contact information, Answering questions about company policies, Safety information and procedures, Directions to facilities, HR and IT queries, General information about ARL. Just ask your question and I'll do my best to help. For complex issues, I'll direct you to the right department.",
    category: "General",
    keywords: ["help", "assist", "support", "question", "can you"],
  },
  {
    question: "What apps are available?",
    answer:
      "Available applications on the intranet include quick links to: HR Portal (leave, payslips), IT Help Desk Portal, Training Portal, Document Management System, Safety Reporting System, and more. Check the Apps page on the intranet for the full list. Contact IT if you need access to a specific system.",
    category: "Intranet",
    keywords: ["apps", "applications", "systems", "tools", "software"],
  },
];

export async function seedFAQs(): Promise<void> {
  console.log("Seeding FAQs...");

  let created = 0;
  let existing = 0;

  for (const faq of faqData) {
    const existingFaq = await FAQ.findOne({ question: faq.question });
    if (!existingFaq) {
      await FAQ.create(faq);
      created++;
      console.log(`  ✓ Created: ${faq.question.substring(0, 50)}...`);
    } else {
      // Update existing FAQ with new data
      await FAQ.updateOne({ _id: existingFaq._id }, faq);
      existing++;
    }
  }

  console.log(`\nFAQ seeding completed: ${created} created, ${existing} updated.`);
  console.log(`Total FAQs in database: ${await FAQ.countDocuments()}`);
}
