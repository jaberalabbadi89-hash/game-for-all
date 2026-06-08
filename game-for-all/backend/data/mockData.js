const bcrypt = require('bcryptjs');

const users = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@gameforall.com',
    password: bcrypt.hashSync('admin123', 10),
    role: 'admin',
    avatar: 'https://i.pravatar.cc/150?img=12',
  },
  {
    id: 2,
    username: 'playerOne',
    email: 'player1@gameforall.com',
    password: bcrypt.hashSync('123456', 10),
    role: 'user',
    avatar: 'https://i.pravatar.cc/150?img=32',
  },
];

const games = [
  {
    id: 1,
    title: 'God of War Ragnarök',
    platform: 'PS5',
    genre: 'Action',
    condition: 'Excellent',
    ownerId: 2,
    image: 'https://picsum.photos/seed/gow/800/500',
    description: 'Adventure game available for trade.',
    createdAt: '2026-06-01T10:00:00.000Z',
  },
  {
    id: 2,
    title: 'The Legend of Zelda: Tears of the Kingdom',
    platform: 'Nintendo Switch',
    genre: 'Adventure',
    condition: 'Very Good',
    ownerId: 1,
    image: 'https://picsum.photos/seed/zelda/800/500',
    description: 'Popular open-world game for exchange.',
    createdAt: '2026-06-01T11:00:00.000Z',
  },
];

const trades = [
  {
    id: 1,
    requesterId: 2,
    ownerId: 1,
    offeredGameId: 1,
    requestedGameId: 2,
    status: 'pending',
    message: 'I can trade my PS5 copy for your Switch game.',
    createdAt: '2026-06-01T12:00:00.000Z',
  },
];

module.exports = {
  users,
  games,
  trades,
};
