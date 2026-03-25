import Map, { Marker } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useEffect, useState } from 'react';

export default function MapView({ taskers }) {

  const [viewState, setViewState] = useState({
    latitude: 0.3476,
    longitude: 32.5825,
    zoom: 12
  });

  useEffect(() => {

    navigator.geolocation.getCurrentPosition((position) => {

      setViewState({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        zoom: 13
      });

    });

  }, []);

  return (
    <div style={{ width: "100%", height: "500px" }}>
      <Map
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
      >
        {taskers?.map((tasker) => (
          <Marker
            key={tasker.id}
            latitude={tasker.latitude}
            longitude={tasker.longitude}
          >
            <div
              style={{
                width: "18px",
                height: "18px",
                backgroundColor: "#2563eb",
                borderRadius: "50%",
                border: "2px solid white"
              }}
            />
          </Marker>
        ))}
      </Map>

    </div>
  );
}