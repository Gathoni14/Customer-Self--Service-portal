const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Guest tracking endpoint
app.post('/api/tracking/guest', (req, res) => {
  const { orderNumber, email, zipCode } = req.body;
  
  console.log('Tracking order: ' + orderNumber);
  
  // Demo response - replace with database query later
  res.json({
    success: true,
    orderNumber: orderNumber,
    status: 'processing',
    estimatedDelivery: '2024-04-15',
    trackingNumber: '1Z999AA10123456784',
    carrier: 'UPS',
    items: [
      { name: 'Wireless Headphones', quantity: 1, price: 249.99 },
      { name: 'Phone Case', quantity: 2, price: 25.00 }
    ],
    timeline: [
      { 
        status: 'order_placed', 
        description: 'Order placed successfully', 
        location: 'Online',
        timestamp: new Date().toISOString()
      },
      { 
        status: 'processing', 
        description: 'Order is being processed', 
        location: 'Warehouse',
        timestamp: new Date().toISOString()
      }
    ]
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('Server running on port ' + PORT);
  console.log('Health check: http://localhost:' + PORT + '/api/health');
  console.log('Guest tracking: POST http://localhost:' + PORT + '/api/tracking/guest');
});
