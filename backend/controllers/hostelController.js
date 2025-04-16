// controllers/hostelController.js
const HostelModel = require('../models/hostelModel');
const bcrypt = require('bcrypt');

const hostelController = {
  // Create a hostel (Master Admin only)
  createHostel: async (req, res) => {
    try {
      console.log('[DEBUG] Request body for createHostel:', req.body);
      // Update destructuring to match payload keys:
      const { name, username, password, fee_6_month, fee_12_month, hostel_type } = req.body;
     
      if (!name || !username || !password || !fee_6_month || !fee_12_month || !hostel_type) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const hostelId = await HostelModel.createHostel(name, username, hashedPassword, fee_6_month, fee_12_month, hostel_type);

      res.status(201).json({ message: 'Hostel created successfully', hostelId });
    } catch (error) {
      console.error('Error creating hostel:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Get all hostels
  getAllHostels: async (req, res) => {
    try {
      console.log('[DEBUG] User in getAllHostels:', req.user);
      const hostels = await HostelModel.getAllHostels();
      res.json(hostels);
    } catch (error) {
      console.error('Error fetching hostels:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Get fee statistics
  getFeeStatistics: async (req, res) => {
    try {
      const stats = await HostelModel.getFeeStatistics();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching fee statistics:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  getCurrentHostel: async (req, res) => {
    try {
      // For reception admin, the hostel ID will be in req.user
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
     
      // If user is a receptionist, get their hostel info
      if (req.user.role === 'receptionist') {
        const hostel = await HostelModel.getHostelById(req.user.id);
        if (!hostel) {
          return res.status(404).json({ error: 'Hostel not found' });
        }
        return res.json(hostel);
      }
     
      // If the user is a master admin, they don't have a specific hostel
      return res.status(400).json({ error: 'Master admin does not have a specific hostel' });
    } catch (error) {
      console.error('Error fetching current hostel:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Get a single hostel by ID
  getHostelById: async (req, res) => {
    try {
      const { hostelId } = req.params;
     
      const hostel = await HostelModel.getHostelById(hostelId);
     
      if (!hostel) {
        return res.status(404).json({ error: 'Hostel not found' });
      }
     
      res.json(hostel);
    } catch (error) {
      console.error('Error fetching hostel:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Update a hostel (Master Admin only)
  updateHostel: async (req, res) => {
    try {
      const { hostelId } = req.params;
      const { name, fee_6_month, fee_12_month } = req.body;

      // Ensure user is a master admin
      if (req.user.role !== 'master') {
        return res.status(403).json({ error: 'Unauthorized: Only master admin can update hostels' });
      }

      // Check if all required fields are provided
      if (!name || !fee_6_month || !fee_12_month) {
        return res.status(400).json({ error: 'Name and fee information are required' });
      }

      // Verify the hostel exists
      const hostel = await HostelModel.getHostelById(hostelId);
      if (!hostel) {
        return res.status(404).json({ error: 'Hostel not found' });
      }

      // Update the hostel
      await HostelModel.updateHostel(hostelId, name, fee_6_month, fee_12_month);

      res.json({ message: 'Hostel updated successfully' });
    } catch (error) {
      console.error('Error updating hostel:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Delete a hostel (Master Admin only)
  deleteHostel: async (req, res) => {
    try {
      const { hostelId } = req.params;

      // Ensure user is a master admin
      if (req.user.role !== 'master') {
        return res.status(403).json({ error: 'Unauthorized: Only master admin can delete hostels' });
      }

      // Verify the hostel exists
      const hostel = await HostelModel.getHostelById(hostelId);
      if (!hostel) {
        return res.status(404).json({ error: 'Hostel not found' });
      }

      // Delete the hostel
      await HostelModel.deleteHostel(hostelId);

      res.json({ message: 'Hostel deleted successfully' });
    } catch (error) {
      console.error('Error deleting hostel:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Reset a hostel admin's password (Master Admin only)
  resetHostelPassword: async (req, res) => {
    try {
      const { hostelId } = req.params;
      const { password } = req.body;

      // Ensure user is a master admin
      if (req.user.role !== 'master') {
        return res.status(403).json({ error: 'Unauthorized: Only master admin can reset passwords' });
      }

      // Verify password was provided
      if (!password) {
        return res.status(400).json({ error: 'Password is required' });
      }

      // Verify the hostel exists
      const hostel = await HostelModel.getHostelById(hostelId);
      if (!hostel) {
        return res.status(404).json({ error: 'Hostel not found' });
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Update the password
      await HostelModel.updateHostelPassword(hostelId, hashedPassword);

      res.json({ message: 'Hostel admin password reset successfully' });
    } catch (error) {
      console.error('Error resetting hostel password:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // View a hostel's password (Master Admin only, requires verification)
  viewHostelPassword: async (req, res) => {
    try {
      const { hostelId } = req.params;
      const { masterPassword } = req.body;

      // Ensure user is a master admin
      if (req.user.role !== 'master') {
        return res.status(403).json({ error: 'Unauthorized: Only master admin can view passwords' });
      }

      // Verify master password was provided
      if (!masterPassword) {
        return res.status(400).json({ error: 'Master password is required for verification' });
      }

      // Verify the hostel exists
      const hostel = await HostelModel.getHostelById(hostelId);
      if (!hostel) {
        return res.status(404).json({ error: 'Hostel not found' });
      }

      // Get the master admin's password hash from database
      const masterAdmin = await HostelModel.getMasterAdmin(req.user.id);
      if (!masterAdmin) {
        return res.status(404).json({ error: 'Master admin account not found' });
      }

      // Verify the provided password matches the master admin's password
      const passwordMatch = await bcrypt.compare(masterPassword, masterAdmin.password_hash);
      if (!passwordMatch) {
        return res.status(401).json({ error: 'Invalid master password' });
      }

      // Get the hostel's password (would be hashed in the database)
      const hostelPassword = await HostelModel.getHostelPassword(hostelId);
      
      // For security reasons, we don't return the actual stored hash
      // Instead, we could return a temporarily decrypted value or a placeholder
      // This is a simplified example - in production, you might use more secure methods
      res.json({ 
        message: 'Password verification successful',
        username: hostel.username,
        // Never send actual passwords or hashes back to client in real applications
        // This is just an example that would need to be replaced with a secure approach
        temporaryAccessGranted: true
      });
    } catch (error) {
      console.error('Error viewing hostel password:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

module.exports = hostelController;