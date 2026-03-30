import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, LineChart, PieChart, TrendingUp, Table, Map, Gauge, Filter,
  Palette, Type, Calendar, Layout, Save, Share2, Download, RefreshCw,
  AreaChart, Donut, Radar, Circle, Square, ScatterChart, Thermometer,
  Hash, FilterIcon, Sliders
} from 'lucide-react';

interface ChatCommandProps {
  onCommand: (command: string) => void;
}

export function ChatDashboardCommands({ onCommand }: ChatCommandProps) {
  const [showCommands, setShowCommands] = useState(false);
  
  const chartCommands = [
    { command: 'Add a bar chart', icon: BarChart3, description: 'Add a bar chart' },
    { command: 'Add a line chart', icon: LineChart, description: 'Add a line chart' },
    { command: 'Add a pie chart', icon: PieChart, description: 'Add a pie chart' },
    { command: 'Add a doughnut chart', icon: Donut, description: 'Add a doughnut chart' },
    { command: 'Add an area chart', icon: AreaChart, description: 'Add an area chart' },
    { command: 'Add a radar chart', icon: Radar, description: 'Add a radar chart' },
    { command: 'Add a polar area chart', icon: Circle, description: 'Add a polar area chart' },
    { command: 'Add a scatter plot', icon: ScatterChart, description: 'Add a scatter plot' },
    { command: 'Add a bubble chart', icon: Circle, description: 'Add a bubble chart' },
    { command: 'Add a KPI indicator', icon: TrendingUp, description: 'Add a KPI indicator' },
    { command: 'Add a data table', icon: Table, description: 'Add a data table' },
    { command: 'Add a map visualization', icon: Map, description: 'Add a map visualization' },
    { command: 'Add a gauge chart', icon: Gauge, description: 'Add a gauge chart' },
    { command: 'Add a funnel chart', icon: FilterIcon, description: 'Add a funnel chart' },
    { command: 'Add a heatmap', icon: Thermometer, description: 'Add a heatmap' }
  ];
  
  const dashboardCommands = [
    { command: '/filter', icon: Filter, description: 'Apply filters to charts' },
    { command: '/theme', icon: Palette, description: 'Change dashboard theme' },
    { command: '/title color', icon: Type, description: 'Change chart title colors' },
    { command: '/time range', icon: Calendar, description: 'Set time range for data' },
    { command: '/layout', icon: Layout, description: 'Change dashboard layout' },
    { command: '/save', icon: Save, description: 'Save the dashboard' },
    { command: '/share', icon: Share2, description: 'Share the dashboard' },
    { command: '/export', icon: Download, description: 'Export the dashboard' },
    { command: '/refresh', icon: RefreshCw, description: 'Refresh dashboard data' },
    { command: '/clear', icon: Sliders, description: 'Clear dashboard' }
  ];

  return (
    <div className="mt-2">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setShowCommands(!showCommands)}
        className="mb-2 personalization-chip"
      >
        {showCommands ? 'Hide Dashboard Commands' : 'Show Dashboard Commands'}
      </Button>
      
      {showCommands && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center">
              <BarChart3 className="w-4 h-4 mr-2" />
              Chart Commands
            </h4>
            <div className="grid grid-cols-1 gap-1">
              {chartCommands.map((cmd, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-xs personalization-chip"
                  onClick={() => onCommand(cmd.command)}
                >
                  <cmd.icon className="w-3 h-3 mr-2" />
                  {cmd.command}
                  <span className="text-muted-foreground ml-2">- {cmd.description}</span>
                </Button>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center">
              <Layout className="w-4 h-4 mr-2" />
              Dashboard Commands
            </h4>
            <div className="grid grid-cols-1 gap-1">
              {dashboardCommands.map((cmd, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-xs personalization-chip"
                  onClick={() => onCommand(cmd.command)}
                >
                  <cmd.icon className="w-3 h-3 mr-2" />
                  {cmd.command}
                  <span className="text-muted-foreground ml-2">- {cmd.description}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}