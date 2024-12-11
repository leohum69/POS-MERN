import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from './navbar';
import './placeholder.css';
const PlaceOrder = () => {
    const [items, setItems] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredItems, setFilteredItems] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]);
    const [type, setType] = useState('retail');
    const [totalValue, setTotalValue] = useState(0);
    const [discountPercentage, setDiscountPercentage] = useState(0);
    const [discountAmount, setDiscountAmount] = useState(0);
    const [discountedTotal, setDiscountedTotal] = useState(0);
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        axios.get('http://localhost:8080/items')
            .then(response => {
                const updatedItems = response.data.map(item => ({
                    ...item,
                    price: item.price ?? 0
                }));
                setItems(updatedItems);
                adjustPricesForType(type, updatedItems);
            })
            .catch(error => console.error('Error fetching data:', error));
    }, []);

    const adjustPricesForType = (orderType, itemsList) => {
        const updatedPrices = itemsList.map(item => ({
            ...item,
            price: orderType === 'retail' ? (item.price * 1.1).toFixed(2) : item.price
        }));
        setFilteredItems(updatedPrices);

        // Update selectedItems to reflect the new prices
        const updatedSelectedItems = selectedItems.map(selectedItem => {
            const correspondingItem = updatedPrices.find(item => item.code === selectedItem.code);
            return correspondingItem
                ? { ...selectedItem, price: correspondingItem.price }
                : selectedItem;
        });
        setSelectedItems(updatedSelectedItems);
        calculateTotal(updatedSelectedItems);
    };

    const handleTypeChange = (e) => {
        const newType = e.target.value;
        setType(newType);
        adjustPricesForType(newType, items);
    };

    const handleSearchChange = (e) => {
        const search = e.target.value.toLowerCase();
        setSearchTerm(search);

        if (search.length > 0) {
            axios.get(`http://localhost:8080/items/search?name=${search}`)
                .then(response => {
                    const updatedItems = response.data.map(item => ({
                        ...item,
                        price: item.price ?? 0
                    }));
                    adjustPricesForType(type, updatedItems);
                })
                .catch(error => console.error('Error fetching filtered items:', error));
        } else {
            adjustPricesForType(type, items);
        }
    };

    const handleItemSelection = (item) => {
        if (!selectedItems.some(selected => selected.code === item.code)) {
            const updatedItems = [
                ...selectedItems,
                { ...item, quantity: 1, price: item.price }
            ];
            setSelectedItems(updatedItems);
            calculateTotal(updatedItems);
        }
    };

    const handleInputChange = (itemCode, field, value) => {
        const updatedItems = selectedItems.map(item => {
            if (item.code === itemCode) {
                return { ...item, [field]: value };
            }
            return item;
        });
        setSelectedItems(updatedItems);
        calculateTotal(updatedItems);
    };

    const calculateTotal = (items) => {
        const total = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
        setTotalValue(total);
    };

    const handleRemoveItem = (itemCode) => {
        const updatedItems = selectedItems.filter(item => item.code !== itemCode);
        setSelectedItems(updatedItems);
        calculateTotal(updatedItems);
    };

    const handleSubmitOrder = async () => {
        const orderDetails = selectedItems.map(item => ({
            itemname: item.name,
            quantity: item.quantity,
            price: item.price,
        }));

        const totalPriceBeforeDiscount = totalValue;
        const discountAmount = totalPriceBeforeDiscount * (discountPercentage / 100);
        const totalPriceAfterDiscount = totalPriceBeforeDiscount - discountAmount;

        const payload = {
            customerName: customerName,
            customerPhone: customerPhone,
            orderType: type,
            orderDetails,
            totalPriceBeforeDiscount,
            discountPercentage,
            discountAmount,
            totalPriceAfterDiscount,
        };

        try {
            const response = await axios.post('http://localhost:8080/place-order', payload);
            setMessage(response.data.message || 'Order placed successfully!');
            // Reset fields
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
    };

    const handleDiscountChange = (e) => {
        const value = parseFloat(e.target.value) || 0;
        setDiscountPercentage(value);
    };

    // Recalculate discount and total whenever totalValue or discountPercentage changes
    useEffect(() => {
        const discount = (discountPercentage / 100) * totalValue;
        const finalTotal = totalValue - discount;
        setDiscountAmount(discount);
        setDiscountedTotal(finalTotal);
    }, [totalValue, discountPercentage]);


    return (
        <div className="place-order">
            <Navbar />
            <h2>Place Your Order</h2>

            {/* Type Selection */}
            <select onChange={handleTypeChange} value={type}>
                <option value="retail">Retail</option>
                <option value="wholesale">Wholesale</option>
            </select>

            {/* Search Box */}
            <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Search items..."
                className="search-box"
            />

            {/* Items Table */}
            <div className="items-table-container">
                <table className="items-table">
                    <thead>
                        <tr>
                            <th>Code</th>
                            <th>Name</th>
                            <th>Price</th>
                            <th>Size</th>
                            <th>Scheme</th>
                            <th>Model</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredItems.map(item => (
                            <tr key={item.code}>
                                <td>{item.code}</td>
                                <td>{item.name}</td>
                                <td>{item.price}</td>
                                <td>{item.size}</td>
                                <td>{item.scheme}</td>
                                <td>{item.model}</td>
                                <td>
                                    <button onClick={() => handleItemSelection(item)}>Add to Cart</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Cart Section */}
            <h3>Cart</h3>
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
                                <tr key={item.code}>
                                    <td>{item.code}</td>
                                    <td>{item.name}</td>
                                    <td>
                                        <input
                                            type="number"
                                            min="1"
                                            value={item.quantity}
                                            onChange={(e) =>
                                                handleInputChange(item.code, 'quantity', parseInt(e.target.value, 10))
                                            }
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="number"
                                            min="0"
                                            value={item.price}
                                            onChange={(e) =>
                                                handleInputChange(item.code, 'price', parseFloat(e.target.value))
                                            }
                                        />
                                    </td>
                                    <td>{(item.quantity * item.price).toFixed(2)}</td>
                                    <td>
                                        <button onClick={() => handleRemoveItem(item.code)}>Remove</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p>No items in the cart.</p>
                )}
            </div>

            {/* Total */}
            <div className="total-price-container">
                <div className="total-price">
                    <p>Subtotal: Rs.{totalValue.toFixed(2)}</p>
                    <input
                        type="number"
                        min="0"
                        placeholder="Discount (%)"
                        value={discountPercentage}
                        onChange={handleDiscountChange}
                        className="discount-input"
                    />
                    <p>Discount: Rs.{discountAmount.toFixed(2)}</p>
                    <p>Total (after discount): Rs.{discountedTotal.toFixed(2)}</p>
                </div>
            </div>

            {/* Wholesale Info */}
            {
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
            }

            <button type="submit" onClick={handleSubmitOrder}>
                Place Order
            </button>

            {message && <p>{message}</p>}
        </div>
    );
};

export default PlaceOrder;
