# 🛍️ POS System - Point of Sale Management

A modern, full-stack Point of Sale system built with **React** and **Express.js**, designed for small to medium-sized businesses to manage sales, inventory, customers, and debt tracking efficiently.

---

## ✨ Features

### 📊 Dashboard
- **Real-time Analytics** 📈 - View total sales, transactions, and pending debts
- **PDF Reports** 📄 - Generate comprehensive reports by Week, Month, or Year
- **Transaction Overview** - All transaction history at a glance
- **Pending Debts Widget** - Track customers with outstanding debts

### 💳 Sales Management
- **Quick Sales Entry** ⚡ - Fast and intuitive interface for recording sales
- **Product Selection** 🛒 - Easy product catalog with prices and quantities
- **Smart Payment Handling** 💰 - Support for full, partial, and credit payments
- **Elegant Receipts** 🧾 - Professional receipt PDFs with debt summary
- **Receipt Popup** - Instant receipt display after sale completion

### 📦 Inventory Management
- **Product Catalog** 📋 - Manage products with prices, quantities, and supplier names
- **Stock Tracking** 📊 - Monitor inventory levels in real-time
- **Supplier Integration** 🏢 - Track product suppliers for easy reordering
- **Cost Analysis** 💵 - Track cost price for profit margin calculations

### 👥 Customer Management
- **Customer Database** 👤 - Store and manage all customer information
- **Contact Information** 📞 - Phone numbers, WhatsApp, and addresses
- **Credit Limits** 💳 - Set individual credit limits per customer
- **Customer History** 📜 - Complete transaction history per customer

### 💳 Debt Management
- **Debt Tracking** 📊 - Monitor outstanding debts for each customer
- **Payment Recording** 💵 - Easy debt payment tracking
- **Debt Statements** 📄 - Professional PDF statements showing outstanding debts
- **Debt Summary** 📈 - Quick overview of all pending debts by customer
- **Old vs New Debt** - Clear separation of previous and new debt

### 🔐 Authentication
- **Secure Login** 🔒 - Email and password authentication with validation
- **Session Management** 🔑 - JWT-based token authentication
- **Password Validation** ✓ - Minimum 6 characters required
- **Email Validation** ✓ - Proper email format validation

---

## 🏗️ Project Structure

```
pos_final/
├── backend/                    # Express.js server
│   ├── models/                 # Database schemas
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Customer.js
│   │   ├── Transaction.js
│   │   └── Debt.js
│   ├── routes/                 # API endpoints
│   │   ├── auth.js
│   │   ├── products.js
│   │   ├── customers.js
│   │   ├── transactions.js
│   │   └── debts.js
│   ├── middleware/             # Custom middleware
│   │   └── auth.js
│   ├── config/                 # Configuration files
│   │   └── db.js
│   └── server.js              # Main server file
├── frontend/                   # React.js client
│   ├── src/
│   │   ├── pages/             # React pages
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Sales.jsx
│   │   │   ├── Products.jsx
│   │   │   ├── Customers.jsx
│   │   │   ├── Debts.jsx
│   │   │   └── History.jsx
│   │   ├── components/        # Reusable components
│   │   ├── services/          # API services
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
├── services/                   # Shared services
│   ├── pdfService.js          # PDF generation
│   └── whatsappService.js     # Messaging (Twilio)
├── .env                        # Environment variables
└── package.json               # Backend dependencies

```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v14 or higher
- **MongoDB** (local or cloud instance like MongoDB Atlas)
- **npm** or **yarn**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/pos_final.git
   cd pos_final
   ```

2. **Install backend dependencies**
   ```bash
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

4. **Configure environment variables**
   - Create a `.env` file in the root directory
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/pos_system
   JWT_SECRET=your_jwt_secret_key_here
   ```

5. **Start MongoDB** (if running locally)
   ```bash
   mongod
   ```

6. **Start the backend server**
   ```bash
   npm start
   # Server will run on http://localhost:5000
   ```

7. **Start the frontend development server** (in a new terminal)
   ```bash
   cd frontend
   npm run dev
   # Frontend will run on http://localhost:5173
   ```

---

## 📖 Usage

### 1️⃣ **Login** 🔐
- Enter your email and password
- Password must be at least 6 characters
- Email must be in valid format

### 2️⃣ **Dashboard** 📊
- View real-time system statistics
- Check pending debts and transaction summary
- **Generate Reports**: Click Week/Month/Year buttons to export PDF reports with all transaction details

### 3️⃣ **Make a Sale** 💳
- Navigate to **Sales** page
- Select products and quantities
- Choose payment method (Cash, Card, or Credit)
- View receipt in popup
- Download receipt as PDF

### 4️⃣ **Manage Inventory** 📦
- Add new products with name, price, quantity, and supplier
- Edit existing products
- Delete products (with confirmation)
- Track stock levels and suppliers

### 5️⃣ **Manage Customers** 👥
- Add customer details (name, phone, address, credit limit)
- View customer profile and transaction history
- Update customer information
- Track customer credit limits

### 6️⃣ **Track Debts** 💳
- View all customer debts at a glance
- See total outstanding debt per customer
- Record debt payments
- Download debt statement PDFs
- Review old vs. new debt breakdown

### 7️⃣ **View History** 📜
- Browse all transactions with filtering options
- Search by date, customer, or transaction ID
- View transaction details including items and amounts

---

## 🛠️ API Endpoints

### Authentication 🔐
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

### Products 📦
- `GET /api/products` - Get all products
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Customers 👥
- `GET /api/customers` - Get all customers
- `POST /api/customers` - Create new customer
- `PUT /api/customers/:id` - Update customer
- `GET /api/customers/:id` - Get customer details

### Transactions 💰
- `GET /api/transactions` - Get all transactions
- `POST /api/transactions` - Create new transaction
- `GET /api/transactions/:id` - Get transaction details

### Debts 💳
- `GET /api/debts` - Get all debts
- `GET /api/debts/customer/:customerId` - Get debts for customer
- `PUT /api/debts/:debtId` - Record debt payment
- `GET /api/debts/statement/:customerId` - Download debt statement PDF

---

## 📊 PDF Generation

### Receipt PDF 🧾
- Generated after each sale
- Shows: Product list, quantities, prices, payment details
- Includes: Customer name, transaction date, debt summary
- Format: A6 size (portable receipt size)

### Debt Statement PDF 📄
- Available from Debts page
- Shows: Customer info, outstanding debts, transaction history
- Format: Full-page professional layout
- Includes: Debt summary, payment status indicators

### Report PDFs 📈
- Weekly: Last 7 days of transactions
- Monthly: Current month's transactions
- Yearly: Current year's transactions
- Includes: Summary cards and detailed transaction table

---

## 🔒 Security Features

- 🔐 **JWT Authentication** - Secure token-based authentication
- 🛡️ **Protected Routes** - API endpoints require valid JWT token
- ✅ **Input Validation** - All inputs validated on client and server
- 📧 **Email Validation** - Proper email format checking
- 🔑 **Password Requirements** - Minimum 6 characters
- 🗄️ **Database Security** - Environment variables for sensitive data

---

## 🚀 Performance Features

- ⚡ **Fast Transactions** - Optimized database queries
- 🎨 **Responsive UI** - Mobile and desktop friendly
- 📄 **Client-Side PDFs** - No server load for receipt generation
- 🔄 **Real-time Updates** - Instant data refresh
- 💾 **Efficient Caching** - Minimal API calls

---

## 🧪 Technologies Used

### Frontend 🎨
- **React 18.2.0** - UI library
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **React Icons** - Icon library
- **html2pdf.js** - PDF generation

### Backend 🔧
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **PDFKit** - Server-side PDF generation

---

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port (default: 5000) | ❌ |
| `MONGODB_URI` | MongoDB connection string | ✅ |
| `JWT_SECRET` | JWT signing secret | ✅ |

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🙏 Acknowledgments

- Built with ❤️ for small business owners
- Inspired by modern POS solutions
- Thanks to the open-source community

---

**Happy Selling! 🎉**
