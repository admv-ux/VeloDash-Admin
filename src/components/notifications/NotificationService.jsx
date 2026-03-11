import { base44 } from '@/api/base44Client';

// Service to create notifications
export const NotificationService = {
  // Send notification to a driver
  async notifyDriver(driverId, driverEmail, { title, message, type, orderId, priority = 'medium' }) {
    try {
      await base44.entities.UserNotification.create({
        user_type: 'driver',
        user_id: driverId,
        user_email: driverEmail,
        title,
        message,
        type,
        order_id: orderId,
        priority,
        action_url: orderId ? 'Orders' : null,
      });
    } catch (error) {
      console.error('Failed to notify driver:', error);
    }
  },

  // Send notification to a merchant
  async notifyMerchant(merchantId, merchantEmail, { title, message, type, orderId, priority = 'medium' }) {
    try {
      await base44.entities.UserNotification.create({
        user_type: 'merchant',
        user_id: merchantId,
        user_email: merchantEmail,
        title,
        message,
        type,
        order_id: orderId,
        priority,
        action_url: orderId ? 'Orders' : null,
      });
    } catch (error) {
      console.error('Failed to notify merchant:', error);
    }
  },

  // Send notification to a rider
  async notifyRider(riderId, riderEmail, { title, message, type, orderId, priority = 'medium' }) {
    try {
      await base44.entities.UserNotification.create({
        user_type: 'rider',
        user_id: riderId,
        user_email: riderEmail,
        title,
        message,
        type,
        order_id: orderId,
        priority,
        action_url: orderId ? 'Orders' : null,
      });
    } catch (error) {
      console.error('Failed to notify rider:', error);
    }
  },

  // Notify about new order
  async notifyNewOrder(order, driver, merchant, rider) {
    if (driver) {
      await this.notifyDriver(driver.id, driver.email, {
        title: '🎯 New Order Assigned!',
        message: `New ${order.type} order #${order.order_number || order.id.slice(-8)} - ${order.dropoff_address}`,
        type: 'new_order',
        orderId: order.id,
        priority: 'urgent',
      });
    }
    if (merchant) {
      await this.notifyMerchant(merchant.id, merchant.email, {
        title: '📦 New Order Received',
        message: `Order #${order.order_number || order.id.slice(-8)} from ${order.rider_name}`,
        type: 'new_order',
        orderId: order.id,
        priority: 'high',
      });
    }
  },

  // Notify about order status change
  async notifyOrderStatusChange(order, newStatus, driver, rider) {
    const statusMessages = {
      accepted: 'Your order has been accepted',
      preparing: 'Your order is being prepared',
      picked_up: 'Driver has picked up your order',
      in_transit: 'Your order is on the way',
      delivered: 'Your order has been delivered',
      completed: 'Order completed',
      cancelled: 'Order has been cancelled',
    };

    if (rider) {
      await this.notifyRider(rider.id, rider.email, {
        title: `Order ${statusMessages[newStatus] || 'updated'}`,
        message: `Order #${order.order_number || order.id.slice(-8)} - ${statusMessages[newStatus]}`,
        type: 'status_update',
        orderId: order.id,
        priority: ['delivered', 'cancelled'].includes(newStatus) ? 'high' : 'medium',
      });
    }

    if (driver && ['delivered', 'completed'].includes(newStatus)) {
      await this.notifyDriver(driver.id, driver.email, {
        title: '✅ Order Completed',
        message: `Great job! Order #${order.order_number || order.id.slice(-8)} completed`,
        type: 'status_update',
        orderId: order.id,
        priority: 'medium',
      });
    }
  },

  // Notify about payment
  async notifyPayment(user, userType, { title, message, orderId }) {
    const notifyFn = userType === 'driver' ? this.notifyDriver :
                     userType === 'merchant' ? this.notifyMerchant :
                     this.notifyRider;
    
    if (user) {
      await notifyFn.call(this, user.id, user.email, {
        title,
        message,
        type: 'payment',
        orderId,
        priority: 'high',
      });
    }
  },
};