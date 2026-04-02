import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = 'http://localhost:5000/api';

export default function GuestTracking() {
  const [formData, setFormData] = useState({ orderNumber: '', email: '', zipCode: '' });
  const [loading, setLoading] = useState(false);
  const [trackingData, setTrackingData] = useState(null);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.orderNumber) {
      setError('Order number is required');
      return;
    }
    if (!formData.email && !formData.zipCode) {
      setError('Please provide email OR ZIP code');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(${API_URL}/tracking/guest, {
        orderNumber: formData.orderNumber,
        email: formData.email,
        zipCode: formData.zipCode
      });
      setTrackingData(response.data);
      toast.success('Order found!');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to track order');
      toast.error('Order not found');
    } finally {
      setLoading(false);
    }
  };

  if (trackingData) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="container" style={{ maxWidth: '800px', margin: '0 auto', padding: '0 1rem' }}>
          <button onClick={() => setTrackingData(null)} className="text-blue-600 mb-4" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            ← Track another order
          </button>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-2">Order {trackingData.orderNumber}</h2>
            <p className="text-gray-500 mb-4">Status: <span className="font-semibold">{trackingData.status}</span></p>
            {trackingData.estimatedDelivery && (
              <p className="text-gray-600 mb-4">Estimated Delivery: {new Date(trackingData.estimatedDelivery).toLocaleDateString()}</p>
            )}
            {trackingData.trackingNumber && (
              <p className="text-gray-600 mb-4">Tracking: {trackingData.trackingNumber} ({trackingData.carrier})</p>
            )}
            <h3 className="font-semibold mt-4 mb-2">Items:</h3>
            <ul className="list-disc pl-5 mb-4">
              {trackingData.items?.map((item, i) => (
                <li key={i}>{item.name} - Qty: {item.quantity} - </li>
              ))}
            </ul>
            <h3 className="font-semibold mb-2">Timeline:</h3>
            {trackingData.timeline?.map((event, i) => (
              <div key={i} className="border-l-2 border-blue-500 pl-4 mb-3">
                <p className="font-medium">{event.status}</p>
                <p className="text-sm text-gray-600">{event.description}</p>
                <p className="text-xs text-gray-400">{new Date(event.timestamp).toLocaleString()}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <Link to="/login" className="text-blue-600">Sign in for more options →</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold text-center mb-2">Track Your Order</h2>
        <p className="text-gray-600 text-center mb-6">Enter your order details</p>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Order Number *</label>
            <input type="text" name="orderNumber" value={formData.orderNumber} onChange={handleChange} className="w-full p-2 border rounded" required />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Email Address</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full p-2 border rounded" />
            <p className="text-xs text-gray-500 mt-1">Enter email OR ZIP code</p>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">ZIP Code</label>
            <input type="text" name="zipCode" value={formData.zipCode} onChange={handleChange} className="w-full p-2 border rounded" />
          </div>
          {error && <div className="bg-red-50 text-red-600 p-2 rounded mb-4">{error}</div>}
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Tracking...' : 'Track Order'}
          </button>
        </form>
        <div className="mt-4 text-center">
          <Link to="/login" className="text-blue-600">Sign in →</Link>
        </div>
      </div>
    </div>
  );
}
