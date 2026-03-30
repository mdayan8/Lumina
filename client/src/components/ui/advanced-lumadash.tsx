import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, LineChart, PieChart, TrendingUp, BarChart3, PieChartIcon, Table, 
  Plus, Trash2, Edit3, Move, Maximize2, Sparkles, Eye, Download, Share2, 
  Filter, RefreshCw, Save, Upload, Settings, Palette, Layout, Map, Globe,
  Calendar, Clock, Users, DollarSign, Percent, Hash, Type, Image, Sliders,
  ChevronDown, ChevronUp, X, Check, Radar, Circle, Square, Triangle, ScatterChart,
  AreaChart, Donut, Gauge, Thermometer, HashIcon, FilterIcon
} from 'lucide-react';
import { ChartWrapper } from '@/components/charts/chart-wrapper';
import { DashboardCommandProcessor } from '@/lib/dashboard-command-processor';

interface ChartConfig {
  id: string;
  type: 'bar' | 'line' | 'pie' | 'kpi' | 'table' | 'doughnut' | 'area' | 'map' | 'gauge' | 'funnel' | 'polarArea' | 'radar' | 'bubble' | 'scatter' | 'heatmap' | 'candlestick';
  title: string;
  data: any;
  position: { x: number; y: number; w: number; h: number };
  description?: string;
  filters?: Record<string, any>;
  colorScheme?: string;
  titleColor?: string;
  backgroundColor?: string;
  borderColor?: string;
}

interface LumaDashProps {
  file: any;
  onAddChart: (command: string) => void;
  onRemoveChart: (chartId: string) => void;
  onUpdateChart: (chartId: string, updates: Partial<ChartConfig>) => void;
}

export function AdvancedLumaDash({ file, onAddChart, onRemoveChart, onUpdateChart }: LumaDashProps) {
  const [charts, setCharts] = useState<ChartConfig[]>([]);
  const [command, setCommand] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [previewMode, setPreviewMode] = useState(false);
  const [selectedChart, setSelectedChart] = useState<string | null>(null);
  const [dashboardTitle, setDashboardTitle] = useState('My Dashboard');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [colorSchemes] = useState([
    { id: 'purple', name: 'Purple Theme', colors: ['#5C4BBA', '#7D6CC9', '#A280E0', '#C7AFFF', '#E6D9FF'] },
    { id: 'blue', name: 'Blue Theme', colors: ['#1E40AF', '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE'] },
    { id: 'green', name: 'Green Theme', colors: ['#065F46', '#10B981', '#34D399', '#6EE7B7', '#A7F3D0'] },
    { id: 'orange', name: 'Orange Theme', colors: ['#9C4221', '#F97316', '#FB923C', '#FDBA74', '#FED7AA'] },
    { id: 'red', name: 'Red Theme', colors: ['#7F1D1D', '#EF4444', '#F87171', '#FCA5A5', '#FECACA'] },
    { id: 'indigo', name: 'Indigo Theme', colors: ['#312E81', '#6366F1', '#818CF8', '#C7D2FE', '#E0E7FF'] }
  ]);
  const [titleColors] = useState([
    { id: 'white', name: 'White', color: '#FFFFFF' },
    { id: 'black', name: 'Black', color: '#000000' },
    { id: 'purple', name: 'Purple', color: '#5C4BBA' },
    { id: 'blue', name: 'Blue', color: '#3B82F6' },
    { id: 'green', name: 'Green', color: '#10B981' },
    { id: 'orange', name: 'Orange', color: '#F97316' },
    { id: 'red', name: 'Red', color: '#EF4444' }
  ]);
  const [currentColorScheme, setCurrentColorScheme] = useState('purple');
  const [currentTitleColor, setCurrentTitleColor] = useState('white');
  const [timeRange, setTimeRange] = useState('Last 30 days');

  // Mock data for demonstration
  useEffect(() => {
    // Initialize with some mock charts if none exist
    if (charts.length === 0) {
      setCharts([
        {
          id: '1',
          type: 'bar',
          title: 'Sales by Product Line',
          data: {
            type: 'bar',
            labels: ['Classic Cars', 'Vintage Cars', 'Motorcycles', 'Planes', 'Ships'],
            datasets: [
              {
                label: 'Revenue',
                data: [350000, 280000, 180000, 150000, 95000],
                backgroundColor: colorSchemes.find(s => s.id === 'purple')?.colors || undefined,
              }
            ]
          },
          position: { x: 0, y: 0, w: 6, h: 4 },
          description: 'This chart shows revenue distribution across different product categories.',
          colorScheme: 'purple',
          titleColor: '#FFFFFF'
        },
        {
          id: '2',
          type: 'line',
          title: 'Monthly Sales Trend',
          data: {
            type: 'line',
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [
              {
                label: '2023 Sales',
                data: [120000, 135000, 142000, 158000, 172000, 165000, 182000, 195000, 210000, 245000, 280000, 320000],
                borderColor: colorSchemes.find(s => s.id === 'purple')?.colors[0] || undefined,
                backgroundColor: undefined,
                fill: true
              }
            ]
          },
          position: { x: 6, y: 0, w: 6, h: 4 },
          description: 'Monthly sales trend showing growth throughout the year.',
          colorScheme: 'purple',
          titleColor: '#FFFFFF'
        },
        {
          id: '3',
          type: 'pie',
          title: 'Revenue by Region',
          data: {
            type: 'pie',
            labels: ['North America', 'Europe', 'Asia', 'South America', 'Africa'],
            datasets: [
              {
                data: [42, 28, 18, 8, 4],
                backgroundColor: colorSchemes.find(s => s.id === 'purple')?.colors || undefined,
              }
            ]
          },
          position: { x: 0, y: 4, w: 4, h: 4 },
          description: 'Revenue distribution by geographical regions.',
          colorScheme: 'purple',
          titleColor: '#FFFFFF'
        }
      ]);
    }
  }, [charts.length, colorSchemes]);

  // Generate suggestions based on the file content
  useEffect(() => {
    if (file) {
      // In a real implementation, this would be based on actual file analysis
      setSuggestions([
        "Show sales by product category",
        "Create a trend line for monthly revenue",
        "Compare regional performance in a pie chart",
        "Display top 5 customers by revenue",
        "Show cost breakdown analysis",
        "Create a KPI dashboard for key metrics",
        "Generate a heatmap of sales performance",
        "Show sales performance on a map",
        "Create a gauge for customer satisfaction",
        "Build a funnel chart for sales process",
        "Add a scatter plot for price vs quantity",
        "Create a bubble chart for product analysis",
        "Show a radar chart for performance metrics",
        "Add a polar area chart for distribution"
      ]);
    }
  }, [file]);

  // Process natural language command to create chart
  const processCommand = useCallback((command: string) => {
    // Use the dashboard command processor
    const processedCommand = DashboardCommandProcessor.processCommand(command);
    
    if (!processedCommand.success) {
      console.error('Command processing failed:', processedCommand.message);
      return null;
    }
    
    // Handle different actions
    switch (processedCommand.action) {
      case 'add_chart':
        if (processedCommand.chartType) {
          const title = processedCommand.chartTitle || `New ${processedCommand.chartType} chart`;
          const mockData = generateMockData(processedCommand.chartType, title);
          
          return {
            type: processedCommand.chartType,
            title,
            data: mockData,
            description: `Chart created from command: "${command}"`
          };
        }
        break;
        
      case 'change_theme':
        if (processedCommand.theme) {
          setCurrentColorScheme(processedCommand.theme);
          // Update all charts with new theme
          setCharts(prev => prev.map(chart => ({
            ...chart,
            colorScheme: processedCommand.theme,
            data: {
              ...chart.data,
              datasets: chart.data.datasets.map((dataset: any) => ({
                ...dataset,
                backgroundColor: colorSchemes.find(s => s.id === processedCommand.theme)?.colors || dataset.backgroundColor,
                borderColor: colorSchemes.find(s => s.id === processedCommand.theme)?.colors[0] || dataset.borderColor
              }))
            }
          })));
        }
        break;
        
      case 'apply_filter':
        // In a real implementation, this would apply filters to charts
        console.log('Applying filter:', processedCommand.filter);
        break;
        
      case 'export_dashboard':
        exportDashboard();
        break;
        
      case 'share_dashboard':
        shareDashboard();
        break;
        
      case 'save_dashboard':
        saveDashboard();
        break;
        
      case 'refresh_dashboard':
        refreshDashboard();
        break;
        
      default:
        console.log('Unhandled command action:', processedCommand.action);
    }
    
    return null;
  }, [colorSchemes]);

  // Generate mock data for different chart types
  const generateMockData = (type: string, title: string) => {
    const colors = colorSchemes.find(s => s.id === currentColorScheme)?.colors || colorSchemes[0].colors;
    
    switch (type) {
      case 'bar':
        return {
          type: 'bar',
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
          datasets: [
            {
              label: title,
              data: [Math.floor(Math.random() * 100), Math.floor(Math.random() * 100), Math.floor(Math.random() * 100), Math.floor(Math.random() * 100), Math.floor(Math.random() * 100)],
              backgroundColor: colors,
            }
          ]
        };
      case 'line':
        return {
          type: 'line',
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [
            {
              label: title,
              data: [30, 45, 35, 60, 55, 70],
              borderColor: colors[0],
              backgroundColor: `${colors[0]}20`,
              fill: true
            }
          ]
        };
      case 'pie':
        return {
          type: 'pie',
          labels: ['Category A', 'Category B', 'Category C', 'Category D'],
          datasets: [
            {
              data: [35, 25, 20, 20],
              backgroundColor: colors,
            }
          ]
        };
      case 'doughnut':
        return {
          type: 'doughnut',
          labels: ['Segment 1', 'Segment 2', 'Segment 3', 'Segment 4'],
          datasets: [
            {
              data: [40, 30, 20, 10],
              backgroundColor: colors,
            }
          ]
        };
      case 'area':
        return {
          type: 'line',
          labels: ['Q1', 'Q2', 'Q3', 'Q4'],
          datasets: [
            {
              label: title,
              data: [120, 190, 150, 210],
              borderColor: colors[0],
              backgroundColor: `${colors[0]}40`,
              fill: true
            }
          ]
        };
      case 'map':
        return {
          type: 'bar', // Using bar chart as placeholder for map
          labels: ['North', 'South', 'East', 'West', 'Central'],
          datasets: [
            {
              label: title,
              data: [120, 190, 150, 210, 180],
              backgroundColor: colors,
            }
          ]
        };
      case 'gauge':
        return {
          type: 'doughnut', // Using doughnut as placeholder for gauge
          labels: ['Value', 'Remaining'],
          datasets: [
            {
              data: [75, 25],
              backgroundColor: [colors[0], `${colors[0]}20`],
            }
          ]
        };
      case 'funnel':
        return {
          type: 'bar', // Using bar chart as placeholder for funnel
          labels: ['Step 1', 'Step 2', 'Step 3', 'Step 4', 'Step 5'],
          datasets: [
            {
              label: title,
              data: [100, 80, 60, 40, 20],
              backgroundColor: colors,
            }
          ]
        };
      case 'polarArea':
        return {
          type: 'polarArea',
          labels: ['Category 1', 'Category 2', 'Category 3', 'Category 4', 'Category 5'],
          datasets: [
            {
              label: title,
              data: [30, 20, 35, 25, 15],
              backgroundColor: colors,
            }
          ]
        };
      case 'radar':
        return {
          type: 'radar',
          labels: ['Speed', 'Reliability', 'Comfort', 'Safety', 'Efficiency'],
          datasets: [
            {
              label: title,
              data: [65, 59, 90, 81, 56],
              borderColor: colors[0],
              backgroundColor: `${colors[0]}40`,
            }
          ]
        };
      case 'bubble':
        return {
          type: 'bubble',
          labels: ['Point 1', 'Point 2', 'Point 3', 'Point 4'],
          datasets: [
            {
              label: title,
              data: [
                { x: 20, y: 30, r: 15 },
                { x: 40, y: 10, r: 10 },
                { x: 30, y: 25, r: 20 },
                { x: 50, y: 40, r: 12 }
              ],
              backgroundColor: colors,
            }
          ]
        };
      case 'scatter':
        return {
          type: 'scatter',
          labels: ['Point 1', 'Point 2', 'Point 3', 'Point 4', 'Point 5'],
          datasets: [
            {
              label: title,
              data: [
                { x: 20, y: 30 },
                { x: 40, y: 10 },
                { x: 30, y: 25 },
                { x: 50, y: 40 },
                { x: 60, y: 20 }
              ],
              backgroundColor: colors[0],
              borderColor: colors[0],
            }
          ]
        };
      case 'heatmap':
        return {
          type: 'bubble', // Using bubble chart as placeholder for heatmap
          labels: ['Cell 1', 'Cell 2', 'Cell 3', 'Cell 4', 'Cell 5'],
          datasets: [
            {
              label: title,
              data: [
                { x: 1, y: 1, r: 20 },
                { x: 2, y: 2, r: 30 },
                { x: 3, y: 1, r: 15 },
                { x: 1, y: 3, r: 25 },
                { x: 3, y: 3, r: 35 }
              ],
              backgroundColor: colors,
            }
          ]
        };
      case 'candlestick':
        return {
          type: 'bar', // Using bar chart as placeholder for candlestick
          labels: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5'],
          datasets: [
            {
              label: title,
              data: [120, 190, 150, 210, 180],
              backgroundColor: colors,
            }
          ]
        };
      default:
        return {
          type: 'bar',
          labels: ['A', 'B', 'C', 'D', 'E'],
          datasets: [
            {
              label: title,
              data: [10, 20, 30, 25, 15],
              backgroundColor: colors,
            }
          ]
        };
    }
  };

  const handleAddChart = () => {
    if (!command.trim()) return;
    
    setIsProcessing(true);
    onAddChart(command);
    
    // Process the command and add the chart
    setTimeout(() => {
      const chartConfig = processCommand(command);
      
      if (chartConfig) {
        const newChart: ChartConfig = {
          id: Date.now().toString(),
          type: chartConfig.type as any,
          title: chartConfig.title,
          data: chartConfig.data,
          position: { x: 0, y: charts.length * 4, w: 6, h: 4 },
          description: chartConfig.description,
          colorScheme: currentColorScheme,
          titleColor: titleColors.find(c => c.id === currentTitleColor)?.color || '#FFFFFF'
        };
        
        setCharts(prev => [...prev, newChart]);
      }
      
      setCommand('');
      setIsProcessing(false);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddChart();
    }
  };

  const getChartIcon = (type: string) => {
    switch (type) {
      case 'bar': return <BarChart3 className="w-4 h-4" />;
      case 'line': return <LineChart className="w-4 h-4" />;
      case 'pie': return <PieChartIcon className="w-4 h-4" />;
      case 'kpi': return <TrendingUp className="w-4 h-4" />;
      case 'table': return <Table className="w-4 h-4" />;
      case 'doughnut': return <Donut className="w-4 h-4" />;
      case 'area': return <AreaChart className="w-4 h-4" />;
      case 'map': return <Map className="w-4 h-4" />;
      case 'gauge': return <Gauge className="w-4 h-4" />;
      case 'funnel': return <FilterIcon className="w-4 h-4" />; // Using FilterIcon as placeholder for Funnel
      case 'polarArea': return <Circle className="w-4 h-4" />;
      case 'radar': return <Radar className="w-4 h-4" />;
      case 'bubble': return <Circle className="w-4 h-4" />;
      case 'scatter': return <ScatterChart className="w-4 h-4" />;
      case 'heatmap': return <Thermometer className="w-4 h-4" />;
      case 'candlestick': return <HashIcon className="w-4 h-4" />;
      default: return <BarChart3 className="w-4 h-4" />;
    }
  };

  const removeChart = (chartId: string) => {
    setCharts(prev => prev.filter(chart => chart.id !== chartId));
    onRemoveChart(chartId);
    if (selectedChart === chartId) {
      setSelectedChart(null);
    }
  };

  const togglePreviewMode = () => {
    setPreviewMode(!previewMode);
  };

  const exportDashboard = () => {
    // In a real implementation, this would export the dashboard
    alert('Dashboard exported successfully!');
  };

  const shareDashboard = () => {
    // In a real implementation, this would share the dashboard
    alert('Dashboard shared successfully!');
  };

  const saveDashboard = () => {
    // In a real implementation, this would save the dashboard
    alert('Dashboard saved successfully!');
  };

  const refreshDashboard = () => {
    // In a real implementation, this would refresh the dashboard data
    alert('Dashboard refreshed successfully!');
  };

  const applyColorScheme = (schemeId: string) => {
    setCurrentColorScheme(schemeId);
    // In a real implementation, this would update all charts with the new color scheme
    alert(`Color scheme changed to ${colorSchemes.find(s => s.id === schemeId)?.name}`);
  };

  const applyTitleColor = (colorId: string) => {
    setCurrentTitleColor(colorId);
    // In a real implementation, this would update all chart titles with the new color
    alert(`Title color changed to ${titleColors.find(c => c.id === colorId)?.name}`);
  };

  const updateChartFilters = (chartId: string, filters: Record<string, any>) => {
    setCharts(prev => prev.map(chart => 
      chart.id === chartId ? { ...chart, filters } : chart
    ));
  };

  const updateChartTitle = (chartId: string, newTitle: string) => {
    setCharts(prev => prev.map(chart => 
      chart.id === chartId ? { ...chart, title: newTitle } : chart
    ));
  };

  const updateChartType = (chartId: string, newType: ChartConfig['type']) => {
    setCharts(prev => prev.map(chart => {
      if (chart.id === chartId) {
        const newData = { ...chart.data, type: newType };
        return { ...chart, type: newType, data: newData };
      }
      return chart;
    }));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Dashboard Header */}
      <div className="bg-card border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <Sparkles className="w-6 h-6 text-primary mr-2" />
              <input
                type="text"
                value={dashboardTitle}
                onChange={(e) => setDashboardTitle(e.target.value)}
                className="text-xl font-bold gradient-text bg-transparent border-none focus:outline-none"
              />
            </div>
            <Badge variant="secondary" className="personalization-chip">
              {charts.length} charts
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="personalization-chip">
              {file?.originalName || 'No file selected'}
            </Badge>
            <Button 
              variant="outline" 
              size="sm"
              onClick={togglePreviewMode}
              className="personalization-chip flex items-center"
            >
              <Eye className="w-4 h-4 mr-2" />
              {previewMode ? 'Edit Mode' : 'Preview'}
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={refreshDashboard}
              className="personalization-chip flex items-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={saveDashboard}
              className="personalization-chip flex items-center"
            >
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={exportDashboard}
              className="personalization-chip flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={shareDashboard}
              className="personalization-chip flex items-center"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </div>

      {/* Command Input and Controls */}
      {!previewMode && (
        <div className="p-4 border-b border-border">
          <div className="flex space-x-2 mb-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Add a chart: 'Add a bar chart for last quarter sales' or 'Remove the revenue pie chart'"
                className="command-input"
                disabled={isProcessing}
              />
              {isProcessing && (
                <div className="absolute right-3 top-2.5">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-primary rounded-full typing-indicator"></div>
                    <div className="w-2 h-2 bg-primary rounded-full typing-indicator" style={{animationDelay: '0.2s'}}></div>
                    <div className="w-2 h-2 bg-primary rounded-full typing-indicator" style={{animationDelay: '0.4s'}}></div>
                  </div>
                </div>
              )}
            </div>
            <Button 
              onClick={handleAddChart} 
              disabled={!command.trim() || isProcessing}
              className="gradient-button"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Chart
            </Button>
          </div>
          
          {/* Advanced Controls */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              className="flex items-center"
            >
              <Sliders className="w-4 h-4 mr-2" />
              Advanced Options
              {showAdvancedOptions ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
            </Button>
            
            {showAdvancedOptions && (
              <div className="flex flex-wrap items-center gap-2 mt-2 w-full">
                <div className="flex items-center space-x-2">
                  <Palette className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Theme:</span>
                  <select 
                    value={currentColorScheme}
                    onChange={(e) => applyColorScheme(e.target.value)}
                    className="text-sm bg-background border border-input rounded px-2 py-1"
                  >
                    {colorSchemes.map(scheme => (
                      <option key={scheme.id} value={scheme.id}>{scheme.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Type className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Title Color:</span>
                  <select 
                    value={currentTitleColor}
                    onChange={(e) => applyTitleColor(e.target.value)}
                    className="text-sm bg-background border border-input rounded px-2 py-1"
                  >
                    {titleColors.map(color => (
                      <option key={color.id} value={color.id}>{color.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Time Range:</span>
                  <select 
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    className="text-sm bg-background border border-input rounded px-2 py-1"
                  >
                    <option>Last 7 days</option>
                    <option>Last 30 days</option>
                    <option>Last 90 days</option>
                    <option>Last year</option>
                    <option>All time</option>
                  </select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Layout className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Layout:</span>
                  <Button variant="outline" size="sm" className="text-xs">
                    Grid
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs">
                    Freeform
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="text-sm text-muted-foreground">Try:</span>
              {suggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="suggestion-chip"
                  onClick={() => setCommand(suggestion)}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Dashboard Grid */}
      <div className={`flex-1 overflow-auto ${previewMode ? 'p-6' : 'p-4'}`}>
        {charts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <BarChart className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No charts yet</h3>
            <p className="text-muted-foreground mb-4 max-w-md">
              Start building your dashboard by adding charts through natural language commands.
              Try: "Add a bar chart for last quarter sales"
            </p>
            <Button 
              onClick={() => setCommand('Add a bar chart for last quarter sales')} 
              variant="outline"
              className="personalization-chip"
            >
              Try Example Command
            </Button>
          </div>
        ) : (
          <div className={previewMode ? "lumadash-grid-preview" : "lumadash-grid"}>
            {charts.map((chart) => (
              <div 
                key={chart.id} 
                className={previewMode ? "lumadash-card-preview" : "lumadash-card"}
                onClick={() => !previewMode && setSelectedChart(chart.id)}
              >
                <Card className={`h-full insight-card ${previewMode ? 'border-0 shadow-none' : 'border-0 shadow-none'} ${selectedChart === chart.id ? 'ring-2 ring-primary' : ''}`}>
                  {!previewMode && (
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center" style={{ color: chart.titleColor }}>
                          {getChartIcon(chart.type)}
                          <span className="ml-2">{chart.title}</span>
                        </CardTitle>
                        <div className="flex space-x-1">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Move className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeChart(chart.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      {chart.description && (
                        <p className="text-sm text-muted-foreground mt-1">{chart.description}</p>
                      )}
                    </CardHeader>
                  )}
                  <CardContent className={previewMode ? "p-4" : "p-2"}>
                    <div className="h-64">
                      <ChartWrapper 
                        data={chart.data}
                      />
                    </div>
                    {!previewMode && (
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex space-x-1">
                          <Button variant="outline" size="sm" className="text-xs">
                            <Filter className="w-3 h-3 mr-1" />
                            Filter
                          </Button>
                          <Button variant="outline" size="sm" className="text-xs">
                            <RefreshCw className="w-3 h-3 mr-1" />
                            Refresh
                          </Button>
                          <Button variant="outline" size="sm" className="text-xs">
                            <Settings className="w-3 h-3 mr-1" />
                            Customize
                          </Button>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {chart.type.toUpperCase()}
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}