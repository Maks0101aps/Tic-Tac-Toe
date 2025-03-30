import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

// Interface for Game attributes
interface GameAttributes {
  id: number;
  gameId: string;
  boardState: string;
  status: 'finished';
  winnerId?: number;
  player1Id: number;
  player2Id: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface for Game creation attributes
interface GameCreationAttributes extends Optional<GameAttributes, 'id'> {}

// Define the Game model
class Game extends Model<GameAttributes, GameCreationAttributes> implements GameAttributes {
  public id!: number;
  public gameId!: string;
  public boardState!: string;
  public status!: 'finished';
  public winnerId?: number;
  public player1Id!: number;
  public player2Id!: number;
  
  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Game.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    gameId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    boardState: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'JSON string representing the final state of the board',
    },
    status: {
      type: DataTypes.ENUM('finished'),
      allowNull: false,
    },
    winnerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    player1Id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    player2Id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'games',
  }
);

// Define associations
Game.belongsTo(User, { as: 'player1', foreignKey: 'player1Id' });
Game.belongsTo(User, { as: 'player2', foreignKey: 'player2Id' });
Game.belongsTo(User, { as: 'winner', foreignKey: 'winnerId' });

export default Game; 