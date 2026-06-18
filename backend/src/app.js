const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const { ensureDatabaseExists, sequelize } = require('./config/db');
const { User } = require('./models');

// Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const fileRoutes = require('./routes/fileRoutes');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Authorization', 'Content-Type', 'Cache-Control', 'Accept'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Register API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/files', fileRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Global Error Handler:', err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

// Seed function
async function seedDefaultUsers() {
  try {
    // Admin Seed
    const adminEmail = 'admin@gmail.com';
    const adminUser = await User.findOne({ where: { email: adminEmail } });
    if (!adminUser) {
      const adminPassword = await bcrypt.hash('admin123', 10);
      await User.create({
        name: 'Admin Officer',
        email: adminEmail,
        phone: '9999999999',
        password: adminPassword,
        role: 'ROLE_ADMIN',
      });
      console.log('Default Admin account seeded (admin@gmail.com / admin123)');
    }

    // Citizen Seed
    const citizenEmail = 'user@gmail.com';
    const citizenUser = await User.findOne({ where: { email: citizenEmail } });
    if (!citizenUser) {
      const citizenPassword = await bcrypt.hash('user1234', 10);
      await User.create({
        name: 'Abhishek Baghel',
        email: citizenEmail,
        phone: '9876543210',
        password: citizenPassword,
        role: 'ROLE_CITIZEN',
      });
      console.log('Default Citizen account seeded (user@gmail.com / user1234)');
    }
  } catch (error) {
    console.error('Error seeding default data:', error);
  }
}

// Start Server
async function startServer() {
  try {
    // Ensure database exists
    await ensureDatabaseExists();
    console.log('Database verification successful.');

    // Sync database models
    await sequelize.sync();
    console.log('Database synced successfully.');

    // Seed default data
    await seedDefaultUsers();

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
