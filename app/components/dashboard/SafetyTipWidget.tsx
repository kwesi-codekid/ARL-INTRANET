/**
 * Safety Tip of the Day Widget
 * Task: 1.2.2.2.5 - Add homepage "Safety Tip" widget
 */

import { Card, CardBody, CardHeader, Button, Chip } from "@heroui/react";
import { Shield, ArrowRight, Lightbulb } from "lucide-react";
import { Link } from "react-router";
import type { SerializedSafetyTip } from "~/lib/services/safety.server";

interface SafetyTipWidgetProps {
  tip: SerializedSafetyTip | null;
}

export function SafetyTipWidget({ tip }: SafetyTipWidgetProps) {
  if (!tip) {
    return (
      <Card className="shadow-sm">
        <CardHeader className="flex items-center gap-3 pb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
            <Shield size={20} className="text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Safety Tip</h3>
            <p className="text-xs text-gray-500">Daily reminder</p>
          </div>
        </CardHeader>
        <CardBody className="pt-0">
          <div className="rounded-lg bg-gray-50 p-4 text-center">
            <Lightbulb size={32} className="mx-auto mb-2 text-gray-300" />
            <p className="text-sm text-gray-500">No tip available today</p>
            <Button
              as={Link}
              to="/safety-tips"
              size="sm"
              variant="flat"
              color="success"
              className="mt-3"
            >
              Browse Tips
            </Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm overflow-hidden">
      <CardHeader className="flex items-center gap-3 pb-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
          <Shield size={20} className="text-green-600" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">Safety Tip</h3>
            <Chip size="sm" color="success" variant="flat">
              Today
            </Chip>
          </div>
          <p className="text-xs text-gray-500">Daily reminder</p>
        </div>
      </CardHeader>

      <CardBody className="pt-0 space-y-3">
        {tip.featuredImage && (
          <Link to={`/safety-tips/${tip.slug}`} className="block">
            <div className="relative h-32 w-full overflow-hidden rounded-lg bg-gray-900">
              <img
                src={tip.featuredImage}
                alt={tip.title}
                className="h-full w-full object-contain sm:object-cover"
              />
            </div>
          </Link>
        )}

        <div>
          {tip.category && (
            <Chip
              size="sm"
              variant="flat"
              className="mb-2"
              style={{
                backgroundColor: `${tip.category.color}20`,
                color: tip.category.color,
              }}
            >
              {tip.category.name}
            </Chip>
          )}
          <Link
            to={`/safety-tips/${tip.slug}`}
            className="font-semibold text-gray-900 hover:text-green-600 line-clamp-2 block"
          >
            {tip.title}
          </Link>
          <p className="mt-1 text-sm text-gray-600 line-clamp-2">{tip.summary}</p>
        </div>

        <Button
          as={Link}
          to={`/safety-tips/${tip.slug}`}
          color="success"
          variant="flat"
          fullWidth
          endContent={<ArrowRight size={16} />}
        >
          Read Full Tip
        </Button>
      </CardBody>
    </Card>
  );
}

export default SafetyTipWidget;
