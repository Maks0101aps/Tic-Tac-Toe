import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

// Interface for User attributes
interface UserAttributes {
  id: number;
  username: string;
  email: string;
  password: string;
  wins: number;
  losses: number;
  draws: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface for User creation attributes
interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'wins' | 'losses' | 'draws'> {}

// Define the User model
class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public username!: string;
  public email!: string;
  public password!: string;
  public wins!: number;
  public losses!: number;
  public draws!: number;
  
  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    wins: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    losses: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    draws: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: 'users',
  }
);

export default User; 