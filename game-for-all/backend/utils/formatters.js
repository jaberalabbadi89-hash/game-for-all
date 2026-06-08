function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  const {
    password,
    id_user,
    created_at,
    ...safeUser
  } = user;

  return {
    id: user.id_user,
    username: user.username,
    email: user.email,
    avatar: user.avatar,
    role: user.role,
    createdAt: created_at,
    ...safeUser,
  };
}

function mapGameRow(game) {
  if (!game) {
    return null;
  }

  const {
    id_game,
    id_owner,
    created_at,
    state,
    ...rest
  } = game;

  return {
    id: id_game,
    id_owner,
    createdAt: created_at,
    condition: state,
    state,
    ...rest,
  };
}

function mapTradeRow(trade) {
  if (!trade) {
    return null;
  }

  const {
    id_trade,
    id_sender,
    id_receiver,
    id_game_offered,
    id_game_requested,
    created_at,
    ...rest
  } = trade;

  return {
    id: id_trade,
    requesterId: id_sender,
    ownerId: id_receiver,
    offeredGameId: id_game_offered,
    requestedGameId: id_game_requested,
    createdAt: created_at,
    ...rest,
  };
}

module.exports = {
  sanitizeUser,
  mapGameRow,
  mapTradeRow,
};
