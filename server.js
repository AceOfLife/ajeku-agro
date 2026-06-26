// server.js (UPDATED with farmUnitRoutes)
const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const favicon = require('serve-favicon');
const socketio = require('socket.io');
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
const cookieParser = require('cookie-parser');

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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(bodyParser.json());

sequelize.authenticate()
  .then(() => console.log('Database connection established'))
  .catch(err => console.error('Database connection error:', err));

app.use(favicon(path.join(__dirname, 'favicon.png')));
app.use(express.static(path.join(__dirname)));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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

app.get('/', (req, res) => res.send('Server is running'));
app.get('/favicon.png', (req, res) => res.sendFile(path.join(__dirname, 'favicon.png')));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running with Socket.io on port ${PORT}`);
});

module.exports = app;