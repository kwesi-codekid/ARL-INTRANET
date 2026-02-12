import { useState, useEffect, type ComponentType } from "react";
import { Card, CardBody, CardHeader, Chip, Spinner } from "@heroui/react";
import { TrendingUp } from "lucide-react";

interface TimelineItem {
  day: string;
  count: number;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
interface RechartsModules {
  AreaChart: ComponentType<any>;
  Area: ComponentType<any>;
  XAxis: ComponentType<any>;
  YAxis: ComponentType<any>;
  Tooltip: ComponentType<any>;
  ResponsiveContainer: ComponentType<any>;
  CartesianGrid: ComponentType<any>;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export function ActivityTimelineChart({ data }: { data: TimelineItem[] }) {
  const [modules, setModules] = useState<RechartsModules | null>(null);

  useEffect(() => {
    import("recharts")
      .then((mod) => {
        setModules({
          AreaChart: mod.AreaChart,
          Area: mod.Area,
          XAxis: mod.XAxis,
          YAxis: mod.YAxis,
          Tooltip: mod.Tooltip,
          ResponsiveContainer: mod.ResponsiveContainer,
          CartesianGrid: mod.CartesianGrid,
        });
      })
      .catch(() => {
        // recharts failed to load — leave modules null to show spinner/fallback
      });
  }, []);

  const total = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp size={20} className="text-[#c7a262]" />
            <h2 className="text-lg font-semibold text-gray-900">
              Activity (Last 7 Days)
            </h2>
          </div>
          <Chip size="sm" variant="flat" color="warning">
            {total}
          </Chip>
        </div>
      </CardHeader>
      <CardBody className="pt-0">
        {total === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">
            No activity in the last 7 days
          </p>
        ) : modules ? (
          <AreaChartContent data={data} modules={modules} />
        ) : (
          <div className="flex h-[220px] items-center justify-center">
            <Spinner size="lg" color="warning" />
          </div>
        )}
      </CardBody>
    </Card>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const count = payload[0].value as number;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-gray-900">
        {count} {count === 1 ? "action" : "actions"}
      </p>
    </div>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function AreaChartContent({
  data,
  modules,
}: {
  data: TimelineItem[];
  modules: RechartsModules;
}) {
  const {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
  } = modules;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart
        data={data}
        margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
      >
        <defs>
          <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c7a262" stopOpacity={0.4} />
            <stop offset="50%" stopColor="#c7a262" stopOpacity={0.15} />
            <stop offset="100%" stopColor="#c7a262" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid
          stroke="#f0f0f0"
          strokeDasharray="3 3"
          vertical={false}
        />
        <XAxis
          dataKey="day"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fill: "#9ca3af" }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fill: "#9ca3af" }}
          allowDecimals={false}
        />
        <Tooltip
          content={<CustomTooltip />}
          cursor={{ stroke: "#c7a262", strokeWidth: 1, strokeDasharray: "4 4" }}
        />
        <Area
          type="monotone"
          dataKey="count"
          stroke="#c7a262"
          strokeWidth={2.5}
          strokeLinecap="round"
          fill="url(#goldGradient)"
          dot={false}
          activeDot={{
            r: 5,
            fill: "#c7a262",
            stroke: "#fff",
            strokeWidth: 2,
            style: { filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.15))" },
          }}
          animationDuration={800}
          animationEasing="ease-out"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
