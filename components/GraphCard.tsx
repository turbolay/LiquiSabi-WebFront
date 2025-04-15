"use client"

import React from 'react';
import { useState, useEffect, useMemo } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, TooltipProps } from 'recharts'
import { ChartContainer } from "@/components/ui/chart"
import { fetchGraphData } from '@/lib/api'

interface GraphCardProps {
  useUTC: boolean
  selectedCoordinators: string[]
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const createCustomScale = (domain: number[], ticks: number[]) => {
  let currentDomain = domain;
  let currentRange = [0, 1];

  const scale = (value: number) => {
    let rangeStarting0 = [currentRange[0], 0]
    if (value < ticks[0]) {
      return rangeStarting0[0];
    }
    if (value > ticks[ticks.length - 1]) {
      return rangeStarting0[1];
    }

    let lowerIndex = 0;
    for (let i = 0; i < ticks.length - 1; i++) {
      if (value >= ticks[i] && value <= ticks[i + 1]) {
        lowerIndex = i;
        break;
      }
    }

    const lowerTick = ticks[lowerIndex];
    const upperTick = ticks[lowerIndex + 1];
    const intervalPosition = (value - lowerTick) / (upperTick - lowerTick);
    const rangeSize = rangeStarting0[1] - rangeStarting0[0];
    const segmentSize = rangeSize / (ticks.length - 1);
    const startY = rangeStarting0[1] - (lowerIndex * segmentSize);
    const endY = rangeStarting0[1] - ((lowerIndex + 1) * segmentSize);

    return rangeStarting0[0] - (startY - (intervalPosition * (startY - endY)));
  };

  scale.domain = function(d?: number[]) {
    if (!arguments.length) return currentDomain;
    if (d) currentDomain = d;
    return scale;
  };

  scale.range = function(r?: number[]) {
    if (!arguments.length) return currentRange;
    if (r) currentRange = r;
    return scale;
  };

  scale.ticks = function() {
    return ticks;
  };

  scale.tickFormat = () => String;
  scale.bandwidth = () => 0;
  scale.copy = () => createCustomScale(currentDomain, ticks);

  return scale;
};

const formatYAxisTick = (value: number) => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
};

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <div className="bg-[#2a2a2a] border border-[#3a3a3a] p-2 rounded">
      <p className="text-[#DBDBDB]">{`Date: ${label}`}</p>
      {payload.map((entry, index) => {
        let value = entry.value;
        // Don't format coordinator earnings, format others to 2 decimal places
        if (entry.name !== 'Coordinator Earnings (BTC)' && 
          entry.name !== 'Input Count' && 
          entry.name !== 'Number of Rounds' 
        ) {
          value = Number(value).toFixed(2);
        }
        return (
          <p key={index} style={{ color: entry.color }}>
            {`${entry.name}: ${value}`}
          </p>
        );
      })}
    </div>
  );
};

const getDynamicDomainAndTicks = (data: any[], visibleMetrics: Record<string, boolean>) => {
  const allTicks = [0, 0.0001, 0.0005, 0.001, 0.01, 0.1, 1, 2, 10, 25, 100, 250, 500];
  let minValue = Infinity;
  let maxValue = -Infinity;
  const values: number[] = [];

  data.forEach(entry => {
    Object.entries(visibleMetrics).forEach(([key, isVisible]) => {
      if (isVisible && entry[key] !== undefined) {
        const value = entry[key];
        values.push(value);
        minValue = Math.min(minValue, value);
        maxValue = Math.max(maxValue, value);
      }
    });
  });

  const lowerTick = allTicks.reverse().find(tick => tick <= minValue) || allTicks[allTicks.length - 1];
  allTicks.reverse();
  const upperTick = allTicks.find(tick => tick >= maxValue) || allTicks[allTicks.length - 1];
  const lowerIndex = allTicks.indexOf(lowerTick);
  const upperIndex = allTicks.indexOf(upperTick);

  const domain = [lowerTick, upperTick];
  const candidateTicks = allTicks.slice(lowerIndex, upperIndex + 1);

  const hasValuesInInterval = candidateTicks.map((tick, index) => {
    const nextTick = candidateTicks[index + 1] || Infinity;
    return values.some(value => 
      value >= tick && 
      (index === candidateTicks.length - 1 ? value <= nextTick : value < nextTick)
    );
  });

  const filteredTicks = candidateTicks.filter((_, index) => 
    hasValuesInInterval[index] || 
    hasValuesInInterval[index - 1]
  );

  return { domain, ticks: filteredTicks };
};

export default function Component({ useUTC, selectedCoordinators }: GraphCardProps) {
  const [graphData, setGraphData] = useState([])
  const [loading, setLoading] = useState(true)
  const [visibleMetrics, setVisibleMetrics] = useState({})
  const [collapsed, setCollapsed] = useState(false)

  const colors = [
    "#5298E1",
    "#56D5AA",
    "#EA9540",
    "#3C8401",
    "#DE4478",
    "#B35FDD",
    "#FFFFFF"
  ]

  const metrics = [
    { key: 'EstimatedCoordinatorEarningsSats', label: 'Coordinator Earnings (BTC)' },
    { key: 'InputCount', label: 'Input Count' },
    { key: 'TotalInputAmount', label: 'Input Amount (BTC)' },
    { key: 'FreshInputsEstimateBtc', label: 'Fresh Inputs Estimate (BTC)' },
    { key: 'AverageStandardOutputsAnonSet', label: 'Standard Outputs Anon Set' },
    { key: 'FinalMiningFeeRate', label: 'Mining Fee Rate' },
    { key: 'TxId', label: 'Number of Rounds' },
  ]

  useEffect(() => {
    const initialVisibility = metrics.reduce((acc, metric) => {
      acc[metric.key] = true;
      return acc;
    }, {});
    setVisibleMetrics(initialVisibility);
  }, []);

  useEffect(() => {
    const loadGraphData = async () => {
      setLoading(true)
      try {
        const data = await fetchGraphData(selectedCoordinators)
        const processedData = data.map(entry => ({
          date: entry.Date,
          EstimatedCoordinatorEarningsSats: ((entry.Averages?.EstimatedCoordinatorEarningsSats ?? 0) / 100000000),
          FinalMiningFeeRate: entry.Averages?.FinalMiningFeeRate ?? 0,
          InputCount: entry.Averages?.InputCount ?? 0,
          TotalInputAmount: ((entry.Averages?.TotalInputAmount ?? 0) / 100000000),
          FreshInputsEstimateBtc: entry.Averages?.FreshInputsEstimateBtc ?? 0,
          AverageStandardOutputsAnonSet: entry.Averages?.AverageStandardOutputsAnonSet ?? 0,
          TxId: entry.Averages?.TxId ?? 0
        }));
        setGraphData(processedData)
      } catch (error) {
        console.error("Error fetching graph data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadGraphData()
  }, [selectedCoordinators])

  const formatXAxis = (date: string) => {
    const [day, month] = date.split('/')
    return `${day}/${month}`
  }

  const handleLegendClick = (entry, event) => {
    const metricKey = metrics.find(m => m.label === entry.value)?.key;
    if (metricKey) {
      if (event.shiftKey) {
        setVisibleMetrics(prev => {
          const newState = Object.keys(prev).reduce((acc, key) => {
            acc[key] = false;
            return acc;
          }, {});
          newState[metricKey] = true;
          return newState;
        });
      } else {
        setVisibleMetrics(prev => {
          const newState = { ...prev };
          if (Object.values(newState).filter(Boolean).length === 1 && newState[metricKey]) {
            Object.keys(newState).forEach(key => {
              newState[key] = true;
            });
          } else {
            newState[metricKey] = !newState[metricKey];
          }
          return newState;
        });
      }
    }
  };

  const chartConfig = metrics.reduce((acc, metric, index) => {
    acc[metric.key] = {
      label: metric.label,
      color: colors[index % colors.length],
    }
    return acc
  }, {})

  const { domain, ticks } = useMemo(() => getDynamicDomainAndTicks(graphData, visibleMetrics), [graphData, visibleMetrics]);

  const customScaleFunction = useMemo(() => createCustomScale(domain, ticks), [domain, ticks]);

  return (
    <Card className="w-full h-full mb-8 bg-[#2a2a2a] border-[#3a3a3a]">
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-3">
        <CardTitle className="text-[#DBDBDB] text-xl">Averages (Last 30 Days)</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="hover:bg-[#4BA500] hover:text-white"
        >
          {collapsed ? <ChevronDown className="h-4 w-4 text-[#DBDBDB]" /> : <ChevronUp className="h-4 w-4 text-[#DBDBDB]" />}
        </Button>
      </CardHeader>
      {!collapsed && (
      <CardContent className="p-0">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <span className="text-[#DBDBDB]">Loading...</span>
          </div>
        ) : (
          <div className="w-full" style={{ height: '600px' }}>
            <ChartContainer config={chartConfig} className="w-full h-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={graphData}
                  margin={{ top: 0, right: 50, left: 30, bottom: 15 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#3A3F41" />
                  <XAxis
  dataKey="date"
  stroke="#DBDBDB"
  tick={(props) => {
    const { x, y, payload } = props;
    return (
      <g transform={`translate(${x},${y})`}>
        <text 
          x={0} 
          y={0} 
          dy={16} 
          textAnchor="middle" 
          className="recharts-cartesian-axis-tick-value"
          fontSize="12px"
        >
          {payload.value}
        </text>
      </g>
    );
  }}
  tickLine={{ stroke: 'white' }}
/>
<YAxis
  stroke="#DBDBDB"
  width={60}
  domain={domain}
  ticks={ticks}
  scale={customScaleFunction}
  tick={(props) => {
    const { x, y, payload } = props;
    return (
      <g transform={`translate(${x},${y})`}>
        <text 
          x={0} 
          y={0} 
          dx={-10} 
          textAnchor="end"
          className="recharts-cartesian-axis-tick-value"
          fontSize="12px"
        >
          {payload.value}
        </text>
      </g>
    );
  }}
  tickLine={{ stroke: 'white' }}
/>
                  <Tooltip content={(props: CustomTooltipProps) => <CustomTooltip {...props} />} />
                  <Legend 
                    onClick={(entry, index, event) => handleLegendClick(entry, event)}
                    wrapperStyle={{ 
                      cursor: 'pointer',
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                      MozUserSelect: 'none',
                      msUserSelect: 'none'
                    }}
                    align="center"
                    formatter={(value, entry, index) => {
                      const metric = metrics.find(m => m.label === value);
                      const isVisible = metric ? visibleMetrics[metric.key] : false;
                      return (
                        <span style={{ color: isVisible ? entry.color : '#DBDBDB' }}>
                          {value}
                        </span>
                      );
                    }}
                  />
                  {metrics.map((metric, index) => (
                    <Line
                      key={metric.key}
                      type="monotone"
                      dataKey={metric.key}
                      stroke={colors[index % colors.length]}
                      strokeWidth={2}
                      name={metric.label}
                      dot={{ r: 2 }}
                      activeDot={{ r: 4 }}
                      hide={!visibleMetrics[metric.key]}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        )}
      </CardContent>
    )}
    </Card>
  )
}
