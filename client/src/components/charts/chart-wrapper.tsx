import { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
  Filler,
  ChartType as ChartJSType
} from 'chart.js';
import { Bar, Line, Pie, Doughnut, PolarArea, Radar, Bubble, Scatter } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
  Filler
);

// Extend the ChartType type to include all supported types
type ChartType = ChartJSType | 'area' | 'kpi' | 'table' | 'map' | 'gauge' | 'funnel' | 'heatmap' | 'candlestick';

interface ChartWrapperProps {
  data: {
    type: ChartType;
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[] | { x: number; y: number; r?: number }[];
      backgroundColor?: string[] | string;
      borderColor?: string;
      borderWidth?: number;
      fill?: boolean;
      pointRadius?: number;
      pointBackgroundColor?: string;
    }>;
  };
}

export function ChartWrapper({ data }: ChartWrapperProps) {
  const chartRef = useRef<any>(null);

  // Prepare chart data without hardcoded colors
  const chartData = {
    labels: data.labels,
    datasets: data.datasets.map((dataset) => ({
      ...dataset,
      // Only provide default colors if none are specified
      backgroundColor: dataset.backgroundColor || undefined,
      borderColor: dataset.borderColor || undefined,
      borderWidth: dataset.borderWidth || (data.type === 'line' || data.type === 'radar' ? 3 : 1),
      pointBackgroundColor: dataset.pointBackgroundColor || undefined,
      pointRadius: dataset.pointRadius || (data.type === 'bubble' || data.type === 'scatter' ? 5 : 3),
    })),
  };

  const chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          color: 'hsl(240, 5%, 64%)', // muted-foreground
          font: {
            family: 'Inter',
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: 'hsl(240, 10%, 9%)', // card background
        titleColor: 'hsl(240, 5%, 90%)', // card-foreground
        bodyColor: 'hsl(240, 5%, 90%)',
        borderColor: 'hsl(240, 10%, 18%)', // border
        borderWidth: 1,
        cornerRadius: 8,
        titleFont: {
          family: 'Inter',
          size: 14,
          weight: '600',
        },
        bodyFont: {
          family: 'Inter',
          size: 12,
        },
      },
    },
    scales: data.type !== 'pie' && data.type !== 'doughnut' && data.type !== 'polarArea' ? {
      x: {
        grid: {
          display: data.type === 'line' || data.type === 'bubble' || data.type === 'scatter' || data.type === 'area',
          color: 'hsl(240, 10%, 18%)', // border color
        },
        ticks: {
          color: 'hsl(240, 5%, 64%)', // muted-foreground
          font: {
            family: 'Inter',
            size: 11,
          },
        },
      },
      y: {
        grid: {
          color: 'hsl(240, 10%, 18%)', // border color
        },
        ticks: {
          color: 'hsl(240, 5%, 64%)', // muted-foreground
          font: {
            family: 'Inter',
            size: 11,
          },
        },
      },
    } : {},
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart',
    },
  };

  const renderChart = () => {
    // Convert our extended chart types to Chart.js types
    let chartType = data.type;
    
    // Handle special cases for our extended types
    switch (data.type) {
      case 'area':
        chartType = 'line';
        // Ensure fill is true for area charts
        chartData.datasets = chartData.datasets.map(dataset => ({
          ...dataset,
          fill: true
        }));
        break;
      case 'kpi':
      case 'table':
      case 'map':
      case 'gauge':
      case 'funnel':
      case 'heatmap':
      case 'candlestick':
        // For these types, we'll use a bar chart as a placeholder
        chartType = 'bar';
        break;
      default:
        // For standard Chart.js types, use as-is
        break;
    }

    switch (chartType) {
      case 'bar':
        return <Bar ref={chartRef} data={chartData} options={chartOptions} />;
      case 'line':
        return <Line ref={chartRef} data={chartData} options={chartOptions} />;
      case 'pie':
        return <Pie ref={chartRef} data={chartData} options={chartOptions} />;
      case 'doughnut':
        return <Doughnut ref={chartRef} data={chartData} options={chartOptions} />;
      case 'polarArea':
        return <PolarArea ref={chartRef} data={chartData} options={chartOptions} />;
      case 'radar':
        return <Radar ref={chartRef} data={chartData} options={chartOptions} />;
      case 'bubble':
        return <Bubble ref={chartRef} data={chartData} options={chartOptions} />;
      case 'scatter':
        return <Scatter ref={chartRef} data={chartData} options={chartOptions} />;
      default:
        return <Bar ref={chartRef} data={chartData} options={chartOptions} />;
    }
  };

  return (
    <div className="w-full h-64" data-testid={`chart-${data.type}`}>
      {renderChart()}
    </div>
  );
}