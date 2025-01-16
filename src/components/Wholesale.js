import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from './navbar';
import './retail.css';
// import { set } from 'mongoose';

const Wholesale = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]);
    const [totalValue, setTotalValue] = useState(0);
    const [discountPercentage, setDiscountPercentage] = useState(0);
    const [discountAmount, setDiscountAmount] = useState(0);
    const [discountedTotal, setDiscountedTotal] = useState(0);
    const [customerId, setCustomerId] = useState(''); 
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerBalance, setCustomerBalance] = useState('');
    const [message, setMessage] = useState('');
    const [printReceipt, setPrintReceipt] = useState(false);
    const [customers, setCustomers] = useState([]);
    const [payed, setPayed] = useState(0);
    // const [remainingBalance, setRemainingBalance] = useState(0);

    // Search for items and fetch suggestions

    useEffect(() => {
        axios.get('http://localhost:8080/customers') 
            .then(response => setCustomers(response.data))
            .catch(error => console.error('Error fetching customers:', error));
    }, []);

    
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
                { ...item, quantity: 1, price: item.price ?? 0 }
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
    const calculateTotal = (items) => {
        const total = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
        setTotalValue(total);
    };
    const handlePayedAmount = (value) => {
        const payedValue = parseFloat(value) || 0;
        setPayed(payedValue);
        // setRemainingBalance(discountedTotal - payedValue);
    };

    useEffect(() => {
        const discount = (discountPercentage / 100) * totalValue;
        const finalTotal = totalValue - discount;
        setDiscountAmount(discount);
        setDiscountedTotal(finalTotal);
        // setRemainingBalance(finalTotal - payed);

    }, [totalValue, discountPercentage,customerBalance,payed]);

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

        const totalPriceBeforeDiscount = totalValue;
        const discountAmount = totalPriceBeforeDiscount * (discountPercentage / 100);
        const totalPriceAfterDiscount = totalPriceBeforeDiscount - discountAmount;
        const remainingBalance = totalPriceAfterDiscount + customerBalance - payed;
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
            orderType: "wholesale",
            orderDetails,
            totalPriceBeforeDiscount,
            discountPercentage,
            discountAmount,
            totalPriceAfterDiscount,
            printReceipt,
            ordernum,
            opening: payed,
            closing: remainingBalance,
        };

        try {
            const response = await axios.post('http://localhost:8080/place-order', payload);

            const customerUpdatePayload = { balance: remainingBalance };
            await axios.put(`http://localhost:8080/customers/${customerId}`, customerUpdatePayload);

            setMessage(response.data.message || 'Order placed successfully!');
            setSelectedItems([]);
            setCustomerName('');
            setCustomerPhone('');
            setTotalValue(0);
            setDiscountPercentage(0);
            setDiscountAmount(0);
            setDiscountedTotal(0);
            setPayed(0);
            setCustomerId('');
            setCustomerBalance('');
            setCustomerName('');

            axios.get('http://localhost:8080/customers') 
            .then(response => setCustomers(response.data))
            .catch(error => console.error('Error fetching customers:', error));

        } catch (error) {
            console.error('Error placing the order:', error);
            setMessage('Error placing the order.');
        }
    };

    return (
        <div className="place-order">
            <Navbar />
            <h2>Place Wholesale Order</h2>

            {/* Search box */}
                        <div className="customer-select">
                <label>Customer:</label>
                <select value={customerId}
                 onChange={(e) => {
                    const selectedCustomer = customers.find(customer => customer._id === e.target.value);
                    setCustomerId(selectedCustomer?._id || '');
                    setCustomerName(selectedCustomer?.name || '');
                    setCustomerPhone(selectedCustomer?.phone || '');
                    setCustomerBalance(selectedCustomer?.balance || '');
                }}>
                    <option value="">Select Customer</option>
                    {customers.map(customer => (
                        <option key={customer._id} value={customer._id}>
                            {customer.name} - {customer.balance}
                        </option>
                    ))}
                </select>
            </div>
            <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Search for items..."
                className="search-box"
            />

            {/* Suggestions dropdown */}
            {suggestions.length > 0 && (
                <ul className="suggestions-list">
                    {suggestions.map(item => (
                        <li key={item._id} onClick={() => handleItemSelection(item)}>
                            {item.name} - {item.model} - Rs.{item.price}
                        </li>
                    ))}
                </ul>
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
                <p>Total with Previous Balance included : Rs.{discountedTotal+customerBalance}</p>
                <label>
                    Amount To Pay : 
                <input
                    type="number"
                    min="0"
                    placeholder="Enter Payment Amount"
                    value={payed}
                    onChange={(e) => handlePayedAmount(e.target.value)}
                    className='discount-input'
                />
                </label>
                </div>
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

export default Wholesale;
