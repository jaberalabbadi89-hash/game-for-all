use game_for_all;


drop table if exists messages;
drop table if exists ratings;
drop table if exists favorites;
drop table if exists trades;
drop table if exists games;
drop table if exists users;


create table Users (
 id_user int auto_increment primary key,
 username varchar(50) not null unique,
 email varchar(120) not null unique,
 password varchar(255) not null,
 avatar varchar(255) default null,
 role enum('user', 'admin') not null default 'user',
 created_at timestamp not null default current_timestamp
);


create table Games (
 id_game int auto_increment primary key,
 title varchar(120) not null,
 description text,
 platform varchar(80) not null,
 genre varchar(80) default null,
 state enum('new', 'like_new', 'used') not null default 'used',
 image varchar(255) default null,
 id_owner int not null,
 created_at timestamp not null default current_timestamp,
 constraint fk_games_owner
   foreign key (id_owner) references Users (id_user)
   on delete cascade
   on update cascade
);


create table Favorites (
 id_user int not null,
 id_game int not null,
 created_at timestamp not null default current_timestamp,
 primary key (id_user, id_game),
 constraint fk_favorites_user
   foreign key (id_user) references Users (id_user)
   on delete cascade
   on update cascade,
 constraint fk_favorites_game
   foreign key (id_game) references Games (id_game)
   on delete cascade
   on update cascade
);


create table Ratings (
 id_rating int auto_increment primary key,
 id_voter int not null,
 id_reviewed int not null,
 stars tinyint not null,
 comment text default null,
 created_at timestamp not null default current_timestamp,
 constraint chk_ratings_stars check (stars between 1 and 5),
 unique key uq_rating_pair (id_voter, id_reviewed),
 constraint fk_ratings_voter1
   foreign key (id_voter) references Users (id_user)
   on delete cascade
   on update cascade,
 constraint fk_ratings_reviewed1
   foreign key (id_reviewed) references Users (id_user)
   on delete cascade
   on update cascade
);


create table Trades (
 id_trade int auto_increment primary key,
 id_sender int not null,
 id_receiver int not null,
 id_game_offered int not null,
 id_game_requested int not null,
 status enum('pending', 'accepted', 'rejected', 'completed', 'cancelled') not null default 'pending',
 message text default null,
 created_at timestamp not null default current_timestamp,
 constraint fk_trades_sender1
   foreign key (id_sender) references Users (id_user)
   on delete cascade
   on update cascade,
 constraint fk_trades_receiver1
   foreign key (id_receiver) references Users (id_user)
   on delete cascade
   on update cascade,
 constraint fk_trades_offered1
   foreign key (id_game_offered) references Games (id_game)
   on delete cascade
   on update cascade,
 constraint fk_trades_requested1
   foreign key (id_game_requested) references Games (id_game)
   on delete cascade
   on update cascade
);


create table Messages (
 id_message int auto_increment primary key,
 sender_id int not null,
 receiver_id int not null,
 message_text text not null,
 sent_at timestamp not null default current_timestamp,
 constraint fk_messages_sender1
   foreign key (sender_id) references Users (id_user)
   on delete cascade
   on update cascade,
 constraint fk_messages_receiver1
   foreign key (receiver_id) references Users (id_user)
   on delete cascade
   on update cascade
);


insert into Users (username, email, password, avatar, role) values
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


insert into Games (title, description, platform, genre, state, image, id_owner) values
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


insert into Favorites (id_user, id_game) values
(1, 2),
(2, 1),
(2, 3);


insert into Ratings (id_voter, id_reviewed, stars, comment) values
(2, 1, 5, 'Great trade partner.'),
(1, 2, 4, 'Fast and friendly.');


insert into Trades (id_sender, id_receiver, id_game_offered, id_game_requested, status, message) values
(2, 1, 1, 2, 'pending', 'I can trade my PS5 copy for your Switch game.');


insert into Messages (sender_id, receiver_id, message_text) values
(2, 1, 'Hi, are you still interested in a trade?');


update Users set password = '$2b$10$H8ZIxjJ4ry97UqJfX6xwD.jqy4LqAXt2AJrv/wwRX.aUN1nKEA.z6' where email = 'admin@gameforall.com';


