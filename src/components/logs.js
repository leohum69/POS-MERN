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
    const handleDelete = (orderNum) => {
        if (window.confirm('Are you sure you want to delete this order?')) {
            axios.delete(`http://localhost:8080/orders/${orderNum}`)
                .then(() => {
                    // Update state after successful deletion
                    const updatedOrders = orders.filter(order => order.orderNum !== orderNum);
                    setOrders(updatedOrders);
                    setFilteredOrders(updatedOrders);
                    alert('Order deleted successfully!');
                })
                .catch(error => {
                    console.error('Error deleting the order:', error);
                    alert('Failed to delete the order. Please try again.');
                });
        }
    };
    

    const filterOrders = (type, date) => {
        let filtered = orders;

        if (type === 'retail') {
            filtered = filtered.filter(order => order.orderType === 'retail');
        } else if (type === 'wholesale') {
            filtered = filtered.filter(order => order.orderType === 'wholesale');
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
                    <span class="label-text">Filter by Date</span>
                </label>
            </div>

            {/* Logs Table */}
            <div className="logs-table-container">
            <div className="logs-table-wrapper">
                {filteredOrders.length > 0 ? (
                    <table className="logs-table">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Type</th>
                                <th>Customer Name</th>
                                <th>Customer Phone</th>
                                <th>Total Before Discount</th>
                                <th>Discount (%)</th>
                                <th>Discount Amount</th>
                                <th>Total After Discount</th>
                                <th>Order Date</th>
                                <th>Order Details</th>
                                <th>Delete</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.slice().reverse().map((order, index) => (
                                <tr key={index}>
                                    <td>{order.orderNum}</td>
                                    <td>{order.orderType}</td>
                                    <td>{order.customerName || 'N/A'}</td>
                                    <td>{order.customerPhone || 'N/A'}</td>
                                    <td>Rs.{order.totalPriceBeforeDiscount.toFixed(2)}</td>
                                    <td>{order.discountPercentage || 0}%</td>
                                    <td>Rs.{order.discountAmount.toFixed(2)}</td>
                                    <td>Rs.{order.totalPriceAfterDiscount.toFixed(2)}</td>
                                    <td>{new Date(order.date).toLocaleDateString()}</td>
                                    <td>
                                        <ul>
                                            {order.orderDetails.map((item, idx) => (
                                                <li key={idx}>
                                                    {item.itemname} - 
                                                    Qty: {item.quantity}, 
                                                    Price: Rs.{item.price.toFixed(2)}
                                                </li>
                                            ))}
                                        </ul>
                                    </td>
                                    <button 
                                        className="delete-btn" 
                                        onClick={() => handleDelete(order.orderNum)}
                                    >
                                    Delete
                                    </button>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p>No orders found.</p>
                )}
                </div>
            </div>
        </div>
    );
};

export default Logs;
