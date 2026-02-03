/**
 * Public About Us Page
 * Display company vision, mission, and core values
 */

import { Card, CardBody, Divider } from "@heroui/react";
import { Target, Eye, Heart, Shield, Users, Award } from "lucide-react";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { MainLayout } from "~/components/layout";
import { connectDB } from "~/lib/db/connection.server";
import {
  getCompanyInfo,
  serializeCompanyInfo,
} from "~/lib/services/company-info.server";

interface CoreValue {
  title: string;
  description: string;
  icon?: string;
}

interface CompanyInfoData {
  _id: string;
  vision: string;
  mission: string;
  coreValues: CoreValue[];
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

interface LoaderData {
  companyInfo: CompanyInfoData | null;
}

// Icon mapping for core values
const iconMap: Record<string, React.ElementType> = {
  shield: Shield,
  heart: Heart,
  users: Users,
  award: Award,
  target: Target,
  eye: Eye,
};

export async function loader({ request }: LoaderFunctionArgs) {
  await connectDB();

  const companyInfo = await getCompanyInfo();

  return Response.json({
    companyInfo: companyInfo ? serializeCompanyInfo(companyInfo) : null,
  });
}

export default function AboutPage() {
  const { companyInfo } = useLoaderData<LoaderData>();

  if (!companyInfo) {
    return (
      <MainLayout>
        <div className="container mx-auto max-w-6xl px-4 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">About Us</h1>
            <p className="mt-4 text-gray-500">
              Company information is being updated. Please check back later.
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-gray-900">About Us</h1>
          <p className="mt-2 text-lg text-gray-600">
            Our Vision, Mission, and Core Values
          </p>
        </div>

        {/* Vision & Mission */}
        <div className="mb-12 grid gap-8 md:grid-cols-2">
          {/* Vision */}
          <Card className="border-t-4 border-t-primary-500 shadow-lg">
            <CardBody className="p-8">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100">
                  <Eye size={24} className="text-primary-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Our Vision</h2>
              </div>
              <Divider className="my-4" />
              <p className="whitespace-pre-line text-lg leading-relaxed text-gray-700">
                {companyInfo.vision}
              </p>
            </CardBody>
          </Card>

          {/* Mission */}
          <Card className="border-t-4 border-t-secondary-500 shadow-lg">
            <CardBody className="p-8">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100">
                  <Target size={24} className="text-gray-700" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Our Mission</h2>
              </div>
              <Divider className="my-4" />
              <p className="whitespace-pre-line text-lg leading-relaxed text-gray-700">
                {companyInfo.mission}
              </p>
            </CardBody>
          </Card>
        </div>

        {/* Core Values */}
        {companyInfo.coreValues && companyInfo.coreValues.length > 0 && (
          <div>
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold text-gray-900">
                Our Core Values
              </h2>
              <p className="mt-2 text-gray-600">
                The principles that guide everything we do
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {companyInfo.coreValues.map((value, index) => {
                const IconComponent =
                  iconMap[value.icon?.toLowerCase() || ""] || Heart;

                return (
                  <Card
                    key={index}
                    className="transition-shadow hover:shadow-lg"
                  >
                    <CardBody className="p-6">
                      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary-100">
                        <IconComponent size={28} className="text-primary-600" />
                      </div>
                      <h3 className="mb-2 text-xl font-bold text-gray-900">
                        {value.title}
                      </h3>
                      <p className="text-gray-600">{value.description}</p>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
