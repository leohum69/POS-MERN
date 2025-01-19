import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import Navbar from './navbar';
import './retail.css';

const RetailPage = () => {
    const location = useLocation();
    const [order, setOrder] = useState(location.state?.order || null);
    const [searchTerm, setSearchTerm] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]);
    const [totalValue, setTotalValue] = useState(0);
    const [discountPercentage, setDiscountPercentage] = useState(0);
    const [discountAmount, setDiscountAmount] = useState(0);
    const [discountedTotal, setDiscountedTotal] = useState(0);
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [message, setMessage] = useState('');
    const [printReceipt, setPrintReceipt] = useState(false);

    // Search for items and fetch suggestions
    const handleSearchChange = (e) => {
        const search = e.target.value.toLowerCase();
        setSearchTerm(search);

        if (search.length > 0) {
            axios.get(`http://localhost:8080/items/search?name=${search}`)
                .then(response => setSuggestions(response.data))
                .catch(error => console.error('Error fetching suggestions:', error));
        } else {
            setSuggestions([]);
        }
    };

    // Add selected item to the editable list
    const handleItemSelection = (item) => {
        if (!selectedItems.some(selected => selected._id === item._id)) {
            const updatedItems = [
                ...selectedItems,
                { ...item, quantity: 1, price: item.retail ?? 0 }
            ];
            setSelectedItems(updatedItems);
            calculateTotal(updatedItems);
            setSearchTerm('');
            setSuggestions([]);
        }
    };

    // Update item quantity or price
    const handleInputChange = (itemId, field, value) => {
        const updatedItems = selectedItems.map(item => {
            if (item._id === itemId) {
                const newValue = field === 'quantity' ? Math.max(1, value) : value;
                if(field == 'quantity' && newValue > item.stock) {
                    alert('Quantity exceeds stock!');
                    return { ...item, [field]: item.stock };
            }
            return { ...item, [field]: newValue };
        }
            return item;
        });
        setSelectedItems(updatedItems);
        calculateTotal(updatedItems);
    };

    // Calculate total value and discount
    const calculateTotal = async (items) => {
        const total = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
        setTotalValue(total);
    };

    const setOrderDetails = async (order) => {
        // Fetch items from the API
        try {
            const response = await axios.get('http://localhost:8080/items');
            const items = response.data;  // Assuming the API response contains an array of items
            const updatedItems = order.orderDetails.map(orderItem => {
                // Find the real item data by matching _id
                const realItem = items.find(item => item._id === orderItem.itemid);
    
                if (realItem) {
                    return {
                        ...realItem,  // Get all real item data
                        quantity: orderItem.quantity || 1,
                        price: orderItem.price || realItem.retail || 0,  // Default to retail price if no price in order
                    };
                }
    
                // If real item is not found, return a default object with just the basic details
                return {
                    _id: orderItem.itemid,
                    itemname: orderItem.itemname,
                    quantity: orderItem.quantity || 1,
                    price: orderItem.price || 0,
                };
            });
    
            setSelectedItems(updatedItems);
            calculateTotal(updatedItems);
        } catch (error) {
            console.error('Error fetching items:', error);
        }
    };

    useEffect(() => {
        if (order) {
            setCustomerName(order.customerName);
            setCustomerPhone(order.customerPhone);
            setDiscountPercentage(order.discountPercentage);
            setOrderDetails(order);
        }
    }, [order]);

    useEffect(() => {
        const discount = (discountPercentage / 100) * totalValue;
        const finalTotal = totalValue - discount;
        setDiscountAmount(discount);
        setDiscountedTotal(finalTotal);
    }, [totalValue, discountPercentage]);

    // Remove an item from the list
    const handleRemoveItem = (itemId) => {
        const updatedItems = selectedItems.filter(item => item._id !== itemId);
        setSelectedItems(updatedItems);
        calculateTotal(updatedItems);
    };

    // Submit order
    const handleSubmitOrder = async () => {
        const orderDetails = selectedItems.map(item => ({
            itemid: item._id,
            itemname: `${item.name}-${item.model}`,
            quantity: item.quantity,
            price: item.price,
        }));


        // console.log(orderDetails);

        const totalPriceBeforeDiscount = totalValue;
        const discountAmount = totalPriceBeforeDiscount * (discountPercentage / 100);
        const totalPriceAfterDiscount = totalPriceBeforeDiscount - discountAmount;
        let ordernum = -1;

        try {
            const response = await axios.get('http://localhost:8080/orders');
            const orders23 = response.data;
            if (orders23.length === 0) {
                ordernum = 1;
            } else {
                const maxOrderId = orders23.reduce((maxId, order) => {
                    return Math.max(maxId, order.orderNum);
                }, 0);
                ordernum = maxOrderId + 1;
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
            return;
        }

        const payload = {
            customerName,
            customerPhone,
            orderType: "retail",
            orderDetails,
            totalPriceBeforeDiscount,
            discountPercentage,
            discountAmount,
            totalPriceAfterDiscount,
            printReceipt,
            ordernum,
        };

        if (order) {
            // Edit existing order (PUT request)
            try {
                await axios.put(`http://localhost:8080/orders/${order.orderNum}`, payload);
                setMessage('Order updated successfully!');
            } catch (error) {
                console.error('Error updating the order:', error);
                setMessage('Error updating the order.');
            }
        }else{
            try {
                const response = await axios.post('http://localhost:8080/place-order', payload);
                setMessage(response.data.message || 'Order placed successfully!');
                setSelectedItems([]);
                setCustomerName('');
                setCustomerPhone('');
                setTotalValue(0);
                setDiscountPercentage(0);
                setDiscountAmount(0);
                setDiscountedTotal(0);
            } catch (error) {
                console.error('Error placing the order:', error);
                setMessage('Error placing the order.');
            }
        }

        
    };

    return (
        <div className="place-order">
            <Navbar />
            <h2>Place Retail Order</h2>

            {/* Search box */}
            <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Search for items..."
                className="search-box"
            />

            {/* Suggestions dropdown */}
            {suggestions.length > 0 && (
            <table className="suggestions-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Model</th>
                        <th>Retail Price (Rs.)</th>
                        <th>Stock</th>
                    </tr>
                </thead>
                <tbody>
                    {suggestions.map(item => (
                        <tr key={item._id} onClick={() => handleItemSelection(item)}>
                            <td>{item.name}</td>
                            <td>{item.model}</td>
                            <td>Rs.{item.retail}</td>
                            <td>{item.stock}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        )}

            {/* Selected items */}
            <h3>Selected Items</h3>
            <div className="cart-container">
                {selectedItems.length > 0 ? (
                    <table className="cart-table">
                        <thead>
                            <tr>
                                <th>Code</th>
                                <th>Name</th>
                                <th>Quantity</th>
                                <th>Price</th>
                                <th>Total</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {selectedItems.map(item => (
                                <tr key={item._id}>
                                    <td>{item.code}</td>
                                    <td>{item.name}</td>
                                    <td>
                                        <input
                                            type="number"
                                            min="1"
                                            value={item.quantity}
                                            onChange={(e) =>
                                                handleInputChange(item._id, 'quantity', parseInt(e.target.value, 10))
                                            }
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="number"
                                            min="0"
                                            value={item.price}
                                            onChange={(e) =>
                                                handleInputChange(item._id, 'price', parseFloat(e.target.value))
                                            }
                                        />
                                    </td>
                                    <td>{(item.quantity * item.price).toFixed(2)}</td>
                                    <td>
                                        <button onClick={() => handleRemoveItem(item._id)}>Remove</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p>No items selected.</p>
                )}
            </div>

            {/* Total and customer info */}
            <div className="total-price-container">
            <div className="total-price">
                <p>Subtotal: Rs.{totalValue.toFixed(2)}</p>
                <input
                    type="number"
                    min="0"
                    placeholder="Discount (%)"
                    value={discountPercentage}
                    onChange={(e) => setDiscountPercentage(parseFloat(e.target.value) || 0)}
                    className='discount-input'
                />
                <p>Discount: Rs.{discountAmount.toFixed(2)}</p>
                <p>Total (after discount): Rs.{discountedTotal.toFixed(2)}</p>
                </div>
            </div>

            <div className="customer-info">
                <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Customer Name"
                />
                <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Customer Phone"
                />
            </div>

            <div className="print-receipt">
                <label>
                    <input
                        type="checkbox"
                        checked={printReceipt}
                        onChange={(e) => setPrintReceipt(e.target.checked)}
                    />
                    Print Receipt
                </label>
            </div>

            <button type="submit" onClick={handleSubmitOrder}>
                Place Order
            </button>

            {message && <p>{message}</p>}
        </div>
    );
};

export default RetailPage;
