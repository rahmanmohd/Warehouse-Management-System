import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function SkuMappingAssistant() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: unmappedSkus } = useQuery({
    queryKey: ["/api/skus/unmapped"],
  });

  const { data: allMskus } = useQuery({
    queryKey: ["/api/mskus"],
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

  const displayedSkus = unmappedSkus?.slice(0, 3) || [];

  return (
    <Card className="shadow-sm border border-gray-200">
      <CardHeader>
        <CardTitle>SKU Mapping Assistant</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {unmappedSkus && unmappedSkus.length > 0 && (
          <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
              <div>
                <p className="font-medium text-orange-900 text-sm">Unmapped SKUs Found</p>
                <p className="text-sm text-gray-600 mt-1">
                  {unmappedSkus.length} SKU{unmappedSkus.length !== 1 ? 's' : ''} require mapping
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {displayedSkus.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              All SKUs are mapped!
            </div>
          ) : (
            displayedSkus.map((sku: any) => (
              <div key={sku.id} className="p-3 border border-gray-200 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-sm font-mono">{sku.sku}</span>
                  <Badge variant="outline" className="text-orange-600 border-orange-200">
                    Unmapped
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 mb-2">{sku.name}</p>
                <p className="text-xs text-gray-500 mb-2">Suggested mapping:</p>
                <Select onValueChange={(value) => {
                  const mskuId = parseInt(value);
                  handleCreateMapping(sku.id, mskuId);
                }}>
                  <SelectTrigger className="w-full text-sm">
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
              </div>
            ))
          )}
        </div>

        {unmappedSkus && unmappedSkus.length > 0 && (
          <Button className="w-full" size="sm">
            Auto-map All Suggestions
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
