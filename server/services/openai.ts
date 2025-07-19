import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export class OpenAIService {
  async suggestSkuMapping(skuName: string, availableMskus: string[]): Promise<{
    suggestedMsku: string;
    confidence: number;
    reasoning: string;
  }[]> {
    try {
      const prompt = `
You are an expert warehouse management system assistant. Given a SKU name and a list of available Master SKUs (MSKUs), suggest the best mapping.

SKU to map: "${skuName}"

Available MSKUs:
${availableMskus.map(msku => `- ${msku}`).join('\n')}

Please analyze the SKU name and suggest the most appropriate MSKU mapping. Consider:
1. Product name similarity
2. Brand/category matches
3. Marketplace variations (e.g., "flipkart", "amazon" suffixes)
4. Common abbreviations

Respond with JSON in this format:
{
  "suggestions": [
    {
      "suggestedMsku": "exact-msku-name",
      "confidence": 0.95,
      "reasoning": "Explanation for this suggestion"
    }
  ]
}

Provide up to 3 suggestions, ordered by confidence score (0-1).
`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a warehouse management expert specializing in SKU to MSKU mapping. Always respond with valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const result = JSON.parse(response.choices[0].message.content || '{"suggestions": []}');
      return result.suggestions || [];
    } catch (error) {
      console.error("OpenAI SKU mapping error:", error);
      return [];
    }
  }

  async processTextToSQL(userQuery: string): Promise<{
    sql?: string;
    result?: any[];
    error?: string;
    explanation: string;
  }> {
    try {
      const schemaDescription = `
Database Schema for Warehouse Management System:

Tables:
1. skus (id, sku, name, marketplace, created_at)
2. mskus (id, msku, name, category, created_at)
3. sku_mappings (id, sku_id, msku_id, confidence, status, mapped_by, created_at)
4. inventory (id, msku_id, warehouse, quantity, reserved_quantity, last_updated)
5. sales_data (id, sku_id, msku_id, order_date, quantity, revenue, marketplace, processed_at)
6. file_uploads (id, filename, original_name, file_size, status, progress, uploaded_at)

Key relationships:
- SKUs map to MSKUs through sku_mappings table
- Inventory is tracked by MSKU and warehouse
- Sales data links to both SKUs and MSKUs
- Revenue is stored as decimal values

Common queries:
- Top selling products by revenue
- Inventory levels by warehouse
- Sales by marketplace
- Mapping statistics
- Revenue trends over time
`;

      const prompt = `
Given this database schema and user query, generate a safe PostgreSQL query and explain what it does.

User Query: "${userQuery}"

Database Schema:
${schemaDescription}

Rules:
1. Only generate SELECT queries (no INSERT, UPDATE, DELETE, DROP, etc.)
2. Use proper JOINs to get meaningful data
3. Include appropriate WHERE clauses for filtering
4. Use aggregate functions for summaries
5. Limit results to reasonable numbers (e.g., TOP 10)
6. Format monetary values appropriately

Respond with JSON in this format:
{
  "sql": "SELECT statement here",
  "explanation": "Clear explanation of what this query does and what results to expect",
  "queryType": "analytics|report|lookup",
  "canExecute": true
}

If the query cannot be safely generated, set canExecute to false and explain why in the explanation.
`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a PostgreSQL expert who generates safe, read-only queries for warehouse management analytics. Always respond with valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      if (!result.canExecute) {
        return {
          error: "Query cannot be executed safely",
          explanation: result.explanation || "The requested operation is not supported"
        };
      }

      // In a real implementation, you would execute the SQL query here
      // For now, we'll return a mock result structure
      return {
        sql: result.sql,
        explanation: result.explanation,
        result: [] // This would contain actual query results
      };

    } catch (error: any) {
      console.error("OpenAI text-to-SQL error:", error);
      
      // Handle specific OpenAI errors
      if (error.code === 'insufficient_quota') {
        return {
          error: "OpenAI API quota exceeded",
          explanation: "The AI service is temporarily unavailable due to quota limits. Please try again later or contact support."
        };
      }
      
      if (error.code === 'rate_limit_exceeded') {
        return {
          error: "Rate limit exceeded",
          explanation: "Too many requests to the AI service. Please wait a moment and try again."
        };
      }
      
      return {
        error: "Failed to process query",
        explanation: "There was an error processing your request. Please try rephrasing your question."
      };
    }
  }

  async generateChartConfig(data: any[], userRequest: string): Promise<{
    chartType: string;
    config: any;
    title: string;
  }> {
    try {
      const prompt = `
Given this data and user request, suggest the best chart configuration:

Data: ${JSON.stringify(data.slice(0, 5))}... (showing first 5 rows)
User Request: "${userRequest}"

Available chart types: line, bar, pie, area, scatter

Respond with JSON:
{
  "chartType": "line|bar|pie|area|scatter",
  "config": {
    "xAxisKey": "field_name",
    "yAxisKey": "field_name", 
    "dataKey": "field_name",
    "title": "Chart Title"
  },
  "title": "Descriptive chart title"
}
`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error("Chart config generation error:", error);
      return {
        chartType: "bar",
        config: { xAxisKey: "name", yAxisKey: "value", title: "Data Visualization" },
        title: "Data Chart"
      };
    }
  }
}

export const openaiService = new OpenAIService();
