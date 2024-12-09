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
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        axios.get('http://localhost:8080/items')
            .then(response => {
                setItems(response.data);
                setFilteredItems(response.data);
            })
            .catch(error => console.error('Error fetching data:', error));
    }, []);

    const handleSearchChange = (e) => {
        const search = e.target.value.toLowerCase();
        setSearchTerm(search);

        if (search.length > 0) {
            axios.get(`http://localhost:8080/items/search?name=${search}`)
                .then(response => setFilteredItems(response.data))
                .catch(error => console.error('Error fetching filtered items:', error));
        } else {
            setFilteredItems(items);
        }
    };

    const handleItemSelection = (item) => {
        if (!selectedItems.some(selected => selected.code === item.code)) {
            setSelectedItems(prev => [
                ...prev,
                { ...item, quantity: 1, price: item.price, discount: 0 }
            ]);
        }
        calculateTotal([...selectedItems, { ...item, quantity: 1, price: item.price, discount: 0 }]);
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
        const total = items.reduce((sum, item) => {
            const itemTotal = Math.max(
                item.quantity * item.price - item.discount,
                0
            ); // Ensure total does not go below 0
            return sum + itemTotal;
        }, 0);
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
            discount: item.discount, // Include the discount field
        }));
    
        try {
            const response = await axios.post('http://localhost:8080/place-order', {
                orderDetails,
                customerName: type === 'wholesale' ? customerName : '',
                customerPhone: type === 'wholesale' ? customerPhone : '',
                totalPrice: totalValue,
            });
    
            setMessage(response.data.message || 'Order placed successfully!');
            setSelectedItems([]);
            setCustomerName('');
            setCustomerPhone('');
            setTotalValue(0);
        } catch (error) {
            setMessage('Error placing the order.');
        }
    };
    

    return (
        <div className="place-order">
            <Navbar />
            <h2>Place Your Order</h2>

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
                                <th>Discount</th>
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
                                    <td>
                                        <input
                                            type="number"
                                            min="0"
                                            value={item.discount}
                                            onChange={(e) =>
                                                handleInputChange(item.code, 'discount', parseFloat(e.target.value))
                                            }
                                        />
                                    </td>
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
            <div className="total-price">
                <p>Total: Rs.{totalValue.toFixed(2)}</p>
            </div>

            {/* Type Selection */}
            <select onChange={(e) => setType(e.target.value)} value={type}>
                <option value="retail">Retail</option>
                <option value="wholesale">Wholesale</option>
            </select>

            {/* Wholesale Info */}
            {type === 'wholesale' && (
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
            )}

            <button type="submit" onClick={handleSubmitOrder}>
                Place Order
            </button>

            {message && <p>{message}</p>}
        </div>
    );
};

export default PlaceOrder;
