import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from './navbar';
import "./items.css";

const ItemsTable = () => {
    const [items, setItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [editItem, setEditItem] = useState(null); // To track the item being edited
    const [editedValues, setEditedValues] = useState({}); // To track edited values

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
                    scheme: item.scheme || 'N/A'
                }));
                setItems(data);
                setFilteredItems(data); // Initially set filteredItems to all items
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
                .then(response => setFilteredItems(response.data))
                .catch(error => console.error('Error fetching filtered items:', error));
        } else {
            setFilteredItems(items); // Reset to all items when search is cleared
        }
    };

    const handleEdit = (item) => {
        setEditItem(item.id);
        setEditedValues({ ...item });
    };

    const handleUpdate = (id) => {
        axios.put(`http://localhost:8080/items/${id}`, editedValues)
            .then(() => {
                fetchItems(); // Refresh items after update
                setEditItem(null);
                setEditedValues({});
            })
            .catch(error => {
                console.error('Error updating item:', error);
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

            {/* Table to display items */}
            <table className="items-table-content">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Code</th>
                        <th>Price</th>
                        <th>Size</th>
                        <th>Scheme</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredItems.map((item, index) => (
                        <tr key={index}>
                            {editItem === item.id ? (
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
                                        <button onClick={() => handleUpdate(item.id)}>Save</button>
                                        <button onClick={() => setEditItem(null)}>Cancel</button>
                                    </td>
                                </>
                            ) : (
                                <>
                                    <td>{item.name}</td>
                                    <td>{item.code}</td>
                                    <td>{item.price}</td>
                                    <td>{item.size}</td>
                                    <td>{item.scheme}</td>
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
