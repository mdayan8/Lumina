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
} from 'chart.js';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface ChartWrapperProps {
  data: {
    type: string;
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor?: string[] | string;
      borderColor?: string;
      borderWidth?: number;
    }>;
  };
}

export function ChartWrapper({ data }: ChartWrapperProps) {
  const chartRef = useRef<any>(null);

  // Purple theme colors for Lumina
  const purpleTheme = {
    primary: 'hsl(255, 62%, 52%)',
    secondary: 'hsl(262, 45%, 70%)',
    tertiary: 'hsl(250, 55%, 60%)',
    quaternary: 'hsl(268, 40%, 65%)',
    quinary: 'hsl(245, 50%, 75%)',
  };

  const chartColors = [
    purpleTheme.primary,
    purpleTheme.secondary,
    purpleTheme.tertiary,
    purpleTheme.quaternary,
    purpleTheme.quinary,
  ];

  // Prepare chart data with purple theme
  const chartData = {
    labels: data.labels,
    datasets: data.datasets.map((dataset, index) => ({
      ...dataset,
      backgroundColor: dataset.backgroundColor || 
        (data.type === 'pie' || data.type === 'doughnut' 
          ? chartColors.slice(0, data.labels.length)
          : chartColors[index % chartColors.length] + '80'), // Add transparency for bars/lines
      borderColor: dataset.borderColor || chartColors[index % chartColors.length],
      borderWidth: dataset.borderWidth || (data.type === 'line' ? 3 : 1),
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
    scales: data.type !== 'pie' && data.type !== 'doughnut' ? {
      x: {
        grid: {
          display: data.type === 'line',
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
    switch (data.type.toLowerCase()) {
      case 'bar':
        return <Bar ref={chartRef} data={chartData} options={chartOptions} />;
      case 'line':
        return <Line ref={chartRef} data={chartData} options={chartOptions} />;
      case 'pie':
        return <Pie ref={chartRef} data={chartData} options={chartOptions} />;
      case 'doughnut':
        return <Doughnut ref={chartRef} data={chartData} options={chartOptions} />;
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
