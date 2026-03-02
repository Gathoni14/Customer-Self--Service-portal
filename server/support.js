import SupportTicket from '../models/SupportTicket.model.js';
import Notification from '../models/Notification.model.js';
import { logger } from '../utils/logger.js';
import { sendEmail } from '../services/email.service.js';

export const createTicket = async (req, res, next) => {
  try {
    const { subject, message, orderNumber, category, priority } = req.body;

    const ticket = await SupportTicket.create({
      userId: req.user.id,
      orderNumber,
      subject,
      category,
      priority,
      messages: [{
        from: 'user',
        message,
        timestamp: new Date()
      }]
    });

    // Send confirmation email
    await sendEmail({
      to: req.user.email,
      subject: `Support Ticket Created: ${ticket.ticketNumber}`,
      template: 'ticketCreated',
      context: {
        name: req.user.name,
        ticketNumber: ticket.ticketNumber,
        subject: ticket.subject
      }
    });

    res.status(201).json(ticket);
  } catch (error) {
    logger.error('Create ticket error:', error);
    next(error);
  }
};

export const getTickets = async (req, res, next) => {
  try {
    const { status, category } = req.query;
    
    const query = { userId: req.user.id };
    
    if (status) query.status = status;
    if (category) query.category = category;

    const tickets = await SupportTicket.find(query)
      .sort({ createdAt: -1 })
      .select('-messages');

    res.json(tickets);
  } catch (error) {
    logger.error('Get tickets error:', error);
    next(error);
  }
};

export const getTicketById = async (req, res, next) => {
  try {
    const { ticketId } = req.params;

    const ticket = await SupportTicket.findOne({
      _id: ticketId,
      userId: req.user.id
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.json(ticket);
  } catch (error) {
    logger.error('Get ticket error:', error);
    next(error);
  }
};

export const addMessage = async (req, res, next) => {
  try {
    const { ticketId } = req.params;
    const { message } = req.body;

    const ticket = await SupportTicket.findOne({
      _id: ticketId,
      userId: req.user.id
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    if (ticket.status === 'closed') {
      return res.status(400).json({ error: 'Cannot add message to closed ticket' });
    }

    ticket.messages.push({
      from: 'user',
      message,
      timestamp: new Date()
    });

    ticket.status = 'waiting_customer';
    await ticket.save();

    // Notify support team via email
    await sendEmail({
      to: process.env.SUPPORT_EMAIL,
      subject: `New reply on ticket ${ticket.ticketNumber}`,
      template: 'ticketReply',
      context: {
        ticketNumber: ticket.ticketNumber,
        message,
        customerName: req.user.name
      }
    });

    res.json(ticket);
  } catch (error) {
    logger.error('Add message error:', error);
    next(error);
  }
};

export const closeTicket = async (req, res, next) => {
  try {
    const { ticketId } = req.params;

    const ticket = await SupportTicket.findOneAndUpdate(
      {
        _id: ticketId,
        userId: req.user.id,
        status: { $ne: 'closed' }
      },
      {
        status: 'closed',
        closedAt: new Date()
      },
      { new: true }
    );

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found or already closed' });
    }

    res.json({ message: 'Ticket closed successfully', ticket });
  } catch (error) {
    logger.error('Close ticket error:', error);
    next(error);
  }
};