import {
  Bar,
  CartesianGrid,
  BarChart as RechartsBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import styled from 'styled-components';

export interface BarDatum {
  label: string;
  value: number;
}

interface BarChartProps {
  data: readonly BarDatum[];
  /** Full value, e.g. "$102,000" (tooltip and screen-reader list). */
  formatValue: (value: number) => string;
  /** Short value for the axis, e.g. "$100K". */
  formatTick: (value: number) => string;
}

const ROW_HEIGHT = 36;
const AXIS_SPACE = 40;
const CATEGORY_AXIS_WIDTH = 120;

/**
 * A single-series bar chart in the brand colour, with horizontal bars: each category gets its own
 * row with its label on the left, so labels never overlap — at any screen width, and however long
 * the labels are (country names, salary ranges like "$100K–$125K"). The chart grows with the rows.
 *
 * Colours come from CSS (theme tokens), so the chart follows light/dark mode. The same numbers are
 * also given as a visually hidden list for screen readers.
 */
export function BarChart({ data, formatValue, formatTick }: BarChartProps) {
  const height = data.length * ROW_HEIGHT + AXIS_SPACE;

  return (
    <Figure>
      <ResponsiveContainer width="100%" height={height} initialDimension={{ width: 600, height }}>
        <RechartsBarChart
          data={[...data]}
          // Recharts names layouts by axis direction: "vertical" layout = horizontal bars.
          layout="vertical"
          margin={{ top: 4, right: 16, bottom: 4, left: 4 }}
        >
          <CartesianGrid horizontal={false} />
          <XAxis type="number" tickFormatter={formatTick} tickLine={false} axisLine={false} />
          <YAxis
            type="category"
            dataKey="label"
            tickLine={false}
            interval={0}
            width={CATEGORY_AXIS_WIDTH}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              const value = payload?.[0]?.value;
              if (!active || typeof value !== 'number') return null;
              return (
                <TooltipBox>
                  <strong>{label}</strong>
                  <span>{formatValue(value)}</span>
                </TooltipBox>
              );
            }}
          />
          <Bar
            dataKey="value"
            name="Value"
            radius={[0, 4, 4, 0]}
            maxBarSize={32}
            isAnimationActive={false}
          />
        </RechartsBarChart>
      </ResponsiveContainer>

      <ul className="visually-hidden">
        {data.map((datum) => (
          <li key={datum.label}>
            {datum.label}: {formatValue(datum.value)}
          </li>
        ))}
      </ul>
    </Figure>
  );
}

/** Recharts draws SVG; these rules colour it from the theme (CSS beats SVG attributes). */
const Figure = styled.figure`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.xs};

  .recharts-cartesian-grid line {
    stroke: ${({ theme }) => theme.colors.chartGrid};
  }

  .recharts-cartesian-axis-tick-value {
    fill: ${({ theme }) => theme.colors.textMuted};
  }

  .recharts-bar-rectangle path {
    fill: ${({ theme }) => theme.colors.chartBar};
  }

  .recharts-bar-rectangle:hover path {
    fill: ${({ theme }) => theme.colors.chartBarHover};
  }

  .recharts-tooltip-cursor {
    fill: ${({ theme }) => theme.colors.surfaceMuted};
  }
`;

const TooltipBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadows.md};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-variant-numeric: tabular-nums;
`;
