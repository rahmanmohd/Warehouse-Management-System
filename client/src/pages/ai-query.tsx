import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Bot, Send, Lightbulb, BarChart, Package, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function AiQuery() {
  const [query, setQuery] = useState("");
  const [queryResult, setQueryResult] = useState<any>(null);
  const { toast } = useToast();

  const queryMutation = useMutation({
    mutationFn: async (userQuery: string) => {
      const response = await apiRequest("POST", "/api/ai/query", { query: userQuery });
      return response.json();
    },
    onSuccess: (data) => {
      setQueryResult(data);
      setQuery("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to process query",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!query.trim()) return;
    queryMutation.mutate(query);
  };

  const suggestedQueries = [
    "Show me the top 5 selling products by revenue",
    "What's the current inventory level for each warehouse?",
    "List all unmapped SKUs from the last week",
    "Show sales performance by marketplace",
    "Which products have low stock levels?",
    "What's the revenue trend for the last 30 days?"
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="AI Query Assistant" 
          subtitle="Ask questions about your warehouse data in natural language"
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* AI Introduction */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <Bot className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">AI-Powered Data Analysis</h2>
                    <p className="text-sm text-gray-600">Ask questions about your warehouse data and get instant insights</p>
                  </div>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-blue-900 mb-1">Try asking questions like:</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {suggestedQueries.map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => setQuery(suggestion)}
                            className="text-left text-sm text-blue-700 hover:text-blue-900 hover:underline"
                          >
                            "{suggestion}"
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Query Input */}
            <Card>
              <CardHeader>
                <CardTitle>Ask Your Question</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Textarea
                    placeholder="Type your question here... e.g., 'Show me revenue by product category for the last month'"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="min-h-24 pr-12"
                  />
                  <Button
                    onClick={handleSubmit}
                    disabled={!query.trim() || queryMutation.isPending}
                    className="absolute bottom-2 right-2"
                    size="sm"
                  >
                    {queryMutation.isPending ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {suggestedQueries.slice(0, 3).map((suggestion, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="cursor-pointer hover:bg-blue-100"
                      onClick={() => setQuery(suggestion)}
                    >
                      {suggestion}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Query Results */}
            {queryResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart className="w-5 h-5" />
                    Query Result
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {queryResult.error ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h3 className="font-medium text-red-900 mb-2">Error</h3>
                      <p className="text-red-700">{queryResult.error}</p>
                      <p className="text-sm text-red-600 mt-2">{queryResult.explanation}</p>
                      
                      {queryResult.error.includes("quota") && (
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                          <p className="text-blue-800 text-sm font-medium mb-2">Try these ready-to-use queries instead:</p>
                          <div className="space-y-1">
                            <button 
                              onClick={() => setQuery("Show me top selling products by revenue")}
                              className="block text-left text-blue-600 hover:text-blue-800 text-sm underline"
                            >
                              • Top selling products by revenue
                            </button>
                            <button 
                              onClick={() => setQuery("What is the inventory status by warehouse")}
                              className="block text-left text-blue-600 hover:text-blue-800 text-sm underline"
                            >
                              • Inventory status by warehouse
                            </button>
                            <button 
                              onClick={() => setQuery("Sales breakdown by marketplace")}
                              className="block text-left text-blue-600 hover:text-blue-800 text-sm underline"
                            >
                              • Sales breakdown by marketplace
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h3 className="font-medium text-green-900 mb-2">Analysis Complete</h3>
                        <p className="text-green-700">{queryResult.explanation}</p>
                      </div>
                      
                      {queryResult.sql && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-2">Generated SQL Query</h4>
                          <code className="text-sm bg-gray-100 p-2 rounded block overflow-x-auto">
                            {queryResult.sql}
                          </code>
                        </div>
                      )}
                      
                      {queryResult.result && queryResult.result.length > 0 && (
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-3">Results</h4>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b">
                                  {Object.keys(queryResult.result[0]).map((key) => (
                                    <th key={key} className="text-left py-2 px-3 font-medium text-gray-600">
                                      {key}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {queryResult.result.map((row: any, index: number) => (
                                  <tr key={index} className="border-b">
                                    {Object.values(row).map((value: any, valueIndex: number) => (
                                      <td key={valueIndex} className="py-2 px-3">
                                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Recent Queries */}
            <Card>
              <CardHeader>
                <CardTitle>Query Examples</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Inventory Queries
                    </h4>
                    <div className="space-y-2">
                      <button 
                        onClick={() => setQuery("Show current inventory levels by warehouse")}
                        className="text-left text-sm text-blue-600 hover:text-blue-800 block"
                      >
                        Current inventory levels by warehouse
                      </button>
                      <button 
                        onClick={() => setQuery("Which products are out of stock?")}
                        className="text-left text-sm text-blue-600 hover:text-blue-800 block"
                      >
                        Products that are out of stock
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Sales Queries
                    </h4>
                    <div className="space-y-2">
                      <button 
                        onClick={() => setQuery("Show top 10 products by revenue this month")}
                        className="text-left text-sm text-blue-600 hover:text-blue-800 block"
                      >
                        Top 10 products by revenue this month
                      </button>
                      <button 
                        onClick={() => setQuery("Compare sales performance across marketplaces")}
                        className="text-left text-sm text-blue-600 hover:text-blue-800 block"
                      >
                        Sales performance by marketplace
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        </main>
      </div>
    </div>
  );
}
