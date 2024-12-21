import React, { useState, useEffect } from 'react';
import Navbar from './navbar'; // Import the Navbar

function Dashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer); // Cleanup the interval on component unmount
  }, []);

  const styles = {
    dashboard: {
      fontFamily: "'Arial', sans-serif",
      textAlign: 'center',
      padding: '20px',
      color: '#333',
    },
    clock: {
      fontSize: '1.2em',
      color: '#555',
      margin: '10px 0',
    },
    content: {
      marginTop: '20px',
      backgroundColor: '#fff',
      padding: '20px',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      maxWidth: '600px',
      margin: '20px auto',
    },
    heading: {
      fontSize: '1.8em',
      color: '#cb2122',
      marginBottom: '10px',
    },
    paragraph: {
      fontSize: '1em',
      color: '#666',
    },
  };

  return (
    <div className="home">
    <div style={styles.dashboard}>
      {/* Navbar Component */}
      <Navbar />

      {/* Clock */}
      <div style={styles.clock}>
        Current Time: {currentTime.toLocaleTimeString()}
      </div>

      {/* Main Content */}
      <div style={styles.content}>
        <h2 style={styles.heading}>Welcome to GM AUTOS & Haji Wheel Alignment</h2>
        <p style={styles.paragraph}>Choose an option from the Navbar to get started.</p>
      </div>
    </div></div>
  );
}

export default Dashboard;
