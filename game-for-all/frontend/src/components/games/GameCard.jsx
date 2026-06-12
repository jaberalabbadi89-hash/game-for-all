import React from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Repeat, Edit2, Trash2 } from 'lucide-react';

export function GameCard({ 
  game, 
  favorites, 
  toggleFavorite, 
  onTradeClick, 
  onMessageClick, 
  canEditGame, 
  canDeleteGame, 
  onEditClick, 
  onDeleteClick, 
  onImageClick 
}) {
  const isFavorite = favorites.includes(game.id);

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="group relative bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md flex flex-col hover:border-purple-500/50 transition-colors"
    >
      {/* Image Container */}
      <div 
        className="relative h-48 w-full bg-gray-900 cursor-pointer overflow-hidden"
        onClick={() => onImageClick(game)}
      >
        {game.image ? (
          <motion.img
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
            src={game.image.startsWith('http') ? game.image : `http://localhost:5000${game.image}`}
            alt={game.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500">
            Sin imagen
          </div>
        )}
        
        {/* Floating Favorite Button */}
        <button
          onClick={(e) => { e.stopPropagation(); toggleFavorite(game.id); }}
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-colors ${
            isFavorite 
              ? 'bg-purple-600 text-white' 
              : 'bg-black/50 text-gray-300 hover:bg-black/70 hover:text-white'
          }`}
        >
          <Heart size={18} fill={isFavorite ? "currentColor" : "none"} />
        </button>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold text-white truncate pr-2" title={game.title}>
            {game.title}
          </h3>
          <span className="px-2 py-1 bg-purple-600/20 text-purple-400 text-xs font-semibold rounded-md uppercase tracking-wider">
            {game.platform}
          </span>
        </div>
        
        <p className="text-sm text-gray-400 mb-4 line-clamp-2 flex-1">
          {game.description || 'Sin descripción disponible.'}
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          <span className="px-2 py-1 bg-white/5 border border-white/10 text-gray-300 text-xs rounded-md">
            {game.genre}
          </span>
          <span className="px-2 py-1 bg-white/5 border border-white/10 text-gray-300 text-xs rounded-md">
            {game.condition || 'Good'}
          </span>
        </div>

        {/* Actions Footer */}
        <div className="pt-4 border-t border-white/10 flex justify-between items-center mt-auto">
          {/* Public Actions */}
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onTradeClick(game)}
              className="p-2 text-gray-400 hover:text-blue-400 transition-colors tooltip-trigger"
              title="Solicitar intercambio"
            >
              <Repeat size={18} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onMessageClick(game)}
              className="p-2 text-gray-400 hover:text-purple-400 transition-colors tooltip-trigger"
              title="Enviar mensaje"
            >
              <MessageCircle size={18} />
            </motion.button>
          </div>

          {/* Owner/Admin Actions */}
          {(canEditGame(game) || canDeleteGame(game)) && (
            <div className="flex gap-2">
              {canEditGame(game) && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onEditClick(game)}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                  title="Editar"
                >
                  <Edit2 size={18} />
                </motion.button>
              )}
              {canDeleteGame(game) && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onDeleteClick(game.id)}
                  className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                  title="Eliminar"
                >
                  <Trash2 size={18} />
                </motion.button>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
