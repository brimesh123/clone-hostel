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

app.use(
  cors({
    origin: 'https://clone-hostel.vercel.app', // Allow all origins, will be restricted by Render's security
    credentials: true, // Allow cookies to be sent/received
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS' , 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);
app.use(bodyParser.json());
app.use(cookieParser()); // Enable cookie parsing

// Debugging middleware: log each request and its cookies
app.use((req, res, next) => {
  console.log(`[DEBUG] ${req.method} ${req.url}`);
  console.log(`[DEBUG] Cookies: `, req.cookies);
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
