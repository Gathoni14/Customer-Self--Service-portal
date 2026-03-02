import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['order', 'shipping', 'delivery', 'return', 'support', 'promotion', 'system'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  data: {
    orderId: mongoose.Schema.Types.ObjectId,
    orderNumber: String,
    ticketId: mongoose.Schema.Types.ObjectId,
    returnId: mongoose.Schema.Types.ObjectId,
    url: String
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  read: {
    type: Boolean,
    default: false,
    index: true
  },
  readAt: Date,
  delivered: {
    type: Boolean,
    default: false
  },
  deliveredAt: Date,
  expiresAt: Date
}, {
  timestamps: true
});

// Auto-expire old notifications
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 }); // 30 days

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;