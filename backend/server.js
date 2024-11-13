// const express = require("express");
// const multer = require("multer");
// const fs = require("fs");
// const path = require("path");
// const net = require("net");
// const cors = require("cors");  // Import cors

// const app = express();
// const uploadFolder = path.join(__dirname, "uploads");

// // Ensure the uploads folder exists
// fs.mkdirSync(uploadFolder, { recursive: true });

// // Enable CORS for all routes
// app.use(cors());
// app.use(express.json()); // Add this line to parse JSON request body

// const storage = multer.diskStorage({
//   destination: uploadFolder,
//   filename: (req, file, cb) => {
//     cb(null, file.originalname);
//   },
// });

// const upload = multer({ storage });

// // Endpoint to connect to a target IP and port
// app.post("/connect", (req, res) => {
//   const { targetIp, targetPort } = req.body;

//   const client = new net.Socket();
//   client.connect(parseInt(targetPort), targetIp, () => {
//     client.end(); // Close the connection immediately after checking
//     res.json({ success: true });
//   });

//   client.on("error", (err) => {
//     res.status(500).json({ success: false, error: err.message });
//   });
// });

// // Endpoint to upload and send the file
// app.post("/uploadAndShare", upload.single("file"), (req, res) => {
//   const { targetIp, targetPort } = req.body;
//   const filename = req.file.originalname;
//   const filePath = path.join(uploadFolder, filename);

//   if (!targetIp || !targetPort) {
//     return res.status(400).json({ error: "Target IP and Port are required." });
//   }

//   const fileSize = fs.statSync(filePath).size;

//   // Establish a TCP connection and send the file
//   const client = new net.Socket();
//   client.connect(parseInt(targetPort), targetIp, () => {
//     client.write(Buffer.from(filename.length.toString().padStart(4, "0"))); // Send filename length
//     client.write(filename); // Send filename
//     client.write(Buffer.from(fileSize.toString().padStart(8, "0"))); // Send file size

//     // Send file data in chunks
//     const readStream = fs.createReadStream(filePath);
//     readStream.on("data", (chunk) => client.write(chunk));
//     readStream.on("end", () => {
//       client.end();
//       res.json({ message: `File ${filename} sent to ${targetIp}:${targetPort}.` });
//     });
//   });

//   client.on("error", (err) => {
//     res.status(500).json({ error: err.message });
//   });
// });

// // Start the server
// const PORT = 8000;

// app.listen(PORT, () => {
//   console.log(`Server running on http://localhost:${PORT}`);
// });


const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const net = require("net");
const cors = require("cors");

const app = express();
const uploadFolder = path.join(__dirname, "uploads");
const receiveFolder = path.join(__dirname, "received_files");

// Ensure the folders exist
fs.mkdirSync(uploadFolder, { recursive: true });
fs.mkdirSync(receiveFolder, { recursive: true });

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: uploadFolder,
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });

// TCP Receiver
const PORT = 9000; // Port for receiving files
const HOST = "0.0.0.0"; // Listen on all network interfaces

const tcpServer = net.createServer((socket) => {
  console.log("Connection established with sender:", socket.remoteAddress);

  let filename = "";
  let fileSize = 0;
  let receivedSize = 0;
  let writeStream;

  // Receive data in chunks
  socket.on("data", (chunk) => {
    if (!filename) {
      const filenameLength = parseInt(chunk.slice(0, 4).toString(), 10); // First 4 bytes: filename length
      filename = chunk.slice(4, 4 + filenameLength).toString(); // Next bytes: filename
      fileSize = parseInt(chunk.slice(4 + filenameLength, 12 + filenameLength).toString(), 10); // Next 8 bytes: file size
      const filePath = path.join(receiveFolder, filename);
      writeStream = fs.createWriteStream(filePath); // Create file write stream
      console.log(`Receiving file: ${filename}, size: ${fileSize} bytes`);

      // Remove the header from chunk and start writing the actual file content
      chunk = chunk.slice(12 + filenameLength);
    }

    // Write file content to disk
    if (writeStream) {
      writeStream.write(chunk);
      receivedSize += chunk.length;

      // Close the stream once the file is fully received
      if (receivedSize >= fileSize) {
        writeStream.end();
        console.log(`File ${filename} received successfully.`);
        socket.end();
      }
    }
  });

  // Handle socket errors
  socket.on("error", (err) => {
    console.error("Socket error:", err);
    if (writeStream) writeStream.end();
  });

  // Handle socket close
  socket.on("close", () => {
    console.log("Connection closed.");
  });
});

// Start listening for TCP connections
tcpServer.listen(PORT, HOST, () => {
  console.log(`Receiver server is listening on ${HOST}:${PORT}`);
});

// Endpoint to connect to a target IP and port
app.post("/connect", (req, res) => {
  const { targetIp, targetPort } = req.body;

  const client = new net.Socket();
  client.connect(parseInt(targetPort), targetIp, () => {
    client.end(); // Close the connection immediately after checking
    res.json({ success: true });
  });

  client.on("error", (err) => {
    res.status(500).json({ success: false, error: err.message });
  });
});

app.get("/received-files", (req, res) => {
  fs.readdir(receiveFolder, (err, files) => {
    if (err) {
      console.error("Error reading received_files folder:", err);
      return res.status(500).json({ error: "Error reading received files." });
    }
    res.json(files);
  });
});

// Endpoint to upload and send the file
app.post("/uploadAndShare", upload.single("file"), (req, res) => {
  const { targetIp, targetPort } = req.body;
  const filename = req.file.originalname;
  const filePath = path.join(uploadFolder, filename);

  if (!targetIp || !targetPort) {
    return res.status(400).json({ error: "Target IP and Port are required." });
  }

  const fileSize = fs.statSync(filePath).size;

  // Establish a TCP connection and send the file
  const client = new net.Socket();
  client.connect(parseInt(targetPort), targetIp, () => {
    client.write(Buffer.from(filename.length.toString().padStart(4, "0"))); // Send filename length
    client.write(filename); // Send filename
    client.write(Buffer.from(fileSize.toString().padStart(8, "0"))); // Send file size

    // Send file data in chunks
    const readStream = fs.createReadStream(filePath);
    readStream.on("data", (chunk) => client.write(chunk));
    readStream.on("end", () => {
      client.end();
      res.json({ message: `File ${filename} sent to ${targetIp}:${targetPort}.` });
    });
  });

  client.on("error", (err) => {
    res.status(500).json({ error: err.message });
  });
});

// Start the Express server
const HTTP_PORT = 8000;
app.listen(HTTP_PORT, () => {
  console.log(`Server running on http://localhost:${HTTP_PORT}`);
});
