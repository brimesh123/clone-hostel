// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

// Import routes
const authRoutes = require('./routes/authRoutes');
const hostelRoutes = require('./routes/hostelRoutes');
const studentRoutes = require('./routes/studentRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const dueRoutes = require('./routes/dueRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Define allowed origins
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? ['https://clone-hostel.vercel.app']
  : ['http://localhost:5173'];

app.use(
  cors({
    origin: function(origin, callback) {
      // Allow requests with no origin (like mobile apps, curl requests)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) === -1) {
        return callback(null, true); // Temporarily allow all origins during development
        // In production, you would return an error:
        // return callback(new Error('Not allowed by CORS'), false);
      }
      return callback(null, true);
    },
    credentials: true, // Allow cookies to be sent/received
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

app.use(bodyParser.json());
app.use(cookieParser()); // Enable cookie parsing

// Debugging middleware: log each request and its cookies
app.use((req, res, next) => {
  console.log(`[DEBUG] ${req.method} ${req.url}`);
  console.log(`[DEBUG] Cookies: `, req.cookies);
  console.log(`[DEBUG] Origin: `, req.headers.origin);
  console.log(`[DEBUG] Authorization: `, req.headers.authorization);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/hostels', hostelRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/dues', dueRoutes);

app.get('/', (req, res) => {
  res.send('Hostel Management API is running.');
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
