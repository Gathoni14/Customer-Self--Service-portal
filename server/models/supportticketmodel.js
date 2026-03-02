import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  from: {
    type: String,
    enum: ['user', 'agent'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  attachments: [{
    filename: String,
    url: String,
    size: Number
  }],
  read: {
    type: Boolean,
    default: false
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const supportTicketSchema = new mongoose.Schema({
  ticketNumber: {
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
  orderNumber: {
    type: String,
    ref: 'Order'
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['order', 'shipping', 'payment', 'return', 'technical', 'other'],
    default: 'other'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'waiting_customer', 'resolved', 'closed'],
    default: 'open',
    index: true
  },
  messages: [messageSchema],
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedAt: Date,
  closedAt: Date,
  satisfaction: {
    rating: Number,
    comment: String,
    submittedAt: Date
  }
}, {
  timestamps: true
});

// Generate ticket number
supportTicketSchema.pre('save', function(next) {
  if (!this.ticketNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.ticketNumber = `TKT-${year}${month}-${random}`;
  }
  next();
});

const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);

export default SupportTicket;