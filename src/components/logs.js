import React, { useEffect, useState } from 'react';
import Navbar from './navbar';
import axios from 'axios';
import './logs.css';

const Logs = () => {
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [filter, setFilter] = useState('all'); // Options: 'all', 'retail', 'wholesale'
    const [selectedDate, setSelectedDate] = useState(''); // Track selected date

    useEffect(() => {
        axios.get('http://localhost:8080/orders')
            .then(response => {
                setOrders(response.data);
                setFilteredOrders(response.data);
            })
            .catch(error => console.error('Error fetching orders:', error));
    }, []);

    const handleFilterChange = (type) => {
        setFilter(type);
        filterOrders(type, selectedDate);
    };

    const handleDateChange = (date) => {
        setSelectedDate(date);
        filterOrders(filter, date);
    };

    const filterOrders = (type, date) => {
        let filtered = orders;

        if (type === 'retail') {
            filtered = filtered.filter(order => !order.customerName);
        } else if (type === 'wholesale') {
            filtered = filtered.filter(order => order.customerName);
        }

        if (date) {
            filtered = filtered.filter(order => {
                const orderDate = new Date(order.date).toISOString().split('T')[0];
                return orderDate === date;
            });
        }

        setFilteredOrders(filtered);
    };

    return (
        <div className="logs">
            <Navbar />
            <h2>Order Logs</h2>

            {/* Filter Section */}
            <div className="filter-section">
                <label>
                    <input
                        type="radio"
                        name="filter"
                        value="all"
                        checked={filter === 'all'}
                        onChange={() => handleFilterChange('all')}
                    />
                    All
                </label>
                <label>
                    <input
                        type="radio"
                        name="filter"
                        value="retail"
                        checked={filter === 'retail'}
                        onChange={() => handleFilterChange('retail')}
                    />
                    Retail
                </label>
                <label>
                    <input
                        type="radio"
                        name="filter"
                        value="wholesale"
                        checked={filter === 'wholesale'}
                        onChange={() => handleFilterChange('wholesale')}
                    />
                    Wholesale
                </label>

                {/* Date Picker */}
                <label>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => handleDateChange(e.target.value)}
                    />
                    Filter by Date
                </label>
            </div>

            {/* Logs Table */}
            <div className="logs-table-container">
                {filteredOrders.length > 0 ? (
                    <table className="logs-table">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Type</th>
                                <th>Customer Name</th>
                                <th>Customer Phone</th>
                                <th>Total Price</th>
                                <th>Order Date</th>
                                <th>Order Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.map((order, index) => (
                                <tr key={index}>
                                    <td>{order._id}</td>
                                    <td>{order.customerName ? 'Wholesale' : 'Retail'}</td>
                                    <td>{order.customerName || 'N/A'}</td>
                                    <td>{order.customerPhone || 'N/A'}</td>
                                    <td>Rs.{order.totalPrice.toFixed(2)}</td>
                                    <td>{new Date(order.date).toLocaleDateString()}</td>
                                    <td>
                                        <ul>
                                            {order.orderDetails.map((item, idx) => (
                                                <li key={idx}>
                                                {item.itemname} - 
                                                Qty: {item.quantity}, 
                                                Price: Rs.{item.price.toFixed(2)}, 
                                                Discount: Rs.{(item.discount || 0).toFixed(2)}
                                            </li>
                                            ))}
                                        </ul>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p>No orders found.</p>
                )}
            </div>
        </div>
    );
};

export default Logs;
