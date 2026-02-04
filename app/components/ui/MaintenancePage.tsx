/**
 * Maintenance Page Component
 * Displayed when maintenance mode is enabled
 */

import { Card, CardBody, Button } from "@heroui/react";
import { Wrench, AlertTriangle, ArrowLeft } from "lucide-react";

interface MaintenancePageProps {
  message?: string;
  showAdminLink?: boolean;
}

export function MaintenancePage({
  message = "We're currently performing scheduled maintenance. Please check back soon.",
  showAdminLink = false,
}: MaintenancePageProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 px-4">
      <Card className="max-w-lg w-full shadow-xl">
        <CardBody className="p-8 text-center">
          {/* Animated Icon */}
          <div className="relative mx-auto mb-6 w-24 h-24">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-amber-100 animate-pulse" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Wrench size={40} className="text-amber-600" />
            </div>
          </div>

          {/* Alert Badge */}
          <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <AlertTriangle size={16} />
            <span>Maintenance in Progress</span>
          </div>

          {/* Main Message */}
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            We'll be right back!
          </h1>

          <p className="text-gray-600 mb-6 leading-relaxed">{message}</p>

          {/* Info Box */}
          <div className="bg-gray-50 rounded-lg p-4 text-left mb-6">
            <p className="text-sm text-gray-500">
              <strong className="text-gray-700">What's happening?</strong>
              <br />
              Our team is working to improve your experience. The intranet will
              be back online shortly.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              color="primary"
              variant="flat"
              onPress={() => window.location.reload()}
              startContent={<ArrowLeft size={16} />}
            >
              Try Again
            </Button>

            {showAdminLink && (
              <Button
                as="a"
                href="/admin"
                color="default"
                variant="bordered"
              >
                Go to Admin
              </Button>
            )}
          </div>

          {/* Footer */}
          <p className="text-xs text-gray-400 mt-6">
            ARL Intranet - Adamus Resources Limited
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
