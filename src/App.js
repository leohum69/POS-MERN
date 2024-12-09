import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import Home from "./components/Home";
import Items from "./components/items";
import PlaceOrder from "./components/PlaceOrder";
import Logs from "./components/logs";
import "./App.css";
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Home />} />
        <Route path="/items" element={<Items />} />
        <Route path="/place-order" element={<PlaceOrder />} />
        <Route path="/logs" element={<Logs />} />
      </Routes>
    </Router>
  );
}

export default App;
