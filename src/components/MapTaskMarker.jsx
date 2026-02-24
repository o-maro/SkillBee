import { TaskCard } from './TaskCard'
import styles from './MapTaskMarker.module.css'

// Try to import Popup from react-leaflet
let Popup
try {
  const leaflet = require('react-leaflet')
  Popup = leaflet.Popup
} catch (e) {
  // react-leaflet not installed - Popup will be undefined
  Popup = null
}

export const MapTaskMarker = ({ task, onAccept }) => {
  const popupContent = (
    <div className={styles.popupContent}>
      <TaskCard
        task={task}
        showActions={true}
        onAccept={onAccept}
      />
    </div>
  )

  if (!Popup) {
    return <div className={styles.popup}>{popupContent}</div>
  }

  return <Popup className={styles.popup}>{popupContent}</Popup>
}

