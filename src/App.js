import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import Home from "./components/Home";
import Items from "./components/items";
import RetailPage from "./components/RetailPage";
import Logs from "./components/logs";
import Customers from "./components/Customers";
import Wholesale from "./components/Wholesale";
import "./App.css";
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Home />} />
        <Route path="/items" element={<Items />} />
        <Route path="/retailpage" element={<RetailPage />} />
        <Route path="/logs" element={<Logs />} />
        <Route path="/addcustomer" element={<Customers />} />
        <Route path="/wholesale" element={<Wholesale />} />
      </Routes>
    </Router>
  );
}

export default App;
