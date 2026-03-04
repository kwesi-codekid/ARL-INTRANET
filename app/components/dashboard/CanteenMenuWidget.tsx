/**
 * Canteen Menu Widget
 * Task: 1.2.4.2.6 - Add homepage today's menu widget
 */

import { Card, CardBody, CardHeader, Chip, Divider, Button } from "@heroui/react";
import { UtensilsCrossed, Sun, ArrowRight } from "lucide-react";
import { Link } from "react-router";
import type { SerializedMenu } from "~/lib/utils/menu-constants";
import { dietaryInfo, mealTimeInfo } from "~/lib/utils/menu-constants";

interface CanteenMenuWidgetProps {
  menu: SerializedMenu | null;
}

export function CanteenMenuWidget({ menu }: CanteenMenuWidgetProps) {
  const currentMeal = menu?.meals.find((m) => m.type === "lunch");

  return (
    <Card className="shadow-sm h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <UtensilsCrossed size={18} className="text-primary" />
          <h3 className="font-semibold text-gray-900">Today's Menu</h3>
        </div>
        <Chip size="sm" color="primary" variant="flat">
          {mealTimeInfo.lunch.label}
        </Chip>
      </CardHeader>
      <Divider />
      <CardBody className="pt-3">
        {menu && currentMeal ? (
          <div className="space-y-3">
            {/* Current Meal Items */}
            <ul className="space-y-2">
              {currentMeal.items
                .filter((item) => item.isAvailable)
                .slice(0, 4)
                .map((item, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <span className="text-primary">•</span>
                    <span className="text-sm text-gray-700 flex-1">{item.name}</span>
                    {item.dietary.slice(0, 2).map((d) => (
                      <span key={d} title={dietaryInfo[d].label}>
                        {dietaryInfo[d].icon}
                      </span>
                    ))}
                  </li>
                ))}
            </ul>

            {currentMeal.items.filter((i) => i.isAvailable).length > 4 && (
              <p className="text-xs text-gray-500">
                +{currentMeal.items.filter((i) => i.isAvailable).length - 4} more items
              </p>
            )}

            <Divider />

            {/* Time Info */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                Serving: {currentMeal.startTime || mealTimeInfo.lunch.defaultStart} -{" "}
                {currentMeal.endTime || mealTimeInfo.lunch.defaultEnd}
              </span>
            </div>
          </div>
        ) : (
          <div className="py-4 text-center">
            <UtensilsCrossed size={32} className="mx-auto mb-2 text-gray-300" />
            <p className="text-sm text-gray-500">No menu available today</p>
          </div>
        )}

        <Button
          as={Link}
          to="/canteen"
          color="primary"
          variant="flat"
          size="sm"
          fullWidth
          endContent={<ArrowRight size={16} />}
          className="mt-3"
        >
          View Full Menu
        </Button>
      </CardBody>
    </Card>
  );
}
