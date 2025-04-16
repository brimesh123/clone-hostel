import React, { useState, useEffect } from 'react';

const ConsolePopup = () => {
  const [logs, setLogs] = useState([]);
  const [isVisible, setIsVisible] = useState(true);

  // Function to toggle popup visibility
  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  // Function to clear all logs
  const clearLogs = () => {
    setLogs([]);
  };

  useEffect(() => {
    // Store the original console.log method
    const originalConsoleLog = console.log;
    
    // Override the console.log method
    console.log = (...args) => {
      // Call the original console.log
      originalConsoleLog(...args);
      
      // Add the log to our state
      setLogs(prevLogs => [
        ...prevLogs,
        {
          id: Date.now(),
          content: args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(' '),
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    };
    
    // Restore the original console.log when component unmounts
    return () => {
      console.log = originalConsoleLog;
    };
  }, []);

  // Example function to test with
  const exampleFunction = (message) => {
    console.log(message);
    return message;
  };

  return (
    <div>
      {/* Button to test the console.log functionality */}
      <button 
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2"
        onClick={() => exampleFunction('This is a test message')}>
        Test Console Log
      </button>
      
      <button 
        className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded mr-2"
        onClick={() => exampleFunction({ object: 'This is an object', number: 42 })}>
        Log Object
      </button>
      
      <button 
        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mr-2"
        onClick={toggleVisibility}>
        {isVisible ? 'Hide Console' : 'Show Console'}
      </button>
      
      <button 
        className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
        onClick={clearLogs}>
        Clear Console
      </button>
      
      {/* The console popup */}
      {isVisible && (
        <div className="fixed bottom-0 right-0 w-96 h-64 bg-gray-800 text-white p-4 overflow-auto shadow-lg rounded-tl-lg">
          <div className="font-bold mb-2 flex justify-between items-center">
            <span>Console Output</span>
            <div>
              <button 
                className="text-xs bg-gray-600 hover:bg-gray-700 px-2 py-1 rounded mr-2"
                onClick={clearLogs}>
                Clear
              </button>
              <button 
                className="text-xs bg-gray-600 hover:bg-gray-700 px-2 py-1 rounded"
                onClick={toggleVisibility}>
                Close
              </button>
            </div>
          </div>
          <div className="border-t border-gray-600 pt-2">
            {logs.length === 0 ? (
              <div className="text-gray-400 italic">No logs yet</div>
            ) : (
              logs.map(log => (
                <div key={log.id} className="mb-1 border-b border-gray-700 pb-1">
                  <span className="text-xs text-gray-400">[{log.timestamp}]</span>
                  <pre className="whitespace-pre-wrap break-words text-sm">{log.content}</pre>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Function as requested in the specification
const nameFunction = (message) => {
  console.log(message);
  return message;
};

export { ConsolePopup, nameFunction };
export default ConsolePopup;