import Order from '../models/Order.model.js';
import Notification from '../models/Notification.model.js';
import { logger } from '../utils/logger.js';
import { getRedisClient } from '../config/redis.js';

export const getOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = { userId: req.user.id };
    
    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Date range filter
    if (req.query.startDate || req.query.endDate) {
      query.createdAt = {};
      if (req.query.startDate) {
        query.createdAt.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        query.createdAt.$lte = new Date(req.query.endDate);
      }
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-__v');

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Get orders error:', error);
    next(error);
  }
};

export const getOrderByNumber = async (req, res, next) => {
  try {
    const { orderNumber } = req.params;

    // Try cache first
    const redis = getRedisClient();
    const cachedOrder = await redis.get(`order:${orderNumber}`);
    
    if (cachedOrder) {
      return res.json(JSON.parse(cachedOrder));
    }

    const order = await Order.findOne({
      orderNumber,
      userId: req.user.id
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Cache for 5 minutes
    await redis.setex(`order:${orderNumber}`, 300, JSON.stringify(order));

    res.json(order);
  } catch (error) {
    logger.error('Get order error:', error);
    next(error);
  }
};

export const cancelOrder = async (req, res, next) => {
  try {
    const { orderNumber } = req.params;

    const order = await Order.findOne({
      orderNumber,
      userId: req.user.id
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if order can be cancelled
    const cancellableStatuses = ['pending', 'processing'];
    if (!cancellableStatuses.includes(order.status)) {
      return res.status(400).json({ 
        error: `Order cannot be cancelled at '${order.status}' stage` 
      });
    }

    // Update order
    order.addTimelineEvent(
      'cancelled',
      'Order cancelled by customer',
      null,
      { cancelledBy: 'customer', cancelledAt: new Date() }
    );
    
    await order.save();

    // Clear cache
    const redis = getRedisClient();
    await redis.del(`order:${orderNumber}`);

    // Create notification
    await Notification.create({
      userId: req.user.id,
      type: 'order',
      title: 'Order Cancelled',
      message: `Order ${orderNumber} has been cancelled successfully`,
      data: { orderId: order._id, orderNumber }
    });

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`order_${order._id}`).emit('order_updated', order);

    res.json({ 
      message: 'Order cancelled successfully',
      order 
    });
  } catch (error) {
    logger.error('Cancel order error:', error);
    next(error);
  }
};

export const getOrderTimeline = async (req, res, next) => {
  try {
    const { orderNumber } = req.params;

    const order = await Order.findOne({
      orderNumber,
      userId: req.user.id
    }).select('timeline status estimatedDelivery');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({
      currentStatus: order.status,
      estimatedDelivery: order.estimatedDelivery,
      timeline: order.timeline
    });
  } catch (error) {
    logger.error('Get timeline error:', error);
    next(error);
  }
};

export const trackOrder = async (req, res, next) => {
  try {
    const { orderNumber } = req.params;

    const order = await Order.findOne({
      orderNumber,
      userId: req.user.id
    }).select('status trackingNumber carrier estimatedDelivery timeline');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get last 5 timeline events
    const recentTimeline = order.timeline.slice(-5);

    res.json({
      orderNumber,
      status: order.status,
      trackingNumber: order.trackingNumber,
      carrier: order.carrier,
      estimatedDelivery: order.estimatedDelivery,
      recentActivity: recentTimeline
    });
  } catch (error) {
    logger.error('Track order error:', error);
    next(error);
  }
};