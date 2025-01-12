import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Customers.css";
import Navbar from "./navbar";

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    initialBalance: "",
  });
  const [editCustomerId, setEditCustomerId] = useState(null);
  const [editedValues, setEditedValues] = useState({});
  const [customerOrders, setCustomerOrders] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [customer,setCustomer ] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false); // State to toggle form visibility

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = () => {
    axios
      .get("http://localhost:8080/customers")
      .then((response) => {
        const data = response.data.map((customer) => ({
          id: customer._id,
          name: customer.name,
          phone: customer.phone,
          balance: customer.balance,
        }));
        setCustomers(data);
        setFilteredCustomers(data);
      })
      .catch((error) => {
        console.error("Error fetching customers:", error);
      });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleViewOrders = (customer) => {
    axios
      .get("http://localhost:8080/orders")
      .then((response) => {
        const allOrders = response.data;
        const wholesaleOrders = allOrders.filter(
          (order) =>
            order.customerPhone === customer.phone && order.orderType === "wholesale"
        );
        setCustomerOrders(wholesaleOrders);
        setSelectedCustomer(customer);
        setShowOrdersModal(true);
      })
      .catch((error) => {
        console.error("Error fetching orders:", error);
      });
  };
  const closeOrdersModal = () => {
    setShowOrdersModal(false);
    setSelectedCustomer(null);
    setCustomerOrders([]);
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.initialBalance) {
      alert("Please fill all fields!");
      return;
    }

    try {
      const response = await axios.post("http://localhost:8080/customers", {
        name: formData.name,
        phone: formData.phone,
        balance: parseFloat(formData.initialBalance),
      });
      setCustomer(response.data);
      alert("Customer added successfully!");
      setFormData({
        name: "",
        phone: "",
        shop: "",
        initialBalance: "",
      });
      fetchCustomers();
    } catch (error) {
      alert("Error adding customer: " + error.response?.data?.message || error.message);
    }
  };

  const handleSearchChange = (e) => {
    const search = e.target.value.toLowerCase();
    setSearchTerm(search);

    if (search.length > 0) {
      const filtered = customers.filter((customer) =>
        customer.name.toLowerCase().includes(search)
      );
      setFilteredCustomers(filtered);
    } else {
      setFilteredCustomers(customers);
    }
  };

  const handleEdit = (customer) => {
    setEditCustomerId(customer.id);
    setEditedValues({ ...customer });
  };

  const handleUpdate = (id) => {
    axios
      .put(`http://localhost:8080/customers/${id}`, editedValues)
      .then(() => {
        fetchCustomers();
        setEditCustomerId(null);
        setEditedValues({});
      })
      .catch((error) => {
        console.error("Error updating customer:", error);
      });
  };

  const handleDelete = (id) => {
    axios
      .delete(`http://localhost:8080/customers/${id}`)
      .then(() => {
        fetchCustomers();
      })
      .catch((error) => {
        console.error("Error deleting customer:", error);
      });
  };

  // Toggle visibility of Add Customer form
  const toggleAddForm = () => {
    setShowAddForm((prevState) => !prevState);
  };

  return (
    <div className="add-customer-container">
      <Navbar />

      {/* Button to toggle form visibility */}
      <div id="add-customer-btn">
      <button onClick={toggleAddForm} className="toggle-btn">
        {showAddForm ? "Cancel" : "Add Customer"}
      </button>
      </div>
      {/* Conditional rendering of Add Customer form */}
      {showAddForm && (
        <div className="add-customer-form">
          <h1>Add Customer</h1>
          <form onSubmit={handleAddCustomer}>
            <div className="form-group">
              <label>Name:</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter customer name"
                required
              />
            </div>
            <div className="form-group">
              <label>Phone:</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Enter phone number"
                required
              />
            </div>
            <div className="form-group">
              <label>Initial Balance:</label>
              <input
                type="number"
                name="initialBalance"
                value={formData.initialBalance}
                onChange={handleInputChange}
                placeholder="Enter initial balance"
                required
              />
            </div>
            <button type="submit" className="btn-submit">
              Add Customer
            </button>
          </form>
        </div>
      )}

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

      {/* Customers Table */}
      <table className="customers-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Phone</th>
            <th>Balance</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredCustomers.map((customer, index) => (
            <tr key={index}>
              {editCustomerId === customer.id ? (
                <>
                  <td>
                    <input
                      type="text"
                      value={editedValues.name}
                      onChange={(e) =>
                        setEditedValues({ ...editedValues, name: e.target.value })
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={editedValues.phone}
                      onChange={(e) =>
                        setEditedValues({ ...editedValues, phone: e.target.value })
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={editedValues.balance}
                      onChange={(e) =>
                        setEditedValues({ ...editedValues, balance: e.target.value })
                      }
                    />
                  </td>
                  <td>
                    <button className="save-btn" onClick={() => handleUpdate(customer.id)}>
                      Save
                    </button>
                    <button className="cancel-btn" onClick={() => setEditCustomerId(null)}>
                      Cancel
                    </button>
                    
                  </td>
                </>
              ) : (
                <>
                  <td>{customer.name}</td>
                  <td>{customer.phone}</td>
                  <td>{customer.balance}</td>
                  <td>
                    <button className="edit-btn" onClick={() => handleEdit(customer)}>
                      Edit
                    </button>
                    <button className="delete" onClick={() => handleDelete(customer.id)}>
                      Delete
                    </button>
                    <button className="view-orders-btn" onClick={() => handleViewOrders(customer)}>
                  View Orders
                </button>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {showOrdersModal && (
        <div className="orders-modal">
          <div className="modal-content">
            <h2>Wholesale Orders for {selectedCustomer.name}</h2>
            <button className="close-modal" onClick={closeOrdersModal}>
              Close
            </button>
            {customerOrders.length > 0 ? (
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Date</th>
                    <th>Total Before Discount</th>
                    <th>Discount %</th>
                    <th>Final Total</th>
                    <th>Opening</th>
                    <th>Closing</th>
                  </tr>
                </thead>
                <tbody>
                  {customerOrders.map((order, index) => (
                    <tr key={index}>
                      <td>{order.orderNum}</td>
                      <td>{new Date(order.date).toLocaleDateString()}</td>
                      <td>{order.totalPriceBeforeDiscount.toFixed(2)}</td>
                      <td>{order.discountPercentage}%</td>
                      <td>{order.totalPriceAfterDiscount.toFixed(2)}</td>
                      <td>{order.opening || 0}</td>
                      <td>{order.closing || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No wholesale orders found for this customer.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
