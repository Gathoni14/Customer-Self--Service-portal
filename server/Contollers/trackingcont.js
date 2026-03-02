import Order from '../models/Order.model.js';
import User from '../models/User.model.js';
import { logger } from '../utils/logger.js';

export const guestTrackOrder = async (req, res, next) => {
  try {
    const { orderNumber, email, zipCode } = req.body;

    // Find order
    const order = await Order.findOne({ orderNumber });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Verify ownership (email or zip code)
    const user = await User.findById(order.userId);
    
    const emailMatch = user.email.toLowerCase() === email?.toLowerCase();
    const zipMatch = user.address?.zip === zipCode;

    if (!emailMatch && !zipMatch) {
      return res.status(403).json({ error: 'Verification failed' });
    }

    // Return limited information for guest
    res.json({
      orderNumber: order.orderNumber,
      status: order.status,
      estimatedDelivery: order.estimatedDelivery,
      items: order.items.map(item => ({
        name: item.name,
        quantity: item.quantity
      })),
      timeline: order.timeline.slice(-5), // Last 5 events
      trackingNumber: order.trackingNumber,
      carrier: order.carrier
    });
  } catch (error) {
    logger.error('Guest tracking error:', error);
    next(error);
  }
};

export const trackByTrackingNumber = async (req, res, next) => {
  try {
    const { trackingNumber } = req.params;

    const order = await Order.findOne({ trackingNumber })
      .populate('userId', 'name');

    if (!order) {
      return res.status(404).json({ error: 'Tracking number not found' });
    }

    res.json({
      orderNumber: order.orderNumber,
      customerName: order.userId.name,
      status: order.status,
      estimatedDelivery: order.estimatedDelivery,
      carrier: order.carrier,
      trackingNumber: order.trackingNumber,
      timeline: order.timeline.slice(-5)
    });
  } catch (error) {
    logger.error('Track by number error:', error);
    next(error);
  }
};