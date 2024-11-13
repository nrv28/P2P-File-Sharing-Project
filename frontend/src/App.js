import React, { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [file, setFile] = useState(null);
  const [targetIp, setTargetIp] = useState("");
  const [targetPort, setTargetPort] = useState("");
  const [isSender, setIsSender] = useState(true);
  const [receivedFiles, setReceivedFiles] = useState([]);
  const [fileCount, setFileCount] = useState(0); // New state to track the count of files
  const [deviceIp, setDeviceIp] = useState("Open Terminal and Type ipconfig");
  const PORT = 9000; // Hardcoded port for receiving files

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleIpChange = (e) => {
    setTargetIp(e.target.value);
  };

  const handlePortChange = (e) => {
    setTargetPort(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !targetIp || !targetPort) {
      alert("Please provide all inputs.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("targetIp", targetIp);
    formData.append("targetPort", targetPort);

    try {
      const response = await fetch("http://localhost:8000/uploadAndShare", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      alert(result.message || "File sent successfully.");
    } catch (error) {
      console.error("Error uploading and sharing file:", error);
    }
  };

  // Function to fetch the list of received files and update count
  const fetchReceivedFiles = async () => {
    try {
      const response = await fetch("http://localhost:8000/received-files");
      const files = await response.json();
      setReceivedFiles(files);

      // Update file count on initial load
      if (fileCount === 0) {
        setFileCount(files.length);
      }

      // Check if new files have been added
      if (files.length > fileCount) {
        alert("New file received!");
        setFileCount(files.length); // Update the file count with the new length
      }
    } catch (error) {
      console.error("Error fetching received files:", error);
    }
  };

  useEffect(() => {
    fetchReceivedFiles(); // Initial fetch
    const interval = setInterval(fetchReceivedFiles, 5000); // Fetch every 5 seconds
    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, [fileCount]);

  return (
    <div className="App min-h-screen flex items-center justify-center bg-gray-900 text-gray-100">
      <div className="App-header w-full max-w-2xl p-8 bg-gray-800 rounded-lg shadow-lg">
        <h1 className="text-4xl font-bold text-gray-300 mb-6 text-center">File Sharing App</h1>

        {/* Toggle Buttons for Sender and Receiver */}
        <div className="flex justify-center mb-6">
          <button
            onClick={() => setIsSender(true)}
            className={`py-2 px-4 mr-2 rounded ${isSender ? 'bg-gray-600' : 'bg-gray-700'} text-white`}
          >
            Sending
          </button>
          <button
            onClick={() => setIsSender(false)}
            className={`py-2 px-4 rounded ${!isSender ? 'bg-gray-600' : 'bg-gray-700'} text-white`}
          >
            Receiving
          </button>
        </div>

        {/* Form for Sending */}
        {isSender && (
          <form onSubmit={handleSubmit} className="flex flex-col items-center space-y-4">
            <input
              type="file"
              onChange={handleFileChange}
              className="block w-full text-lg text-green-300 file:mr-4 file:py-3 file:px-5 file:rounded-full file:border-0 file:text-lg file:font-semibold file:bg-green-600 file:text-white hover:file:bg-green-700"
              required
            />
            <input
              type="text"
              placeholder="Target IP"
              value={targetIp}
              onChange={handleIpChange}
              className="w-full px-5 py-3 text-blue-900 bg-blue-100 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="number"
              placeholder="Target Port"
              value={targetPort}
              onChange={handlePortChange}
              className="w-full px-5 py-3 text-purple-900 bg-purple-100 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
            <button
              type="submit"
              className="w-full py-3 mt-4 bg-orange-600 rounded-lg font-semibold text-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              Upload and Send
            </button>
          </form>
        )}

        {/* Form for Receiving */}
        {!isSender && (
          <div className="flex flex-col items-center">
            <p className="text-lg text-gray-200">Device IP: {deviceIp}</p>
            <p className="text-lg text-gray-200">Port: {PORT}</p>
            <h3 className="text-lg text-gray-300 mt-4">Received Files:</h3>
            <ul className="mt-2">
              {receivedFiles.length === 0 ? (
                <li className="text-gray-400">No files received yet.</li>
              ) : (
                receivedFiles.map((filename, index) => (
                  <li key={index} className="text-gray-200">{filename}</li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
