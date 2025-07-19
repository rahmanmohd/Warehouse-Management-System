import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, AlertTriangle, CheckCircle } from "lucide-react";

export default function Inventory() {
  const { data: inventory, isLoading } = useQuery({
    queryKey: ["/api/inventory"],
  });

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { status: "Out of Stock", color: "destructive", icon: AlertTriangle };
    if (quantity < 10) return { status: "Low Stock", color: "secondary", icon: AlertTriangle };
    return { status: "In Stock", color: "default", icon: CheckCircle };
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Inventory Management" 
          subtitle="Monitor stock levels and warehouse inventory"
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Products</p>
                    <p className="text-3xl font-semibold text-gray-900 mt-1">
                      {inventory?.length || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Package className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Low Stock Items</p>
                    <p className="text-3xl font-semibold text-orange-600 mt-1">
                      {inventory?.filter((item: any) => item.totalQuantity < 10).length || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Out of Stock</p>
                    <p className="text-3xl font-semibold text-red-600 mt-1">
                      {inventory?.filter((item: any) => item.totalQuantity === 0).length || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Inventory Overview</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading inventory...</div>
              ) : !inventory || inventory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No inventory data available
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">MSKU</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Product Name</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Category</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Total Quantity</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventory.map((item: any) => {
                        const { status, color, icon: Icon } = getStockStatus(item.totalQuantity);
                        return (
                          <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <span className="font-mono text-sm">{item.msku}</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-medium">{item.name}</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-sm text-gray-600">{item.category || "Uncategorized"}</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-medium">{item.totalQuantity}</span>
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant={color as any} className="flex items-center gap-1 w-fit">
                                <Icon className="w-3 h-3" />
                                {status}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
