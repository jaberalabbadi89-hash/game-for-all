DROP DATABASE IF EXISTS game_for_all;
CREATE DATABASE game_for_all CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE game_for_all;

DROP TABLE IF EXISTS Messages;
DROP TABLE IF EXISTS Ratings;
DROP TABLE IF EXISTS Favorites;
DROP TABLE IF EXISTS Trades;
DROP TABLE IF EXISTS Games;
DROP TABLE IF EXISTS Users;

CREATE TABLE Users (
  id_user INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(120) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  avatar VARCHAR(255) DEFAULT NULL,
  role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Games (
  id_game INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(120) NOT NULL,
  description TEXT,
  platform VARCHAR(80) NOT NULL,
  genre VARCHAR(80) DEFAULT NULL,
  state ENUM('new', 'like_new', 'used') NOT NULL DEFAULT 'used',
  image VARCHAR(255) DEFAULT NULL,
  id_owner INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_games_owner
    FOREIGN KEY (id_owner) REFERENCES Users (id_user)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE TABLE Favorites (
  id_user INT NOT NULL,
  id_game INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_user, id_game),
  CONSTRAINT fk_favorites_user
    FOREIGN KEY (id_user) REFERENCES Users (id_user)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_favorites_game
    FOREIGN KEY (id_game) REFERENCES Games (id_game)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE TABLE Ratings (
  id_rating INT AUTO_INCREMENT PRIMARY KEY,
  id_voter INT NOT NULL,
  id_reviewed INT NOT NULL,
  stars TINYINT NOT NULL,
  comment TEXT DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_ratings_stars CHECK (stars BETWEEN 1 AND 5),
  UNIQUE KEY uq_rating_pair (id_voter, id_reviewed),
  CONSTRAINT fk_ratings_voter
    FOREIGN KEY (id_voter) REFERENCES Users (id_user)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_ratings_reviewed
    FOREIGN KEY (id_reviewed) REFERENCES Users (id_user)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE TABLE Trades (
  id_trade INT AUTO_INCREMENT PRIMARY KEY,
  id_sender INT NOT NULL,
  id_receiver INT NOT NULL,
  id_game_offered INT NOT NULL,
  id_game_requested INT NOT NULL,
  status ENUM('pending', 'accepted', 'rejected', 'cancelled') NOT NULL DEFAULT 'pending',
  message TEXT DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_trades_sender
    FOREIGN KEY (id_sender) REFERENCES Users (id_user)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_trades_receiver
    FOREIGN KEY (id_receiver) REFERENCES Users (id_user)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_trades_offered
    FOREIGN KEY (id_game_offered) REFERENCES Games (id_game)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_trades_requested
    FOREIGN KEY (id_game_requested) REFERENCES Games (id_game)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE TABLE Messages (
  id_message INT AUTO_INCREMENT PRIMARY KEY,
  sender_id INT NOT NULL,
  receiver_id INT NOT NULL,
  message_text TEXT NOT NULL,
  sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_messages_sender
    FOREIGN KEY (sender_id) REFERENCES Users (id_user)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_messages_receiver
    FOREIGN KEY (receiver_id) REFERENCES Users (id_user)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

INSERT INTO Users (username, email, password, avatar, role) VALUES
(
  'admin',
  'admin@gameforall.com',
  '$2b$10$XpNa56jHxOwATCgxCzuggO2nJp3EKiE15AMlG08m.HBjFRggEa7xW',
  'https://i.pravatar.cc/150?img=12',
  'admin'
),
(
  'playerOne',
  'player1@gameforall.com',
  '$2b$10$prRg9OGnTdGl2AC9hI7BA.F.orrnjhytMYM1xzgbENddpRhum0BRC',
  'https://i.pravatar.cc/150?img=32',
  'user'
),
(
  'playerTwo',
  'player2@gameforall.com',
  '$2b$10$koZyeJrVuGN21Sdhu2X8aeLmHkYXh1gB6WQfFsWnN4QhKZxQg57Ti',
  'https://i.pravatar.cc/150?img=44',
  'user'
);

INSERT INTO Games (title, description, platform, genre, state, image, id_owner) VALUES
(
  'God of War Ragnarök',
  'Adventure game available for trade.',
  'PS5',
  'Action',
  'like_new',
  'https://picsum.photos/seed/gow/800/500',
  2
),
(
  'The Legend of Zelda: Tears of the Kingdom',
  'Popular open-world game for exchange.',
  'Nintendo Switch',
  'Adventure',
  'used',
  'https://picsum.photos/seed/zelda/800/500',
  1
),
(
  'Elden Ring',
  'Fantasy action RPG ready for exchange.',
  'PS5',
  'RPG',
  'new',
  'https://picsum.photos/seed/eldenring/800/500',
  3
);

INSERT INTO Favorites (id_user, id_game) VALUES
(1, 2),
(2, 1),
(2, 3);

INSERT INTO Ratings (id_voter, id_reviewed, stars, comment) VALUES
(2, 1, 5, 'Great trade partner.'),
(1, 2, 4, 'Fast and friendly.');

INSERT INTO Trades (id_sender, id_receiver, id_game_offered, id_game_requested, status, message) VALUES
(2, 1, 1, 2, 'pending', 'I can trade my PS5 copy for your Switch game.');

INSERT INTO Messages (sender_id, receiver_id, message_text) VALUES
(2, 1, 'Hi, are you still interested in a trade?');

UPDATE Users SET password = '$2b$10$H8ZIxjJ4ry97UqJfX6xwD.jqy4LqAXt2AJrv/wwRX.aUN1nKEA.z6' WHERE email = 'admin@gameforall.com';
