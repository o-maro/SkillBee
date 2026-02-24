/**
 * Location Service
 * Handles real-time location tracking, updates, and subscriptions for tasks
 */

import { supabase } from './supabaseClient';

const LOCATION_UPDATE_INTERVAL = 15000; // 15 seconds
const STALE_LOCATION_THRESHOLD = 60000; // 1 minute - consider location stale if not updated

/**
 * Start tracking tasker location for an active task
 * @param {string} bookingId - The booking ID
 * @param {Function} onLocationUpdate - Callback when location updates
 * @param {Function} onError - Error callback
 * @returns {Function} Stop tracking function
 */
export const startTracking = async (bookingId, onLocationUpdate, onError) => {
  let watchId = null;
  let updateInterval = null;
  let isTracking = true;

  // Request location permission
  if (!navigator.geolocation) {
    onError(new Error('Geolocation is not supported by this browser'));
    return () => {};
  }

  const updateLocation = async (position) => {
    if (!isTracking) return;

    const { latitude, longitude } = position.coords;

    try {
      const { error } = await updateTaskerLocation(bookingId, latitude, longitude);
      if (error) {
        console.error('Error updating location:', error);
        onError(error);
      } else {
        onLocationUpdate({ latitude, longitude, timestamp: Date.now() });
      }
    } catch (err) {
      console.error('Exception updating location:', err);
      onError(err);
    }
  };

  const handleLocationError = (error) => {
    console.error('Geolocation error:', error);
    onError(error);
  };

  // Start watching position
  watchId = navigator.geolocation.watchPosition(
    updateLocation,
    handleLocationError,
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000
    }
  );

  // Also update periodically as backup
  updateInterval = setInterval(() => {
    if (isTracking) {
      navigator.geolocation.getCurrentPosition(
        updateLocation,
        handleLocationError,
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000
        }
      );
    }
  }, LOCATION_UPDATE_INTERVAL);

  // Return stop function
  return () => {
    isTracking = false;
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
    }
    if (updateInterval !== null) {
      clearInterval(updateInterval);
    }
  };
};

/**
 * Update tasker's location in the database
 * @param {string} bookingId - The booking ID
 * @param {number} latitude - Tasker's latitude
 * @param {number} longitude - Tasker's longitude
 * @returns {Promise<{error: Error|null}>}
 */
export const updateTaskerLocation = async (bookingId, latitude, longitude) => {
  try {
    const { error } = await supabase
      .from('task_locations')
      .update({
        tasker_latitude: latitude,
        tasker_longitude: longitude,
        updated_at: new Date().toISOString()
      })
      .eq('booking_id', bookingId);

    return { error };
  } catch (error) {
    console.error('Exception in updateTaskerLocation:', error);
    return { error };
  }
};

/**
 * Subscribe to real-time location updates for a task
 * @param {string} bookingId - The booking ID
 * @param {Function} onUpdate - Callback when location updates
 * @returns {Function} Unsubscribe function
 */
export const subscribeToTaskLocation = (bookingId, onUpdate) => {
  const subscription = supabase
    .channel(`task_location:${bookingId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'task_locations',
        filter: `booking_id=eq.${bookingId}`
      },
      (payload) => {
        onUpdate(payload.new);
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
};

/**
 * Get current location data for a task
 * @param {string} bookingId - The booking ID
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export const getTaskLocation = async (bookingId) => {
  try {
    const { data, error } = await supabase
      .from('task_locations')
      .select('*')
      .eq('booking_id', bookingId)
      .single();

    return { data, error };
  } catch (error) {
    console.error('Exception in getTaskLocation:', error);
    return { data: null, error };
  }
};

/**
 * Mark tasker as arrived at client location
 * @param {string} bookingId - The booking ID
 * @returns {Promise<{error: Error|null}>}
 */
export const markTaskerArrived = async (bookingId) => {
  try {
    const { error } = await supabase
      .from('task_locations')
      .update({ status: 'arrived' })
      .eq('booking_id', bookingId);

    return { error };
  } catch (error) {
    console.error('Exception in markTaskerArrived:', error);
    return { error };
  }
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Get route and ETA using Google Maps Directions API (requires API key)
 * Alternative: Use Mapbox Directions API
 * @param {number} fromLat - Starting latitude
 * @param {number} fromLon - Starting longitude
 * @param {number} toLat - Destination latitude
 * @param {number} toLon - Destination longitude
 * @returns {Promise<{distance: number, duration: number, route: Array|null, error: Error|null}>}
 */
export const getRouteAndETA = async (fromLat, fromLon, toLat, toLon) => {
  // For now, calculate straight-line distance and estimate ETA
  // In production, integrate with Google Maps or Mapbox Directions API
  const distance = calculateDistance(fromLat, fromLon, toLat, toLon);
  
  // Estimate ETA: average speed of 30 km/h in urban areas
  const averageSpeed = 30; // km/h
  const estimatedMinutes = (distance / averageSpeed) * 60;

  return {
    distance,
    duration: estimatedMinutes,
    route: null, // Would contain route coordinates from Directions API
    error: null
  };
};

/**
 * Check if location is stale (not updated recently)
 * @param {string} updatedAt - ISO timestamp of last update
 * @returns {boolean} True if location is stale
 */
export const isLocationStale = (updatedAt) => {
  if (!updatedAt) return true;
  const lastUpdate = new Date(updatedAt).getTime();
  const now = Date.now();
  return now - lastUpdate > STALE_LOCATION_THRESHOLD;
};

/**
 * Format distance for display
 * @param {number} distanceKm - Distance in kilometers
 * @returns {string} Formatted distance string
 */
export const formatDistance = (distanceKm) => {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  }
  return `${distanceKm.toFixed(1)}km`;
};

/**
 * Format duration for display
 * @param {number} minutes - Duration in minutes
 * @returns {string} Formatted duration string
 */
export const formatDuration = (minutes) => {
  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hours}h ${mins}m`;
};

