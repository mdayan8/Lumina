# Lumina - AI-Driven Data Analytics Platform

## Overview

Lumina is a conversational analytics platform designed for small and medium-sized businesses (SMBs) to transform raw Excel/CSV data into actionable insights through natural language queries. The application enables users to upload data files, ask questions about their data using plain English, and receive AI-powered analysis with visualizations and recommendations.

The platform bridges the gap between complex enterprise BI tools and basic spreadsheet analysis by providing an intuitive chat-based interface powered by DeepSeek AI. Users can upload their data files and immediately start asking questions like "What are my top-performing products?" or "Show me sales trends over time" without needing to learn complex query languages or dashboard builders.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**React-based SPA**: Built with React 18 using TypeScript for type safety and better developer experience. The application uses Wouter for client-side routing and React Query (TanStack Query) for server state management.

**Component System**: Utilizes Radix UI primitives with shadcn/ui components for a consistent, accessible design system. The UI follows a dark theme with a purple color scheme that aligns with the Lumina brand identity.

**State Management**: Implements React Query for server state with custom hooks for local state management. API key storage is handled through localStorage with the `useApiKey` hook providing persistent authentication state.

**File Processing**: Client-side file parsing supports CSV and Excel formats using Papa Parse and SheetJS libraries. Files are processed to extract schemas and preview data before upload.

### Backend Architecture

**Express.js API**: RESTful API built with Express.js handling file uploads, data processing, and AI analysis requests. The server includes middleware for request logging, error handling, and CORS management.

**File Upload System**: Implements Multer for handling multipart form data with configurable file size limits (50MB) and type validation for CSV/Excel files only.

**AI Integration**: DeepSeek API client handles natural language processing and data analysis. The system builds contextual prompts combining user queries with data schema information to generate relevant insights.

**Data Processing Pipeline**: FileProcessor service extracts schemas, validates data types, and creates preview datasets from uploaded files. The system automatically detects column types (string, number, date, boolean) and generates representative samples.

### Data Storage Solutions

**PostgreSQL Database**: Uses Neon serverless PostgreSQL for scalable data storage with connection pooling for optimal performance.

**Drizzle ORM**: Type-safe database operations with automatic schema generation and migration support. The schema includes tables for users, data files, and analysis results.

**Database Schema Design**:
- Users table with authentication and API key storage
- Data files table storing metadata, schemas, and file information
- Analyses table linking user queries with AI responses and visualizations

### Authentication and Authorization

**API Key Management**: Currently implements a demo authentication system using stored API keys for DeepSeek integration. Users can configure their own API keys through a modal interface.

**Session Management**: Prepared for future session-based authentication with database storage for user preferences and analysis history.

### External Dependencies

**DeepSeek AI API**: Primary AI service for natural language data analysis and insight generation. Handles conversational queries and generates structured responses with metrics and recommendations.

**Chart.js Integration**: Visualization library for rendering dynamic charts and graphs based on AI-generated chart data. Supports multiple chart types including bar, line, pie, and doughnut charts.

**File Processing Libraries**: 
- Papa Parse for CSV file handling
- SheetJS (XLSX) for Excel file processing
- Both libraries provide robust parsing with error handling and type detection

**UI Framework Dependencies**:
- Radix UI for accessible component primitives
- Tailwind CSS for utility-first styling
- Lucide React for consistent iconography

**Development Tools**:
- Vite for fast development and optimized builds
- TypeScript for type safety across the full stack
- ESBuild for efficient server-side bundling