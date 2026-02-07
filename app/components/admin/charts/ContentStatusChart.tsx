import { useState, useEffect, type ComponentType } from "react";
import { Card, CardBody, CardHeader, Chip, Spinner } from "@heroui/react";
import { FileText } from "lucide-react";

interface StatusItem {
  name: string;
  published: number;
  draft: number;
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
  LabelList: ComponentType<any>;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export function ContentStatusChart({ data }: { data: StatusItem[] }) {
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
          LabelList: mod.LabelList,
        });
      })
      .catch(() => {
        // recharts failed to load — leave modules null to show spinner/fallback
      });
  }, []);

  const hasData = data.some((d) => d.published > 0 || d.draft > 0);
  const totalItems = data.reduce(
    (sum, d) => sum + d.published + d.draft,
    0,
  );

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText size={20} className="text-[#c7a262]" />
            <h2 className="text-lg font-semibold text-gray-900">
              Content Status
            </h2>
          </div>
          {hasData && (
            <Chip size="sm" variant="flat" color="warning">
              {totalItems}
            </Chip>
          )}
        </div>
      </CardHeader>
      <CardBody className="pt-0">
        {!hasData ? (
          <p className="py-8 text-center text-sm text-gray-400">
            No content status data
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
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const published =
    payload.find((p: any) => p.dataKey === "published")?.value ?? 0;
  const draft = payload.find((p: any) => p.dataKey === "draft")?.value ?? 0;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg">
      <p className="mb-1.5 text-xs font-medium text-gray-700">{label}</p>
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        <span className="text-xs text-gray-600">Published</span>
        <span className="ml-auto text-xs font-semibold text-gray-900">
          {published}
        </span>
      </div>
      <div className="mt-1 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-amber-500" />
        <span className="text-xs text-gray-600">Draft</span>
        <span className="ml-auto text-xs font-semibold text-gray-900">
          {draft}
        </span>
      </div>
      <div className="mt-1.5 border-t border-gray-100 pt-1.5 text-xs font-semibold text-gray-900">
        Total: {published + draft}
      </div>
    </div>
  );
}

function renderLabel(props: any) {
  const { x, y, width, height, value } = props;
  if (!value || value === 0) return null;
  return (
    <text
      x={x + width + 4}
      y={y + height / 2}
      fill="#6b7280"
      fontSize={11}
      dominantBaseline="central"
    >
      {value}
    </text>
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
  const {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
    LabelList,
  } = modules;

  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <Chip
          size="sm"
          variant="dot"
          classNames={{ dot: "bg-emerald-500" }}
        >
          Published
        </Chip>
        <Chip
          size="sm"
          variant="dot"
          classNames={{ dot: "bg-amber-500" }}
        >
          Draft
        </Chip>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 10, bottom: 0 }}
        >
          <defs>
            <linearGradient
              id="publishedGradient"
              x1="0"
              y1="0"
              x2="1"
              y2="0"
            >
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={1} />
            </linearGradient>
            <linearGradient
              id="draftGradient"
              x1="0"
              y1="0"
              x2="1"
              y2="0"
            >
              <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity={1} />
            </linearGradient>
          </defs>
          <CartesianGrid
            stroke="#f0f0f0"
            strokeDasharray="3 3"
            horizontal={false}
          />
          <XAxis
            type="number"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "#9ca3af" }}
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "#6b7280" }}
            width={90}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f9fafb" }} />
          <Bar
            dataKey="published"
            fill="url(#publishedGradient)"
            radius={[0, 4, 4, 0]}
            barSize={16}
            name="Published"
            animationDuration={800}
            animationEasing="ease-out"
          >
            <LabelList dataKey="published" content={renderLabel} />
          </Bar>
          <Bar
            dataKey="draft"
            fill="url(#draftGradient)"
            radius={[0, 4, 4, 0]}
            barSize={16}
            name="Draft"
            animationDuration={800}
            animationEasing="ease-out"
          >
            <LabelList dataKey="draft" content={renderLabel} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
