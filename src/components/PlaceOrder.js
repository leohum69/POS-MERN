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
    const [printReceipt, setPrintReceipt] = useState(false);

    useEffect(() => {
        axios.get('http://192.168.10.76:8080/items')
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
            price: orderType === 'retail' ? item.retail : item.price
        }));
        setFilteredItems(updatedPrices);

        const updatedSelectedItems = selectedItems.map(selectedItem => {
            const correspondingItem = updatedPrices.find(item => item._id === selectedItem._id);
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
            axios.get(`http://192.168.10.76:8080/items/search?name=${search}`)
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
        if (!selectedItems.some(selected => selected._id === item._id)) {
            const updatedItems = [
                ...selectedItems,
                { ...item, quantity: 1, price: item.price }
            ];
            setSelectedItems(updatedItems);
            calculateTotal(updatedItems);
        }
    };

    const handleInputChange = (itemId, field, value) => {
        const newValue = isNaN(value) ? 0 : value;

        const updatedItems = selectedItems.map(item => {
            if (item._id === itemId) {
                if (field === 'quantity' && newValue > item.stock) {
                    alert('Quantity cannot be greater than stock');
                    return { ...item, quantity: item.stock }; // Set quantity to stock if it exceeds stock
                }
                return { ...item, [field]: newValue };
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

    const handleRemoveItem = (itemId) => {
        const updatedItems = selectedItems.filter(item => item._id !== itemId);
        setSelectedItems(updatedItems);
        calculateTotal(updatedItems);
    };

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
        let ordernum = -1;

        try {
            const response = await axios.get('http://192.168.10.76:8080/orders');
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
            orderType: type,
            orderDetails,
            totalPriceBeforeDiscount,
            discountPercentage,
            discountAmount,
            totalPriceAfterDiscount,
            printReceipt,
            ordernum,
        };

        try {
            const response = await axios.post('http://192.168.10.76:8080/place-order', payload);
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
    };

    const handleDiscountChange = (e) => {
        const value = parseFloat(e.target.value) || 0;
        setDiscountPercentage(value);
    };

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

            <select onChange={handleTypeChange} value={type}>
                <option value="retail">Retail</option>
                <option value="wholesale">Wholesale</option>
            </select>

            <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Search items..."
                className="search-box"
            />

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
                            <th>Stock</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredItems.map((item, index) => (
                            <tr key={index}>
                                <td>{item.code}</td>
                                <td>{item.name}</td>
                                <td>{item.price}</td>
                                <td>{item.size}</td>
                                <td>{item.scheme}</td>
                                <td>{item.model}</td>
                                <td>{item.stock}</td>
                                <td>
                                    <button className="add-to-cart" onClick={() => handleItemSelection(item)}>Add to Cart</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <h3>Cart</h3>
            <div className="cart-container">
                {selectedItems.length > 0 ? (
                    <table className="cart-table">
                        <thead>
                            <tr>
                                <th>code</th>
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
                    <p>No items in the cart.</p>
                )}
            </div>

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

export default PlaceOrder;
