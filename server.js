
const express = require("express");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const restaurants = [
  {
    id: 1,
    name: "Pizza Hub",
    cuisine: "Pizza",
    menu: [
      { itemId: 101, name: "Margherita Pizza", price: 200 },
      { itemId: 102, name: "Cheese Pizza", price: 300 }
    ]
  },
  {
    id: 2,
    name: "Burger House",
    cuisine: "Burger",
    menu: [
      { itemId: 201, name: "Veg Burger", price: 120 },
      { itemId: 202, name: "Cheese Burger", price: 180 }
    ]
  }
];

let orders = [];
let nextOrderId = 1;

app.get("/api/restaurants", (req, res) => {
  const search = (req.query.search || "").toLowerCase();

  const result = restaurants.filter(restaurant =>
    restaurant.name.toLowerCase().includes(search) ||
    restaurant.cuisine.toLowerCase().includes(search)
  );

  res.status(200).json(result);
});

app.get("/api/restaurants/:id/menu", (req, res) => {
  const restaurant = restaurants.find(
    r => r.id === Number(req.params.id)
  );

  if (!restaurant) {
    return res.status(404).json({
      message: "Restaurant not found"
    });
  }

  res.status(200).json(restaurant.menu);
});

app.post("/api/orders", (req, res) => {
  const { customerId, restaurantId, items, paymentMethod } = req.body;

  const restaurant = restaurants.find(
    r => r.id === Number(restaurantId)
  );

  if (!restaurant) {
    return res.status(404).json({
      message: "Restaurant not found"
    });
  }

  if (
    !customerId ||
    !Array.isArray(items) ||
    items.length === 0
  ) {
    return res.status(400).json({
      message: "Invalid order details"
    });
  }

  let totalAmount = 0;

  for (const item of items) {
    const food = restaurant.menu.find(
      f => f.itemId === Number(item.itemId)
    );

    if (
      !food ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1
    ) {
      return res.status(400).json({
        message: "Invalid or unavailable food item"
      });
    }

    totalAmount += food.price * item.quantity;
  }

  const order = {
    orderId: nextOrderId++,
    customerId,
    restaurantId: restaurant.id,
    items: items.map(item => ({
      itemId: Number(item.itemId),
      quantity: item.quantity
    })),
    paymentMethod: paymentMethod || "UPI",
    totalAmount,
    status: "PLACED"
  };

  orders.push(order);

  res.status(201).json({
    message: "Order placed successfully",
    ...order
  });
});

app.get("/api/orders/:id/status", (req, res) => {
  const order = orders.find(
    o => o.orderId === Number(req.params.id)
  );

  if (!order) {
    return res.status(404).json({
      message: "Order not found"
    });
  }

  res.status(200).json({
    orderId: order.orderId,
    status: order.status
  });
});

app.post("/api/orders/:id/cancel", (req, res) => {
  const order = orders.find(
    o => o.orderId === Number(req.params.id)
  );

  if (!order) {
    return res.status(404).json({
      message: "Order not found"
    });
  }

  if (order.status !== "PLACED") {
    return res.status(409).json({
      message: "Order cannot be cancelled"
    });
  }

  order.status = "CANCELLED";

  res.status(200).json({
    orderId: order.orderId,
    status: order.status,
    message: "Order cancelled successfully"
  });
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});