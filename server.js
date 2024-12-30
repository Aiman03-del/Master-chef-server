const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId, ServerApiVersion } = require("mongodb");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://restaurant-management-7b76f.web.app",
      "https://restaurant-management-7b76f.firebaseapp.com",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// MongoDB URI
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.whalj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create MongoClient
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Verify token middleware
const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;

  if (!token) {
    return res.status(401).send({ message: "Unauthorized token" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Unauthorized token" });
    }

    req.user = decoded;
    next();
  });
};

// Connect to MongoDB
async function run() {
  try {
    // await client.connect();
    // await client.db("admin").command({ ping: 1 });
    console.log("Successfully connected to MongoDB!");

    const foodsCollection = client
      .db("restaurant-management")
      .collection("foods");
    const ordersCollection = client
      .db("restaurant-management")
      .collection("orders");

    // Authentication related APIs
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: "1h" });
      res;
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })

        .status(201)
        .send({ success: true });
    });

    app.post("/logout", (req, res) => {
      res
        .clearCookie("token", { httpOnly: true, secure: false })
        .send({ success: true });
    });

    app.get("/all-foods", verifyToken, async (req, res) => {
      try {
        const userEmail = req.user.email; // Check if this is correct
        console.log("Fetching foods for user:", userEmail); // Log the email for debugging

        const foods = await foodsCollection
          .find({ "addedBy.email": userEmail })
          .toArray();
        if (!foods) {
          console.log("No foods found for the user");
          return res.status(404).send({ message: "No foods found" });
        }

        res.status(200).send({ foods });
      } catch (error) {
        console.error("Error fetching food items:", error);
        res.status(500).send({ message: "Failed to fetch food items" });
      }
    });

    app.get("/foods", async (req, res) => {
      const { email, search = "", page = 1, limit = 9 } = req.query;

      const query = {
        ...(search && { name: { $regex: search, $options: "i" } }),
        ...(email && { "addedBy.email": email }),
      };

      const skip = (parseInt(page) - 1) * parseInt(limit);
      try {
        const totalCount = await foodsCollection.countDocuments(query);
        const foods = await foodsCollection
          .find(query)
          .skip(skip)
          .limit(parseInt(limit))
          .toArray();
        res.status(200).send({ foods, totalCount });
      } catch (error) {
        console.error("Error fetching foods:", error);
        res.status(500).send({ message: "Failed to fetch foods" });
      }
    });

    // Add new food item
    app.post("/foods", async (req, res) => {
      const newFood = req.body;

      // Ensure food has an addedBy field
      if (!newFood.addedBy || !newFood.addedBy.email) {
        newFood.addedBy = { name: "Anonymous", email: "N/A" };
      }

      try {
        const result = await foodsCollection.insertOne(newFood);
        res.status(201).send({ message: "Food added successfully", result });
      } catch (error) {
        console.error("Error inserting food:", error);
        res.status(500).send("Failed to add food item.");
      }
    });

    // Get food by ID
    app.get("/foods/:id", async (req, res) => {
      const { id } = req.params;

      try {
        const food = await foodsCollection.findOne(
          { _id: new ObjectId(id) },
          {
            projection: {
              name: 1,
              image: 1,
              description: 1,
              price: 1,
              purchaseCount: { $ifNull: ["$purchaseCount", 0] },
              addedBy: 1,
              quantity: 1,
            },
          }
        );

        if (!food) return res.status(404).send({ message: "Food not found" });

        res.status(200).send(food);
      } catch (error) {
        console.error("Error fetching food by ID:", error);
        res.status(500).send({ message: "Failed to fetch food by ID" });
      }
    });

    app.put("/foods/:id", async (req, res) => {
      const { id } = req.params;
      const updatedFood = req.body;

      if (updatedFood._id) {
        delete updatedFood._id;
      }

      try {
        const result = await foodsCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updatedFood }
        );

        if (result.matchedCount === 0) {
          return res.status(404).send({ message: "Food not found" });
        }

        res.status(200).send({ message: "Food updated successfully" });
      } catch (error) {
        console.error("Error updating food:", error);
        res.status(500).send({ message: "Failed to update food" });
      }
    });

    // Place a new order
    app.post("/orders", verifyToken, async (req, res) => {
      const newOrder = req.body;

      if (!newOrder.foodId || !newOrder.email) {
        return res.status(400).send({ message: "Invalid order data" });
      }

      try {
        const result = await ordersCollection.insertOne(newOrder);

        const updateResult = await foodsCollection.updateOne(
          { _id: new ObjectId(newOrder.foodId) },
          { $inc: { purchaseCount: newOrder.quantity } }
        );

        res.status(201).send({
          success: true,
          message: "Order placed successfully",
          result,
          updateResult,
        });
      } catch (error) {
        console.error("Error placing order:", error);
        res.status(500).send({ message: "Failed to place order" });
      }
    });

    // Get orders
    app.get("/orders", verifyToken, async (req, res) => {
      const { email } = req.query;

      if (req.user.email !== email) {
        return res.status(403).send({ message: "Forbidden access" });
      }

      try {
        const orders = await ordersCollection.find({ email }).toArray();
        res.status(200).send(orders);
      } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).send({ message: "Failed to fetch orders" });
      }
    });

    // Delete an order with verification
    app.delete("/orders/:id", async (req, res) => {
      const { id } = req.params;
      const { email } = req.query;

      try {
        // Find the order by ID
        const order = await ordersCollection.findOne({ _id: new ObjectId(id) });
        if (!order) return res.status(404).send({ message: "Order not found" });

        // Check if the email matches the order's email
        if (order.email !== email) {
          return res
            .status(403)
            .send({ message: "You cannot delete another user's order" });
        }

        // Delete the order
        const result = await ordersCollection.deleteOne({
          _id: new ObjectId(id),
        });
        res.status(200).send({ message: "Order deleted successfully", result });
      } catch (error) {
        console.error("Error deleting order:", error);
        res.status(500).send({ message: "Failed to delete order" });
      }
    });
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}

// Start the server
app.get("/", (req, res) => {
  res.send("Restaurant Management API is running");
});

// Run the connection
run().catch(console.dir);

// Start listening
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
