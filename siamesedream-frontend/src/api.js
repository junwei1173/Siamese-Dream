// src/api.js
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5051", // or your backend port
  withCredentials: true, // optional if using cookies
});

export default api;
