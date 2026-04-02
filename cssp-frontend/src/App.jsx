import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import GuestTracking from './pages/GuestTracking';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/" element={<div className="text-center py-12"><h1>Welcome to CSSP</h1><a href="/guest/track" className="text-blue-600">Track Order</a></div>} />
          <Route path="/guest/track" element={<GuestTracking />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
