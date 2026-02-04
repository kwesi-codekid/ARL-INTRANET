import type { IAdmin } from "../models/admin.server";
import type { INews } from "../models/news.server";
import type { IContact } from "../models/contact.server";
import type { IAppLink } from "../models/app-link.server";

/**
 * Initial admin users
 */
export const adminSeeds: Partial<IAdmin>[] = [
  {
    name: "System Administrator",
    phone: "+233200000000",
    email: "admin@adamusresources.com",
    role: "superadmin",
    isActive: true,
  },
];

/**
 * Initial news articles
 */
export const newsSeeds: Partial<INews>[] = [
  {
    title: "Welcome to ARL Intranet",
    content: `
      <p>Welcome to <strong>ARL Intranet</strong>, the official intranet portal for Adamus Resources Limited.</p>
      <p>This platform is designed to keep you informed about company news, safety updates, and provide easy access to important resources and tools.</p>
      <h3>What you can do here:</h3>
      <ul>
        <li>Stay updated with the latest company news and announcements</li>
        <li>Access safety information and toolbox talks</li>
        <li>Find contact information for colleagues across all departments</li>
        <li>View and share photos from company events</li>
        <li>Access frequently used business applications</li>
      </ul>
      <p>We're excited to have you here. If you have any questions or suggestions, please reach out to the IT department.</p>
    `,
    category: "company",
    authorName: "ARL Communications",
    isFeatured: true,
    status: "published",
    publishedAt: new Date(),
    tags: ["welcome", "announcement", "intranet"],
  },
  {
    title: "Safety First: New PPE Requirements",
    content: `
      <p>As part of our commitment to maintaining the highest safety standards, we are implementing updated PPE requirements across all operational areas.</p>
      <h3>Key Updates:</h3>
      <ul>
        <li>High-visibility vests are now mandatory in all operational zones</li>
        <li>Safety glasses must be worn at all times in designated areas</li>
        <li>New hearing protection guidelines for processing plant workers</li>
      </ul>
      <p>Please ensure you are familiar with these requirements and contact your supervisor or the HSE department if you have any questions.</p>
    `,
    category: "safety",
    authorName: "HSE Department",
    isFeatured: false,
    status: "published",
    publishedAt: new Date(),
    tags: ["safety", "ppe", "requirements"],
  },
];

/**
 * Initial contact entries
 */
export const contactSeeds: Partial<IContact>[] = [
  {
    firstName: "John",
    lastName: "Mensah",
    name: "John Mensah",
    phone: "+233201234567",
    phoneExtension: "101",
    email: "john.mensah@adamusresources.com",
    department: "HSE",
    position: "HSE Manager",
    location: "Main Office",
    isActive: true,
    sortOrder: 1,
  },
  {
    firstName: "Akua",
    lastName: "Boateng",
    name: "Akua Boateng",
    phone: "+233201234568",
    phoneExtension: "102",
    email: "akua.boateng@adamusresources.com",
    department: "HR",
    position: "HR Manager",
    location: "Admin Building",
    isActive: true,
    sortOrder: 1,
  },
  {
    firstName: "Kwame",
    lastName: "Asante",
    name: "Kwame Asante",
    phone: "+233201234569",
    phoneExtension: "201",
    email: "kwame.asante@adamusresources.com",
    department: "MINING",
    position: "Mining Superintendent",
    location: "Mining Office",
    isActive: true,
    sortOrder: 1,
  },
  {
    firstName: "Ama",
    lastName: "Darko",
    name: "Ama Darko",
    phone: "+233201234570",
    phoneExtension: "301",
    email: "ama.darko@adamusresources.com",
    department: "PROC",
    position: "Process Manager",
    location: "Processing Plant",
    isActive: true,
    sortOrder: 1,
  },
  {
    firstName: "Kofi",
    lastName: "Owusu",
    name: "Kofi Owusu",
    phone: "+233201234571",
    phoneExtension: "401",
    email: "kofi.owusu@adamusresources.com",
    department: "SEC",
    position: "Security Manager",
    location: "Main Gate",
    isActive: true,
    sortOrder: 1,
  },
];

/**
 * Initial app links
 */
export const appLinkSeeds: Partial<IAppLink>[] = [
  {
    name: "Microsoft 365",
    url: "https://www.office.com",
    description: "Access Outlook, Teams, SharePoint, and other Microsoft apps",
    icon: "mail",
    iconType: "lucide",
    category: "productivity",
    order: 1,
    isActive: true,
    isExternal: true,
  },
  {
    name: "SAP",
    url: "https://sap.example.com",
    description: "Enterprise resource planning system",
    icon: "database",
    iconType: "lucide",
    category: "business",
    order: 1,
    isActive: true,
    isExternal: true,
    requiresAuth: true,
  },
  {
    name: "HRIS Portal",
    url: "https://hr.example.com",
    description: "Human resources self-service portal",
    icon: "users",
    iconType: "lucide",
    category: "hr",
    order: 1,
    isActive: true,
    isExternal: true,
    requiresAuth: true,
  },
  {
    name: "Safety Portal",
    url: "https://safety.example.com",
    description: "Safety management and incident reporting",
    icon: "shield",
    iconType: "lucide",
    category: "safety",
    order: 1,
    isActive: true,
    isExternal: true,
    requiresAuth: true,
  },
  {
    name: "IT Service Desk",
    url: "https://servicedesk.example.com",
    description: "Submit IT support requests",
    icon: "headphones",
    iconType: "lucide",
    category: "productivity",
    order: 2,
    isActive: true,
    isExternal: true,
  },
  {
    name: "Document Library",
    url: "https://docs.example.com",
    description: "Company policies, procedures, and forms",
    icon: "folder",
    iconType: "lucide",
    category: "business",
    order: 2,
    isActive: true,
    isExternal: true,
    requiresAuth: true,
  },
];
