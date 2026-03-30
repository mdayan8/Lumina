import { ChartType } from 'chart.js';

interface ProcessedCommand {
  action: 'add_chart' | 'remove_chart' | 'update_chart' | 'change_theme' | 'apply_filter' | 'export_dashboard' | 'share_dashboard' | 'save_dashboard' | 'refresh_dashboard';
  chartType?: ChartType | 'kpi' | 'table' | 'map' | 'gauge' | 'funnel' | 'heatmap' | 'candlestick' | 'sankey' | 'treemap' | 'sunburst' | 'wordcloud' | 'radialbar' | 'bullet';
  chartTitle?: string;
  chartId?: string;
  theme?: string;
  filter?: Record<string, any>;
  parameters?: Record<string, any>;
  success: boolean;
  message: string;
}

export class DashboardCommandProcessor {
  private static chartTypeMap: Record<string, string> = {
    'bar': 'bar',
    'line': 'line',
    'pie': 'pie',
    'kpi': 'kpi',
    'table': 'table',
    'doughnut': 'doughnut',
    'area': 'line',
    'map': 'map',
    'gauge': 'gauge',
    'funnel': 'funnel',
    'column': 'bar',
    'histogram': 'bar',
    'trend': 'line',
    'distribution': 'pie',
    'metric': 'kpi',
    'list': 'table',
    'donut': 'doughnut',
    'geographic': 'map',
    'geography': 'map',
    'speedometer': 'gauge',
    'waterfall': 'bar',
    'radar': 'radar',
    'bubble': 'bubble',
    'heatmap': 'heatmap',
    'scatter': 'scatter',
    'candlestick': 'candlestick',
    'sankey': 'sankey',
    'treemap': 'treemap',
    'sunburst': 'sunburst',
    'wordcloud': 'wordcloud',
    'radialbar': 'radialbar',
    'bullet': 'bullet',
    'polararea': 'polarArea',
    'polar area': 'polarArea',
    'polar': 'polarArea'
  };

  static processCommand(command: string): ProcessedCommand {
    const lowerCommand = command.toLowerCase().trim();
    
    // Add chart commands
    if (lowerCommand.startsWith('/add ') || lowerCommand.startsWith('add ') || 
        lowerCommand.includes('add') || lowerCommand.includes('create') || 
        lowerCommand.includes('make') || lowerCommand.includes('show') ||
        lowerCommand.includes('display') || lowerCommand.includes('generate') ||
        lowerCommand.includes('chart') || lowerCommand.includes('graph') ||
        lowerCommand.includes('visualization') || lowerCommand.includes('dashboard')) {
      return this.processAddChartCommand(lowerCommand);
    }
    
    // Remove chart commands
    if (lowerCommand.startsWith('/remove ') || lowerCommand.startsWith('remove ') ||
        lowerCommand.includes('remove') || lowerCommand.includes('delete') ||
        lowerCommand.includes('clear')) {
      return this.processRemoveChartCommand(lowerCommand);
    }
    
    // Update chart commands
    if (lowerCommand.startsWith('/update ') || lowerCommand.startsWith('update ') ||
        lowerCommand.includes('update') || lowerCommand.includes('modify') ||
        lowerCommand.includes('change') || lowerCommand.includes('edit')) {
      return this.processUpdateChartCommand(lowerCommand);
    }
    
    // Theme commands
    if (lowerCommand.startsWith('/theme ') || lowerCommand.includes('theme') ||
        lowerCommand.includes('color') || lowerCommand.includes('scheme') ||
        lowerCommand.includes('dark mode') || lowerCommand.includes('light mode')) {
      return this.processThemeCommand(lowerCommand);
    }
    
    // Filter commands
    if (lowerCommand.startsWith('/filter ') || lowerCommand.includes('filter') ||
        lowerCommand.includes('sort') || lowerCommand.includes('group') ||
        lowerCommand.includes('by') || lowerCommand.includes('where')) {
      return this.processFilterCommand(lowerCommand);
    }
    
    // Export commands
    if (lowerCommand.startsWith('/export') || lowerCommand.includes('export') ||
        lowerCommand.includes('download') || lowerCommand.includes('save as') ||
        lowerCommand.includes('export to')) {
      return this.processExportCommand(lowerCommand);
    }
    
    // Share commands
    if (lowerCommand.startsWith('/share') || lowerCommand.includes('share') ||
        lowerCommand.includes('send') || lowerCommand.includes('email') ||
        lowerCommand.includes('collaborate')) {
      return this.processShareCommand(lowerCommand);
    }
    
    // Save commands
    if (lowerCommand.startsWith('/save') || lowerCommand.includes('save') ||
        lowerCommand.includes('store')) {
      return this.processSaveCommand(lowerCommand);
    }
    
    // Refresh commands
    if (lowerCommand.startsWith('/refresh') || lowerCommand.includes('refresh') ||
        lowerCommand.includes('update data') || lowerCommand.includes('reload') ||
        lowerCommand.includes('sync')) {
      return this.processRefreshCommand(lowerCommand);
    }
    
    // Try to interpret as a general chart creation command
    return this.processGeneralCommand(lowerCommand);
  }

  private static processAddChartCommand(command: string): ProcessedCommand {
    // Extract chart type and title
    const chartInfo = this.extractChartInfo(command);
    
    if (!chartInfo.type) {
      return {
        action: 'add_chart',
        success: false,
        message: 'Could not identify chart type. Try: "Add a bar chart for sales by region" or "Create a pie chart of customer distribution"'
      };
    }
    
    return {
      action: 'add_chart',
      chartType: chartInfo.type as any,
      chartTitle: chartInfo.title || undefined,
      success: true,
      message: `Adding ${chartInfo.type} chart${chartInfo.title ? ` titled "${chartInfo.title}"` : ''}`
    };
  }

  private static processRemoveChartCommand(command: string): ProcessedCommand {
    // Extract chart identifier
    const chartIdMatch = command.match(/chart\s+([a-zA-Z0-9]+)/i);
    const chartTitleMatch = command.match(/chart\s+(?:for|of|titled?)\s+(.+)/i);
    
    if (chartIdMatch) {
      return {
        action: 'remove_chart',
        chartId: chartIdMatch[1],
        success: true,
        message: `Removing chart with ID: ${chartIdMatch[1]}`
      };
    }
    
    if (chartTitleMatch) {
      return {
        action: 'remove_chart',
        chartTitle: chartTitleMatch[1],
        success: true,
        message: `Removing chart titled: ${chartTitleMatch[1]}`
      };
    }
    
    return {
      action: 'remove_chart',
      success: false,
      message: 'Please specify which chart to remove by ID or title. Try: "Remove the sales chart" or "Delete chart 123"'
    };
  }

  private static processUpdateChartCommand(command: string): ProcessedCommand {
    // Extract chart identifier and update parameters
    const chartIdMatch = command.match(/chart\s+([a-zA-Z0-9]+)/i);
    const chartTitleMatch = command.match(/chart\s+(?:for|of|titled?)\s+(.+?)(?:\s+to\s+|\s*$)/i);
    
    if (chartIdMatch || chartTitleMatch) {
      return {
        action: 'update_chart',
        chartId: chartIdMatch ? chartIdMatch[1] : undefined,
        chartTitle: chartTitleMatch ? chartTitleMatch[1] : undefined,
        success: true,
        message: `Updating chart${chartIdMatch ? ` with ID: ${chartIdMatch[1]}` : chartTitleMatch ? ` titled: ${chartTitleMatch[1]}` : ''}`
      };
    }
    
    return {
      action: 'update_chart',
      success: false,
      message: 'Please specify which chart to update by ID or title. Try: "Update the sales chart" or "Change chart 123"'
    };
  }

  private static processThemeCommand(command: string): ProcessedCommand {
    const themes = ['purple', 'blue', 'green', 'orange', 'red', 'indigo', 'dark', 'light'];
    const themeMatch = command.match(new RegExp(`\\b(${themes.join('|')})\\b`, 'i'));
    
    if (themeMatch) {
      return {
        action: 'change_theme',
        theme: themeMatch[1].toLowerCase(),
        success: true,
        message: `Changing dashboard theme to ${themeMatch[1]}`
      };
    }
    
    // Check for dark/light mode specifically
    if (command.includes('dark') || command.includes('dark mode')) {
      return {
        action: 'change_theme',
        theme: 'dark',
        success: true,
        message: 'Switching to dark mode'
      };
    }
    
    if (command.includes('light') || command.includes('light mode')) {
      return {
        action: 'change_theme',
        theme: 'light',
        success: true,
        message: 'Switching to light mode'
      };
    }
    
    return {
      action: 'change_theme',
      success: false,
      message: 'Please specify a theme: purple, blue, green, orange, red, indigo, dark, or light. Try: "Change theme to blue" or "Switch to dark mode"'
    };
  }

  private static processFilterCommand(command: string): ProcessedCommand {
    // Extract filter parameters
    const filterMatch = command.match(/(?:filter|sort|group|by|where)\s+(.+)/i);
    
    if (filterMatch) {
      return {
        action: 'apply_filter',
        filter: { criteria: filterMatch[1] },
        success: true,
        message: `Applying filter: ${filterMatch[1]}`
      };
    }
    
    return {
      action: 'apply_filter',
      success: false,
      message: 'Please specify filter criteria. Try: "Filter by region = North America" or "Sort by revenue"'
    };
  }

  private static processExportCommand(command: string): ProcessedCommand {
    const formats = ['pdf', 'png', 'excel', 'csv', 'powerpoint', 'ppt', 'json'];
    const formatMatch = command.match(new RegExp(`\\b(${formats.join('|')})\\b`, 'i'));
    
    return {
      action: 'export_dashboard',
      parameters: formatMatch ? { format: formatMatch[1] } : undefined,
      success: true,
      message: `Exporting dashboard${formatMatch ? ` as ${formatMatch[1].toUpperCase()}` : ''}`
    };
  }

  private static processShareCommand(command: string): ProcessedCommand {
    return {
      action: 'share_dashboard',
      success: true,
      message: 'Sharing dashboard'
    };
  }

  private static processSaveCommand(command: string): ProcessedCommand {
    return {
      action: 'save_dashboard',
      success: true,
      message: 'Saving dashboard'
    };
  }

  private static processRefreshCommand(command: string): ProcessedCommand {
    return {
      action: 'refresh_dashboard',
      success: true,
      message: 'Refreshing dashboard data'
    };
  }

  private static processGeneralCommand(command: string): ProcessedCommand {
    // Try to interpret general commands as chart creation
    const chartInfo = this.extractChartInfo(command);
    
    if (chartInfo.type) {
      return {
        action: 'add_chart',
        chartType: chartInfo.type as any,
        chartTitle: chartInfo.title || undefined,
        success: true,
        message: `Adding ${chartInfo.type} chart${chartInfo.title ? ` titled "${chartInfo.title}"` : ''}`
      };
    }
    
    // Check for dashboard-related keywords
    const dashboardKeywords = ['dashboard', 'lumadash', 'visualization', 'chart', 'graph', 'add', 'create', 'show'];
    const hasDashboardKeyword = dashboardKeywords.some(keyword => command.includes(keyword));
    
    if (hasDashboardKeyword) {
      return {
        action: 'add_chart',
        chartType: 'bar', // Default chart type
        chartTitle: 'New Chart',
        success: true,
        message: 'Adding a new chart to your dashboard'
      };
    }
    
    return {
      action: 'add_chart',
      success: false,
      message: 'Unrecognized command. Try: "Add a bar chart for sales by region" or "Change theme to blue"'
    };
  }

  private static extractChartInfo(command: string): { type: string | null; title: string | null } {
    // Look for chart type keywords
    for (const [keyword, type] of Object.entries(this.chartTypeMap)) {
      if (command.includes(keyword)) {
        // Extract title if present
        const titlePatterns = [
          /(?:chart|graph|visualization)\s+(?:for|of|showing|displaying|titled?|about)\s+(.+)/i,
          /add\s+(?:a|an)\s+\w+\s+chart\s+(?:for|of|showing|displaying|titled?|about)\s+(.+)/i,
          /create\s+(?:a|an)\s+\w+\s+chart\s+(?:for|of|showing|displaying|titled?|about)\s+(.+)/i,
          /show\s+(?:a|an)\s+\w+\s+chart\s+(?:for|of|showing|displaying|titled?|about)\s+(.+)/i,
          /(?:bar|line|pie|doughnut|area|radar|polar|bubble|scatter)\s+chart\s+(?:for|of|showing|displaying|titled?|about)\s+(.+)/i
        ];
        
        for (const pattern of titlePatterns) {
          const titleMatch = command.match(pattern);
          if (titleMatch) {
            const title = titleMatch[1].trim();
            // Remove trailing punctuation
            const cleanTitle = title.replace(/[.!?]+$/, '');
            return { type, title: cleanTitle };
          }
        }
        
        // If no title found, return just the type
        return { type, title: null };
      }
    }
    
    // Try to extract chart type from more general phrases
    const chartTypePhrases = [
      { pattern: /(?:bar|column)\s+chart/i, type: 'bar' },
      { pattern: /line\s+chart/i, type: 'line' },
      { pattern: /(?:pie|donut)\s+chart/i, type: 'pie' },
      { pattern: /area\s+chart/i, type: 'line' },
      { pattern: /scatter\s+plot/i, type: 'scatter' },
      { pattern: /bubble\s+chart/i, type: 'bubble' },
      { pattern: /radar\s+chart/i, type: 'radar' },
      { pattern: /polar\s+area\s+chart/i, type: 'polarArea' }
    ];
    
    for (const phrase of chartTypePhrases) {
      if (phrase.pattern.test(command)) {
        // Extract title
        const titleMatch = command.match(/(?:chart|plot)\s+(?:for|of|showing|displaying|titled?|about)\s+(.+)/i);
        if (titleMatch) {
          const title = titleMatch[1].trim().replace(/[.!?]+$/, '');
          return { type: phrase.type, title };
        }
        return { type: phrase.type, title: null };
      }
    }
    
    return { type: null, title: null };
  }
}