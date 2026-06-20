const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const { ensureDatabaseExists, sequelize } = require('./config/db');
const { User } = require('./models');

// Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const fileRoutes = require('./routes/fileRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const adminRoutes = require('./routes/adminRoutes');
const officerRoutes = require('./routes/officerRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    credentials: true,
  },
});
app.set('io', io);

const initSocketServer = require('./socket/socketServer');
initSocketServer(io);

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
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/officer', officerRoutes);
app.use('/api/notifications', notificationRoutes);

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

    // Officer Seeds
    const seedOfficers = [
      { name: 'Officer Jack', email: 'officer@gmail.com', phone: '8888888888', password: 'officer123' },
      { name: 'Officer Sarah', email: 'sarah@gmail.com', phone: '8888888889', password: 'officer123' },
      { name: 'Officer David', email: 'david@gmail.com', phone: '8888888890', password: 'officer123' },
      { name: 'Officer Emily', email: 'emily@gmail.com', phone: '8888888891', password: 'officer123' }
    ];

    for (const off of seedOfficers) {
      const existing = await User.findOne({ where: { email: off.email } });
      if (!existing) {
        const hashPassword = await bcrypt.hash(off.password, 10);
        await User.create({
          name: off.name,
          email: off.email,
          phone: off.phone,
          password: hashPassword,
          role: 'ROLE_OFFICER',
        });
        console.log(`Seeded officer account: ${off.name} (${off.email})`);
      }
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

    // Pre-sync database schema upgrades (safe ALTER statements)
    try {
      await sequelize.query("ALTER TABLE complaints ADD COLUMN location VARCHAR(255) DEFAULT 'Unknown';");
      console.log('Database: Added location column to complaints table');
    } catch (err) {
      // Ignored if column already exists (Error 1060: Duplicate column name)
    }

    try {
      await sequelize.query("ALTER TABLE complaints ADD COLUMN officer_id BIGINT NULL REFERENCES users(id) ON DELETE SET NULL;");
      console.log('Database: Added officer_id column to complaints table');
    } catch (err) {
      // Ignored if column already exists
    }

    try {
      await sequelize.query("ALTER TABLE users MODIFY COLUMN role ENUM('ROLE_CITIZEN', 'ROLE_ADMIN', 'ROLE_OFFICER') DEFAULT 'ROLE_CITIZEN';");
      console.log('Database: Updated role ENUM to support ROLE_OFFICER');
    } catch (err) {
      console.error('Database: Failed to alter users role ENUM', err.message);
    }

    try {
      await sequelize.query("ALTER TABLE users ADD COLUMN status ENUM('ACTIVE', 'DISABLED') DEFAULT 'ACTIVE';");
      console.log('Database: Added status column to users table');
    } catch (err) {
      // Ignored if column already exists
    }

    // Sync database models
    await sequelize.sync();
    console.log('Database synced successfully.');

    // Seed default data
    await seedDefaultUsers();

    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
