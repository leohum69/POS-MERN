import React from 'react';
import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <nav className="navbar">
      <h1 className="navbar-title">Welcome</h1>
      <ul className="navbar-links">
        <li>
          <Link to="/items">Items</Link>
        </li>
        <li>
          <Link to="/logs">Logs</Link>
        </li>
        <li>
          <Link to="/place-order">Place Order</Link>
        </li>
      </ul>
    </nav>
  );
}

export default Navbar;
