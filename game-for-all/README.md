# Game For All

Platforma web per a l'intercanvi de videojocs entre usuaris.

## Project Overview

Game For All is a full-stack application with:

- Frontend: React
- Backend: Node.js + Express
- Database: MySQL
- Security: JWT, Helmet, CORS

The app follows a 3-tier architecture:

- Presentation layer: React UI
- Application layer: Express REST API
- Data layer: MySQL relational database

## Main Features

- User register and login
- JWT-based authentication
- Role-based access control
- Browse and search games
- Create, edit, and delete games
- Create trades
- Send messages
- Save favorite games
- Rate other users

## Project Structure

- `backend/` API, controllers, routes, middleware, SQL seed
- `frontend/` React user interface

## Requirements

- Node.js
- npm
- MySQL

## Setup

### 1. Backend

```bash
cd backend
npm install
```

Create a `.env` file in `backend/` using this template:

```env
PORT=5000
JWT_SECRET=my_super_secret_key_change_this
JWT_EXPIRES_IN=7d

DB_HOST=127.0.0.1
DB_PORT=8889
DB_USER=root
DB_PASSWORD=root
DB_NAME=game_for_all
```

Import the database schema and seed data:

- `backend/sql/game_for_all.sql`

Start the backend:

```bash
npm run dev
```

or

```bash
npm start
```

### 2. Frontend

```bash
cd frontend
npm install
npm start
```

If the backend runs on another host, set:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

## Available Scripts

### Backend

- `npm start` - start the server
- `npm run dev` - start with nodemon

### Frontend

- `npm start` - start the React app
- `npm run build` - create production build
- `npm test` - run tests

## API Endpoints

### Health

- `GET /api/health`

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`

### Games

- `GET /api/games`
- `GET /api/games/:id`
- `POST /api/games` protected
- `PATCH /api/games/:id` protected
- `DELETE /api/games/:id` protected, admin only

### Favorites

- `GET /api/favorites` protected
- `POST /api/favorites` protected
- `DELETE /api/favorites/:gameId` protected

### Trades

- `GET /api/trades` protected
- `POST /api/trades` protected
- `PATCH /api/trades/:id` protected

### Messages

- `GET /api/messages` protected
- `POST /api/messages` protected

### Ratings

- `GET /api/ratings` protected
- `POST /api/ratings` protected

## Authentication and Roles

- `user`: can browse, create games, manage favorites, trades, messages, and ratings
- `admin`: can also delete games

JWT token is returned on login/register and must be sent in the `Authorization` header:

```http
Authorization: Bearer <token>
```

## Database Model

Main tables:

- `Users`
- `Games`
- `Trades`
- `Favorites`
- `Ratings`
- `Messages`

Relations:

- `Users` 1:N `Games`
- `Users` 1:N `Trades`
- `Users` 1:N `Messages`
- `Users` 1:N `Ratings`
- `Users` N:M `Games` through `Favorites`

## Demo Account

Admin demo:

- Email: `admin@gameforall.com`
- Password: `admin123`

## Notes

- The frontend is responsive and designed for desktop and mobile.
- The backend returns JSON responses with HTTP status codes.
- The project includes seed data to demonstrate the main flows.

