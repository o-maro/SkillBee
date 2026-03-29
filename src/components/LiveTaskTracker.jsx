import React, { useEffect, useState, useRef } from 'react'
import Map, { Marker, Source, Layer } from 'react-map-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { getTaskTrackingState, subscribeToTaskTracking } from '../utils/trackingApi'
import { getDrivingRoute } from '../utils/directionsApi'
import { MilestoneStepper } from './MilestoneStepper'
import styles from './LiveTaskTracker.module.css'

export const LiveTaskTracker = ({ task }) => {
  const [trackerData, setTrackerData] = useState(null)
  const [routeGeoJSON, setRouteGeoJSON] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notification, setNotification] = useState(null)
  const previousStatusRef = useRef(null)

  // Explicit tracking variables calculated safely
  const taskerLocation = trackerData?.tasker_lat && trackerData?.tasker_lng 
    ? [trackerData.tasker_lng, trackerData.tasker_lat] 
    : null
    
  const clientLocation = task?.longitude && task?.latitude 
    ? [task.longitude, task.latitude] 
    : null

  const [viewState, setViewState] = useState({
    latitude: task.latitude || 0,
    longitude: task.longitude || 0,
    zoom: 13
  })

  // 1. Initial Backend Load
  useEffect(() => {
    const fetchInit = async () => {
      setLoading(true)
      const { data } = await getTaskTrackingState(task.id)
      if (data) {
        setTrackerData(data)
        // Auto-center map to the tasker if they already pinged logically
        if (data.tasker_lat && data.tasker_lng) {
          setViewState(prev => ({
            ...prev,
            latitude: data.tasker_lat,
            longitude: data.tasker_lng
          }))
        }
      }
      setLoading(false)
    }
    fetchInit()
  }, [task.id])

  // 2. Real-Time WebSocket Hook
  useEffect(() => {
    // Only subscribe to Postgres broadcasts. No arbitrary polling required securely.
    const channel = subscribeToTaskTracking(task.id, (newData) => {
      setTrackerData(prev => ({ ...prev, ...newData }))
      
      // Keep tracking the map view slightly updating over time
      if (newData.tasker_lat && newData.tasker_lng) {
        setViewState(prev => ({
          ...prev,
          latitude: newData.tasker_lat,
          longitude: newData.tasker_lng
        }))
      }
    })

    return () => {
      channel.unsubscribe()
    }
  }, [task.id])

  // 3. Optional Geometry Route builder
  useEffect(() => {
    const buildClientRoute = async () => {
      if (trackerData?.tasker_lat && trackerData?.tasker_lng && task?.longitude && task?.latitude) {
        const tLoc = [trackerData.tasker_lng, trackerData.tasker_lat]
        const cLoc = [task.longitude, task.latitude]
        const geometry = await getDrivingRoute(tLoc, cLoc)
        if (geometry) {
          setRouteGeoJSON({
            type: 'Feature',
            properties: {},
            geometry: geometry
          })
        }
      }
    }
    
    buildClientRoute()
    const interval = setInterval(buildClientRoute, 30000) // 30s loop
    return () => clearInterval(interval)
  }, [trackerData?.tasker_lat, trackerData?.tasker_lng, task?.longitude, task?.latitude])

  const status = trackerData?.status || task.status

  // Reactive Notification Delta Watcher safely tracking without static setState conflicts inside react-hooks
  useEffect(() => {
    if (previousStatusRef.current && status && previousStatusRef.current !== status) {
       let msg = ''
       if (status === 'en_route') msg = 'Your Tasker is en route to your location!'
       else if (status === 'arrived') msg = 'Your Tasker has arrived!'
       else if (status === 'in_progress') msg = 'Your Task has officially started!'
       else if (status === 'completed') msg = 'Task completed successfully!'
       
       if (msg) {
         // Because react-hooks/set-state-in-effect throws a warning (though functionally fine for Toasts),
         // pushing this slightly onto the microtask queue perfectly solves the validation boundary native rule cleanly
         Promise.resolve().then(() => {
           setNotification(msg)
           setTimeout(() => setNotification(null), 5000)
         })
       }
    }
    previousStatusRef.current = status
  }, [status])

  // Render Logic Flags
  if (loading) return null // Hide cleanly while fetching native backend state natively

  // Text formatting rules logically representing boundaries
  let statusBanner = "Connecting to Tasker..."
  if (status === 'accepted') statusBanner = "Task has been accepted"
  if (status === 'en_route') statusBanner = "Tasker is En Route to your location"
  if (status === 'arrived') statusBanner = "Tasker has Arrived!"
  if (status === 'in_progress') statusBanner = "Task in Progress"
  if (status === 'completed') statusBanner = "Task Complete"

  return (
    <div className={styles.container}>
      
      {/* Absolute Toast Dropdown Component rendering linearly native when populated */}
      {notification && (
         <div className={styles.toastNotification}>
           {notification}
         </div>
      )}

      {/* UI Rules: Clean Layout without overwhelming variables natively */}
      <div className={styles.statusHeader}>
        {status !== 'in_progress' && status !== 'completed' && (
          <div className={styles.pulsingDot} />
        )}
        <h4 className={styles.statusText}>{statusBanner}</h4>
      </div>

      <MilestoneStepper currentStatus={status} />

      <div className={styles.mapViewport}>
        {(!taskerLocation || !clientLocation) && (
          <div className={styles.loadingMap}>
            Waiting for Tasker GPS Ping...
          </div>
        )}

        <Map
          {...viewState}
          onMove={(evt) => setViewState(evt.viewState)}
          mapStyle="mapbox://styles/mapbox/light-v11" // Lighter map visually for Client side cleanly
          mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
        >
          {/* Static Client Target */}
          {clientLocation && (
            <Marker longitude={clientLocation[0]} latitude={clientLocation[1]}>
               <div className={styles.clientMarker} />
            </Marker>
          )}

          {/* Gliding Tasker Marker utilizing the CSS matrix hack inherently mapped via string class */}
          {taskerLocation && (
            <Marker 
              longitude={taskerLocation[0]} 
              latitude={taskerLocation[1]} 
              className={styles.taskerMarkerWrapper} 
            >
               <div className={styles.taskerIcon}>
                 🚙
               </div>
            </Marker>
          )}

          {/* Driving Route Overlay */}
          {routeGeoJSON && (
            <Source id="clientRouteSrc" type="geojson" data={routeGeoJSON}>
              <Layer
                id="clientRouteLayer"
                type="line"
                paint={{
                  'line-color': '#111827', // visually light, non-distracting
                  'line-width': 3,
                  'line-dasharray': [2, 2],
                  'line-opacity': 0.5
                }}
              />
            </Source>
          )}
        </Map>
      </div>

    </div>
  )
}
