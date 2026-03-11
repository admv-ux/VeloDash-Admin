// Utility to check if a driver is eligible to receive new orders
export function isDriverEligible(driver) {
  if (!driver) return false;

  // Check basic status
  if (driver.status !== 'online') return false;
  
  // Check if accepting orders
  if (driver.accepting_orders === false) return false;

  // Check working schedule for current day/time
  if (driver.working_schedule) {
    const now = new Date();
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()];
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const todaySchedule = driver.working_schedule[dayName];
    
    if (todaySchedule) {
      // If day is disabled, driver is not eligible
      if (todaySchedule.enabled === false) return false;
      
      // Check if current time is within working hours
      if (todaySchedule.start && todaySchedule.end) {
        if (currentTime < todaySchedule.start || currentTime > todaySchedule.end) {
          return false;
        }
      }
    }
  }

  return true;
}

// Get all eligible drivers from a list
export function getEligibleDrivers(drivers) {
  if (!Array.isArray(drivers)) return [];
  return drivers.filter(isDriverEligible);
}

// Get eligible drivers in a specific zone
export function getEligibleDriversInZone(drivers, zoneId) {
  return getEligibleDrivers(drivers).filter(d => d.zone_id === zoneId);
}