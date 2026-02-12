import { useState, useEffect, useCallback, type ComponentType } from "react";
import { Card, CardBody, CardHeader, Spinner } from "@heroui/react";
import { PieChart as PieChartIcon } from "lucide-react";

interface ContentItem {
  name: string;
  value: number;
  color: string;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
interface RechartsModules {
  PieChart: ComponentType<any>;
  Pie: ComponentType<any>;
  Cell: ComponentType<any>;
  ResponsiveContainer: ComponentType<any>;
  Tooltip: ComponentType<any>;
  Label: ComponentType<any>;
  Sector: ComponentType<any>;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export function ContentDistributionChart({ data }: { data: ContentItem[] }) {
  const [modules, setModules] = useState<RechartsModules | null>(null);

  useEffect(() => {
    import("recharts")
      .then((mod) => {
        setModules({
          PieChart: mod.PieChart,
          Pie: mod.Pie,
          Cell: mod.Cell,
          ResponsiveContainer: mod.ResponsiveContainer,
          Tooltip: mod.Tooltip,
          Label: mod.Label,
          Sector: mod.Sector,
        });
      })
      .catch(() => {
        // recharts failed to load — leave modules null to show spinner/fallback
      });
  }, []);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <PieChartIcon size={20} className="text-[#c7a262]" />
          <h2 className="text-lg font-semibold text-gray-900">
            Content Distribution
          </h2>
        </div>
      </CardHeader>
      <CardBody className="pt-0">
        {total === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">
            No content data available
          </p>
        ) : modules ? (
          <DonutChart data={data} total={total} modules={modules} />
        ) : (
          <div className="flex h-[300px] items-center justify-center">
            <Spinner size="lg" color="warning" />
          </div>
        )}
      </CardBody>
    </Card>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function renderActiveShape(props: any, Sector: ComponentType<any>) {
  const {
    cx,
    cy,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
  } = props;

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.15))" }}
      />
    </g>
  );
}

function CustomTooltip({ active, payload, total }: any) {
  if (!active || !payload?.length) return null;
  const { name, value, color } = payload[0].payload;
  const pct = total > 0 ? ((value / total) * 100).toFixed(1) : "0";
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg">
      <div className="flex items-center gap-2">
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className="text-xs font-medium text-gray-700">{name}</span>
      </div>
      <div className="mt-1 text-sm font-semibold text-gray-900">
        {value} <span className="font-normal text-gray-500">({pct}%)</span>
      </div>
    </div>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function CenterLabel({
  viewBox,
  total,
}: {
  viewBox?: { cx: number; cy: number };
  total: number;
}) {
  if (!viewBox) return null;
  const { cx, cy } = viewBox;
  return (
    <g>
      <text
        x={cx}
        y={cy - 6}
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-gray-900 text-xl font-bold"
      >
        {total}
      </text>
      <text
        x={cx}
        y={cy + 14}
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-gray-400 text-[10px]"
      >
        Total Items
      </text>
    </g>
  );
}

function DonutChart({
  data,
  total,
  modules,
}: {
  data: ContentItem[];
  total: number;
  modules: RechartsModules;
}) {
  const { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Label, Sector } =
    modules;
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

  const onMouseEnter = useCallback((_: unknown, index: number) => {
    setActiveIndex(index);
  }, []);

  const onMouseLeave = useCallback(() => {
    setActiveIndex(undefined);
  }, []);

  return (
    <div>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
            activeIndex={activeIndex}
            activeShape={(props: unknown) => renderActiveShape(props, Sector)}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            animationDuration={800}
            animationEasing="ease-out"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                style={{ cursor: "pointer" }}
              />
            ))}
            <Label
              content={<CenterLabel total={total} />}
              position="center"
            />
          </Pie>
          <Tooltip content={<CustomTooltip total={total} />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
        {data.map((item) => {
          const pct =
            total > 0 ? ((item.value / total) * 100).toFixed(0) : "0";
          return (
            <div key={item.name} className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="truncate text-xs text-gray-600">
                {item.name}
              </span>
              <span className="ml-auto whitespace-nowrap text-xs font-semibold text-gray-900">
                {item.value}{" "}
                <span className="font-normal text-gray-400">({pct}%)</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
