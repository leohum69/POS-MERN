const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const cors = require('cors');
var converter = require('number-to-words');
const fs = require('fs');
const { exec } = require('child_process');


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


const formatReceipt = (order) => {
  const maxItemNameLength = 14; // Adjust to the maximum length you want for item names
  let formattedItems = order.orderDetails
    .map((item) => {
      const itemName = item.itemname.length > maxItemNameLength
        ? item.itemname.slice(0, maxItemNameLength) // Truncate if it's too long
        : item.itemname.padEnd(maxItemNameLength); // Pad with spaces if short

      const quantity = item.quantity.toString().padStart(4); // Right-align quantity
      const price = `Rs.${item.price.toFixed(2)}`.padStart(10); // Right-align price

      return `${itemName} x ${quantity} @ ${price}`;
    })
    .join('\n');

  if(order.customerName == "") {

const receiptContent = 
` G.M.Autos & Haji Wheel Alignment
===================================
            INVOICE
===================================
Inv Num: ${order._id}
Date: ${new Date().toLocaleString()}
Order Type: ${order.orderType}
-----------------------------------
Items:
${formattedItems}
-----------------------------------
Subtotal: Rs.${order.totalPriceBeforeDiscount.toFixed(2)}
Discount: Rs.${order.discountAmount.toFixed(2)}
Total: Rs.${order.totalPriceAfterDiscount.toFixed(2)}
===================================
Rs.${converter.toWords(order.totalPriceAfterDiscount)} Only
===================================
No Return or Exchange with out Invoice
Used item could not be returned or exchange
Electrical Items could not be returned or exchange No return or exchange with out this invoice
Thanks to Visit us, See you again
Thanks for Shoping
`;
    return receiptContent;

  }else {
const receiptContent = 
` G.M.Autos & Haji Wheel Alignment
===================================
            INVOICE
===================================
Inv Num: ${order._id}
Date: ${new Date().toLocaleString()}
Customer Name: ${order.customerName}
Customer Phone: ${order.customerPhone}
Order Type: ${order.orderType}
-----------------------------------
Items:
${formattedItems}
-----------------------------------
Subtotal: Rs.${order.totalPriceBeforeDiscount.toFixed(2)}
Discount: Rs.${order.discountAmount.toFixed(2)}
Total: Rs.${order.totalPriceAfterDiscount.toFixed(2)}
===================================
Rs.${converter.toWords(order.totalPriceAfterDiscount)} Only
===================================
No Return or Exchange with out Invoice
Used item could not be returned or exchange
Electrical Items could not be returned or exchange No return or exchange with out this invoice
Thanks to Visit us, See you again
Thanks for Shoping
`;
    return receiptContent;
  }

};

const saveReceiptToFile = async (order) => {
  try {
    // Generate the receipt content dynamically using the order object and format it
    const receiptContent = formatReceipt(order);

    // Define the file path where the receipt will be saved
    const filePath = './receipt.txt';

    // Save the receipt content to the file
    fs.writeFileSync(filePath, receiptContent, 'utf8');
    console.log(`Receipt saved to ${filePath}`);

    // After saving, print the saved file (just simulate the printing here)
    await printFile(filePath);  // This function prints the saved file

  } catch (error) {
    console.error('Error in saveReceiptToFile function:', error);
  }
};

async function printFile(filePath) {

  const printCommand = `notepad /p ${filePath}`;

  exec(printCommand, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error printing the file: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return;
    }
    console.log(`File printed successfully!`);
  });
}


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
    printReceipt,
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
    if (printReceipt) {
      // Call the new API or receipt logic
      const receiptResponse = await saveReceiptToFile(order);
      if (receiptResponse.error) {
        return res.status(500).json({ message: 'Order placed but failed to print receipt.' });
      }
    }
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