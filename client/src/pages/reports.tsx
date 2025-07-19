import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, TrendingUp, Package, DollarSign } from "lucide-react";

export default function Reports() {
  const { data: topProducts } = useQuery({
    queryKey: ["/api/sales/top-products"],
  });

  const { data: salesData } = useQuery({
    queryKey: ["/api/sales"],
  });

  const totalRevenue = salesData?.reduce((sum: number, sale: any) => 
    sum + parseFloat(sale.revenue), 0
  ).toFixed(2) || "0.00";

  const totalOrders = salesData?.length || 0;

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Reports & Analytics" 
          subtitle="Detailed insights into your warehouse performance"
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-4">
              <Select defaultValue="7">
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select time period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 3 months</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button>
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                    <p className="text-3xl font-semibold text-gray-900 mt-1">
                      ${totalRevenue}
                    </p>
                    <p className="text-sm text-green-600 mt-1">+8.2% from last week</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Orders</p>
                    <p className="text-3xl font-semibold text-gray-900 mt-1">
                      {totalOrders}
                    </p>
                    <p className="text-sm text-green-600 mt-1">+12.5% from last week</p>
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
                    <p className="text-sm font-medium text-gray-500">Avg Order Value</p>
                    <p className="text-3xl font-semibold text-gray-900 mt-1">
                      ${totalOrders > 0 ? (parseFloat(totalRevenue) / totalOrders).toFixed(2) : "0.00"}
                    </p>
                    <p className="text-sm text-green-600 mt-1">+3.1% from last week</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Selling Products</CardTitle>
              </CardHeader>
              <CardContent>
                {!topProducts || topProducts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No sales data available
                  </div>
                ) : (
                  <div className="space-y-4">
                    {topProducts.slice(0, 10).map((product: any, index: number) => (
                      <div key={product.msku.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-semibold text-blue-600">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{product.msku.name}</p>
                            <p className="text-sm text-gray-500 font-mono">{product.msku.msku}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">${parseFloat(product.totalRevenue).toFixed(2)}</p>
                          <p className="text-sm text-gray-500">{product.totalQuantity} sold</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sales by Marketplace</CardTitle>
              </CardHeader>
              <CardContent>
                {!salesData || salesData.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No sales data available
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(
                      salesData.reduce((acc: any, sale: any) => {
                        const marketplace = sale.marketplace;
                        if (!acc[marketplace]) {
                          acc[marketplace] = { revenue: 0, orders: 0 };
                        }
                        acc[marketplace].revenue += parseFloat(sale.revenue);
                        acc[marketplace].orders += 1;
                        return acc;
                      }, {})
                    ).map(([marketplace, data]: [string, any]) => (
                      <div key={marketplace} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary">{marketplace}</Badge>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">${data.revenue.toFixed(2)}</p>
                          <p className="text-sm text-gray-500">{data.orders} orders</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
