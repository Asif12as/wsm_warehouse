import React, { useState } from 'react';
import { MessageSquare, Send, BarChart3, Database, Sparkles, Copy, Download, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface QueryResult {
  id: string;
  query: string;
  sql: string;
  results: any[];
  executionTime: number;
  timestamp: Date;
  visualizationType?: 'table' | 'chart' | 'metric';
}

const AIQuery: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<QueryResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<QueryResult | null>(null);

  const sampleQueries = [
    "Show me the top 5 selling products this month",
    "What's the total revenue by marketplace?",
    "Find products with low stock levels",
    "Compare sales performance across different categories",
    "Show me return rates by product category",
    "Which products have the highest profit margins?",
  ];

  const handleSubmitQuery = async (queryText: string) => {
    if (!queryText.trim()) return;

    setIsLoading(true);
    
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Generate mock SQL and results based on query
    const mockResult = generateMockResult(queryText);
    
    setResults(prev => [mockResult, ...prev]);
    setSelectedResult(mockResult);
    setQuery('');
    setIsLoading(false);
  };

  const generateMockResult = (queryText: string): QueryResult => {
    const queryId = `query_${Date.now()}`;
    
    // Mock SQL generation based on query content
    let sql = '';
    let results: any[] = [];
    let visualizationType: 'table' | 'chart' | 'metric' = 'table';

    if (queryText.toLowerCase().includes('top') && queryText.toLowerCase().includes('selling')) {
      sql = `SELECT p.name, p.sku, SUM(s.quantity) as total_sold, SUM(s.total_amount) as revenue
FROM products p
JOIN sales_records s ON p.sku = s.sku
WHERE s.order_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY p.sku, p.name
ORDER BY total_sold DESC
LIMIT 5;`;
      
      results = [
        { name: 'Wireless Bluetooth Headphones', sku: 'WMS-001234', total_sold: 245, revenue: 12250 },
        { name: 'Smartphone Case', sku: 'WMS-001235', total_sold: 189, revenue: 3780 },
        { name: 'USB-C Cable', sku: 'WMS-001236', total_sold: 156, revenue: 2340 },
        { name: 'Power Bank', sku: 'WMS-001237', total_sold: 134, revenue: 6700 },
        { name: 'Screen Protector', sku: 'WMS-001238', total_sold: 123, revenue: 1845 },
      ];
      visualizationType = 'chart';
    } else if (queryText.toLowerCase().includes('revenue') && queryText.toLowerCase().includes('marketplace')) {
      sql = `SELECT marketplace, SUM(total_amount) as revenue, COUNT(*) as orders
FROM sales_records
WHERE order_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY marketplace
ORDER BY revenue DESC;`;
      
      results = [
        { marketplace: 'Amazon', revenue: 45620, orders: 1243 },
        { marketplace: 'eBay', revenue: 23450, orders: 567 },
        { marketplace: 'Shopify', revenue: 18930, orders: 423 },
        { marketplace: 'Walmart', revenue: 12340, orders: 289 },
      ];
      visualizationType = 'chart';
    } else if (queryText.toLowerCase().includes('low stock')) {
      sql = `SELECT name, sku, quantity, reorder_point
FROM products
WHERE quantity <= reorder_point
ORDER BY (quantity / reorder_point) ASC;`;
      
      results = [
        { name: 'Wireless Mouse', sku: 'WMS-001240', quantity: 5, reorder_point: 25 },
        { name: 'Keyboard', sku: 'WMS-001241', quantity: 8, reorder_point: 20 },
        { name: 'Monitor Stand', sku: 'WMS-001242', quantity: 12, reorder_point: 30 },
      ];
    } else {
      sql = `SELECT * FROM sales_records 
WHERE order_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)
ORDER BY order_date DESC
LIMIT 10;`;
      
      results = [
        { order_id: 'ORD-001', product_name: 'Sample Product 1', quantity: 2, total_amount: 59.98 },
        { order_id: 'ORD-002', product_name: 'Sample Product 2', quantity: 1, total_amount: 29.99 },
        { order_id: 'ORD-003', product_name: 'Sample Product 3', quantity: 3, total_amount: 89.97 },
      ];
    }

    return {
      id: queryId,
      query: queryText,
      sql,
      results,
      executionTime: Math.round(Math.random() * 500 + 100),
      timestamp: new Date(),
      visualizationType,
    };
  };

  const copySQLToClipboard = (sql: string) => {
    navigator.clipboard.writeText(sql);
  };

  const exportResults = (result: QueryResult) => {
    const csv = [
      Object.keys(result.results[0]).join(','),
      ...result.results.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `query_results_${result.id}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI-Powered Query Interface</h1>
        <p className="text-gray-600">Ask questions about your warehouse data in natural language and get instant insights.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Query Input */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Natural Language Query</h2>
            </div>
            
            <div className="relative">
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask me anything about your warehouse data... e.g., 'Show me the top selling products this month' or 'What's my total revenue by marketplace?'"
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
                disabled={isLoading}
              />
              <button
                onClick={() => handleSubmitQuery(query)}
                disabled={isLoading || !query.trim()}
                className="absolute bottom-3 right-3 p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Sample Queries */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Try these sample queries:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {sampleQueries.map((sampleQuery, index) => (
                <button
                  key={index}
                  onClick={() => handleSubmitQuery(sampleQuery)}
                  disabled={isLoading}
                  className="p-3 text-left bg-gray-50 hover:bg-blue-50 hover:border-blue-200 border border-gray-200 rounded-lg transition-all duration-200 disabled:opacity-50"
                >
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-gray-700">{sampleQuery}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Query Results */}
          <AnimatePresence>
            {selectedResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Query Results</h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">
                      Executed in {selectedResult.executionTime}ms
                    </span>
                    <button
                      onClick={() => copySQLToClipboard(selectedResult.sql)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Copy SQL"
                    >
                      <Copy className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => exportResults(selectedResult)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Export Results"
                    >
                      <Download className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>

                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Generated SQL:</p>
                  <code className="text-sm text-gray-800 whitespace-pre-wrap">{selectedResult.sql}</code>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        {selectedResult.results.length > 0 && Object.keys(selectedResult.results[0]).map((key) => (
                          <th key={key} className="text-left py-3 px-4 text-sm font-semibold text-gray-900 capitalize">
                            {key.replace('_', ' ')}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedResult.results.map((row, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          {Object.values(row).map((value, colIndex) => (
                            <td key={colIndex} className="py-3 px-4 text-sm text-gray-900">
                              {typeof value === 'number' ? value.toLocaleString() : String(value)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Query History */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Query History</h3>
          <div className="space-y-3">
            {results.map((result) => (
              <div
                key={result.id}
                onClick={() => setSelectedResult(result)}
                className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                  selectedResult?.id === result.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {result.visualizationType === 'chart' ? (
                      <BarChart3 className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Database className="w-4 h-4 text-gray-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {result.query}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-gray-500">
                        {result.timestamp.toLocaleTimeString()}
                      </span>
                      <span className="text-xs text-gray-500">
                        {result.results.length} rows
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {results.length === 0 && (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No queries yet. Start by asking a question above!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIQuery;