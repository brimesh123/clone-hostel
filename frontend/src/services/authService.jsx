// src/services/authService.jsx
import axios from 'axios';
import config from '../config';

const API_URL = `${config.backendUrl}/api/auth`;

export const login = async (username, password) => {
  try {
    const response = await axios.post(
      `${API_URL}/login`,
      { username, password },
      { withCredentials: true } // Sends HTTPOnly cookies automatically
    );
    return response.data; // Expected to include user details (e.g., role)
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const register = async (username, password) => {
  try {
    const response = await axios.post(`${API_URL}/register`, { username, password });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};
