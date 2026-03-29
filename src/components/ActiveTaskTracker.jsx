import React, { useEffect, useState, useRef } from 'react'
import Map, { Marker, Source, Layer } from 'react-map-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import {
  getTaskTrackingState,
  initializeTaskTracking,
  updateTaskerLocation,
  updateTrackingMilestone
} from '../utils/trackingApi'
import { getDrivingRoute } from '../utils/directionsApi'
import { MilestoneStepper } from './MilestoneStepper'
import styles from './ActiveTaskTracker.module.css'

export const ActiveTaskTracker = ({ task, profile, onTaskRefreshRequest }) => {
  const [tracking, setTracking] = useState(null)
  const [taskerLocation, setTaskerLocation] = useState(null)
  const [routeGeoJSON, setRouteGeoJSON] = useState(null)
  
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [viewState, setViewState] = useState({
    latitude: task.latitude || 0,
    longitude: task.longitude || 0,
    zoom: 13
  })

  const watchIdRef = useRef(null)

  // 1. Fetch current tracking layer explicitly on mount
  useEffect(() => {
    const fetchTracking = async () => {
      setLoading(true)
      const { data } = await getTaskTrackingState(task.id)
      if (data) {
        setTracking(data)
      } else if (task.status === 'accepted') {
        // Mock a pending tracking state visually 
        setTracking({ status: 'pending_start' })
      }
      setLoading(false)
    }
    fetchTracking()

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [task.id, task.status])

  // 2. Start Live Geolocation Watcher if active
  useEffect(() => {
    if (!tracking || tracking.status === 'pending_start' || tracking.status === 'completed') {
      return
    }

    if (navigator.geolocation) {
      let lastPushTime = 0
      
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setTaskerLocation([longitude, latitude]) // Array for Mapbox [lng, lat]
          
          // Re-center map to tasker
          setViewState(prev => ({ ...prev, latitude, longitude }))

          const now = Date.now()
          // Throttle database pushes to every 10 seconds securely
          if (now - lastPushTime > 10000) {
            updateTaskerLocation(task.id, latitude, longitude)
            lastPushTime = now
          }
        },
        (error) => console.error("Error watching position: ", error),
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      )
    }
    
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [tracking, task.id])

  // 3. Fetch Mapbox Directions periodically when both physical locations exist 
  useEffect(() => {
    const buildRoute = async () => {
      if (taskerLocation && task.latitude && task.longitude) {
        const clientCoords = [task.longitude, task.latitude]
        const geometry = await getDrivingRoute(taskerLocation, clientCoords)
        if (geometry) {
          setRouteGeoJSON({
            type: 'Feature',
            properties: {},
            geometry: geometry
          })
        }
      }
    }
    
    buildRoute()
    // Refresh route every 30 seconds gracefully
    const interval = setInterval(buildRoute, 30000)
    return () => clearInterval(interval)
  }, [taskerLocation, task.latitude, task.longitude])


  // Buttons Logic 
  const handleStartTracking = async () => {
    setActionLoading(true)
    // Initialize the DB object explicitly
    const { data, error } = await initializeTaskTracking(task.id, profile.id, task.client_id)
    if (!error && data) {
      // Immediately step to en_route sequentially 
      const advance = await updateTrackingMilestone(task.id, 'en_route')
      if (advance.data) {
        setTracking(advance.data)
        if (onTaskRefreshRequest) onTaskRefreshRequest()
      }
    }
    setActionLoading(false)
  }

  const handleMilestone = async (nextStatus) => {
    setActionLoading(true)
    const { data } = await updateTrackingMilestone(task.id, nextStatus)
    if (data) {
      setTracking(data)
      if (onTaskRefreshRequest) onTaskRefreshRequest() // Reload dashboard generic statuses safely
    }
    setActionLoading(false)
  }

  if (loading) return <div className={styles.trackerCard}><div className={styles.header}>Loading tracking...</div></div>

  const status = tracking?.status || 'unknown'

  return (
    <div className={styles.trackerCard}>
      {/* Header section cleanly summarizing task variables safely */}
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h3 className={styles.serviceType}>{task.service_type.toUpperCase()}</h3>
          <p className={styles.clientLocation}>📍 {task.location || 'Client Location'}</p>
        </div>
        <span className={`${styles.statusBadge} ${styles[status]}`}>
          {status.replace('_', ' ')}
        </span>
      </div>

      <MilestoneStepper currentStatus={status} />

      {/* Embedded Map Visual */}
      <div className={styles.mapContainer}>
        {status === 'pending_start' && (
          <div className={styles.mapLoading}>
            Tap "Start Tracking" to initialize route guidance.
          </div>
        )}
        
        <Map
          {...viewState}
          onMove={(evt) => setViewState(evt.viewState)}
          mapStyle="mapbox://styles/mapbox/navigation-day-v1"
          mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
        >
          {/* Client Destination Marker */}
          {task.latitude && task.longitude && (
            <Marker longitude={task.longitude} latitude={task.latitude}>
               <div className={styles.destinationMarker} />
            </Marker>
          )}

          {/* Tasker Live Marker */}
          {taskerLocation && (
            <Marker longitude={taskerLocation[0]} latitude={taskerLocation[1]}>
               <div className={styles.taskerMarker} />
            </Marker>
          )}

          {/* Driving Route Overlay */}
          {routeGeoJSON && (
            <Source id="routeSource" type="geojson" data={routeGeoJSON}>
              <Layer
                id="routeLayer"
                type="line"
                paint={{
                  'line-color': '#4f46e5',
                  'line-width': 5,
                  'line-opacity': 0.8
                }}
              />
            </Source>
          )}
        </Map>
      </div>

      {/* Logic Controls Sequence */}
      <div className={styles.controlsRow}>
        {status === 'pending_start' && (
          <button 
            className={`${styles.actionBtn} ${styles.startTrackingBtn}`}
            onClick={handleStartTracking}
            disabled={actionLoading}
          >
            {actionLoading ? 'Starting...' : 'Start Tracking'}
          </button>
        )}

        {status === 'en_route' && (
          <button 
            className={`${styles.actionBtn} ${styles.arrivedBtn}`}
            onClick={() => handleMilestone('arrived')}
            disabled={actionLoading}
          >
            {actionLoading ? 'Updating...' : 'Arrived at Location'}
          </button>
        )}

        {status === 'arrived' && (
          <button 
            className={`${styles.actionBtn} ${styles.startTaskBtn}`}
            onClick={() => handleMilestone('in_progress')}
            disabled={actionLoading}
          >
            {actionLoading ? 'Updating...' : 'Start Task'}
          </button>
        )}

        {status === 'in_progress' && (
          <button 
            className={`${styles.actionBtn} ${styles.completeBtn}`}
            onClick={() => handleMilestone('completed')}
            disabled={actionLoading}
          >
            {actionLoading ? 'Finishing...' : 'Complete Task'}
          </button>
        )}
      </div>
    </div>
  )
}
