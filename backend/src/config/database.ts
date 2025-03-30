import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Get database configuration from environment variables
const {
  DB_NAME = 'tictactoe',
  DB_USER = 'postgres',
  DB_PASSWORD = 'postgres',
  DB_HOST = 'localhost',
  DB_PORT = '5432',
} = process.env;

// Create Sequelize instance
const sequelize = new Sequelize({
  dialect: 'postgres',
  host: DB_HOST,
  port: parseInt(DB_PORT, 10),
  database: DB_NAME,
  username: DB_USER,
  password: DB_PASSWORD,
  logging: false, // Set to console.log for SQL query logging
});

export default sequelize; 