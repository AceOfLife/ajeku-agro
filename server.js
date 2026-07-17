// server.js
const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const favicon = require('serve-favicon');
const socketio = require('socket.io');
const cookieParser = require('cookie-parser');

const adminRoutes = require('./routes/admin');
const investorRoutes = require('./routes/investorRoutes');
const authRoutes = require('./routes/authRoutes');
const { sequelize } = require('./models');
const paymentRoutes = require("./routes/paymentRoutes");
const transactionRoutes = require('./routes/transactionRoutes');
const bankOfHeavenRoutes = require('./routes/bankOfHeavenRoutes');
const messageRoutes = require('./routes/messageRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const farmRoutes = require('./routes/farmRoutes');
const farmManagerRoutes = require('./routes/farmManagerRoutes');
const harvestRoutes = require('./routes/harvestRoutes');
const farmUnitRoutes = require('./routes/farmUnitRoutes');
const marketplaceRoutes = require('./routes/marketplaceRoutes');

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.set('socketio', io);

io.on('connection', (socket) => {
  console.log(`New client connected: ${socket.id}`);
  
  socket.on('join_user_room', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined their notification room`);
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Database connection
sequelize.authenticate()
  .then(() => console.log('✅ Database connection established'))
  .catch(err => console.error('❌ Database connection error:', err.message));

app.use(favicon(path.join(__dirname, 'favicon.png')));
app.use(express.static(path.join(__dirname)));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Ajeku Agro API is running',
    timestamp: new Date().toISOString()
  });
});

app.get('/favicon.png', (req, res) => res.sendFile(path.join(__dirname, 'favicon.png')));

// Routes
app.use("/api", paymentRoutes);
app.use('/transactions', transactionRoutes);
app.use('/api/bank-of-heaven', bankOfHeavenRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/investors', investorRoutes);
app.use('/api/farms', farmRoutes);
app.use('/api/farms/:farmId/units', farmUnitRoutes);
app.use('/api/farm-managers', farmManagerRoutes);
app.use('/api/harvest', harvestRoutes);
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/api/documents', require('./routes/documentRoutes'));
app.use('/api/marketplace', marketplaceRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Server running with Socket.io on port ${PORT}`);
});

module.exports = app;