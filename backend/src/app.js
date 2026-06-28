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
const threatIntelRoutes = require('./routes/threatIntelRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');
const chatRoutes = require('./routes/chatRoutes');
const timelineRoutes = require('./routes/timelineRoutes');
const reportRoutes = require('./routes/reportRoutes');
const geoRoutes = require('./routes/geoRoutes');

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const server = http.createServer(app);

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000, // Limit each IP to 10000 requests per window to prevent development throttling
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 authentication attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many security authentication attempts. Please try again after 15 minutes.' }
});

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL
].filter(Boolean);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
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
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Authorization', 'Content-Type', 'Cache-Control', 'Accept'],
  credentials: true,
}));
app.use(helmet());
app.use(globalLimiter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Register API Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin', geoRoutes);
app.use('/api/officer', officerRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/threat-intel', threatIntelRoutes);
app.use('/api/ai/chatbot', chatbotRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/timeline', timelineRoutes);
app.use('/api/reports', reportRoutes);

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

async function enrichExistingComplaints() {
  try {
    const { Complaint } = require('./models');
    const geoService = require('./services/geoService');
    const { Op } = require('sequelize');

    const complaints = await Complaint.findAll({
      where: {
        [Op.or]: [
          { city: null },
          { city: 'Unknown' },
          { latitude: null },
          { longitude: null }
        ]
      }
    });

    if (complaints.length > 0) {
      console.log(`Geocoding background service: Enriching ${complaints.length} existing complaints with coordinates...`);
      for (const c of complaints) {
        const enrichment = geoService.enrichComplaintLocation(c);
        c.city = enrichment.city;
        c.state = enrichment.state;
        c.latitude = enrichment.latitude;
        c.longitude = enrichment.longitude;
        await c.save();
      }
      console.log('Geocoding background service: Finished enriching existing complaints.');
    }
  } catch (error) {
    console.error('Error during database location enrichment:', error);
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

    // Add city, state, latitude, and longitude columns to complaints table
    const geoColumns = [
      { name: 'city', type: "VARCHAR(255) NULL DEFAULT 'Unknown'" },
      { name: 'state', type: "VARCHAR(255) NULL DEFAULT 'Unknown'" },
      { name: 'latitude', type: 'DECIMAL(10, 8) NULL' },
      { name: 'longitude', type: 'DECIMAL(11, 8) NULL' }
    ];

    for (const col of geoColumns) {
      try {
        await sequelize.query(`ALTER TABLE complaints ADD COLUMN ${col.name} ${col.type};`);
        console.log(`Database: Added ${col.name} column to complaints table`);
      } catch (err) {
        // Column already exists
      }
    }

    // Add missing AI columns to complaints table
    const aiColumns = [
      { name: 'ai_summary', type: 'TEXT' },
      { name: 'ai_category', type: 'VARCHAR(255)' },
      { name: 'ai_priority', type: 'VARCHAR(255)' },
      { name: 'ai_risk_score', type: 'INT' },
      { name: 'ai_iocs', type: 'TEXT' },
      { name: 'fraud_risk_level', type: 'VARCHAR(255)' },
      { name: 'fraud_reasons', type: 'TEXT' }
    ];

    for (const col of aiColumns) {
      try {
        await sequelize.query(`ALTER TABLE complaints ADD COLUMN ${col.name} ${col.type} NULL;`);
        console.log(`Database: Added ${col.name} column to complaints table`);
      } catch (err) {
        // Column already exists
      }
    }

    // Add missing file metadata columns to evidence_files table
    const fileColumns = [
      { name: 'file_hash', type: 'VARCHAR(255)' },
      { name: 'file_size', type: 'BIGINT' },
      { name: 'mime_type', type: 'VARCHAR(255)' },
      { name: 'metadata_json', type: 'TEXT' }
    ];

    for (const col of fileColumns) {
      try {
        await sequelize.query(`ALTER TABLE evidence_files ADD COLUMN ${col.name} ${col.type} NULL;`);
        console.log(`Database: Added ${col.name} column to evidence_files table`);
      } catch (err) {
        // Column already exists
      }
    }

    // Add missing file metadata columns to evidence_uploads table
    for (const col of fileColumns) {
      try {
        await sequelize.query(`ALTER TABLE evidence_uploads ADD COLUMN ${col.name} ${col.type} NULL;`);
        console.log(`Database: Added ${col.name} column to evidence_uploads table`);
      } catch (err) {
        // Column already exists
      }
    }

    // Sync database models
    await sequelize.sync();
    console.log('Database synced successfully.');

    // Seed default data
    await seedDefaultUsers();

    // Enrich existing complaints with geo metadata asynchronously
    enrichExistingComplaints().catch(err => {
      console.error('Failed to run backward compatibility geo enrichment:', err);
    });

    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
