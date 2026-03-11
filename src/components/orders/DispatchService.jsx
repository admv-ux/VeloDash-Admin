import { base44 } from '@/api/base44Client';
import { NotificationService } from '@/components/notifications/NotificationService';

// Calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Check if driver is currently within working hours
const isWithinWorkingHours = (driver) => {
  if (!driver.working_schedule) return true;
  
  const now = new Date();
  const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()];
  const schedule = driver.working_schedule[dayName];
  
  if (!schedule || !schedule.enabled) return false;
  
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const [startHour, startMin] = schedule.start.split(':').map(Number);
  const [endHour, endMin] = schedule.end.split(':').map(Number);
  const startTime = startHour * 60 + startMin;
  const endTime = endHour * 60 + endMin;
  
  return currentTime >= startTime && currentTime <= endTime;
};

// Check if driver is eligible for new orders
const isDriverEligible = (driver, orderType, zone) => {
  // Check basic status
  if (driver.status !== 'online') return false;
  
  // Check if accepting orders
  if (driver.accepting_orders === false) return false;
  
  // Check working hours
  if (!isWithinWorkingHours(driver)) return false;
  
  // Check service type match
  if (orderType === 'delivery' && driver.service_type === 'ride_hailing') return false;
  if (orderType === 'ride' && driver.service_type === 'delivery') return false;
  
  // Check zone match (if zones are being used)
  if (zone && driver.zone_id && driver.zone_id !== zone.id) return false;
  
  return true;
};

// Round-robin counter for fair distribution
let lastAssignedDriverIndex = 0;

export const DispatchService = {
  /**
   * Automatically find and assign a driver to an order
   * @param {Object} order - The order to assign
   * @param {Array} allDrivers - List of all drivers
   * @param {Array} allZones - List of all zones
   * @returns {Object} - { success: boolean, driver: Object, message: string }
   */
  async assignDriverToOrder(order, allDrivers, allZones) {
    try {
      // Validate order has required location data
      if (!order.pickup_latitude || !order.pickup_longitude) {
        return {
          success: false,
          message: 'Order missing pickup location coordinates'
        };
      }

      // Find the zone for this order (if using zones)
      let orderZone = null;
      if (allZones && allZones.length > 0) {
        orderZone = allZones.find(zone => {
          if (!zone.center_latitude || !zone.center_longitude) return false;
          const distance = calculateDistance(
            order.pickup_latitude,
            order.pickup_longitude,
            zone.center_latitude,
            zone.center_longitude
          );
          return distance <= (zone.radius_km || 10);
        });
      }

      // Filter eligible drivers
      const eligibleDrivers = allDrivers.filter(driver => 
        isDriverEligible(driver, order.type, orderZone)
      );

      if (eligibleDrivers.length === 0) {
        return {
          success: false,
          message: 'No eligible drivers available at this time'
        };
      }

      // Calculate distances for eligible drivers with valid locations
      const driversWithDistance = eligibleDrivers
        .filter(d => d.current_latitude && d.current_longitude)
        .map(driver => ({
          driver,
          distance: calculateDistance(
            order.pickup_latitude,
            order.pickup_longitude,
            driver.current_latitude,
            driver.current_longitude
          )
        }))
        .sort((a, b) => a.distance - b.distance);

      // Assignment strategy: Nearest driver within 15km, otherwise round-robin
      let selectedDriver;
      
      if (driversWithDistance.length > 0 && driversWithDistance[0].distance <= 15) {
        // Assign to nearest driver within reasonable range
        selectedDriver = driversWithDistance[0].driver;
      } else {
        // Round-robin fallback for fair distribution
        selectedDriver = eligibleDrivers[lastAssignedDriverIndex % eligibleDrivers.length];
        lastAssignedDriverIndex++;
      }

      // Update order with driver assignment
      await base44.entities.Order.update(order.id, {
        driver_id: selectedDriver.id,
        driver_name: selectedDriver.full_name,
        status: 'accepted'
      });

      // Update driver status to busy
      await base44.entities.Driver.update(selectedDriver.id, {
        status: 'busy'
      });

      // Send notifications
      await NotificationService.notifyDriver(selectedDriver.id, selectedDriver.email, {
        title: '🎯 New Order Assigned!',
        message: `New ${order.type} order #${order.order_number || order.id.slice(-8)} - Pickup: ${order.pickup_address}`,
        type: 'new_order',
        orderId: order.id,
        priority: 'urgent',
      });

      // Notify merchant if delivery order
      if (order.type === 'delivery' && order.merchant_id) {
        const merchants = await base44.entities.Merchant.list();
        const merchant = merchants.find(m => m.id === order.merchant_id);
        if (merchant) {
          await NotificationService.notifyMerchant(merchant.id, merchant.email, {
            title: '📦 Order Assigned to Driver',
            message: `Order #${order.order_number || order.id.slice(-8)} assigned to ${selectedDriver.full_name}`,
            type: 'status_update',
            orderId: order.id,
            priority: 'medium',
          });
        }
      }

      // Notify rider
      if (order.rider_id) {
        const riders = await base44.entities.Rider.list();
        const rider = riders.find(r => r.id === order.rider_id);
        if (rider) {
          await NotificationService.notifyRider(rider.id, rider.email, {
            title: '✅ Driver Assigned!',
            message: `${selectedDriver.full_name} will handle your ${order.type} - ${selectedDriver.vehicle_type}`,
            type: 'status_update',
            orderId: order.id,
            priority: 'high',
          });
        }
      }

      return {
        success: true,
        driver: selectedDriver,
        message: `Order assigned to ${selectedDriver.full_name}`
      };

    } catch (error) {
      console.error('Dispatch error:', error);
      return {
        success: false,
        message: error.message || 'Failed to assign driver'
      };
    }
  },

  /**
   * Get list of eligible drivers for an order (for manual assignment)
   */
  getEligibleDrivers(order, allDrivers, allZones) {
    let orderZone = null;
    if (allZones && allZones.length > 0 && order.pickup_latitude && order.pickup_longitude) {
      orderZone = allZones.find(zone => {
        if (!zone.center_latitude || !zone.center_longitude) return false;
        const distance = calculateDistance(
          order.pickup_latitude,
          order.pickup_longitude,
          zone.center_latitude,
          zone.center_longitude
        );
        return distance <= (zone.radius_km || 10);
      });
    }

    const eligible = allDrivers.filter(driver => 
      isDriverEligible(driver, order.type, orderZone)
    );

    // Add distance info if location available
    return eligible.map(driver => {
      if (driver.current_latitude && driver.current_longitude && order.pickup_latitude && order.pickup_longitude) {
        const distance = calculateDistance(
          order.pickup_latitude,
          order.pickup_longitude,
          driver.current_latitude,
          driver.current_longitude
        );
        return { ...driver, distance };
      }
      return driver;
    }).sort((a, b) => (a.distance || 999) - (b.distance || 999));
  }
};