# LumaDash Feature Documentation

## Overview
LumaDash is an innovative dashboard feature that allows users to toggle between a chat interface and a visualization dashboard. It enables users to create and manage interactive charts through natural language commands, making data analysis accessible and intuitive.

## Key Features

### 1. Dual Interface Mode
- **Chat Mode**: Traditional conversational interface for data analysis
- **Dashboard Mode**: Visual representation of data through interactive charts

### 2. Natural Language Processing
Users can create charts by simply typing commands like:
- "Add a bar chart for last quarter sales"
- "Create a line chart showing monthly revenue trends"
- "Show a pie chart of regional performance"

### 3. Interactive Dashboard
- Grid-based layout for organizing charts
- Drag-and-drop functionality for chart positioning
- Real-time chart rendering with multiple visualization types
- Chart customization options

### 4. Chart Types Supported
- Bar Charts
- Line Charts
- Pie Charts
- KPI Indicators
- Data Tables

## Implementation Details

### Components
1. **LumaDash Component** (`/src/components/ui/lumadash.tsx`)
   - Main dashboard interface
   - Natural language command processing
   - Chart grid management

2. **ChartWrapper Component** (`/src/components/charts/chart-wrapper.tsx`)
   - Renders different chart types using Chart.js
   - Handles chart theming and styling

### Integration Points
- Toggle button in the main application header
- File context passed from the main app
- API integration points for chart data processing

## Usage Instructions

1. **Toggle Between Views**
   - Use the "Chat" and "Dashboard" buttons in the header to switch between interfaces

2. **Creating Charts**
   - In Dashboard mode, type a natural language command in the input field
   - Press Enter or click "Add Chart" to generate the visualization
   - Use suggested commands for quick chart creation

3. **Managing Charts**
   - Edit charts using the edit icon
   - Reposition charts using the move icon
   - Delete charts using the trash icon

## Future Enhancements
- Advanced chart customization options
- Dashboard sharing and collaboration features
- Export functionality for charts and dashboards
- Integration with more data sources
- Enhanced natural language processing capabilities