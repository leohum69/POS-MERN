const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const cors = require('cors');
var converter = require('number-to-words');
const fs = require('fs');
const { exec } = require('child_process');
const Fuse = require('fuse.js');

//  const escpos = require('escpos');
//  const USB = require('escpos-usb');
//  const device = new USB(); // Automatically selects first connected USB printer
//  const printer = new escpos.Printer(device);


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
  size: Number,
  model: String,
  code: String,
  retail: Number,
  stock: Number
};

const Item = mongoose.model("Item", itemschema,"items");


const orderSchema = new mongoose.Schema({
  customerName: String, // Optional customer name
  customerPhone: String, // Optional customer phone
  orderType: String, // 'retail' or 'wholesale'
  orderDetails: [
    {
      itemid : String, // ID of the item
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
  orderNum: Number, // Order number
  opening : Number,
  closing : Number,
});

const Order = mongoose.model("Order", orderSchema, "orders");


const customerSchema = new mongoose.Schema({
  name: { type: String},
  phone: { type: String },
  balance: { type: Number, default: 0 },
});

const Customer = mongoose.model('Customer', customerSchema, "customers");



const printReceipt2 = async (order) => {
  const lineSeparator = '------------------------------------------------';
  const lineSeparator2 = '================================================';

  // Adjust column widths for 80mm thermal printer
  const maxItemNameLength = 28; // Column width for item name
const qtyWidth = 4;           // Column width for quantity
const rateWidth = 5;          // Column width for rate
const amtWidth = 5;           // Column width for amount
const srWidth = 3;   

  const formattedItems = order.orderDetails
  .map((item, index) => {
    const counter = (index + 1).toString().padEnd(srWidth-1, ' ');

    // Split the item name into multiple lines if it exceeds maxItemNameLength
    let itemNameLines = [];
    for (let i = 0; i < item.itemname.length; i += maxItemNameLength) {
      itemNameLines.push(item.itemname.slice(i, i + maxItemNameLength));
    }

    // Right-align quantity, rate, and amount
    const quantity = item.quantity.toString().padStart(qtyWidth, ' ');
    const rate = parseInt(item.price).toString().padStart(rateWidth, ' '); 
    const amount = parseInt(item.quantity * item.price).toString().padStart(amtWidth, ' ');

    // Construct the formatted lines
    return itemNameLines
      .map((line, idx) => {
        if (idx === 0) {
          return `${counter} ${line.padEnd(maxItemNameLength, ' ')}${quantity} ${rate} ${amount}`;
        } else {
          return `   ${line.padEnd(maxItemNameLength, ' ')}    `; // Indented for wrapped lines
        }
      })
      .join('\n');
  })
  .join('\n');


  const lineWidth = 20; // Adjust this based on your printer's maximum line width

  // Function to format and pad text
  function formatAndPadText(order, width) {
      const lines = [
          `Subtotal: Rs.${order.totalPriceBeforeDiscount.toFixed(2)}`,
          `Discount: Rs.${order.discountAmount.toFixed(2)}`,
          `Total:    Rs.${order.totalPriceAfterDiscount.toFixed(2)}`
      ];
  
      // Pad each line to the specified width
      let pewpew = 0;
      return lines.map(line => {
        if(width - line.length < 0){
          pewpew = 0;
        }else{
          pewpew = width - line.length;
        }
          const padding = ' '.repeat(pewpew); // Calculate padding
          return line + padding; // Add padding to the right of the line
      }).join('\n'); // Join all lines with a newline
  }
  
  const formattedText = formatAndPadText(order, lineWidth);
    const name =
`G.M.Autos
Haji Wheel Alignment`;
const address = 
`
Main Taxi Stand Road Malik Raees Market Near CRM School Dhoke kala Khan Shamasabad Rawalpindi

Phone# 0345-5078190`;



const totalLength = 48; // Total length of the formatted string

// First line: Invoice Number and Date
let invoiceNum = `Invoice Num : ${order.orderNum}`;
let date = `Date : ${new Date().toLocaleDateString()}`;

// Split if the total length exceeds the limit
if (invoiceNum.length + date.length > totalLength) {
    invoiceNum = invoiceNum.slice(0, totalLength - date.length); // truncate invoiceNum
}

const spaceBetween1 = totalLength - (invoiceNum.length + date.length);
const padding1 = ' '.repeat(spaceBetween1 > 0 ? spaceBetween1 : 1);
const formattedInvoice = `${invoiceNum}${padding1}${date}`;

// Second line: Customer Name and Time
let customerName = `Customer : ${order.customerName || 'N/A'}`;
const time = `Time : ${new Date().toLocaleTimeString()}`;

// Split if the total length exceeds the limit
if (customerName.length + time.length > totalLength) {
    customerName = customerName.slice(0, totalLength - time.length); // truncate customerName
}

const spaceBetween2 = totalLength - (customerName.length + time.length);
const padding2 = ' '.repeat(spaceBetween2 > 0 ? spaceBetween2 : 1);
const formattedCustomerTime = `${customerName}${padding2}${time}`;

// Combine the lines
const formattedOutput = `${formattedInvoice}\n${formattedCustomerTime}`;



    const dabba = 
`
+----------------------------------------------+
Sr. Item Name                    QTY Rate   AMT 
+----------------------------------------------+`;


  const receiptContent = 
`
No Return or Exchange with out Invoice
Used item could not be returned or exchange
Electrical items could not be returned or
exchange
No return or exchange without this invoice
Thanks to Visit us. See you again

Thanks For Shopping
`;

  device.open((err) => {
    if (err) {
      console.error('Failed to connect to printer:', err);
      return;
    }

    // Print the receipt content using Font A
    printer
      .align('CT')
      .style('b')
      .size(1, 1)
      .text(name)
      .size(0, 0)
      .font('A') // Use Font A for clarity
      .style('normal') // Normal style
      .align('ct') // Left-align to preserve formatting
      .text(address)
      .size(0, 0)
      .font('A') // Use Font A for clarity
      .style('normal') // Normal style
      .align('lt') 
      .text(lineSeparator2)
      .style('b')
      .align('lt')
      .size(0, 0)
      .text(formattedOutput)
      .size(0, 0)
      .font('A') // Use Font A for clarity
      .style('normal') // Normal style
      .align('lt') 
      .text(lineSeparator2)
      .align('lt')
      .style('normal')
      .text(dabba)
      .text(formattedItems)
      .text("+----------------------------------------------+")
      .size(0, 0)
      .font('A') // Use Font A for clarity
      .style('normal') // Normal style
      .align('lt') 
      .text(lineSeparator2)
      .align('rt')
      .style('b')
      .text(formattedText)
      .size(0, 0)
      .font('A') // Use Font A for clarity
      .style('normal') // Normal style
      .align('lt') 
      .text(lineSeparator2)
      .align('ct')
      .text(`Rs.${converter.toWords(order.totalPriceAfterDiscount)} Only`)
      .align('lt')
      .text(lineSeparator2);

      printer
      .align('lt')
      .size(0,0)
      .style('b')
      .text(receiptContent)

      // .feed(2) // Add spacing at the end
      .cut()
      .close();
  });
};






app.post('/login', async (req, res) => {
  const { username, password} = req.body;
  // console.log(username, password);
  try {
    if((username === "aqibgmautos" && password === "gmautos123") || (username === "aligmautos" && password === "gmautos123")) {
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
      const { name, price, size, model, code,retail, stock } = req.body;
      // console.log(req.body);

      // Create a new item with only the provided fields
      const newItem = new Item({
          name: name || "N/A",         // Default to "N/A" if name is not provided
          price: price || 0,          // Default to 0 if price is not provided
          size: size || 0,    // Default to 0 if quantity is not provided
          model: model || "N/A",      // Default to "N/A" if model is not provided
          code: code || "N/A",         // Default to "N/A" if code is not provided
          retail: retail || 0,
          stock: stock || 0
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
    ordernum,
    opening,
    closing
  } = req.body;

  // Validate orderDetails
  if (!orderDetails || !Array.isArray(orderDetails) || orderDetails.length === 0) {
    return res.status(400).json({ message: 'Order details are required and must be a non-empty array.' });
  }

  // Ensure all order details are valid
  const isValidDetails = orderDetails.every(
    (item) => item.itemid && item.quantity > 0 && item.price >= 0
  );

  if (!isValidDetails) {
    return res.status(400).json({ message: 'Invalid order details.' });
  }

  try {
    // Deduct stock for each item in the order
    for (let item of orderDetails) {
      const product = await Item.findById(item.itemid); // Fetch item by ObjectId

      if (!product) {
        return res.status(400).json({ message: `Product with ID ${item.itemid} not found.` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${product.name}-${product.model}.` });
      }

      // Update the stock
      product.stock -= item.quantity;
      await product.save();
    }

    // Create the order
    const order = new Order({
      customerName: customerName || '', // Optional for wholesale
      customerPhone: customerPhone || '', // Optional for wholesale
      orderType: orderType || 'retail', // Default to 'retail' if not provided
      orderDetails,
      totalPriceBeforeDiscount: totalPriceBeforeDiscount || 0,
      discountPercentage: discountPercentage || 0,
      discountAmount: discountAmount || 0,
      totalPriceAfterDiscount: totalPriceAfterDiscount || totalPriceBeforeDiscount || 0,
      orderNum: ordernum,
      opening: opening,
      closing: closing
    });

    await order.save();

    // Optionally print receipt if required
    if (printReceipt) {
      // Call the new API or receipt logic
       //const receiptResponse = await printReceipt2(order);
    }

    res.status(201).json({ message: 'Order placed successfully!' });
  } catch (error) {
    console.error('Error placing order:', error);
    res.status(500).json({ message: 'Server error while placing the order.' });
  }
});

app.put('/orders/:orderNum', async (req, res) => {
  const { orderNum } = req.params; // Extract order number from the URL
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
    opening,
    closing
  } = req.body;

  // Validate orderDetails
  if (!orderDetails || !Array.isArray(orderDetails) || orderDetails.length === 0) {
    return res.status(400).json({ message: 'Order details are required and must be a non-empty array.' });
  }

  // Ensure all order details are valid
  const isValidDetails = orderDetails.every(
    (item) => item.itemid && item.quantity > 0 && item.price >= 0
  );

  if (!isValidDetails) {
    return res.status(400).json({ message: 'Invalid order details.' });
  }

  try {
    // Find the order by orderNum
    const existingOrder = await Order.findOne({ orderNum });

    if (!existingOrder) {
      return res.status(404).json({ message: `Order with orderNum ${orderNum} not found.` });
    }

    // Iterate over the orderDetails to compare quantities and validate stock
    for (let newItem of orderDetails) {
      const existingItem = existingOrder.orderDetails.find(item => item.itemid === newItem.itemid);
      
      if (existingItem) {
        // Check if the quantity has changed
        const quantityChanged = existingItem.quantity !== newItem.quantity;

        if (quantityChanged) {
          const product = await Item.findById(newItem.itemid); // Fetch item by ObjectId

          if (!product) {
            return res.status(400).json({ message: `Product with ID ${newItem.itemid} not found.` });
          }

          // Check if sufficient stock is available
          if (product.stock < newItem.quantity) {
            return res.status(400).json({ message: `Insufficient stock for ${product.name}-${product.model}.` });
          }

          // Update the stock if valid
          product.stock -= (newItem.quantity - existingItem.quantity); // Adjust stock based on the difference in quantities
          await product.save();
        }
      }
    }

    // Update the order details in the database
    existingOrder.customerName = customerName || existingOrder.customerName;
    existingOrder.customerPhone = customerPhone || existingOrder.customerPhone;
    existingOrder.orderType = orderType || existingOrder.orderType;
    existingOrder.orderDetails = orderDetails;
    existingOrder.totalPriceBeforeDiscount = totalPriceBeforeDiscount || existingOrder.totalPriceBeforeDiscount;
    existingOrder.discountPercentage = discountPercentage || existingOrder.discountPercentage;
    existingOrder.discountAmount = discountAmount || existingOrder.discountAmount;
    existingOrder.totalPriceAfterDiscount = totalPriceAfterDiscount || existingOrder.totalPriceAfterDiscount;
    existingOrder.opening = opening;
    existingOrder.closing = closing;

    // console.log(existingOrder);

    // Save the updated order
    await existingOrder.save();

    // Optionally print receipt if required
    if (printReceipt) {
      // Call the print receipt logic
      //const receiptResponse = await printReceipt2(existingOrder);
    }

    res.status(200).json({ message: 'Order updated successfully!' });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ message: 'Server error while updating the order.' });
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

app.delete('/orders/:orderNum', async (req, res) => {
  try {
    const { orderNum } = req.params;

    // Find and delete the order
    const deletedOrder = await Order.findOneAndDelete({ orderNum: orderNum });

    if (!deletedOrder) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    res.status(200).json({ message: 'Order deleted successfully.', deletedOrder });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ message: 'Server error while deleting order.' });
  }
});

app.post('/print/orders/:orderNum', async (req, res) => {
  try {
    const { orderNum } = req.params;

    // Find the order in the database
    const order = await Order.findOne({ orderNum: orderNum });

    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    // Call the function to print the order
    //await printReceipt2(order);

    res.status(200).json({ message: 'Order printed successfully.' });
  } catch (error) {
    console.error('Error printing order:', error);
    res.status(500).json({ message: 'Server error while printing order.' });
  }
});

app.put('/items/:id', async (req, res) => {
  const { id } = req.params; // Extract item ID from the URL
  const {
    name = "N/A",
    price = 0,
    size = 0,
    model = "N/A",
    code = "N/A",
    retail = 0,
    stock = 0
  } = req.body; // Extract and assign default values to the fields

  try {
    // Find the item by ID and update only the provided fields
    const updatedItem = await Item.findByIdAndUpdate(
      id,
      { name, price, size, model, code, retail, stock },
      { new: true, runValidators: true }
    );

    // If the item does not exist, return an error
    if (!updatedItem) {
      return res.status(404).send({ message: "Item not found!" });
    }

    // Send the updated item in the response
    res.status(200).send({ message: "Item updated successfully!", item: updatedItem });
  } catch (error) {
    // Handle errors during the update process
    console.error("Error updating item:", error);
    res.status(500).send({ message: "Server error while updating the item." });
  }
});


app.delete('/items/:id', async (req, res) => {
  const { id } = req.params; // Extract item ID from the URL
  try {
    // Find and delete the item by its ID
    const deletedItem = await Item.findByIdAndDelete(id);
    
    // If no item was found, return an error
    if (!deletedItem) {
      return res.status(404).send({ message: "Item not found!" });
    }

    // Send success response after deleting the item
    res.status(200).send({ message: "Item deleted successfully!" });
  } catch (error) {
    // Handle errors during the delete process
    console.error("Error deleting item:", error);
    res.status(500).send({ message: "Server error while deleting the item." });
  }
});

// app.get('/items/search', (req, res) => {
//   const { name } = req.query;
//   if (!name) {
//       return res.status(400).json({ error: 'Search term is required' });
//   }

//   // Perform case-insensitive search (modify for database usage)
//   const regex = new RegExp(name, 'i');
//   const filteredItems = items.filter(item => regex.test(item.name));

//   res.json(filteredItems);
// });
app.get('/items/search', (req, res) => {
  const { name } = req.query;
  if (!name) {
      return res.status(400).json({ error: 'Search term is required' });
  }

  // Fuse.js options for fuzzy searching
  const fuseOptions = {
      keys: ['name'], // Search within the 'name' field
      threshold: 0.3, // Adjust similarity threshold (lower means stricter matching)
      includeScore: true // Includes match score in the response
  };

  const fuse = new Fuse(items, fuseOptions);
  const result = fuse.search(name);

  // Extract matched items from Fuse.js result
  const filteredItems = result.map(item => item.item);

  res.json(filteredItems);
});



app.post('/customers', async (req, res) => {
  try {
    const { name, phone, balance } = req.body;
    const customer = new Customer({ name, phone, balance });
    await customer.save();
    res.status(201).json(customer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get('/customers', async (req, res) => {
  try {
    const customers = await Customer.find();
    res.status(200).json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/customers/:id', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    res.status(200).json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/customers/:id', async (req, res) => {
  try {
    const { name, phone, balance } = req.body;
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { name, phone, balance },
      { new: true }
    );
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    res.status(200).json(customer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.delete('/customers/:id', async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    res.status(200).json({ message: 'Customer deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});





app.listen(8080, function() {
  console.log('Server started on port 8080');
});