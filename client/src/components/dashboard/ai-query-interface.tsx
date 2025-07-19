import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Bot, Send, BarChart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function AiQueryInterface() {
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
    "Top selling products",
    "Inventory by warehouse", 
    "Sales by marketplace"
  ];

  return (
    <Card className="shadow-sm border border-gray-200">
      <CardHeader>
        <CardTitle className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <span>AI Query Assistant</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-2">Ask me anything about your warehouse data:</p>
          <div className="flex flex-wrap gap-2">
            {suggestedQueries.map((suggestion, index) => (
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
        </div>

        <div className="relative">
          <Textarea
            placeholder="Type your question here... e.g., 'Show me revenue by product category for the last month'"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="resize-none h-20 pr-12"
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

        {queryResult && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-3">
              <BarChart className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-sm">Query Result</span>
            </div>
            {queryResult.error ? (
              <div className="text-sm text-red-600">
                <p className="font-medium">Error: {queryResult.error}</p>
                <p className="mt-1">{queryResult.explanation}</p>
              </div>
            ) : (
              <div className="text-sm text-gray-600">
                <p className="mb-2">{queryResult.explanation}</p>
                {queryResult.sql && (
                  <div className="bg-gray-100 p-2 rounded text-xs font-mono mt-2 overflow-x-auto">
                    {queryResult.sql}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
