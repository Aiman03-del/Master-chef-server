# Master Chef API

A robust and secure backend service for managing restaurant operations, built using Node.js, Express, and MongoDB.

## Purpose

This project serves as a backend API for a restaurant management application, enabling functionalities such as user authentication, food item management, and order placement.

## Live URL

[Master Chef API](https://server-sigma-plum.vercel.app/)

## Key Features

- **Authentication**
  - JWT-based user authentication with token stored in HTTP-only cookies.
  - User login and logout functionalities.
- **Food Management**

  - Add new food items with details like name, description, image, price, etc.
  - Fetch all foods added by a user.
  - Search, filter, and paginate food items.
  - Update and delete food items by ID.

- **Order Management**

  - Place orders, incrementing purchase counts in food items.
  - Retrieve user-specific orders.
  - Delete orders with email verification.

- **Middleware**

  - Token verification for protected routes.
  - Role and email-based access control for sensitive operations.

- **Error Handling**
  - Comprehensive error responses for all APIs.
  - Custom messages for different HTTP status codes.

## Technologies and Packages Used

### Backend

- **Node.js**: Runtime environment for JavaScript.
- **Express.js**: Web framework for creating APIs.

### Database

- **MongoDB**: NoSQL database for storing application data.
- **MongoDB Driver**: For connecting and querying MongoDB.

### Authentication

- **jsonwebtoken**: For JWT token generation and verification.

### Middleware

- **cors**: For Cross-Origin Resource Sharing.
- **cookie-parser**: For parsing cookies.
- **dotenv**: For managing environment variables.

### Dev Tools

- **Nodemon**: For hot reloading during development.

### Other Utilities

- **ObjectId (MongoDB)**: For working with unique document IDs.

## How to Run Locally

1. Clone the repository:

   ```bash
   git clone https://github.com/Aiman03-del/Master-chef-server.git
   cd master-chef-api
   ```
