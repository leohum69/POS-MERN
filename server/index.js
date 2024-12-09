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

const orderSchema = {
  customerName: String,
  customerPhone: String,
  type: String,
  totalPrice: Number,
  orderDetails: [
    {
      itemname: String,
      quantity: Number,
      price: Number,
      discount: Number, // Add the discount field
    }
  ],
  date: { type: Date, default: Date.now },
};

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


app.post('/place-order', async (req, res) => {
  const { orderDetails, customerName, customerPhone, totalPrice } = req.body;

  // Validate incoming data
  if (!orderDetails || orderDetails.length === 0) {
    return res.status(400).send({ message: "Order details cannot be empty." });
  }

  try {
    // Validate each orderDetail entry
    const isValid = orderDetails.every(item => 
      item.quantity > 0 && item.price >= 0 && item.discount >= 0
    );

    if (!isValid) {
      return res.status(400).send({ message: "Invalid order details." });
    }

    const order = new Order({
      customerName: customerName || "",
      customerPhone: customerPhone || "",
      type: customerName ? "wholesale" : "retail",
      totalPrice,
      orderDetails,
    });

    await order.save();
    res.status(201).send({ message: "Order placed successfully!" });
  } catch (error) {
    console.error("Error placing order:", error);
    res.status(500).send({ message: "Server error while placing the order." });
  }
});


 
app.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find();
    res.status(200).json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).send({ message: "Server error while fetching orders." });
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