# Warehouse Management System (WMS) - Architecture Guide

## Overview

This is a full-stack Warehouse Management System built as a web application. The system handles SKU (Stock Keeping Unit) management, inventory tracking, sales data processing, and provides AI-assisted features for data operations. It's designed as an MVP to demonstrate data cleaning, SKU mapping, and warehouse operations management capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (July 19, 2025)

- Enhanced error handling for OpenAI API quota issues with user-friendly messages
- Improved CSV file processing with flexible column detection and better validation
- Added comprehensive database seeding with realistic sample data
- Fixed sidebar navigation component to prevent HTML validation warnings
- Created sample CSV test data for development and testing

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack Query (React Query) for server state
- **UI Framework**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design system
- **Build Tool**: Vite for development and bundling

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript throughout
- **API Pattern**: RESTful API endpoints under `/api` prefix
- **File Processing**: Multer for file uploads with CSV processing
- **AI Integration**: OpenAI GPT-4o for intelligent SKU mapping suggestions

### Database & ORM
- **Database**: PostgreSQL (configured for Neon serverless)
- **ORM**: Drizzle ORM with Zod validation
- **Migrations**: Drizzle Kit for schema management
- **Connection**: Neon serverless with WebSocket support

## Key Components

### Data Models
The system uses a relational database with these core entities:
- **Users**: Authentication and user management
- **SKUs**: Individual product identifiers from different marketplaces
- **MSKUs**: Master SKUs that consolidate product variations
- **SKU Mappings**: Relationships between SKUs and MSKUs with confidence scores
- **Inventory**: Stock levels per warehouse and MSKU
- **Sales Data**: Transaction records linked to SKUs
- **File Uploads**: Tracking of data import operations

### Frontend Pages
- **Dashboard**: Main overview with metrics, charts, and quick actions
- **SKU Mapping**: Interface for managing SKU to MSKU relationships
- **Inventory**: Stock level monitoring and warehouse management
- **Reports**: Analytics and data visualization
- **AI Query**: Natural language interface for data queries

### Core Services
- **File Processor**: Handles CSV data imports and processing
- **OpenAI Service**: Provides AI-powered SKU mapping suggestions
- **Storage Layer**: Abstracted database operations with type safety

## Data Flow

### File Upload Process
1. User uploads CSV files via drag-and-drop interface
2. Files are processed server-side to extract SKU and sales data
3. New SKUs are automatically created if they don't exist
4. Sales data is linked to existing or newly created SKUs
5. Progress tracking and status updates provided to frontend

### SKU Mapping Workflow
1. System identifies unmapped SKUs from uploaded data
2. AI service analyzes SKU names against existing MSKUs
3. Confidence-scored mapping suggestions are presented
4. Users can accept, modify, or manually create mappings
5. Mapping relationships are stored with audit trail

### Real-time Dashboard Updates
1. TanStack Query provides automatic data refetching
2. Metrics are calculated server-side for performance
3. Charts and visualizations update based on time range selections
4. WebSocket-ready architecture for future real-time features

## External Dependencies

### Database
- **Neon PostgreSQL**: Serverless PostgreSQL with connection pooling
- **Environment**: Requires `DATABASE_URL` environment variable

### AI Services
- **OpenAI API**: GPT-4o model for natural language processing
- **Environment**: Requires `OPENAI_API_KEY` environment variable

### File Processing
- **Multer**: Multipart form handling for file uploads
- **CSV Parser**: Stream-based CSV processing for large files
- **File System**: Temporary file storage for upload processing

### UI Dependencies
- **Radix UI**: Accessible component primitives
- **Recharts**: Data visualization and charting
- **React Dropzone**: File upload interface
- **Embla Carousel**: Component carousels

## Deployment Strategy

### Development
- **Local Development**: Vite dev server with HMR
- **Database**: Drizzle migrations with push command
- **Environment**: Development-specific configurations

### Production Build
- **Frontend**: Vite build with optimized bundles
- **Backend**: ESBuild compilation to single output file
- **Static Assets**: Served from `/dist/public` directory
- **Process**: Single Node.js process serving both API and static files

### Environment Configuration
- **Database Connection**: PostgreSQL via connection string
- **API Keys**: OpenAI integration for AI features
- **File Storage**: Local filesystem with configurable limits
- **CORS**: Configured for development and production environments

The architecture prioritizes type safety, developer experience, and scalability while maintaining simplicity for the MVP scope. The system is designed to handle the core warehouse management workflows while providing a foundation for future enhancements.