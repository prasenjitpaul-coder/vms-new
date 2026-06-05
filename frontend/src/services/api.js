import axios from 'axios';

const api = axios.create({
  // baseURL: 'http://localhost:5000/api',
   baseURL: 'https://vms-new-98q5.onrender.com/api',
  withCredentials: true, // For cookie-based JWT passing
});

export default api;

