import mongoose from 'mongoose';

const returnItemSchema = new mongoose.Schema({
  productId: String,
  name: String,
  sku: String,
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  reason: {
    type: String,
    enum: ['defective', 'wrong_item', 'damaged', 'not_as_described', 'changed_mind', 'other'],
    required: true
  },
  condition: {
    type: String,
    enum: ['new', 'opened', 'damaged'],
    default: 'new'
  },
  refundAmount: Number
});

const returnSchema = new mongoose.Schema({
  returnNumber: {
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
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  orderNumber: {
    type: String,
    required: true
  },
  items: [returnItemSchema],
  reason: {
    type: String,
    required: true
  },
  comments: String,
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'processing', 'completed'],
    default: 'pending',
    index: true
  },
  refundMethod: {
    type: String,
    enum: ['original_payment', 'store_credit', 'bank_transfer'],
    default: 'original_payment'
  },
  refundAmount: Number,
  refundProcessedAt: Date,
  returnLabel: {
    url: String,
    trackingNumber: String,
    carrier: String,
    expiresAt: Date
  },
  receivedAt: Date,
  inspectedAt: Date,
  notes: String,
  images: [String]
}, {
  timestamps: true
});

// Generate return number
returnSchema.pre('save', function(next) {
  if (!this.returnNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.returnNumber = `RET-${year}${month}-${random}`;
  }
  next();
});

const Return = mongoose.model('Return', returnSchema);

export default Return;