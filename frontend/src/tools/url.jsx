import React, { useState } from "react";

const EnhancedFetchDataPage = () => {
  const [baseUrl, setBaseUrl] = useState("");
  const [route, setRoute] = useState("");
  const [method, setMethod] = useState("GET");
  const [headers, setHeaders] = useState("");
  const [body, setBody] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setData(null);

    try {
      // Clean up the route to handle leading slashes
      const cleanRoute = route.startsWith("/") ? route.substring(1) : route;
      const cleanBaseUrl = baseUrl.endsWith("/") 
        ? baseUrl.substring(0, baseUrl.length - 1) 
        : baseUrl;
      
      // Construct the full URL
      const url = `${cleanBaseUrl}/${cleanRoute}`;
      
      // Parse headers if provided
      let headerObj = {};
      try {
        headerObj = headers ? JSON.parse(headers) : {};
      } catch (headerErr) {
        throw new Error(`Invalid headers format: ${headerErr.message}`);
      }
      
      // Prepare request options
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headerObj
        }
      };
      
      // Add body for non-GET requests if provided
      if (method !== "GET" && body) {
        try {
          options.body = body;
        } catch (bodyErr) {
          throw new Error(`Invalid body format: ${bodyErr.message}`);
        }
      }
      
      const response = await fetch(url, options);
      
      // Get response details
      const status = response.status;
      const statusText = response.statusText;
      
      // Try to parse as JSON first
      let responseData;
      const contentType = response.headers.get("content-type");
      
      if (contentType && contentType.includes("application/json")) {
        responseData = await response.json();
      } else {
        // Fall back to text if not JSON
        responseData = await response.text();
      }
      
      setData({
        status,
        statusText,
        headers: Object.fromEntries([...response.headers.entries()]),
        data: responseData
      });
      
      if (!response.ok) {
        setError(`Request failed with status: ${status} ${statusText}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">API Request Tool</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="baseUrl" className="block text-sm font-medium text-gray-700">
              Base URL
            </label>
            <input
              id="baseUrl"
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://api.example.com"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="route" className="block text-sm font-medium text-gray-700">
              Route
            </label>
            <input
              id="route"
              type="text"
              value={route}
              onChange={(e) => setRoute(e.target.value)}
              placeholder="users/1"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        <div className="flex items-center">
          <button 
            type="button" 
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
          >
            {showAdvanced ? "Hide" : "Show"} Advanced Options
          </button>
        </div>
        
        {showAdvanced && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-md">
            <div className="space-y-2">
              <label htmlFor="method" className="block text-sm font-medium text-gray-700">
                HTTP Method
              </label>
              <select
                id="method"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
                <option value="PATCH">PATCH</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="headers" className="block text-sm font-medium text-gray-700">
                Headers (JSON format)
              </label>
              <textarea
                id="headers"
                value={headers}
                onChange={(e) => setHeaders(e.target.value)}
                placeholder='{"Authorization": "Bearer token"}'
                rows="3"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              />
            </div>
            
            {method !== "GET" && (
              <div className="space-y-2">
                <label htmlFor="body" className="block text-sm font-medium text-gray-700">
                  Request Body
                </label>
                <textarea
                  id="body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder='{"name": "John", "email": "john@example.com"}'
                  rows="5"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                />
              </div>
            )}
          </div>
        )}
        
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          disabled={loading}
        >
          {loading ? "Fetching..." : "Send Request"}
        </button>
      </form>

      {loading && (
        <div className="mt-6 flex justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      )}
      
      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <h2 className="text-lg font-semibold text-red-700">Error</h2>
          <p className="text-red-600">{error}</p>
        </div>
      )}
      
      {data && (
        <div className="mt-6 space-y-4">
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
            <h2 className="text-lg font-semibold text-gray-800">Response</h2>
            <div className="mt-2 space-y-2">
              <div className="flex">
                <span className="font-medium w-24">Status:</span>
                <span className={`font-mono ${data.status < 300 ? 'text-green-600' : 'text-red-600'}`}>
                  {data.status} {data.statusText}
                </span>
              </div>
              
              <div>
                <span className="font-medium">Headers:</span>
                <pre className="mt-1 bg-gray-100 p-2 rounded-md overflow-x-auto text-sm font-mono">
                  {JSON.stringify(data.headers, null, 2)}
                </pre>
              </div>
              
              <div>
                <span className="font-medium">Data:</span>
                <pre className="mt-1 bg-gray-100 p-2 rounded-md overflow-x-auto text-sm font-mono">
                  {typeof data.data === 'string' 
                    ? data.data 
                    : JSON.stringify(data.data, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedFetchDataPage;