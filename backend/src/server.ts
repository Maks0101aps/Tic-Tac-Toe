import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import { setupGameHandlers } from './services/gameService';
import authRoutes from './routes/authRoutes';
import sequelize from './config/database';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Define routes
app.use('/api/auth', authRoutes);

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Setup game handlers
  setupGameHandlers(io, socket);

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    // Here you could add logic to handle a player disconnecting from a game
  });
});

// Define routes
app.get('/', (req, res) => {
  res.send('Tic-Tac-Toe API is running');
});

// Initialize database and start server
const startServer = async () => {
  // Start server first so we can at least serve the frontend
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
  
  try {
    // Try to initialize database - create tables if they don't exist
    await sequelize.sync();
    console.log('Database synchronized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    console.log('Server will continue to run in limited functionality mode');
    // Not calling process.exit(1) so server can still run without DB
  }
};

// Start the server
startServer();

export { app, server, io };