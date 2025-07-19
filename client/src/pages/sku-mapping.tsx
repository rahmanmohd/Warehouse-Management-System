import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, CheckCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function SkuMapping() {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: unmappedSkus, isLoading: loadingUnmapped } = useQuery({
    queryKey: ["/api/skus/unmapped"],
  });

  const { data: allMskus } = useQuery({
    queryKey: ["/api/mskus"],
  });

  const { data: allMappings } = useQuery({
    queryKey: ["/api/mappings"],
  });

  const createMappingMutation = useMutation({
    mutationFn: async (data: { skuId: number; mskuId: number; mappedBy: string }) => {
      return apiRequest("POST", "/api/mappings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mappings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/skus/unmapped"] });
      toast({
        title: "Success",
        description: "SKU mapping created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create mapping",
        variant: "destructive",
      });
    },
  });

  const handleCreateMapping = (skuId: number, mskuId: number) => {
    createMappingMutation.mutate({
      skuId,
      mskuId,
      mappedBy: "manual"
    });
  };

  const filteredUnmappedSkus = unmappedSkus?.filter((sku: any) =>
    sku.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sku.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="SKU Mapping" 
          subtitle="Map SKUs to Master SKUs (MSKUs)"
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Unmapped SKUs */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    Unmapped SKUs ({filteredUnmappedSkus.length})
                  </CardTitle>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    <Input
                      placeholder="Search SKUs..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {loadingUnmapped ? (
                      <div className="text-center py-8">Loading unmapped SKUs...</div>
                    ) : filteredUnmappedSkus.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        {searchQuery ? "No SKUs match your search" : "All SKUs are mapped!"}
                      </div>
                    ) : (
                      filteredUnmappedSkus.map((sku: any) => (
                        <div key={sku.id} className="p-4 border rounded-lg bg-white">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="font-mono text-sm font-medium">{sku.sku}</h3>
                              <p className="text-sm text-gray-600">{sku.name}</p>
                              <Badge variant="secondary" className="mt-1">
                                {sku.marketplace}
                              </Badge>
                            </div>
                            <Badge variant="outline" className="text-orange-600 border-orange-200">
                              Unmapped
                            </Badge>
                          </div>
                          
                          <div className="flex gap-2">
                            <Select onValueChange={(value) => {
                              const mskuId = parseInt(value);
                              handleCreateMapping(sku.id, mskuId);
                            }}>
                              <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Select MSKU..." />
                              </SelectTrigger>
                              <SelectContent>
                                {allMskus?.map((msku: any) => (
                                  <SelectItem key={msku.id} value={msku.id.toString()}>
                                    {msku.msku} - {msku.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button size="sm" variant="outline">
                              <Plus className="w-4 h-4" />
                              New MSKU
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Mapping Statistics */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Mapping Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total SKUs</span>
                    <span className="font-semibold">
                      {(allMappings?.length || 0) + (unmappedSkus?.length || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Mapped SKUs</span>
                    <span className="font-semibold text-green-600">{allMappings?.length || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Unmapped SKUs</span>
                    <span className="font-semibold text-orange-600">{unmappedSkus?.length || 0}</span>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Mapping Rate</span>
                      <span className="font-semibold">
                        {((allMappings?.length || 0) / ((allMappings?.length || 0) + (unmappedSkus?.length || 0)) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full" variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Create New MSKU
                  </Button>
                  <Button className="w-full" variant="outline">
                    Import Mappings
                  </Button>
                  <Button className="w-full" variant="outline">
                    Export Mappings
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
