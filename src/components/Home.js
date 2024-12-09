import React from 'react';
import Navbar from './navbar'; // Import the Navbar

function Dashboard() {
  return (
    <div className="dashboard">
      {/* Navbar Component */}
      <Navbar />

      {/* Main Content */}
      <div className="dashboard-content">
        <h2>Welcome to the Dashboard</h2>
        <p>Choose an option from the Navbar to get started.</p>
      </div>
    </div>
  );
}

export default Dashboard;
