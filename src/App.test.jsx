// Temporary test file to verify app renders
// This will help diagnose if the issue is with React or routing

function TestApp() {
  return (
    <div style={{
      padding: '2rem',
      textAlign: 'center',
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <h1 style={{ color: '#2563eb', fontSize: '2rem', marginBottom: '1rem' }}>
        SkillBee App is Running! ✅
      </h1>
      <p style={{ color: '#666', fontSize: '1.1rem' }}>
        If you see this, React is working correctly.
      </p>
      <p style={{ color: '#666', marginTop: '1rem' }}>
        Check the browser console (F12) for any errors.
      </p>
    </div>
  )
}

export default TestApp

