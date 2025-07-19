# 🏢 Warehouse Management System

A comprehensive warehouse management system built with React, TypeScript, Node.js, and SQLite. This system handles SKU mapping, inventory management, sales data processing, and provides AI-powered analytics.

## ✨ Features

- **📊 Real-time Dashboard** - Monitor warehouse operations with live metrics
- **📁 File Processing** - Intelligent CSV file upload and processing
- **🔄 SKU Mapping** - Map marketplace SKUs to Master SKUs (MSKUs)
- **📦 Inventory Management** - Track inventory across multiple warehouses
- **📈 Sales Analytics** - Comprehensive sales reporting and charts
- **🤖 AI Integration** - OpenAI-powered query processing and suggestions
- **🔍 Smart Search** - Advanced search and filtering capabilities

## 🛠️ Tech Stack

### Frontend
- **React 18** - User interface
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **TailwindCSS** - Styling
- **Radix UI** - UI components
- **TanStack Query** - Data fetching
- **Recharts** - Data visualization
- **React Hook Form** - Form management

### Backend
- **Node.js** - Runtime
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **Drizzle ORM** - Database ORM
- **SQLite** - Database (Better-SQLite3)
- **Multer** - File upload handling
- **OpenAI API** - AI integrations

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/rahmanmohd/Warehouse-Management-System.git
cd Warehouse-Management-System
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**
```bash
cp .env.example .env
```
Edit `.env` with your configuration:
```env
DATABASE_URL="file:./local-database.sqlite"
OPENAI_API_KEY="your-openai-api-key-here"
PORT=5000
```

4. **Database Setup**
```bash
npm run db:push
```

5. **Seed Sample Data (Optional)**
```bash
npm run seed
```

6. **Start Development Server**
```bash
npm run dev
```

Visit `http://localhost:5000` to access the application.

## 📁 Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom hooks
│   │   └── lib/            # Utilities
├── server/                 # Express backend
│   ├── services/           # Business logic
│   ├── routes.ts           # API routes
│   ├── db.ts              # Database connection
│   └── storage.ts         # Data access layer
├── shared/                 # Shared types and schemas
│   └── schema.ts          # Database schema
├── uploads/               # File upload directory
└── package.json
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:push` - Push database schema changes
- `npm run seed` - Seed database with sample data
- `npm run check` - Type checking

## 📊 Database Schema

The system uses SQLite with the following main entities:

- **Users** - System users
- **SKUs** - Marketplace product identifiers
- **MSKUs** - Master SKUs (internal product codes)
- **SKU Mappings** - Relationships between SKUs and MSKUs
- **Inventory** - Stock levels by warehouse
- **Sales Data** - Transaction records
- **File Uploads** - Upload processing status

## 📄 API Endpoints

### Dashboard
- `GET /api/dashboard/metrics` - Dashboard statistics
- `GET /api/dashboard/sales-chart` - Sales chart data

### SKU Management
- `GET /api/skus` - List all SKUs
- `POST /api/skus` - Create new SKU
- `GET /api/skus/unmapped` - Get unmapped SKUs

### File Processing
- `POST /api/upload` - Upload CSV files
- `GET /api/uploads` - Get upload status
- `POST /api/process-all` - Reprocess failed files

### AI Features
- `POST /api/ai/query` - Natural language queries
- `POST /api/mappings/ai-suggestions` - AI-powered mapping suggestions

## 🎯 CSV File Format

The system accepts CSV files with flexible column naming. Required columns (flexible naming):

- **SKU/Product Code** - Product identifier
- **Product Name** - Product description
- **Quantity** - Number of items
- **Revenue/Price** - Financial value
- **Date** - Transaction date
- **Marketplace** - Sales channel

Example:
```csv
SKU,Product Name,Quantity,Revenue,Order Date,Marketplace
ABC123,Blue Widget,5,99.99,2025-01-15,amazon
DEF456,Red Gadget,2,49.50,2025-01-16,flipkart
```

## 🤖 AI Features

### Query Processing
Use natural language to query your data:
- "Show me top selling products this month"
- "What's our inventory level for electronics?"
- "Sales by marketplace last week"

### Smart SKU Mapping
AI-powered suggestions for mapping marketplace SKUs to internal MSKUs based on:
- Product name similarity
- Category matching
- Historical patterns

## 🔐 Environment Variables

Create a `.env` file with:

```env
# Database
DATABASE_URL="file:./local-database.sqlite"

# OpenAI (optional)
OPENAI_API_KEY="your-api-key-here"

# Server
PORT=5000
NODE_ENV=development
```

## 🚀 Production Deployment

### Build for Production
```bash
npm run build
```

### Start Production Server
```bash
npm run start
```

### Environment Configuration
- Set `NODE_ENV=production`
- Configure production database URL
- Set up file upload directory
- Configure CORS settings

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/rahmanmohd/Warehouse-Management-System/issues) page
2. Create a new issue with detailed information
3. Include error logs and system information

## 🙏 Acknowledgments

- Built with modern web technologies
- UI components from Radix UI
- Icons from Lucide React
- Charts powered by Recharts
- AI capabilities by OpenAI

---

**Made with ❤️ for efficient warehouse management**
