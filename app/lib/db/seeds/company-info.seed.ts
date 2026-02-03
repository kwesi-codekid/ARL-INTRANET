/**
 * Seed Company Info
 */

import { connectDB } from "~/lib/db/connection.server";
import { CompanyInfo } from "~/lib/db/models/company-info.server";

export async function seedCompanyInfo() {
  await connectDB();

  // Check if company info already exists
  const existing = await CompanyInfo.findOne();
  if (existing) {
    console.log("Company info already exists, skipping seed");
    return;
  }

  const companyInfo = await CompanyInfo.create({
    vision:
      "To be the leading responsible gold mining company in West Africa, setting the standard for operational excellence, sustainable practices, and community development.",
    mission:
      "We are committed to safely and responsibly extracting gold while creating lasting value for our shareholders, employees, host communities, and the nation of Ghana. We achieve this through:\n\n• Prioritizing the health and safety of our workforce\n• Implementing environmentally sustainable mining practices\n• Investing in the development of our local communities\n• Maintaining the highest standards of corporate governance\n• Fostering a culture of continuous improvement and innovation",
    coreValues: [
      {
        title: "Safety First",
        description:
          "The safety and well-being of our employees, contractors, and communities is our top priority. We believe every incident is preventable.",
        icon: "shield",
      },
      {
        title: "Integrity",
        description:
          "We conduct our business with honesty, transparency, and ethical behavior. We honor our commitments and take responsibility for our actions.",
        icon: "award",
      },
      {
        title: "Respect",
        description:
          "We treat everyone with dignity and respect, valuing diverse perspectives and creating an inclusive workplace where all can thrive.",
        icon: "heart",
      },
      {
        title: "Excellence",
        description:
          "We strive for excellence in everything we do, continuously improving our operations and challenging ourselves to achieve better results.",
        icon: "target",
      },
      {
        title: "Teamwork",
        description:
          "We work together as one team, collaborating across departments and supporting each other to achieve our shared goals.",
        icon: "users",
      },
      {
        title: "Community",
        description:
          "We are committed to being a responsible corporate citizen, investing in the communities where we operate and leaving a positive legacy.",
        icon: "heart",
      },
    ],
  });

  console.log("Company info seeded successfully:", companyInfo._id);
  return companyInfo;
}
