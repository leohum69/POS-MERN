import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from './navbar';
import "./items.css";

const ItemsTable = () => {
    const [items, setItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [editItemId, setEditItemId] = useState(null); // Track ID of item being edited
    const [editedValues, setEditedValues] = useState({}); // Store edited values
    const [newItem, setNewItem] = useState({ name: '', code: '', price: '', size: '', scheme: '', model: '' }); // For adding a new item
    const [showAddForm, setShowAddForm] = useState(false); // To toggle add item form

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = () => {
        axios.get('http://localhost:8080/items')
            .then(response => {
                const data = response.data.map(item => ({
                    id: item._id,
                    name: item.name || 'N/A',
                    code: item.code || 'N/A',
                    price: item.price || 'N/A',
                    size: item.size || 'N/A',
                    scheme: item.scheme || 'N/A',
                    model: item.model || 'N/A'
                }));
                setItems(data);
                setFilteredItems(data);
            })
            .catch(error => {
                console.error('Error fetching data:', error);
            });
    };

    const handleSearchChange = (e) => {
        const search = e.target.value.toLowerCase();
        setSearchTerm(search);

        if (search.length > 0) {
            axios.get(`http://localhost:8080/items/search?name=${search}`)
                .then(response => {
                    const data = response.data.map(item => ({
                        id: item._id,
                        name: item.name || 'N/A',
                        code: item.code || 'N/A',
                        price: item.price || 'N/A',
                        size: item.size || 'N/A',
                        scheme: item.scheme || 'N/A',
                        model: item.model || 'N/A'
                    }));
                    setFilteredItems(data);
                })
                .catch(error => console.error('Error fetching filtered items:', error));
        } else {
            setFilteredItems(items);
        }
    };

    const handleEdit = (item) => {
        setEditItemId(item.id);
        setEditedValues({ ...item });
    };

    const handleUpdate = (id) => {
        axios.put(`http://localhost:8080/items/${id}`, editedValues)
            .then(() => {
                fetchItems();
                setEditItemId(null);
                setEditedValues({});
            })
            .catch(error => {
                console.error('Error updating item:', error);
            });
    };

    const handleAddItem = () => {
        axios.post('http://localhost:8080/items', newItem)
            .then(() => {
                fetchItems(); // Refresh items after adding
                setNewItem({ name: '', code: '', price: '', size: '', scheme: '', model: '' }); // Reset form
                setShowAddForm(false); // Hide the add form
            })
            .catch(error => {
                console.error('Error adding item:', error);
            });
    };

    return (
        <div className="items-table">
            <Navbar />

            {/* Search Bar */}
            <div className="search-bar">
                <input
                    type="text"
                    placeholder="Search by name"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="search-box"
                />
            </div>

            {/* Toggle Add Item Form */}
            <div className="add-item-toggle">
                <button onClick={() => setShowAddForm(!showAddForm)}>
                    {showAddForm ? "Cancel" : "Add New Item"}
                </button>
            </div>

            {/* Add Item Form */}
            {showAddForm && (
                <div className="add-item-form">
                    <h3>Add New Item</h3>
                    <input
                        type="text"
                        placeholder="Name"
                        value={newItem.name}
                        onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    />
                    <input
                        type="text"
                        placeholder="Code"
                        value={newItem.code}
                        onChange={(e) => setNewItem({ ...newItem, code: e.target.value })}
                    />
                    <input
                        type="number"
                        placeholder="Price"
                        value={newItem.price}
                        onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                    />
                    <input
                        type="text"
                        placeholder="Size"
                        value={newItem.size}
                        onChange={(e) => setNewItem({ ...newItem, size: e.target.value })}
                    />
                    <input
                        type="text"
                        placeholder="Scheme"
                        value={newItem.scheme}
                        onChange={(e) => setNewItem({ ...newItem, scheme: e.target.value })}
                    />
                    <input
                        type="text"
                        placeholder="Model"
                        value={newItem.model}
                        onChange={(e) => setNewItem({ ...newItem, model: e.target.value })}
                    />
                    <button onClick={handleAddItem}>Add Item</button>
                </div>
            )}

            {/* Table to display items */}
            <table className="items-table-content">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Code</th>
                        <th>Price</th>
                        <th>Size</th>
                        <th>Scheme</th>
                        <th>Model</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredItems.map((item, index) => (
                        <tr key={index}>
                            {editItemId === item.id ? (
                                <>
                                    <td>
                                        <input
                                            type="text"
                                            value={editedValues.name}
                                            onChange={(e) => setEditedValues({ ...editedValues, name: e.target.value })}
                                        />
                                    </td>
                                    <td>{item.code}</td>
                                    <td>
                                        <input
                                            type="number"
                                            value={editedValues.price}
                                            onChange={(e) => setEditedValues({ ...editedValues, price: e.target.value })}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="text"
                                            value={editedValues.size}
                                            onChange={(e) => setEditedValues({ ...editedValues, size: e.target.value })}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="text"
                                            value={editedValues.scheme}
                                            onChange={(e) => setEditedValues({ ...editedValues, scheme: e.target.value })}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="text"
                                            value={editedValues.model}
                                            onChange={(e) => setEditedValues({ ...editedValues, model: e.target.value })}
                                        />
                                    </td>
                                    <td>
                                        <button onClick={() => handleUpdate(item.id)}>Save</button>
                                        <button onClick={() => setEditItemId(null)}>Cancel</button>
                                    </td>
                                </>
                            ) : (
                                <>
                                    <td>{item.name}</td>
                                    <td>{item.code}</td>
                                    <td>{item.price}</td>
                                    <td>{item.size}</td>
                                    <td>{item.scheme}</td>
                                    <td>{item.model}</td>
                                    <td>
                                        <button onClick={() => handleEdit(item)}>Edit</button>
                                    </td>
                                </>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ItemsTable;
