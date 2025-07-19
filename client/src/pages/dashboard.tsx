import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import MetricsCards from "@/components/dashboard/metrics-cards";
import FileUpload from "@/components/dashboard/file-upload";
import SkuMappingAssistant from "@/components/dashboard/sku-mapping-assistant";
import SalesChart from "@/components/dashboard/sales-chart";
import AiQueryInterface from "@/components/dashboard/ai-query-interface";
import MappingsTable from "@/components/dashboard/mappings-table";

export default function Dashboard() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Warehouse Dashboard" 
          subtitle="Monitor your warehouse operations in real-time"
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          <MetricsCards />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2">
              <FileUpload />
            </div>
            <SkuMappingAssistant />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <SalesChart />
            <AiQueryInterface />
          </div>

          <MappingsTable />
        </main>
      </div>
    </div>
  );
}
