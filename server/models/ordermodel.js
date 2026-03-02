import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  sku: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1']
  },
  price: {
    type: Number,
    required: true,
    min: [0, 'Price cannot be negative']
  },
  total: {
    type: Number,
    required: true
  }
});

const timelineEventSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['order_placed', 'payment_confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  location: String,
  timestamp: {
    type: Date,
    default: Date.now
  },
  metadata: mongoose.Schema.Types.Mixed
});

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
    default: 'pending',
    index: true
  },
  items: [orderItemSchema],
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  tax: {
    type: Number,
    required: true,
    min: 0
  },
  shipping: {
    type: Number,
    required: true,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  shippingAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zip: { type: String, required: true },
    country: { type: String, default: 'USA' }
  },
  paymentMethod: {
    type: { type: String, required: true },
    last4: String,
    expiry: String
  },
  estimatedDelivery: Date,
  actualDelivery: Date,
  trackingNumber: String,
  carrier: String,
  timeline: [timelineEventSchema],
  notes: String,
  metadata: mongoose.Schema.Types.Mixed
}, {
  timestamps: true
});

// Indexes for common queries
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ status: 1, estimatedDelivery: 1 });

// Generate order number before saving
orderSchema.pre('save', function(next) {
  if (!this.orderNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.orderNumber = `ORD-${year}${month}-${random}`;
  }
  next();
});

// Calculate totals before saving
orderSchema.pre('save', function(next) {
  if (this.isModified('items')) {
    this.subtotal = this.items.reduce((sum, item) => sum + item.total, 0);
    this.total = this.subtotal + this.tax + this.shipping;
  }
  next();
});

// Add timeline event helper
orderSchema.methods.addTimelineEvent = function(status, description, location = null, metadata = null) {
  this.timeline.push({
    status,
    description,
    location,
    timestamp: new Date(),
    metadata
  });
  this.status = status;
};

const Order = mongoose.model('Order', orderSchema);

export default Order;