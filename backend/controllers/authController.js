const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const AdminModel = require('../models/adminModel');
const HostelModel = require('../models/hostelModel');
require('dotenv').config();

const authController = {
  // Registration for master admin (for development purposes)
  registerMasterAdmin: async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
      }

      const existingAdmins = await AdminModel.findByUsername(username);
      if (existingAdmins.length > 0) {
        return res.status(400).json({ error: 'Username already exists.' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      await AdminModel.create(username, passwordHash, 'master');

      res.status(201).json({ message: 'Master admin registered successfully.' });
    } catch (error) {
      console.error('Error registering master admin:', error);
      res.status(500).json({ error: 'Internal server error.' });
    }
  },

  // Login for both master admin and reception admin
  loginMasterAdmin: async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
      }

      // First, try to find the user in the admins table
      const admins = await AdminModel.findByUsername(username);
      
      if (admins.length > 0) {
        // User found in admins table
        const admin = admins[0];
        const passwordMatch = await bcrypt.compare(password, admin.password_hash);
        
        if (!passwordMatch) {
          return res.status(401).json({ error: 'Invalid username or password.' });
        }

        // Generate JWT token for admin
        const token = jwt.sign(
          { id: admin.id, username: admin.username, role: admin.role },
          process.env.JWT_SECRET,
          { expiresIn: '1h' }
        );

        // Set token in HTTP-only cookie
        res.cookie('jwt', token, {
          httpOnly: true,
          secure: true, // Always use secure cookies in production
          sameSite: 'none', // Allow cross-site cookie
          maxAge: 60 * 60 * 1000, // 1 hour
          domain: '.onrender.com' // Allow subdomains on render.com
        });

        // Return the role along with the success message
        return res.json({ message: 'Login successful', role: admin.role });
      }

      // If not found in admins table, try the hostels table
      const hostels = await HostelModel.findByUsername(username);
      
      if (hostels.length > 0) {
        // User found in hostels table
        const hostel = hostels[0];
        const passwordMatch = await bcrypt.compare(password, hostel.password_hash);
        
        if (!passwordMatch) {
          return res.status(401).json({ error: 'Invalid username or password.' });
        }

        // Generate JWT token for hostel reception admin
        const token = jwt.sign(
          { id: hostel.hostel_id, username: hostel.username, role: 'receptionist', hostelType: hostel.hostel_type },
          process.env.JWT_SECRET,
          { expiresIn: '1h' }
        );

        // Set token in HTTP-only cookie
        res.cookie('jwt', token, {
          httpOnly: true,
          secure: true, // Always use secure cookies in production
          sameSite: 'none', // Allow cross-site cookie
          maxAge: 60 * 60 * 1000, // 1 hour
          domain: '.onrender.com' // Allow subdomains on render.com
        });

        // Return the role along with the success message
        return res.json({ message: 'Login successful', role: 'receptionist' });
      }

      // If user not found in either table
      return res.status(401).json({ error: 'Invalid username or password.' });
    } catch (error) {
      console.error('Error logging in:', error);
      res.status(500).json({ error: 'Internal server error.' });
    }
  },
};

module.exports = authController;