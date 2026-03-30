# Lumina - Conversational Business Intelligence Platform

Lumina is an innovative platform that combines the simplicity of chat with the power of customizable BI dashboards, making data analysis accessible, intuitive, and collaborative for SMB users without technical expertise.

## Features

### Core Functionality
- **Natural Language Interaction**: Ask complex business questions in plain English and get accurate insights
- **Conversational Data Analysis**: Chat with your data using intuitive language
- **File Upload & Analysis**: Upload CSV files for instant data analysis
- **AI-Powered Insights**: Get actionable business recommendations from your data

### Advanced Features
- **Explainable AI**: Understand how insights were generated to build trust
- **Premium Plans**: Access advanced features with our premium subscription options
- **Automation**: Set up automated reports, follow-ups, and workflows triggered by insights
- **Personalization**: System learns from user behavior to anticipate needs and offer tailored recommendations

### Power BI-like LumaDash - Conversational Dashboard
- **Full Power BI Features**: 9+ chart types (bar, line, pie, doughnut, area, map, gauge, funnel, KPI, tables)
- **Natural Language Control**: Create and manage dashboards entirely through chat commands
- **Advanced Customization**: Color themes, title customization, layout options, time filters
- **Collaboration Tools**: Save, export (PDF/PNG/Excel), share, and real-time collaboration
- **Advanced Analytics**: Anomaly detection, trend analysis, correlation analysis, segmentation
- **Interactive Dashboard Preview**: Switch between edit and preview modes for dashboard visualization
- **Drag-and-Drop Interface**: Easily reposition and customize charts

## Technology Stack

### Frontend
- React with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Chart.js for data visualization
- Next-themes for dark/light mode

### Backend
- Node.js with Express
- PostgreSQL for data storage
- Drizzle ORM for database operations
- DeepSeek API for AI processing

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL database
- DeepSeek API key

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/lumina.git
   cd lumina
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with the following variables:
   ```
   DATABASE_URL=your_postgresql_connection_string
   DEEPSEEK_API_KEY=your_deepseek_api_key
   ```

4. Run database migrations:
   ```bash
   npm run db:migrate
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open your browser to `http://localhost:3000`

## Usage

### Chat Commands
- **Data Analysis**: "Show me the top 5 products by revenue"
- **SQL Queries**: "/sql SELECT * FROM sales WHERE region = 'North America'"
- **Anomaly Detection**: "/anomalies"
- **Workflow Creation**: "/workflow Analyze customer churn patterns"
- **Chart Creation**: "/add bar chart for sales by region"
- **Dashboard Management**: "/theme blue", "/export dashboard as PDF"

### Dashboard Creation
1. Upload a CSV file using the file upload interface
2. Ask questions about your data in natural language
3. Toggle to LumaDash view to create visualizations through commands
4. Customize and arrange your dashboard as needed
5. Export insights and charts for sharing

## Contributing

We welcome contributions to Lumina! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please open an issue on the GitHub repository or contact our team at support@lumina.example.com.