const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const cors = require('cors');


const app = express();

app.set('view engine', 'ejs');
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));


mongoose.connect("mongodb://localhost:27017/workdb", { useNewUrlParser: true});


const itemschema = {
  name: String,
  price: Number,
  quantity: Number,
  model: String,
  code: String
};

const Item = mongoose.model("Item", itemschema,"items");


const orderSchema = new mongoose.Schema({
  customerName: String, // Optional customer name
  customerPhone: String, // Optional customer phone
  orderType: String, // 'retail' or 'wholesale'
  orderDetails: [
    {
      itemname: String, // Name of the item
      quantity: Number, // Quantity of the item
      price: Number, // Price per unit
    },
  ],
  totalPriceBeforeDiscount: Number, // Total price before applying the discount
  discountPercentage: Number, // Percentage discount applied
  discountAmount: Number, // Discount amount in currency
  totalPriceAfterDiscount: Number, // Final total after applying the discount
  date: { type: Date, default: Date.now }, // Order creation date
});

const Order = mongoose.model("Order", orderSchema, "orders");


app.post('/login', async (req, res) => {
  const { username, password} = req.body;
  console.log(username, password);
  try {
    if(username === "admin" && password === "admin123$"){
      return res.status(200).json({ message: "Login successful"});
    } else {
      return res.status(401).send({ message: "Invalid credentials" });
    }
  } catch (error) {
    res.status(500).send({ message: "Server error" });
  }
});

app.get('/items', async (req, res) => {
  try {
    const items = await Item.find();
    res.status(200).json(items);
  } catch (error) {
    res.status(500).send({ message: "Server error" });
  }
});


app.get('/items/search', async (req, res) => {
  const searchTerm = req.query.name.toLowerCase();
  try {
      const items = await Item.find({
          name: { $regex: searchTerm, $options: 'i' }  // Case-insensitive search
      });
      res.json(items);
  } catch (error) {
      res.status(500).send({ message: 'Error fetching items' });
  }
});

app.post("/items", async (req, res) => {
  try {
      const { name, price, quantity, model, code } = req.body;

      // Create a new item with only the provided fields
      const newItem = new Item({
          name: name || "N/A",         // Default to "N/A" if name is not provided
          price: price || 0,          // Default to 0 if price is not provided
          quantity: quantity || 0,    // Default to 0 if quantity is not provided
          model: model || "N/A",      // Default to "N/A" if model is not provided
          code: code || "N/A"         // Default to "N/A" if code is not provided
      });

      // Save the item to the database
      await newItem.save();

      res.status(201).json({ message: "Item added successfully", item: newItem });
  } catch (error) {
      console.error("Error adding item:", error);
      res.status(500).json({ error: "Internal server error" });
  }
});



app.post('/place-order', async (req, res) => {
  const {
    customerName,
    customerPhone,
    orderType,
    orderDetails,
    totalPriceBeforeDiscount,
    discountPercentage,
    discountAmount,
    totalPriceAfterDiscount,
  } = req.body;

  // Validate orderDetails
  if (!orderDetails || !Array.isArray(orderDetails) || orderDetails.length === 0) {
    return res.status(400).json({ message: 'Order details are required and must be a non-empty array.' });
  }

  // Ensure all order details are valid
  const isValidDetails = orderDetails.every(
    (item) => item.itemname && item.quantity > 0 && item.price >= 0
  );

  if (!isValidDetails) {
    return res.status(400).json({ message: 'Invalid order details.' });
  }

  try {
    const order = new Order({
      customerName: customerName || '', // Optional for wholesale
      customerPhone: customerPhone || '', // Optional for wholesale
      orderType: orderType || 'retail', // Default to 'retail' if not provided
      orderDetails,
      totalPriceBeforeDiscount: totalPriceBeforeDiscount || 0,
      discountPercentage: discountPercentage || 0,
      discountAmount: discountAmount || 0,
      totalPriceAfterDiscount: totalPriceAfterDiscount || totalPriceBeforeDiscount || 0,
    });

    await order.save();
    res.status(201).json({ message: 'Order placed successfully!' });
  } catch (error) {
    console.error('Error placing order:', error);
    res.status(500).json({ message: 'Server error while placing the order.' });
  }
});

 
app.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find();
    res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Server error while fetching orders.' });
  }
});



app.put('/items/:id', async (req, res) => {
  const { id } = req.params;
  const { name, price, scheme, size } = req.body;
  try {
      await Item.findByIdAndUpdate(id, { name, price, scheme, size });
      res.status(200).send({ message: "Item updated successfully!" });
  } catch (error) {
      console.error("Error updating item:", error);
      res.status(500).send({ message: "Server error while updating the item." });
  }
});




app.listen(8080, function() {
  console.log('Server started on port 8080');
});