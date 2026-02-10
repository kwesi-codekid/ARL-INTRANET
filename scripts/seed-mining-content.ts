/**
 * Comprehensive Mining Content Seeder
 * Seeds the database with real mining-related content, images, and safety information
 */

import mongoose from "mongoose";
import * as fs from "fs";
import * as path from "path";

// Load environment variables from .env file manually
const envPath = path.join(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const [key, ...valueParts] = line.split("=");
    if (key && valueParts.length > 0) {
      const value = valueParts.join("=").trim().replace(/^["']|["']$/g, "");
      if (!process.env[key.trim()]) {
        process.env[key.trim()] = value;
      }
    }
  });
}

// Import models
import { SafetyCategory } from "../app/lib/db/models/safety-category.server";
import { SafetyTip } from "../app/lib/db/models/safety-tip.server";
import { SafetyVideo } from "../app/lib/db/models/safety-video.server";
import { News, NewsCategory } from "../app/lib/db/models/news.server";
import { Event } from "../app/lib/db/models/event.server";
import { Alert } from "../app/lib/db/models/alert.server";
import { Album, Photo } from "../app/lib/db/models/gallery.server";
import { ToolboxTalk } from "../app/lib/db/models/toolbox-talk.server";
import { AdminUser } from "../app/lib/db/models/admin-user.server";

// High-quality mining and safety images from Unsplash
const MINING_IMAGES = {
  // Mining operations
  miningOperations: [
    "https://images.unsplash.com/photo-1578319439584-104c94d37305?w=1200&h=800&fit=crop", // Mining truck
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&h=800&fit=crop", // Mining excavator
    "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=1200&h=800&fit=crop", // Industrial mine
    "https://images.unsplash.com/photo-1535813547-99c456a41d4a?w=1200&h=800&fit=crop", // Gold mine
  ],
  // Safety and PPE
  safety: [
    "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&h=800&fit=crop", // Construction safety
    "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1200&h=800&fit=crop", // Hard hat worker
    "https://images.unsplash.com/photo-1590479773265-7464e5d48118?w=1200&h=800&fit=crop", // Safety vest
    "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1200&h=800&fit=crop", // Safety equipment
  ],
  // Workers
  workers: [
    "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&h=800&fit=crop", // Workers discussing
    "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=1200&h=800&fit=crop", // Construction team
    "https://images.unsplash.com/photo-1529400971008-f566de0e6dfc?w=1200&h=800&fit=crop", // Worker portrait
    "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=1200&h=800&fit=crop", // Team meeting
  ],
  // Equipment
  equipment: [
    "https://images.unsplash.com/photo-1580901369227-308f6f40bdeb?w=1200&h=800&fit=crop", // Heavy machinery
    "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1200&h=800&fit=crop", // Industrial equipment
    "https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=1200&h=800&fit=crop", // Mining truck
    "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=1200&h=800&fit=crop", // Excavator
  ],
  // Environment
  environment: [
    "https://images.unsplash.com/photo-1518173946687-a4c036bc6c9b?w=1200&h=800&fit=crop", // Sunset mine
    "https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?w=1200&h=800&fit=crop", // Nature landscape
    "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&h=800&fit=crop", // Forest
    "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200&h=800&fit=crop", // Mountains
  ],
  // Events
  events: [
    "https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&h=800&fit=crop", // Conference
    "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=800&fit=crop", // Training
    "https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=1200&h=800&fit=crop", // Team gathering
    "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=1200&h=800&fit=crop", // Presentation
  ],
};

// Safety Categories
const safetyCategoriesData = [
  { name: "Personal Protective Equipment", slug: "ppe", description: "Guidelines for proper PPE usage", icon: "HardHat", color: "#F59E0B", order: 1 },
  { name: "Hazard Awareness", slug: "hazard-awareness", description: "Identifying and avoiding workplace hazards", icon: "AlertTriangle", color: "#EF4444", order: 2 },
  { name: "Emergency Procedures", slug: "emergency-procedures", description: "Emergency response and evacuation", icon: "Siren", color: "#DC2626", order: 3 },
  { name: "Equipment Safety", slug: "equipment-safety", description: "Safe operation of mining equipment", icon: "Cog", color: "#3B82F6", order: 4 },
  { name: "Chemical Safety", slug: "chemical-safety", description: "Handling hazardous materials safely", icon: "FlaskConical", color: "#8B5CF6", order: 5 },
  { name: "Health & Wellness", slug: "health-wellness", description: "Occupational health and wellness", icon: "Heart", color: "#EC4899", order: 6 },
  { name: "Environmental Safety", slug: "environmental-safety", description: "Environmental protection practices", icon: "Leaf", color: "#10B981", order: 7 },
  { name: "Working at Heights", slug: "working-at-heights", description: "Fall prevention and protection", icon: "ArrowUp", color: "#6366F1", order: 8 },
];

// Safety Tips
const safetyTipsData = [
  {
    title: "Always Wear Your Hard Hat",
    slug: "always-wear-hard-hat",
    content: `<h2>Why Hard Hats Are Essential</h2>
<p>Hard hats are your first line of defense against falling objects, bumping into fixed objects, and electrical hazards. In mining operations, the risk of head injuries is significant.</p>

<h3>Key Points:</h3>
<ul>
<li>Inspect your hard hat daily for cracks, dents, or damage</li>
<li>Replace your hard hat every 5 years or after any impact</li>
<li>Never modify or drill holes in your hard hat</li>
<li>Wear the hard hat with the brim facing forward</li>
<li>Adjust the suspension system for a snug fit</li>
</ul>

<h3>When to Replace Your Hard Hat:</h3>
<p>Replace immediately if you notice any cracks, deep scratches, or if the shell becomes brittle. UV exposure can degrade the plastic over time.</p>`,
    summary: "Your hard hat is your first line of defense. Learn proper usage and maintenance.",
    categorySlug: "ppe",
    featuredImage: MINING_IMAGES.safety[1],
    icon: "HardHat",
    isFeatured: true,
  },
  {
    title: "Proper Use of Safety Glasses",
    slug: "proper-use-safety-glasses",
    content: `<h2>Protecting Your Vision</h2>
<p>Eye injuries are among the most common workplace injuries in mining. Safety glasses protect against flying debris, dust, chemical splashes, and harmful light.</p>

<h3>Best Practices:</h3>
<ul>
<li>Always wear safety glasses in designated areas</li>
<li>Clean lenses regularly with approved cleaning solution</li>
<li>Replace scratched or damaged glasses immediately</li>
<li>Ensure proper fit - glasses should sit snugly</li>
<li>Use anti-fog solutions in humid conditions</li>
</ul>`,
    summary: "Protect your vision with proper safety glasses usage and maintenance.",
    categorySlug: "ppe",
    featuredImage: MINING_IMAGES.safety[0],
    icon: "Eye",
    isFeatured: false,
  },
  {
    title: "Recognizing Underground Hazards",
    slug: "recognizing-underground-hazards",
    content: `<h2>Stay Alert Underground</h2>
<p>Underground mining presents unique hazards that require constant vigilance. Being aware of your surroundings can save lives.</p>

<h3>Common Underground Hazards:</h3>
<ul>
<li><strong>Ground Control:</strong> Watch for signs of roof instability</li>
<li><strong>Ventilation:</strong> Monitor air quality continuously</li>
<li><strong>Electrical:</strong> Be aware of high-voltage equipment</li>
<li><strong>Mobile Equipment:</strong> Stay visible and alert</li>
<li><strong>Water Accumulation:</strong> Report any flooding immediately</li>
</ul>

<h3>Warning Signs:</h3>
<p>Be alert for unusual sounds, fresh cracks in rock faces, or changes in air pressure. Report any concerns immediately to your supervisor.</p>`,
    summary: "Learn to identify and respond to underground mining hazards.",
    categorySlug: "hazard-awareness",
    featuredImage: MINING_IMAGES.miningOperations[2],
    icon: "AlertTriangle",
    isFeatured: true,
  },
  {
    title: "Emergency Evacuation Procedures",
    slug: "emergency-evacuation-procedures",
    content: `<h2>Know Your Escape Routes</h2>
<p>In an emergency, knowing the evacuation procedures can mean the difference between life and death. Every worker must be familiar with all escape routes.</p>

<h3>Emergency Steps:</h3>
<ol>
<li>Remain calm and alert others nearby</li>
<li>Proceed to the nearest emergency refuge chamber or escape route</li>
<li>Use your self-rescuer if air quality is compromised</li>
<li>Follow the lifeline to the surface</li>
<li>Report to the designated assembly point</li>
</ol>

<h3>Self-Rescuer Training:</h3>
<p>Every underground worker must be trained in the proper use of self-contained self-rescuers (SCSRs). Practice donning your SCSR until it becomes second nature.</p>`,
    summary: "Be prepared for emergencies by knowing evacuation procedures.",
    categorySlug: "emergency-procedures",
    featuredImage: MINING_IMAGES.safety[2],
    icon: "LogOut",
    isFeatured: true,
  },
  {
    title: "Safe Operation of Haul Trucks",
    slug: "safe-operation-haul-trucks",
    content: `<h2>Haul Truck Safety</h2>
<p>Mining haul trucks are among the largest vehicles in the world. Their size creates unique safety challenges that all operators must understand.</p>

<h3>Pre-Operation Checklist:</h3>
<ul>
<li>Complete walk-around inspection</li>
<li>Check all fluid levels</li>
<li>Test all lights and signals</li>
<li>Verify brakes and steering</li>
<li>Adjust mirrors for maximum visibility</li>
</ul>

<h3>Operating Rules:</h3>
<ul>
<li>Always wear your seatbelt</li>
<li>Maintain safe following distances</li>
<li>Use spotters when visibility is limited</li>
<li>Never exceed speed limits on haul roads</li>
<li>Report any mechanical issues immediately</li>
</ul>`,
    summary: "Essential safety guidelines for haul truck operators.",
    categorySlug: "equipment-safety",
    featuredImage: MINING_IMAGES.miningOperations[0],
    icon: "Truck",
    isFeatured: false,
  },
  {
    title: "Handling Hazardous Chemicals",
    slug: "handling-hazardous-chemicals",
    content: `<h2>Chemical Safety in Mining</h2>
<p>Mining operations use various chemicals for processing ore. Proper handling is essential to prevent injuries and environmental damage.</p>

<h3>Key Safety Measures:</h3>
<ul>
<li>Read Safety Data Sheets (SDS) before handling any chemical</li>
<li>Wear appropriate PPE for each chemical</li>
<li>Never mix chemicals without authorization</li>
<li>Use proper ventilation in enclosed spaces</li>
<li>Know the location of emergency eyewash and showers</li>
</ul>

<h3>Spill Response:</h3>
<p>In case of a chemical spill, evacuate the area, alert others, and contact the emergency response team. Only trained personnel should attempt cleanup.</p>`,
    summary: "Safe practices for handling chemicals in mining operations.",
    categorySlug: "chemical-safety",
    featuredImage: MINING_IMAGES.equipment[1],
    icon: "FlaskConical",
    isFeatured: false,
  },
  {
    title: "Heat Stress Prevention",
    slug: "heat-stress-prevention",
    content: `<h2>Staying Safe in Hot Conditions</h2>
<p>Mining in Ghana's climate means working in high temperatures. Heat stress can be life-threatening if not properly managed.</p>

<h3>Prevention Strategies:</h3>
<ul>
<li>Drink water regularly - don't wait until you're thirsty</li>
<li>Take scheduled rest breaks in shaded or air-conditioned areas</li>
<li>Wear light, breathable clothing when possible</li>
<li>Monitor yourself and coworkers for signs of heat illness</li>
<li>Avoid caffeine and alcohol which increase dehydration</li>
</ul>

<h3>Warning Signs of Heat Stress:</h3>
<p>Heavy sweating, weakness, cold/pale/clammy skin, nausea, and dizziness. If you experience these symptoms, move to a cool area and seek medical attention.</p>`,
    summary: "Protect yourself from heat-related illness on the job.",
    categorySlug: "health-wellness",
    featuredImage: MINING_IMAGES.workers[0],
    icon: "Thermometer",
    isFeatured: true,
  },
  {
    title: "Dust Control and Respiratory Protection",
    slug: "dust-control-respiratory-protection",
    content: `<h2>Breathe Easy - Protect Your Lungs</h2>
<p>Mining dust can cause serious respiratory diseases including silicosis and pneumoconiosis. Proper respiratory protection is crucial.</p>

<h3>Dust Control Measures:</h3>
<ul>
<li>Use water sprays to suppress dust at source</li>
<li>Ensure proper ventilation in all work areas</li>
<li>Wear appropriate respirators when required</li>
<li>Keep work areas clean and dust-free</li>
<li>Report any ventilation problems immediately</li>
</ul>

<h3>Respirator Care:</h3>
<p>Clean your respirator after each use, replace filters as recommended, and ensure proper fit through regular fit testing.</p>`,
    summary: "Protect your respiratory health from mining dust hazards.",
    categorySlug: "health-wellness",
    featuredImage: MINING_IMAGES.safety[3],
    icon: "Wind",
    isFeatured: false,
  },
];

// Safety Videos (YouTube embeds)
const safetyVideosData = [
  {
    title: "Underground Mining Safety Fundamentals",
    slug: "underground-mining-safety-fundamentals",
    description: "Comprehensive overview of safety protocols in underground mining operations. Learn about hazard identification, emergency procedures, and best practices.",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", // Replace with actual mining safety video
    thumbnail: MINING_IMAGES.miningOperations[2],
    duration: 900, // 15 minutes
    categorySlug: "hazard-awareness",
    isFeatured: true,
  },
  {
    title: "Proper PPE Usage in Mining",
    slug: "proper-ppe-usage-mining",
    description: "Step-by-step guide on selecting, wearing, and maintaining personal protective equipment in mining environments.",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    thumbnail: MINING_IMAGES.safety[0],
    duration: 720, // 12 minutes
    categorySlug: "ppe",
    isFeatured: true,
  },
  {
    title: "Emergency Response Training",
    slug: "emergency-response-training",
    description: "Training video covering emergency evacuation procedures, use of self-rescuers, and emergency communication protocols.",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    thumbnail: MINING_IMAGES.safety[2],
    duration: 1200, // 20 minutes
    categorySlug: "emergency-procedures",
    isFeatured: true,
  },
  {
    title: "Haul Truck Safety Operations",
    slug: "haul-truck-safety-operations",
    description: "Comprehensive guide to safe operation of mining haul trucks including pre-trip inspections, driving techniques, and hazard awareness.",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    thumbnail: MINING_IMAGES.miningOperations[0],
    duration: 1500, // 25 minutes
    categorySlug: "equipment-safety",
    isFeatured: false,
  },
  {
    title: "Chemical Handling Safety",
    slug: "chemical-handling-safety",
    description: "Learn proper procedures for handling, storing, and disposing of hazardous chemicals used in mining and processing operations.",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    thumbnail: MINING_IMAGES.equipment[1],
    duration: 840, // 14 minutes
    categorySlug: "chemical-safety",
    isFeatured: false,
  },
];

// News Categories
const newsCategoriesData = [
  { name: "Company News", slug: "company-news", color: "#D4AF37", description: "Official company announcements", order: 1 },
  { name: "Safety Updates", slug: "safety-updates", color: "#10B981", description: "Safety-related news and updates", order: 2 },
  { name: "Operations", slug: "operations", color: "#3B82F6", description: "Mining operations updates", order: 3 },
  { name: "Community", slug: "community", color: "#8B5CF6", description: "Community engagement news", order: 4 },
  { name: "Environment", slug: "environment", color: "#059669", description: "Environmental initiatives", order: 5 },
  { name: "HR & Training", slug: "hr-training", color: "#F59E0B", description: "Human resources and training", order: 6 },
];

// News Articles
const newsArticlesData = [
  {
    title: "ARL Achieves One Million Safe Work Hours",
    slug: "arl-achieves-one-million-safe-work-hours",
    content: `<p>We are proud to announce that Adamus Resources Limited has achieved a significant safety milestone - <strong>One Million Hours</strong> without a lost-time injury!</p>

<p>This remarkable achievement reflects the dedication of every team member to our safety-first culture. From our underground miners to our processing plant operators, everyone has contributed to this success.</p>

<h3>How We Got Here</h3>
<ul>
<li>Daily safety briefings and PSI talks</li>
<li>Comprehensive hazard identification programs</li>
<li>Investment in state-of-the-art safety equipment</li>
<li>Regular safety training and certification programs</li>
<li>Open communication and near-miss reporting</li>
</ul>

<p>General Manager John Mensah commented: "This milestone belongs to every single person at ARL. Safety is not just a policy - it's who we are."</p>

<p>Let's continue working together to make ARL the safest mine in Ghana!</p>`,
    excerpt: "Adamus Resources Limited celebrates reaching one million work hours without a lost-time injury, showcasing our commitment to safety excellence.",
    categorySlug: "safety-updates",
    featuredImage: MINING_IMAGES.workers[1],
    isFeatured: true,
    isPinned: true,
  },
  {
    title: "New Underground Development Project Begins",
    slug: "new-underground-development-project-begins",
    content: `<p>ARL is excited to announce the commencement of our new underground development project in the Nzema region. This expansion represents a significant investment in our future.</p>

<h3>Project Highlights</h3>
<ul>
<li>3,500 meters of new underground development</li>
<li>State-of-the-art ventilation systems</li>
<li>Modern underground mining equipment</li>
<li>Expected completion: Q4 2024</li>
</ul>

<p>This project will create additional employment opportunities and further establish ARL as a leader in Ghana's gold mining industry.</p>`,
    excerpt: "ARL begins new underground development project with modern equipment and technology.",
    categorySlug: "operations",
    featuredImage: MINING_IMAGES.miningOperations[2],
    isFeatured: true,
    isPinned: false,
  },
  {
    title: "Community Health Screening Program Launched",
    slug: "community-health-screening-program",
    content: `<p>As part of our commitment to community welfare, ARL has launched a comprehensive health screening program for residents of surrounding communities.</p>

<p>The program provides free:</p>
<ul>
<li>Blood pressure monitoring</li>
<li>Diabetes screening</li>
<li>Eye examinations</li>
<li>General health consultations</li>
</ul>

<p>Over 2,000 community members have already benefited from this initiative. The program will continue monthly at various community locations.</p>`,
    excerpt: "ARL launches free health screening program for local communities, benefiting thousands of residents.",
    categorySlug: "community",
    featuredImage: MINING_IMAGES.workers[3],
    isFeatured: false,
    isPinned: false,
  },
  {
    title: "Environmental Rehabilitation Project Shows Progress",
    slug: "environmental-rehabilitation-project-progress",
    content: `<p>Our environmental rehabilitation project has achieved significant progress with over 50,000 trees planted in previously mined areas.</p>

<h3>Key Achievements</h3>
<ul>
<li>50,000+ native trees planted</li>
<li>15 hectares of land rehabilitated</li>
<li>Local species reintroduced</li>
<li>Water quality improvements observed</li>
</ul>

<p>Our commitment to responsible mining means leaving the land better than we found it. This project demonstrates mining and environmental stewardship can coexist.</p>`,
    excerpt: "ARL's rehabilitation project plants 50,000 trees, demonstrating commitment to environmental responsibility.",
    categorySlug: "environment",
    featuredImage: MINING_IMAGES.environment[0],
    isFeatured: true,
    isPinned: false,
  },
  {
    title: "New Training Center Opens at Main Site",
    slug: "new-training-center-opens",
    content: `<p>ARL is proud to announce the opening of our new state-of-the-art training center at the main site. This facility will provide world-class training for all employees.</p>

<h3>Training Center Features</h3>
<ul>
<li>Modern simulation equipment for equipment operation training</li>
<li>Underground safety training facility</li>
<li>Emergency response training area</li>
<li>Computer-based learning center</li>
<li>Conference rooms for workshops</li>
</ul>

<p>The center represents a GH₵2 million investment in our workforce development.</p>`,
    excerpt: "State-of-the-art training center opens, featuring simulation equipment and modern learning facilities.",
    categorySlug: "hr-training",
    featuredImage: MINING_IMAGES.events[1],
    isFeatured: false,
    isPinned: false,
  },
];

// Events
const eventsData = [
  {
    title: "Annual Safety Excellence Awards",
    slug: "annual-safety-excellence-awards-2024",
    description: "Join us for the Annual Safety Excellence Awards ceremony recognizing outstanding safety performance and contributions.",
    content: `<p>The Annual Safety Excellence Awards celebrates individuals and teams who have made exceptional contributions to workplace safety at ARL.</p>
<h3>Award Categories</h3>
<ul>
<li>Individual Safety Champion</li>
<li>Best Department Safety Record</li>
<li>Safety Innovation Award</li>
<li>Near-Miss Reporter of the Year</li>
</ul>`,
    date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
    time: "2:00 PM - 5:00 PM",
    location: "Main Conference Hall",
    locationDetails: "Building A, Second Floor",
    category: "Company Event",
    organizer: "Health & Safety Department",
    featuredImage: MINING_IMAGES.events[0],
    isFeatured: true,
  },
  {
    title: "First Aid Certification Training",
    slug: "first-aid-certification-training",
    description: "Comprehensive first aid and CPR certification course for all employees. Limited spots available.",
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
    time: "8:00 AM - 4:00 PM",
    location: "Training Center",
    locationDetails: "Room 101",
    category: "Training",
    organizer: "HR Department",
    featuredImage: MINING_IMAGES.events[1],
    registrationRequired: true,
    isFeatured: true,
  },
  {
    title: "Community Football Tournament",
    slug: "community-football-tournament",
    description: "Annual football tournament between ARL teams and community teams. Come support your favorite team!",
    date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 3 weeks from now
    time: "9:00 AM - 6:00 PM",
    location: "ARL Sports Field",
    category: "Sports",
    organizer: "Welfare Committee",
    featuredImage: MINING_IMAGES.events[2],
    isFeatured: false,
  },
  {
    title: "Environmental Awareness Week",
    slug: "environmental-awareness-week",
    description: "Week-long activities focusing on environmental protection and sustainability in mining.",
    date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
    endDate: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000), // 16 days from now
    time: "All Day",
    location: "Various Locations",
    category: "Community",
    organizer: "Environment Department",
    featuredImage: MINING_IMAGES.environment[1],
    isFeatured: true,
  },
];

// Alerts
const alertsData = [
  {
    title: "High Temperature Advisory",
    message: "Due to current weather conditions, all outdoor workers must take mandatory 15-minute breaks every hour. Stay hydrated and watch for signs of heat stress.",
    type: "weather" as const,
    severity: "warning" as const,
    isActive: true,
    showBanner: true,
    showPopup: true,
    endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
  },
  {
    title: "Road Maintenance Notice",
    message: "The main haul road between Pit A and the processing plant will be under maintenance from 6 AM to 6 PM tomorrow. Please use the alternate route.",
    type: "maintenance" as const,
    severity: "info" as const,
    isActive: true,
    showBanner: true,
    showPopup: false,
    endDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
  },
  {
    title: "Emergency Drill Scheduled",
    message: "An emergency evacuation drill will be conducted this Friday at 10:00 AM. All personnel must participate. Report to your designated assembly point.",
    type: "safety" as const,
    severity: "critical" as const,
    isActive: true,
    showBanner: true,
    showPopup: true,
    isPinned: true,
    endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
  },
];

// Photo Albums
const albumsData = [
  {
    title: "Mining Operations 2024",
    slug: "mining-operations-2024",
    description: "Stunning photos showcasing our mining operations and hardworking teams.",
    coverImage: MINING_IMAGES.miningOperations[1],
    date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    isFeatured: true,
    photos: [
      { url: MINING_IMAGES.miningOperations[0], caption: "Haul truck in action", isCover: false },
      { url: MINING_IMAGES.miningOperations[1], caption: "Excavator loading operations", isCover: true },
      { url: MINING_IMAGES.miningOperations[2], caption: "Underground development", isCover: false },
      { url: MINING_IMAGES.miningOperations[3], caption: "Gold processing facility", isCover: false },
    ],
  },
  {
    title: "Safety First - Our PPE in Action",
    slug: "safety-first-ppe-action",
    description: "See how our team prioritizes safety with proper PPE usage across all operations.",
    coverImage: MINING_IMAGES.safety[0],
    date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 2 weeks ago
    isFeatured: true,
    photos: [
      { url: MINING_IMAGES.safety[0], caption: "Full PPE compliance", isCover: true },
      { url: MINING_IMAGES.safety[1], caption: "Hard hat inspection", isCover: false },
      { url: MINING_IMAGES.safety[2], caption: "High visibility gear", isCover: false },
      { url: MINING_IMAGES.safety[3], caption: "Safety equipment storage", isCover: false },
    ],
  },
  {
    title: "Our Amazing Team",
    slug: "our-amazing-team",
    description: "Meet the dedicated men and women who make ARL successful.",
    coverImage: MINING_IMAGES.workers[1],
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
    isFeatured: true,
    photos: [
      { url: MINING_IMAGES.workers[0], caption: "Team briefing session", isCover: false },
      { url: MINING_IMAGES.workers[1], caption: "Our construction crew", isCover: true },
      { url: MINING_IMAGES.workers[2], caption: "Experienced operator", isCover: false },
      { url: MINING_IMAGES.workers[3], caption: "Safety meeting in progress", isCover: false },
    ],
  },
];

// PSI Talks
const toolboxTalksData = [
  {
    title: "Working Safely in Hot Weather",
    slug: "working-safely-hot-weather",
    content: `<h2>Beat the Heat</h2>
<p>As temperatures rise, it's crucial to protect yourself from heat-related illnesses.</p>

<h3>Key Points:</h3>
<ul>
<li>Drink water every 15-20 minutes, even if not thirsty</li>
<li>Wear light-colored, loose-fitting clothing</li>
<li>Take breaks in shaded or air-conditioned areas</li>
<li>Know the signs of heat exhaustion: heavy sweating, weakness, cold/clammy skin</li>
<li>Watch out for your coworkers - look for signs of heat stress</li>
</ul>

<p><strong>Remember:</strong> If you feel unwell, stop work and seek shade immediately!</p>`,
    summary: "Essential tips for staying safe during hot weather conditions.",
    scheduledDate: new Date(), // Today
    status: "published",
    tags: ["heat safety", "hydration", "PPE"],
  },
  {
    title: "Hazard Identification Walk",
    slug: "hazard-identification-walk",
    content: `<h2>See Something, Say Something</h2>
<p>Regular hazard identification is key to preventing accidents before they happen.</p>

<h3>During Your Walk:</h3>
<ul>
<li>Look for slip, trip, and fall hazards</li>
<li>Check for proper equipment guarding</li>
<li>Verify emergency equipment is accessible</li>
<li>Identify any unusual conditions</li>
<li>Report ALL findings - no matter how small</li>
</ul>

<p><strong>Action:</strong> Take 5 minutes before starting work to do a personal hazard identification walk of your work area.</p>`,
    summary: "Learn to identify hazards before they cause accidents.",
    scheduledDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Tomorrow
    status: "published",
    tags: ["hazard identification", "safety walk", "prevention"],
  },
  {
    title: "Proper Lifting Techniques",
    slug: "proper-lifting-techniques",
    content: `<h2>Protect Your Back</h2>
<p>Back injuries are common in mining. Using proper lifting techniques can prevent painful and debilitating injuries.</p>

<h3>The Safe Lift:</h3>
<ol>
<li>Plan your lift - know where you're going</li>
<li>Stand close to the load with feet shoulder-width apart</li>
<li>Bend at the knees, not the waist</li>
<li>Keep your back straight and core engaged</li>
<li>Lift with your legs, not your back</li>
<li>Keep the load close to your body</li>
<li>Avoid twisting while carrying</li>
</ol>

<p><strong>Rule of Thumb:</strong> If it feels too heavy, ask for help or use mechanical assistance!</p>`,
    summary: "Prevent back injuries with proper lifting techniques.",
    scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
    status: "published",
    tags: ["lifting", "ergonomics", "back safety"],
  },
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI not found in environment variables");
    }

    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    // Get or create admin user for author reference
    let adminUser = await AdminUser.findOne({ role: "superadmin" });
    if (!adminUser) {
      console.log("No admin user found. Please create an admin user first.");
      process.exit(1);
    }
    const authorId = adminUser._id;

    // 1. Seed Safety Categories
    console.log("\n📁 Seeding Safety Categories...");
    const categoryMap = new Map();
    for (const cat of safetyCategoriesData) {
      const existing = await SafetyCategory.findOne({ slug: cat.slug });
      if (!existing) {
        const created = await SafetyCategory.create({ ...cat, isActive: true });
        categoryMap.set(cat.slug, created._id);
        console.log(`  ✓ Created category: ${cat.name}`);
      } else {
        categoryMap.set(cat.slug, existing._id);
        console.log(`  - Category exists: ${cat.name}`);
      }
    }

    // 2. Seed News Categories
    console.log("\n📰 Seeding News Categories...");
    const newsCategoryMap = new Map();
    for (const cat of newsCategoriesData) {
      const existing = await NewsCategory.findOne({ slug: cat.slug });
      if (!existing) {
        const created = await NewsCategory.create({ ...cat, isActive: true });
        newsCategoryMap.set(cat.slug, created._id);
        console.log(`  ✓ Created news category: ${cat.name}`);
      } else {
        newsCategoryMap.set(cat.slug, existing._id);
        console.log(`  - News category exists: ${cat.name}`);
      }
    }

    // 3. Seed Safety Tips
    console.log("\n💡 Seeding Safety Tips...");
    for (const tip of safetyTipsData) {
      const existing = await SafetyTip.findOne({ slug: tip.slug });
      if (!existing) {
        const categoryId = categoryMap.get(tip.categorySlug);
        if (categoryId) {
          await SafetyTip.create({
            ...tip,
            category: categoryId,
            author: authorId,
            status: "published",
          });
          console.log(`  ✓ Created safety tip: ${tip.title}`);
        }
      } else {
        console.log(`  - Safety tip exists: ${tip.title}`);
      }
    }

    // 4. Seed Safety Videos
    console.log("\n🎬 Seeding Safety Videos...");
    for (const video of safetyVideosData) {
      const existing = await SafetyVideo.findOne({ slug: video.slug });
      if (!existing) {
        const categoryId = categoryMap.get(video.categorySlug);
        if (categoryId) {
          await SafetyVideo.create({
            ...video,
            category: categoryId,
            author: authorId,
            status: "published",
          });
          console.log(`  ✓ Created safety video: ${video.title}`);
        }
      } else {
        console.log(`  - Safety video exists: ${video.title}`);
      }
    }

    // 5. Seed News Articles
    console.log("\n📰 Seeding News Articles...");
    for (const article of newsArticlesData) {
      const existing = await News.findOne({ slug: article.slug });
      if (!existing) {
        const categoryId = newsCategoryMap.get(article.categorySlug);
        if (categoryId) {
          await News.create({
            ...article,
            category: categoryId,
            author: authorId,
            status: "published",
            publishedAt: new Date(),
          });
          console.log(`  ✓ Created news article: ${article.title}`);
        }
      } else {
        console.log(`  - News article exists: ${article.title}`);
      }
    }

    // 6. Seed Events
    console.log("\n📅 Seeding Events...");
    for (const event of eventsData) {
      const existing = await Event.findOne({ slug: event.slug });
      if (!existing) {
        await Event.create({
          ...event,
          createdBy: authorId,
          status: "published",
        });
        console.log(`  ✓ Created event: ${event.title}`);
      } else {
        console.log(`  - Event exists: ${event.title}`);
      }
    }

    // 7. Seed Alerts
    console.log("\n🚨 Seeding Alerts...");
    // Clear old alerts first
    await Alert.deleteMany({ isActive: true });
    for (const alert of alertsData) {
      await Alert.create({
        ...alert,
        author: authorId,
      });
      console.log(`  ✓ Created alert: ${alert.title}`);
    }

    // 8. Seed Photo Albums
    console.log("\n📷 Seeding Photo Albums...");
    for (const albumData of albumsData) {
      const existing = await Album.findOne({ slug: albumData.slug });
      if (!existing) {
        const album = await Album.create({
          title: albumData.title,
          slug: albumData.slug,
          description: albumData.description,
          coverImage: albumData.coverImage,
          date: albumData.date,
          isFeatured: albumData.isFeatured,
          status: "published",
          createdBy: authorId,
        });

        // Create photos for this album
        for (const photoData of albumData.photos) {
          await Photo.create({
            album: album._id,
            url: photoData.url,
            caption: photoData.caption,
            isCover: photoData.isCover,
            uploadedBy: authorId,
          });
        }
        console.log(`  ✓ Created album: ${albumData.title} with ${albumData.photos.length} photos`);
      } else {
        console.log(`  - Album exists: ${albumData.title}`);
      }
    }

    // 9. Seed PSI Talks
    console.log("\n🗣️ Seeding PSI Talks...");
    for (const talk of toolboxTalksData) {
      const existing = await ToolboxTalk.findOne({ slug: talk.slug });
      if (!existing) {
        await ToolboxTalk.create({
          ...talk,
          author: authorId,
        });
        console.log(`  ✓ Created PSI talk: ${talk.title}`);
      } else {
        // Update the scheduled date to ensure it's current
        await ToolboxTalk.updateOne(
          { slug: talk.slug },
          { scheduledDate: talk.scheduledDate }
        );
        console.log(`  - PSI talk exists (updated date): ${talk.title}`);
      }
    }

    console.log("\n✅ Database seeding completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`   - Safety Categories: ${safetyCategoriesData.length}`);
    console.log(`   - Safety Tips: ${safetyTipsData.length}`);
    console.log(`   - Safety Videos: ${safetyVideosData.length}`);
    console.log(`   - News Categories: ${newsCategoriesData.length}`);
    console.log(`   - News Articles: ${newsArticlesData.length}`);
    console.log(`   - Events: ${eventsData.length}`);
    console.log(`   - Alerts: ${alertsData.length}`);
    console.log(`   - Photo Albums: ${albumsData.length}`);
    console.log(`   - PSI Talks: ${toolboxTalksData.length}`);

  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
    process.exit(0);
  }
}

// Run the seeder
seedDatabase();
