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
async function run() {}

// Start the server
app.get("/", (req, res) => {
  res.send("Restaurant Management API is running");
});

run().catch(console.dir);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
