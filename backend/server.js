const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

app.post('/api/tracking/guest', (req, res) => {
  const { orderNumber } = req.body;
  res.json({
    success: true,
    orderNumber: orderNumber,
    status: 'processing',
    estimatedDelivery: '2024-04-15',
    items: [{ name: 'Sample Product', quantity: 1, price: 100 }],
    timeline: [{ status: 'order_placed', description: 'Order placed', timestamp: new Date() }]
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log('Server running on port ' + PORT));
