import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, LineChart, PieChart, TrendingUp, BarChart3, PieChartIcon, Table, Plus, Trash2, Edit3, Move, Maximize2, Sparkles, Eye, Download, Share2 } from 'lucide-react';
import { ChartWrapper } from '@/components/charts/chart-wrapper';

interface ChartConfig {
  id: string;
  type: 'bar' | 'line' | 'pie' | 'kpi' | 'table';
  title: string;
  data: any;
  position: { x: number; y: number; w: number; h: number };
  description?: string;
}

interface LumaDashProps {
  file: any;
  onAddChart: (command: string) => void;
  onRemoveChart: (chartId: string) => void;
  onUpdateChart: (chartId: string, updates: Partial<ChartConfig>) => void;
}

export function LumaDash({ file, onAddChart, onRemoveChart, onUpdateChart }: LumaDashProps) {
  const [charts, setCharts] = useState<ChartConfig[]>([]);
  const [command, setCommand] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [previewMode, setPreviewMode] = useState(false);

  // Generate mock data for different chart types
  const generateMockData = (type: string, title: string) => {
    switch (type) {
      case 'bar':
        return {
          type: 'bar',
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
          datasets: [
            {
              label: title,
              data: [Math.floor(Math.random() * 100), Math.floor(Math.random() * 100), Math.floor(Math.random() * 100), Math.floor(Math.random() * 100), Math.floor(Math.random() * 100)],
              backgroundColor: undefined, // Will use Chart.js defaults
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
              borderColor: undefined, // Will use Chart.js defaults
              backgroundColor: undefined, // Will use Chart.js defaults
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
              backgroundColor: undefined, // Will use Chart.js defaults
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
              backgroundColor: undefined, // Will use Chart.js defaults
            }
          ]
        };
    }
  };

  // Mock data for demonstration
  useEffect(() => {
    // Initialize with some mock charts if none exist
    if (charts.length === 0) {
      setCharts([
        {
          id: '1',
          type: 'bar',
          title: 'Monthly Revenue',
          data: {
            type: 'bar',
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
            datasets: [
              {
                label: 'Revenue',
                data: [120000, 135000, 142000, 158000, 172000],
                backgroundColor: undefined,
              }
            ]
          },
          position: { x: 0, y: 0, w: 6, h: 4 },
          description: 'Monthly revenue for the first quarter.'
        },
        {
          id: '2',
          type: 'line',
          title: 'Sales Trend',
          data: {
            type: 'line',
            labels: ['Q1', 'Q2', 'Q3', 'Q4'],
            datasets: [
              {
                label: '2023 Sales',
                data: [320000, 450000, 510000, 620000],
                borderColor: undefined,
                backgroundColor: undefined,
                fill: true
              }
            ]
          },
          position: { x: 6, y: 0, w: 6, h: 4 },
          description: 'Quarterly sales trend showing growth throughout the year.'
        },
        {
          id: '3',
          type: 'pie',
          title: 'Product Distribution',
          data: {
            type: 'pie',
            labels: ['Electronics', 'Clothing', 'Home Goods', 'Books'],
            datasets: [
              {
                data: [42, 28, 18, 12],
                backgroundColor: undefined,
              }
            ]
          },
          position: { x: 0, y: 4, w: 4, h: 4 },
          description: 'Product distribution by category.'
        }
      ]);
    }
  }, [charts.length]);

  // Generate suggestions based on the file content
  useEffect(() => {
    if (file) {
      // In a real implementation, this would be based on actual file analysis
      setSuggestions([
        "Show sales by product category",
        "Create a trend line for monthly revenue",
        "Compare regional performance in a pie chart",
        "Display top 5 customers by revenue",
        "Show cost breakdown analysis"
      ]);
    }
  }, [file]);

  // Process natural language command to create chart
  const processCommand = useCallback((command: string) => {
    // This is a simplified implementation
    // In a real application, this would use NLP to understand the command
    const lowerCommand = command.toLowerCase();
    
    // Determine chart type based on keywords
    let chartType: 'bar' | 'line' | 'pie' | 'kpi' | 'table' = 'bar';
    if (lowerCommand.includes('line') || lowerCommand.includes('trend')) {
      chartType = 'line';
    } else if (lowerCommand.includes('pie') || lowerCommand.includes('distribution')) {
      chartType = 'pie';
    } else if (lowerCommand.includes('kpi') || lowerCommand.includes('metric')) {
      chartType = 'kpi';
    } else if (lowerCommand.includes('table') || lowerCommand.includes('list')) {
      chartType = 'table';
    }
    
    // Extract chart title
    const title = command.replace(/add (a|an) (bar|line|pie|kpi|table) chart( for)?/i, '').trim() || 'New Chart';
    
    // Generate mock data based on chart type
    const mockData = generateMockData(chartType, title);
    
    return {
      type: chartType,
      title,
      data: mockData,
      description: `Chart created from command: "${command}"`
    };
  }, []);

  const handleAddChart = () => {
    if (!command.trim()) return;
    
    setIsProcessing(true);
    onAddChart(command);
    
    // Process the command and add the chart
    setTimeout(() => {
      const chartConfig = processCommand(command);
      
      const newChart: ChartConfig = {
        id: Date.now().toString(),
        type: chartConfig.type,
        title: chartConfig.title,
        data: chartConfig.data,
        position: { x: 0, y: charts.length * 4, w: 6, h: 4 },
        description: chartConfig.description
      };
      
      setCharts(prev => [...prev, newChart]);
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
      default: return <BarChart3 className="w-4 h-4" />;
    }
  };

  const removeChart = (chartId: string) => {
    setCharts(prev => prev.filter(chart => chart.id !== chartId));
    onRemoveChart(chartId);
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

  return (
    <div className="flex flex-col h-full">
      {/* Dashboard Header */}
      <div className="bg-card border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold gradient-text flex items-center">
              <Sparkles className="w-5 h-5 mr-2" />
              LumaDash
            </h2>
            <p className="text-sm text-muted-foreground">Interactive dashboard powered by AI</p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="personalization-chip">
              {charts.length} charts
            </Badge>
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
              {previewMode ? 'Edit' : 'Preview'}
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

      {/* Command Input */}
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
          
          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="flex flex-wrap gap-2">
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
              >
                <Card className={`h-full insight-card ${previewMode ? 'border-0 shadow-none' : 'border-0 shadow-none'}`}>
                  {!previewMode && (
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center">
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
                            onClick={() => removeChart(chart.id)}
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