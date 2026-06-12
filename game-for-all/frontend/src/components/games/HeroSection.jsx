import React from 'react';
import { motion } from 'framer-motion';
import { Gamepad2, Search, ArrowRight } from 'lucide-react';

export function HeroSection({ user, token, gamesCount, activeTradesCount, setActiveSection }) {
  const hasSession = Boolean(token);

  return (
    <section className="relative overflow-hidden bg-gray-950 py-24 rounded-3xl border border-white/5 shadow-2xl mb-12">
      {/* Abstract Glowing Blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2" />

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-purple-400 text-sm font-medium mb-6">
            <Gamepad2 size={16} /> Game For All 2.0
          </span>
          <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight mb-6">
            Intercambia juegos con <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">estilo</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            Descubre, guarda y negocia juegos en una experiencia elegante y directa. Únete a la comunidad de gamers que comparten tu pasión.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveSection('games')}
              className="w-full sm:w-auto px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 transition-colors shadow-glow"
            >
              Explorar juegos <Search size={20} />
            </motion.button>
            
            {!hasSession ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveSection('auth')}
                className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                Acceder <ArrowRight size={20} />
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveSection('profile')}
                className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                Mi Perfil
              </motion.button>
            )}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="mt-16 grid grid-cols-2 md:grid-cols-3 gap-6 max-w-2xl mx-auto"
        >
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            <div className="text-3xl font-bold text-white mb-1">{gamesCount}</div>
            <div className="text-sm text-gray-400">Juegos listados</div>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            <div className="text-3xl font-bold text-white mb-1">{activeTradesCount}</div>
            <div className="text-sm text-gray-400">Intercambios activos</div>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md col-span-2 md:col-span-1 hidden md:block">
            <div className="text-3xl font-bold text-white mb-1">+1k</div>
            <div className="text-sm text-gray-400">Usuarios felices</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
