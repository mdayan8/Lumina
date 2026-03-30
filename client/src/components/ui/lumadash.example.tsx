import { LumaDash } from './lumadash';

// Example usage of the LumaDash component
export function LumaDashExample() {
  // Mock file data
  const mockFile = {
    id: '1',
    originalName: 'sales-data.csv',
    filename: 'sales-data.csv',
    createdAt: new Date().toISOString()
  };

  // Handler functions for chart operations
  const handleAddChart = (command: string) => {
    console.log('Adding chart with command:', command);
    // In a real implementation, this would call an API to process the command
    // and add the chart to the dashboard
  };

  const handleRemoveChart = (chartId: string) => {
    console.log('Removing chart with ID:', chartId);
    // In a real implementation, this would remove the chart from the dashboard
  };

  const handleUpdateChart = (chartId: string, updates: any) => {
    console.log('Updating chart with ID:', chartId, 'with updates:', updates);
    // In a real implementation, this would update the chart configuration
  };

  return (
    <div className="h-screen">
      <LumaDash 
        file={mockFile}
        onAddChart={handleAddChart}
        onRemoveChart={handleRemoveChart}
        onUpdateChart={handleUpdateChart}
      />
    </div>
  );
}