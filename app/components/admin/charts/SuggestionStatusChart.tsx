import { useState, useEffect, type ComponentType } from "react";
import { Card, CardBody, CardHeader, Chip, Spinner } from "@heroui/react";
import { BarChart3 } from "lucide-react";

interface StatusItem {
  status: string;
  label: string;
  value: number;
  color: string;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
interface RechartsModules {
  BarChart: ComponentType<any>;
  Bar: ComponentType<any>;
  XAxis: ComponentType<any>;
  YAxis: ComponentType<any>;
  Tooltip: ComponentType<any>;
  ResponsiveContainer: ComponentType<any>;
  CartesianGrid: ComponentType<any>;
  Cell: ComponentType<any>;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export function SuggestionStatusChart({ data }: { data: StatusItem[] }) {
  const [modules, setModules] = useState<RechartsModules | null>(null);

  useEffect(() => {
    import("recharts")
      .then((mod) => {
        setModules({
          BarChart: mod.BarChart,
          Bar: mod.Bar,
          XAxis: mod.XAxis,
          YAxis: mod.YAxis,
          Tooltip: mod.Tooltip,
          ResponsiveContainer: mod.ResponsiveContainer,
          CartesianGrid: mod.CartesianGrid,
          Cell: mod.Cell,
        });
      })
      .catch(() => {});
  }, []);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 size={20} className="text-[#c7a262]" />
            <h2 className="text-lg font-semibold text-gray-900">By Status</h2>
          </div>
          {total > 0 && (
            <Chip size="sm" variant="flat" color="warning">
              {total}
            </Chip>
          )}
        </div>
      </CardHeader>
      <CardBody className="pt-0">
        {total === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">
            No data available
          </p>
        ) : modules ? (
          <BarChartContent data={data} modules={modules} />
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
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload as StatusItem;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg">
      <div className="flex items-center gap-2">
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: item.color }}
        />
        <span className="text-xs font-medium text-gray-700">{item.label}</span>
      </div>
      <p className="mt-1 text-sm font-semibold text-gray-900">
        {item.value} {item.value === 1 ? "suggestion" : "suggestions"}
      </p>
    </div>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function BarChartContent({
  data,
  modules,
}: {
  data: StatusItem[];
  modules: RechartsModules;
}) {
  const { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } =
    modules;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart
        data={data}
        margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
      >
        <CartesianGrid
          stroke="#f0f0f0"
          strokeDasharray="3 3"
          vertical={false}
        />
        <XAxis
          dataKey="label"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fill: "#6b7280" }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fill: "#9ca3af" }}
          allowDecimals={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f9fafb" }} />
        <Bar
          dataKey="value"
          radius={[4, 4, 0, 0]}
          barSize={40}
          animationDuration={800}
          animationEasing="ease-out"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
