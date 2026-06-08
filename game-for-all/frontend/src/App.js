import { useCallback, useEffect, useMemo, useState } from 'react';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const navItems = [
  { id: 'home', label: 'Inicio' },
  { id: 'games', label: 'Explorar Juegos' },
  { id: 'publish', label: 'Publicar Juego' },
  { id: 'trades', label: 'Intercambios' },
  { id: 'ratings', label: 'Valoraciones' },
  { id: 'favorites', label: 'Favoritos' },
  { id: 'profile', label: 'Perfil' },
  { id: 'messages', label: 'Mensajes' },
  { id: 'auth', label: 'Acceder' },
];

const marketCategories = [
  'Todas las categorías',
  'PlayStation',
  'Nintendo',
  'Xbox',
  'Accesorios',
  'Ofertas',
];

const validSections = new Set([
  'home',
  'games',
  'detail',
  'publish',
  'trades',
  'ratings',
  'favorites',
  'profile',
  'messages',
  'auth',
]);

function getSectionFromHash() {
  const section = window.location.hash.replace('#', '');
  return validSections.has(section) ? section : null;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('No se pudo leer la imagen'));
    reader.readAsDataURL(file);
  });
}

function App() {
  const [activeSection, setActiveSection] = useState('home');
  const [games, setGames] = useState([]);
  const [trades, setTrades] = useState([]);
  const [messages, setMessages] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [selectedGameId, setSelectedGameId] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('gameForAllToken') || '');
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('gameForAllUser')) || null;
    } catch {
      return null;
    }
  });
  const [authMode, setAuthMode] = useState('login');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingGameId, setEditingGameId] = useState(null);
  const [gameEditForm, setGameEditForm] = useState({
    title: '',
    platform: '',
    genre: '',
    condition: '',
    image: '',
    description: '',
  });
  const [gameCreateForm, setGameCreateForm] = useState({
    title: '',
    platform: '',
    genre: '',
    condition: 'used',
    image: '',
    description: '',
  });
  const [authForm, setAuthForm] = useState({
    username: '',
    email: 'admin@gameforall.com',
    password: 'admin123',
  });
  const [tradeForm, setTradeForm] = useState({
    offeredGameId: '1',
    requestedGameId: '2',
    message: 'Ready to trade',
  });
  const [messageForm, setMessageForm] = useState({
    receiverId: '',
    messageText: 'Hola, ¿te interesa un intercambio?',
  });
  const [ratingForm, setRatingForm] = useState({
    reviewedId: '',
    stars: '5',
    comment: 'Gran experiencia de intercambio.',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');

  useEffect(() => {
    localStorage.setItem('gameForAllToken', token);
  }, [token]);

  useEffect(() => {
    localStorage.setItem('gameForAllUser', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    const initialSection = getSectionFromHash();
    if (initialSection) {
      setActiveSection(initialSection);
      return;
    }

    window.history.replaceState(null, '', '#home');
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const nextSection = getSectionFromHash();
      if (nextSection) {
        setActiveSection(nextSection);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    const nextHash = `#${activeSection}`;
    if (window.location.hash !== nextHash) {
      window.history.pushState(null, '', nextHash);
    }
  }, [activeSection]);

  async function loadGames() {
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/games`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load games');
      }

      if (!Array.isArray(data)) {
        throw new Error('Unexpected games payload');
      }

      setGames(data);
      if (data.length >= 2) {
        setTradeForm((current) => ({
          ...current,
          offeredGameId: String(data[0].id),
          requestedGameId: String(data[1].id),
        }));
      }
    } catch (err) {
      setGames([]);
      setError(
        err?.message === 'Failed to load games'
          ? 'No se pudieron cargar los juegos.'
          : 'No se pudieron cargar los juegos. Verifica que el backend y la base de datos estén activos.'
      );
    }
  }

  useEffect(() => {
    loadGames();
  }, []);

  useEffect(() => {
    async function loadTrades() {
      if (!token) {
        setTrades([]);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/trades/my-trades`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          return;
        }
        const data = await response.json();
        setTrades(data);
      } catch {
        setError('No se pudieron cargar los intercambios.');
      }
    }

    loadTrades();
  }, [token]);

  const loadMessages = useCallback(async () => {
    if (!token) {
      setMessages([]);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/messages`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'No se pudieron cargar los mensajes');
      }

      setMessages(Array.isArray(data) ? data : []);
    } catch {
      setError('No se pudieron cargar los mensajes.');
    }
  }, [token]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    async function loadRatings() {
      if (!token) {
        setRatings([]);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/ratings`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json();
        setRatings(data);
      } catch {
        setError('No se pudieron cargar las valoraciones.');
      }
    }

    loadRatings();
  }, [token]);

  useEffect(() => {
    async function loadFavorites() {
      if (!token) {
        setFavorites([]);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/favorites`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json();
        setFavorites(data.map((game) => game.id));
      } catch {
        setError('No se pudieron cargar los favoritos.');
      }
    }

    loadFavorites();
  }, [token]);

  const favoriteGames = useMemo(
    () => games.filter((game) => favorites.includes(game.id)),
    [favorites, games]
  );

  const messageRecipients = useMemo(() => {
    const recipients = new Map();

    games.forEach((game) => {
      if (game.owner?.id && game.owner.id !== user?.id) {
        recipients.set(game.owner.id, game.owner);
      }
    });

    trades.forEach((trade) => {
      if (trade.owner?.id && trade.owner.id !== user?.id) {
        recipients.set(trade.owner.id, trade.owner);
      }
      if (trade.requester?.id && trade.requester.id !== user?.id) {
        recipients.set(trade.requester.id, trade.requester);
      }
    });

    return Array.from(recipients.values());
  }, [games, trades, user]);

  const ratingRecipients = useMemo(() => {
    const recipients = new Map();

    games.forEach((game) => {
      if (game.owner?.id && game.owner.id !== user?.id) {
        recipients.set(game.owner.id, game.owner);
      }
    });

    trades.forEach((trade) => {
      if (trade.owner?.id && trade.owner.id !== user?.id) {
        recipients.set(trade.owner.id, trade.owner);
      }
      if (trade.requester?.id && trade.requester.id !== user?.id) {
        recipients.set(trade.requester.id, trade.requester);
      }
    });

    return Array.from(recipients.values());
  }, [games, trades, user]);

  useEffect(() => {
    if (!messageForm.receiverId && messageRecipients.length > 0) {
      setMessageForm((current) => ({
        ...current,
        receiverId: String(messageRecipients[0].id),
      }));
    }
  }, [messageRecipients, messageForm.receiverId]);

  useEffect(() => {
    if (!ratingForm.reviewedId && ratingRecipients.length > 0) {
      setRatingForm((current) => ({
        ...current,
        reviewedId: String(ratingRecipients[0].id),
      }));
    }
  }, [ratingRecipients, ratingForm.reviewedId]);

  const visibleGames = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const platformQuery = platformFilter.toLowerCase();
    if (!query) {
      return games.filter((game) => platformFilter === 'all' || String(game.platform || '').toLowerCase().includes(platformQuery));
    }

    return games.filter((game) => {
      const haystack = [game.title, game.platform, game.genre, game.description]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      const matchesText = haystack.includes(query);
      const matchesPlatform =
        platformFilter === 'all' ||
        String(game.platform || '').toLowerCase().includes(platformQuery);
      return matchesText && matchesPlatform;
    });
  }, [games, searchQuery, platformFilter]);

  const selectedGame = useMemo(
    () => games.find((game) => game.id === selectedGameId) || null,
    [games, selectedGameId]
  );

  const currentTradeCount = trades.length;
  const hasSession = Boolean(token);
  const visibleNavItems = useMemo(
    () => navItems.filter((item) => (token ? item.id !== 'auth' : true)),
    [token]
  );
  const canEditGame = (game) => Boolean(user && (user.role === 'admin' || game.owner?.id === user.id));
  const canDeleteGame = Boolean(user?.role === 'admin');

  function startEditingGame(game) {
    setEditingGameId(game.id);
    setGameEditForm({
      title: game.title || '',
      platform: game.platform || '',
      genre: game.genre || '',
      condition: game.condition || game.state || '',
      image: game.image || '',
      description: game.description || '',
    });
    setActiveSection('games');
    setStatus('');
    setError('');
  }

  function cancelEditingGame() {
    setEditingGameId(null);
    setGameEditForm({
      title: '',
      platform: '',
      genre: '',
      condition: '',
      image: '',
      description: '',
    });
  }

  function resetGameCreateForm() {
    setGameCreateForm({
      title: '',
      platform: '',
      genre: '',
      condition: 'used',
      image: '',
      description: '',
    });
  }

  async function handleGameImageUpload(event, setForm) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setForm((current) => ({ ...current, image: dataUrl }));
    } catch (uploadError) {
      setError(uploadError.message || 'No se pudo cargar la imagen');
    }
  }

  async function toggleFavorite(gameId) {
    if (!token) {
      setActiveSection('auth');
      setError('Necesitas iniciar sesión para guardar favoritos.');
      return;
    }

    const isFavorite = favorites.includes(gameId);

    try {
      const response = await fetch(
        isFavorite
          ? `${API_BASE_URL}/favorites/${gameId}`
          : `${API_BASE_URL}/favorites`,
        {
          method: isFavorite ? 'DELETE' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: isFavorite ? undefined : JSON.stringify({ gameId }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'No se pudo actualizar el favorito');
      }

      setFavorites((current) =>
        isFavorite ? current.filter((id) => id !== gameId) : [...current, gameId]
      );
    } catch (err) {
      setError(err.message || 'No se pudo actualizar el favorito');
    }
  }

  async function handleGameUpdate(event) {
    event.preventDefault();

    if (!editingGameId) {
      return;
    }

    if (!token) {
      setActiveSection('auth');
      setError('Necesitas iniciar sesión para editar juegos.');
      return;
    }

    setLoading(true);
    setError('');
    setStatus('');

    try {
      const response = await fetch(`${API_BASE_URL}/games/${editingGameId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(gameEditForm),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'No se pudo actualizar el juego');
      }

      setStatus('Juego actualizado con éxito.');
      cancelEditingGame();
      await loadGames();
    } catch (err) {
      setError(err.message || 'Error actualizando juego');
    } finally {
      setLoading(false);
    }
  }

  async function handleGameCreate(event) {
    event.preventDefault();

    if (!token) {
      setActiveSection('auth');
      setError('Necesitas iniciar sesión para publicar un juego.');
      return;
    }

    if (!gameCreateForm.title.trim() || !gameCreateForm.platform.trim() || !gameCreateForm.genre.trim()) {
      setError('Title, platform and genre are required.');
      return;
    }

    setLoading(true);
    setError('');
    setStatus('');

    try {
      const response = await fetch(`${API_BASE_URL}/games`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: gameCreateForm.title,
          platform: gameCreateForm.platform,
          genre: gameCreateForm.genre,
          condition: gameCreateForm.condition,
          state: gameCreateForm.condition,
          image: gameCreateForm.image,
          description: gameCreateForm.description,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'No se pudo publicar el juego');
      }

      setStatus('Juego publicado con éxito.');
      setGameCreateForm({
        title: '',
        platform: '',
        genre: '',
        condition: 'used',
        image: '',
        description: '',
      });
      await loadGames();
      setActiveSection('games');
    } catch (err) {
      setError(err.message || 'Error publicando juego');
    } finally {
      setLoading(false);
    }
  }

  async function handleGameDelete(gameId) {
    if (!token) {
      setActiveSection('auth');
      setError('Necesitas iniciar sesión para eliminar juegos.');
      return;
    }

    const confirmed = window.confirm('¿Seguro que quieres eliminar este juego?');
    if (!confirmed) {
      return;
    }

    setLoading(true);
    setError('');
    setStatus('');

    try {
      const response = await fetch(`${API_BASE_URL}/games/${gameId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'No se pudo eliminar el juego');
      }

      if (editingGameId === gameId) {
        cancelEditingGame();
      }

      setStatus('Juego eliminado con éxito.');
      await loadGames();
    } catch (err) {
      setError(err.message || 'Error eliminando juego');
    } finally {
      setLoading(false);
    }
  }

  async function handleAuthSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setStatus('');

    const endpoint = authMode === 'login' ? 'login' : 'register';
    const payload =
      authMode === 'login'
        ? {
            email: authForm.email,
            password: authForm.password,
          }
        : {
            username: authForm.username,
            email: authForm.email,
            password: authForm.password,
          };

    try {
      const response = await fetch(`${API_BASE_URL}/auth/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Auth failed');
      }

      setToken(data.token);
      setUser(data.user);
      setStatus(authMode === 'login' ? 'Sesión iniciada correctamente.' : 'Usuario registrado correctamente.');
      setActiveSection('home');
    } catch (err) {
      setError(err.message || 'Error en autenticación');
    } finally {
      setLoading(false);
    }
  }

  async function handleTradeSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setStatus('');

    try {
      const response = await fetch(`${API_BASE_URL}/trades`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          offeredGameId: Number(tradeForm.offeredGameId),
          requestedGameId: Number(tradeForm.requestedGameId),
          message: tradeForm.message,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'No se pudo crear el intercambio');
      }

      setTrades((current) => [data, ...current]);
      setStatus('Intercambio creado con éxito.');
      setActiveSection('trades');
    } catch (err) {
      setError(err.message || 'Error creando intercambio');
    } finally {
      setLoading(false);
    }
  }

  async function handleMessageSubmit(event) {
    event.preventDefault();

    if (!token) {
      setActiveSection('auth');
      setError('Necesitas iniciar sesión para enviar mensajes.');
      return;
    }

    if (!messageForm.receiverId || !messageForm.messageText.trim()) {
      setError('Selecciona un destinatario y escribe un mensaje.');
      return;
    }

    setLoading(true);
    setError('');
    setStatus('');

    try {
      const response = await fetch(`${API_BASE_URL}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          receiverId: Number(messageForm.receiverId),
          messageText: messageForm.messageText,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'No se pudo enviar el mensaje');
      }

      await loadMessages();
      setStatus('Mensaje enviado con éxito.');
      setActiveSection('messages');
    } catch (err) {
      setError(err.message || 'Error enviando mensaje');
    } finally {
      setLoading(false);
    }
  }

  async function handleRatingSubmit(event) {
    event.preventDefault();

    if (!token) {
      setActiveSection('auth');
      setError('Necesitas iniciar sesión para dejar valoraciones.');
      return;
    }

    if (!ratingForm.reviewedId) {
      setError('Selecciona un usuario para valorar.');
      return;
    }

    setLoading(true);
    setError('');
    setStatus('');

    try {
      const response = await fetch(`${API_BASE_URL}/ratings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reviewedId: Number(ratingForm.reviewedId),
          stars: Number(ratingForm.stars),
          comment: ratingForm.comment,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'No se pudo guardar la valoración');
      }

      setRatings((current) => {
        const filtered = current.filter(
          (rating) =>
            rating.id !== data.id &&
            !(rating.voterId === data.voterId && rating.reviewedId === data.reviewedId)
        );
        return [data, ...filtered];
      });
      setStatus('Valoración guardada con éxito.');
      setActiveSection('ratings');
    } catch (err) {
      setError(err.message || 'Error guardando valoración');
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    setToken('');
    setUser(null);
    setTrades([]);
    setMessages([]);
    setRatings([]);
    setFavorites([]);
    setSelectedGameId(null);
    setActiveSection('home');
    setStatus('Sesión cerrada.');
  }

  function renderLandingHeader() {
    return (
      <header className="market-header">
        <div className="market-brand">
          <span className="market-mark">G</span>
          <div className="market-brand-text">
            <strong>Game For All</strong>
            <span>Marketplace de juegos</span>
          </div>
        </div>

        <label className="market-search">
          <span className="market-search-icon">⌕</span>
          <input
            type="search"
            placeholder="Buscar juegos"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </label>

        <div className="market-actions">
          <button className="market-button market-button-outline" type="button" onClick={() => setActiveSection('auth')}>
            Regístrate o inicia sesión
          </button>
          <button className="market-button market-button-solid" type="button" onClick={() => setActiveSection('auth')}>
            <span className="market-plus">+</span>
            <span>Intercambiar</span>
          </button>
        </div>
      </header>
    );
  }

  function renderCategoryStrip() {
    return (
      <nav className="category-strip" aria-label="Categorias">
        <button className="category-menu" type="button" onClick={() => setActiveSection('games')}>
          ☰
          <span>Todas las categorías</span>
        </button>

        <div className="category-links">
          {marketCategories.slice(1).map((category) => (
            <button key={category} className="category-link" type="button" onClick={() => setActiveSection('games')}>
              {category}
            </button>
          ))}
        </div>
      </nav>
    );
  }

  function openGameDetail(gameId) {
    setSelectedGameId(gameId);
    setActiveSection('detail');
  }

  function closeGameDetail() {
    setSelectedGameId(null);
    setActiveSection('games');
  }

  function renderMobileNav() {
    return (
      <nav className="mobile-nav" aria-label="Navegación principal">
        {[
          { id: 'home', label: 'Inicio', icon: '⌂' },
          { id: 'games', label: 'Explorar', icon: '⌕' },
          { id: 'publish', label: 'Publicar', icon: '+' },
          { id: 'trades', label: 'Trades', icon: '⇄' },
          { id: 'profile', label: 'Perfil', icon: '◉' },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            className={activeSection === item.id ? 'mobile-nav-item active' : 'mobile-nav-item'}
            onClick={() => setActiveSection(item.id)}
          >
            <span className="mobile-nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    );
  }

  function renderLanding() {
    return (
      <main className="content landing-content">
        {renderLandingHeader()}
        {renderCategoryStrip()}

        {status ? <div className="notice success">{status}</div> : null}
        {error ? <div className="notice error">{error}</div> : null}

        {activeSection === 'auth' ? (
          <section className="panel auth-layout auth-landing-panel">
            <div className="auth-copy">
              <span className="eyebrow">Acceso</span>
              <h3>Acceso de usuarios</h3>
            </div>

            <form className="form-card auth-card" onSubmit={handleAuthSubmit}>
              <div className="toggle-row">
                <button
                  type="button"
                  className={authMode === 'login' ? 'toggle active' : 'toggle'}
                  onClick={() => setAuthMode('login')}
                >
                  Entrar
                </button>
                <button
                  type="button"
                  className={authMode === 'register' ? 'toggle active' : 'toggle'}
                  onClick={() => setAuthMode('register')}
                >
                  Crear cuenta
                </button>
              </div>

              {authMode === 'register' ? (
                <label>
                  Username
                  <input
                    value={authForm.username}
                    onChange={(event) =>
                      setAuthForm((current) => ({ ...current, username: event.target.value }))
                    }
                    placeholder="Tu nombre"
                  />
                </label>
              ) : null}

              <label>
                Email
                <input
                  value={authForm.email}
                  onChange={(event) =>
                    setAuthForm((current) => ({ ...current, email: event.target.value }))
                  }
                  placeholder="correo@ejemplo.com"
                  type="email"
                />
              </label>

              <label>
                Password
                <input
                  value={authForm.password}
                  onChange={(event) =>
                    setAuthForm((current) => ({ ...current, password: event.target.value }))
                  }
                  placeholder="********"
                  type="password"
                />
              </label>

              <button className="primary-button" type="submit" disabled={loading}>
                {loading ? 'Procesando...' : authMode === 'login' ? 'Entrar' : 'Crear cuenta'}
              </button>
              <p className="hint">
                Cuenta demo: <strong>admin@gameforall.com</strong> / <strong>admin123</strong>
              </p>
            </form>
          </section>
        ) : null}

        <footer className="site-footer">
          <div className="footer-links">
            <a href="#contact">Contact</a>
            <a href="#about">About Us</a>
            <a href="#support">Support</a>
          </div>
          <p>@2026 Game For All</p>
        </footer>
      </main>
    );
  }

  if (!hasSession) {
    return renderLanding();
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">G</span>
          <div>
            <h1>Game For All</h1>
            <p>Marketplace de juegos</p>
          </div>
        </div>

        <nav className="nav">
          {visibleNavItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
              onClick={() => setActiveSection(item.id)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </nav>

      </aside>

      <main className="content">
        <header className="market-header market-header-dark">
          <div className="market-brand">
            <span className="market-mark">G</span>
            <div className="market-brand-text">
              <strong>Game For All</strong>
              <span>Marketplace de juegos</span>
            </div>
          </div>

          <label className="market-search market-search-dark">
            <span className="market-search-icon">⌕</span>
            <input
              type="search"
              placeholder="Buscar juegos"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </label>

          <div className="market-actions">
            {!token ? (
              <button className="market-button market-button-outline" type="button" onClick={() => setActiveSection('auth')}>
                Regístrate o inicia sesión
              </button>
            ) : (
              <>
                <button className="market-button market-button-outline" type="button" onClick={() => setActiveSection('profile')}>
                  Perfil
                </button>
                <button className="market-button market-button-outline" type="button" onClick={logout}>
                  Cerrar sesión
                </button>
              </>
            )}
            <button
              className="market-button market-button-solid"
              type="button"
              onClick={() => setActiveSection(token ? 'publish' : 'auth')}
            >
              <span className="market-plus">+</span>
              <span>Publicar juego</span>
            </button>
          </div>
        </header>

        <section className="hero">
          <div>
            <span className="eyebrow">Novedades</span>
            <h2>Intercambia juegos con estilo</h2>
            <p>Descubre, guarda y negocia juegos en una experiencia elegante y directa.</p>
            <div className="hero-actions">
              <button className="primary-button" type="button" onClick={() => setActiveSection('games')}>
                Explorar juegos
              </button>
              {!token ? (
                <button className="secondary-button" type="button" onClick={() => setActiveSection('auth')}>
                  Acceder
                </button>
              ) : (
                <>
                  <button className="secondary-button" type="button" onClick={() => setActiveSection('profile')}>
                    Perfil
                  </button>
                  <button className="secondary-button" type="button" onClick={logout}>
                    Cerrar sesión
                  </button>
                </>
              )}
            </div>
            <p className="hero-note">
              {!token ? (
                <>
                  Para entrar en tu cuenta, pulsa <strong>Acceder</strong> arriba o en el menú lateral.
                </>
              ) : (
                <>
                  Ya has iniciado sesión como <strong>{user?.username}</strong>.
                </>
              )}
            </p>
          </div>

          <div className="stats-panel">
            <div className="stat">
              <strong>{games.length}</strong>
              <span>Juegos publicados</span>
            </div>
            <div className="stat">
              <strong>{currentTradeCount}</strong>
              <span>Intercambios</span>
            </div>
            <div className="stat">
              <strong>{favoriteGames.length}</strong>
              <span>Favoritos</span>
            </div>
          </div>
        </section>

        {status ? <div className="notice success">{status}</div> : null}
        {error ? <div className="notice error">{error}</div> : null}

        {activeSection === 'home' ? (
          <section className="panel home-splash">
            <div className="splash-stage">
              <div className="splash-copy">
                <span className="eyebrow">Inicio / Splash</span>
                <h3>Game For All</h3>
                <p>Intercambia juegos, publica tus títulos y contacta con otros jugadores sin costo.</p>

                <div className="hero-actions">
                  <button className="primary-button" type="button" onClick={() => setActiveSection('games')}>
                    Explorar juegos
                  </button>
                  <button className="secondary-button" type="button" onClick={() => setActiveSection('auth')}>
                    Iniciar sesión
                  </button>
                </div>

                <div className="splash-mini-stats">
                  <div>
                    <strong>{games.length}</strong>
                    <span>Juegos listados</span>
                  </div>
                  <div>
                    <strong>{currentTradeCount}</strong>
                    <span>Intercambios</span>
                  </div>
                  <div>
                    <strong>{favorites.length}</strong>
                    <span>Favoritos</span>
                  </div>
                </div>
              </div>

              <div className="splash-visual">
                <div className="splash-card-art">
                  <span className="splash-badge">G</span>
                  <strong>Game Swapp</strong>
                  <p>Elige, compara y negocia juegos de forma sencilla.</p>
                </div>
                <div className="splash-tips">
                  <article>
                    <strong>1. Explorar</strong>
                    <span>Descubre juegos disponibles.</span>
                  </article>
                  <article>
                    <strong>2. Publicar</strong>
                    <span>Sube tu juego para intercambio.</span>
                  </article>
                  <article>
                    <strong>3. Contactar</strong>
                    <span>Escribe al propietario o crea un trade.</span>
                  </article>
                </div>
              </div>
            </div>

            <div className="spotlight-row">
              {visibleGames.slice(0, 3).map((game) => (
                <article className="spotlight-card" key={game.id}>
                  <div className="spotlight-image">
                    {game.image ? (
                      <img src={game.image} alt={game.title} />
                    ) : (
                      <div className="spotlight-fallback">
                        <span className="fallback-badge">PS</span>
                        <strong>{game.title}</strong>
                        <span>{game.platform}</span>
                      </div>
                    )}
                  </div>
                  <div className="spotlight-body">
                    <div className="spotlight-topline">
                      <strong>{game.title}</strong>
                      <span>{game.platform}</span>
                    </div>
                    <p>{game.genre}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {activeSection === 'games' ? (
          <section className="panel">
            <div className="section-header">
              <div>
                <span className="eyebrow">Catálogo</span>
                <h3>Juegos disponibles</h3>
              </div>
              <p>Explora la lista, filtra por plataforma y abre cada juego para ver su detalle.</p>
            </div>

            <div className="explore-toolbar">
              {['all', 'PS5', 'Nintendo Switch', 'Xbox'].map((platform) => (
                <button
                  key={platform}
                  type="button"
                  className={platformFilter === platform ? 'explore-chip active' : 'explore-chip'}
                  onClick={() => setPlatformFilter(platform)}
                >
                  {platform === 'all' ? 'Todas' : platform}
                </button>
              ))}
            </div>

            {editingGameId ? (
              <form className="form-card" onSubmit={handleGameUpdate}>
                <div className="section-header">
                  <div>
                    <span className="eyebrow">Editar juego</span>
                    <h3>Actualiza la ficha</h3>
                  </div>
                </div>

                <label>
                  Título
                  <input
                    value={gameEditForm.title}
                    onChange={(event) =>
                      setGameEditForm((current) => ({ ...current, title: event.target.value }))
                    }
                  />
                </label>

                <label>
                  Plataforma
                  <input
                    value={gameEditForm.platform}
                    onChange={(event) =>
                      setGameEditForm((current) => ({ ...current, platform: event.target.value }))
                    }
                  />
                </label>

                <label>
                  Género
                  <input
                    value={gameEditForm.genre}
                    onChange={(event) =>
                      setGameEditForm((current) => ({ ...current, genre: event.target.value }))
                    }
                  />
                </label>

                <label>
                  Estado
                  <select
                    value={gameEditForm.condition}
                    onChange={(event) =>
                      setGameEditForm((current) => ({ ...current, condition: event.target.value }))
                    }
                  >
                    <option value="new">New</option>
                    <option value="like_new">Like new</option>
                    <option value="used">Used</option>
                  </select>
                </label>

                <label>
                  Imagen
                  <input
                    value={gameEditForm.image}
                    onChange={(event) =>
                      setGameEditForm((current) => ({ ...current, image: event.target.value }))
                    }
                    placeholder="https://..."
                  />
                </label>

                <label>
                  Subir imagen
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => handleGameImageUpload(event, setGameEditForm)}
                  />
                </label>

                <label>
                  Descripción
                  <textarea
                    rows="4"
                    value={gameEditForm.description}
                    onChange={(event) =>
                      setGameEditForm((current) => ({ ...current, description: event.target.value }))
                    }
                  />
                </label>

                <div className="form-actions">
                  <button className="primary-button" type="submit" disabled={loading}>
                    {loading ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                  <button className="secondary-button" type="button" onClick={cancelEditingGame}>
                    Cancelar
                  </button>
                </div>
              </form>
            ) : null}

            <div className="explore-list">
              {visibleGames.map((game) => (
                <article className="game-row" key={game.id} onClick={() => openGameDetail(game.id)}>
                  <div className="game-image">
                    {game.image ? (
                      <img src={game.image} alt={game.title} />
                    ) : (
                      <div className="game-fallback">
                        <span className="fallback-badge">PS</span>
                        <strong>{game.title}</strong>
                        <span>{game.platform}</span>
                      </div>
                    )}
                  </div>
                  <div className="game-body">
                    <div className="game-topline">
                      <div className="game-title-block">
                        <strong>{game.title}</strong>
                        <span>{game.platform}</span>
                      </div>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleFavorite(game.id);
                        }}
                      >
                        {favorites.includes(game.id) ? 'Quitar favorito' : 'Favorito'}
                      </button>
                    </div>
                    <p>{game.description || 'Juego disponible para intercambio.'}</p>
                    <div className="chips">
                      <span>{game.genre}</span>
                      <span>{game.condition || 'Good'}</span>
                    </div>
                    {canEditGame(game) || canDeleteGame ? (
                      <div className="game-actions">
                        {canEditGame(game) ? (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              startEditingGame(game);
                            }}
                          >
                            Editar
                          </button>
                        ) : null}
                        {canDeleteGame ? (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleGameDelete(game.id);
                            }}
                          >
                            Eliminar
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {activeSection === 'detail' ? (
          <section className="panel detail-layout">
            <button className="detail-back" type="button" onClick={closeGameDetail}>
              ← Volver
            </button>

            {selectedGame ? (
              <>
                <div className="detail-visual">
                  {selectedGame.image ? (
                    <img src={selectedGame.image} alt={selectedGame.title} />
                  ) : (
                    <div className="detail-fallback">
                      <span className="fallback-badge">PS</span>
                      <strong>{selectedGame.title}</strong>
                    </div>
                  )}
                </div>

                <div className="detail-content">
                  <div className="detail-topline">
                    <div>
                      <span className="eyebrow">Detalle de juego</span>
                      <h3>{selectedGame.title}</h3>
                    </div>
                    <button type="button" onClick={() => toggleFavorite(selectedGame.id)}>
                      {favorites.includes(selectedGame.id) ? 'Quitar favorito' : 'Favorito'}
                    </button>
                  </div>

                  <div className="chips">
                    <span>{selectedGame.platform}</span>
                    <span>{selectedGame.genre}</span>
                    <span>{selectedGame.condition || 'used'}</span>
                  </div>

                  <p>{selectedGame.description || 'Juego disponible para intercambio.'}</p>

                  <div className="detail-owner">
                    <strong>Publicado por {selectedGame.owner?.username || 'Usuario'}</strong>
                    <span>{selectedGame.owner?.role || 'user'}</span>
                  </div>

                  <div className="form-actions">
                    <button className="primary-button" type="button" onClick={() => setActiveSection('trades')}>
                      Enviar solicitud de intercambio
                    </button>
                    <button className="secondary-button" type="button" onClick={() => setActiveSection('messages')}>
                      Contactar
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="empty-state">
                <h4>No hay juego seleccionado</h4>
                <p>Vuelve al catálogo y elige un juego para ver sus detalles.</p>
              </div>
            )}
          </section>
        ) : null}

        {activeSection === 'publish' ? (
          <section className="panel">
            <div className="section-header">
              <div>
                <span className="eyebrow">Publicar juego</span>
                <h3>Sube tu juego para intercambio</h3>
              </div>
              <p>Completa los datos y publícalo para que otros usuarios puedan verlo y escribirte.</p>
            </div>

            <form className="form-card" onSubmit={handleGameCreate}>
              <label>
                Título
                <input
                  value={gameCreateForm.title}
                  onChange={(event) =>
                    setGameCreateForm((current) => ({ ...current, title: event.target.value }))
                  }
                  placeholder="God of War Ragnarök"
                />
              </label>

              <label>
                Plataforma
                <input
                  value={gameCreateForm.platform}
                  onChange={(event) =>
                    setGameCreateForm((current) => ({ ...current, platform: event.target.value }))
                  }
                  placeholder="PS5 / Nintendo Switch / Xbox"
                />
              </label>

              <label>
                Género
                <input
                  value={gameCreateForm.genre}
                  onChange={(event) =>
                    setGameCreateForm((current) => ({ ...current, genre: event.target.value }))
                  }
                  placeholder="Action, RPG, Adventure..."
                />
              </label>

              <label>
                Estado
                <select
                  value={gameCreateForm.condition}
                  onChange={(event) =>
                    setGameCreateForm((current) => ({ ...current, condition: event.target.value }))
                  }
                >
                  <option value="new">New</option>
                  <option value="like_new">Like new</option>
                  <option value="used">Used</option>
                </select>
              </label>

              <label>
                Imagen
                <input
                  value={gameCreateForm.image}
                  onChange={(event) =>
                    setGameCreateForm((current) => ({ ...current, image: event.target.value }))
                  }
                  placeholder="https://..."
                />
              </label>

              <label>
                Subir imagen
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => handleGameImageUpload(event, setGameCreateForm)}
                />
              </label>

              <label>
                Descripción
                <textarea
                  rows="4"
                  value={gameCreateForm.description}
                  onChange={(event) =>
                    setGameCreateForm((current) => ({ ...current, description: event.target.value }))
                  }
                  placeholder="Describe el estado y lo que buscas a cambio"
                />
              </label>

              <div className="form-actions">
                <button className="primary-button" type="submit" disabled={loading || !token}>
                  {loading ? 'Publicando...' : 'Publicar juego'}
                </button>
                <button className="secondary-button" type="button" onClick={resetGameCreateForm}>
                  Limpiar
                </button>
              </div>

              {!token ? <p className="hint">Necesitas iniciar sesión para publicar un juego.</p> : null}
            </form>
          </section>
        ) : null}

        {activeSection === 'trades' ? (
          <section className="panel">
            <div className="section-header">
              <div>
                <span className="eyebrow">Intercambios</span>
                <h3>Solicitudes activas</h3>
              </div>
            </div>

            <form className="form-card" onSubmit={handleTradeSubmit}>
              <label>
                Juego ofrecido
                <select
                  value={tradeForm.offeredGameId}
                  onChange={(event) =>
                    setTradeForm((current) => ({ ...current, offeredGameId: event.target.value }))
                  }
                >
                  {games.map((game) => (
                    <option key={game.id} value={game.id}>
                      {game.title}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Juego solicitado
                <select
                  value={tradeForm.requestedGameId}
                  onChange={(event) =>
                    setTradeForm((current) => ({ ...current, requestedGameId: event.target.value }))
                  }
                >
                  {games.map((game) => (
                    <option key={game.id} value={game.id}>
                      {game.title}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Mensaje
                <textarea
                  rows="4"
                  value={tradeForm.message}
                  onChange={(event) =>
                    setTradeForm((current) => ({ ...current, message: event.target.value }))
                  }
                />
              </label>

              <button className="primary-button" type="submit" disabled={loading || !token}>
                {loading ? 'Procesando...' : 'Enviar intercambio'}
              </button>
              {!token ? <p className="hint">Necesitas iniciar sesión para crear un intercambio.</p> : null}
            </form>

            <div className="list-stack">
              {trades.map((trade) => (
                <article className="list-item" key={trade.id}>
                  <div>
                    <strong>Trade #{trade.id}</strong>
                    <p>
                      Estado: <span>{trade.status}</span>
                    </p>
                    <p>{trade.message}</p>
                  </div>
                  <div className="mini-meta">
                    <span>Offered: {trade.offeredGame?.title || trade.offeredGameId}</span>
                    <span>Requested: {trade.requestedGame?.title || trade.requestedGameId}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {activeSection === 'messages' ? (
          <section className="panel">
            <div className="section-header">
              <div>
                <span className="eyebrow">Mensajes</span>
                <h3>Conversaciones</h3>
              </div>
            </div>

            <form className="form-card" onSubmit={handleMessageSubmit}>
              <label>
                Destinatario
                <select
                  value={messageForm.receiverId}
                  onChange={(event) =>
                    setMessageForm((current) => ({ ...current, receiverId: event.target.value }))
                  }
                >
                  <option value="">Selecciona un usuario</option>
                  {messageRecipients.map((recipient) => (
                    <option key={recipient.id} value={recipient.id}>
                      {recipient.username} ({recipient.email})
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Mensaje
                <textarea
                  rows="4"
                  value={messageForm.messageText}
                  onChange={(event) =>
                    setMessageForm((current) => ({ ...current, messageText: event.target.value }))
                  }
                />
              </label>

              <button className="primary-button" type="submit" disabled={loading || !token}>
                {loading ? 'Procesando...' : 'Enviar mensaje'}
              </button>
              {!token ? <p className="hint">Necesitas iniciar sesión para enviar mensajes.</p> : null}
            </form>

            <div className="list-stack">
              {messages.length ? (
                messages.map((message) => (
                  <article className="list-item" key={message.id}>
                    <div>
                      <strong>
                        {message.sender?.username} → {message.receiver?.username}
                      </strong>
                      <p>{message.messageText}</p>
                    </div>
                    <div className="mini-meta">
                      <span>{new Date(message.sentAt).toLocaleDateString()}</span>
                    </div>
                  </article>
                ))
              ) : (
                <div className="empty-state">
                  <h4>No hay mensajes aún</h4>
                  <p>Envía tu primer mensaje para empezar una conversación.</p>
                </div>
              )}
            </div>
          </section>
        ) : null}

        {activeSection === 'ratings' ? (
          <section className="panel ratings-panel">
            <div className="section-header">
              <div>
                <span className="eyebrow">Valoraciones</span>
                <h3>Calificar usuarios</h3>
              </div>
              <p>Guarda la experiencia de cada intercambio.</p>
            </div>

            <div className="ratings-layout">
              <form className="form-card rating-form" onSubmit={handleRatingSubmit}>
                <div className="rating-badge">★</div>

                <label>
                  Usuario
                  <select
                    value={ratingForm.reviewedId}
                    onChange={(event) =>
                      setRatingForm((current) => ({ ...current, reviewedId: event.target.value }))
                    }
                  >
                    <option value="">Selecciona un usuario</option>
                    {ratingRecipients.map((recipient) => (
                      <option key={recipient.id} value={recipient.id}>
                        {recipient.username} ({recipient.email})
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Estrellas
                  <select
                    value={ratingForm.stars}
                    onChange={(event) =>
                      setRatingForm((current) => ({ ...current, stars: event.target.value }))
                    }
                  >
                    <option value="5">★★★★★ Excelente</option>
                    <option value="4">★★★★☆ Muy buena</option>
                    <option value="3">★★★☆☆ Normal</option>
                    <option value="2">★★☆☆☆ Mejorable</option>
                    <option value="1">★☆☆☆☆ Mala</option>
                  </select>
                </label>

                <label>
                  Comentario
                  <textarea
                    rows="4"
                    value={ratingForm.comment}
                    onChange={(event) =>
                      setRatingForm((current) => ({ ...current, comment: event.target.value }))
                    }
                  />
                </label>

                <button className="primary-button" type="submit" disabled={loading || !token}>
                  {loading ? 'Procesando...' : 'Guardar valoración'}
                </button>
                {!token ? <p className="hint">Necesitas iniciar sesión para valorar usuarios.</p> : null}
              </form>

              <div className="ratings-list">
                {ratings.length ? (
                  ratings.map((rating) => (
                    <article className="rating-card" key={rating.id}>
                      <div className="rating-card-top">
                        <div>
                          <strong>
                            {rating.voter?.username} → {rating.reviewed?.username}
                          </strong>
                          <p>{rating.comment || 'Sin comentario'}</p>
                        </div>
                        <div className="rating-stars">{'★'.repeat(Number(rating.stars))}</div>
                      </div>
                      <div className="mini-meta">
                        <span>{new Date(rating.createdAt).toLocaleDateString()}</span>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="empty-state">
                    <h4>No hay valoraciones aún</h4>
                    <p>Deja tu primera valoración después de un intercambio.</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        ) : null}

        {activeSection === 'favorites' ? (
          <section className="panel">
            <div className="section-header">
              <div>
                <span className="eyebrow">Favoritos</span>
                <h3>Tu lista</h3>
              </div>
            </div>

            <div className="cards-grid">
              {favoriteGames.length ? (
                favoriteGames.map((game) => (
                  <article className="game-card compact" key={game.id}>
                    <div className="game-body">
                      <h4>{game.title}</h4>
                      <p>{game.platform}</p>
                      <button type="button" onClick={() => toggleFavorite(game.id)}>
                        Quitar
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <div className="empty-state">
                  <h4>No hay favoritos aún</h4>
                  <p>Ve a explorar juegos y marca algunos como favoritos.</p>
                </div>
              )}
            </div>
          </section>
        ) : null}

        {activeSection === 'profile' ? (
          <section className="panel profile-layout">
            <div className="profile-card">
              <span className="eyebrow">Perfil</span>
              <h3>{user ? user.username : 'Invitado'}</h3>
              <p>{user ? user.email : 'Inicia sesión para ver tu información.'}</p>
              <div className="chips">
                <span>{user?.role || 'guest'}</span>
                <span>{token ? 'Sesión activa' : 'Sin sesión'}</span>
              </div>
              <button className="secondary-button" type="button" onClick={logout} disabled={!token}>
                Cerrar sesión
              </button>
            </div>
          </section>
        ) : null}

        {renderMobileNav()}

        {activeSection === 'auth' ? (
          <section className="panel auth-layout">
            <div className="auth-copy">
              <span className="eyebrow">Acceso</span>
              <h3>Acceso de usuarios</h3>
            </div>

            <form className="form-card auth-card" onSubmit={handleAuthSubmit}>
              <div className="toggle-row">
                <button
                  type="button"
                  className={authMode === 'login' ? 'toggle active' : 'toggle'}
                  onClick={() => setAuthMode('login')}
                >
                  Entrar
                </button>
                <button
                  type="button"
                  className={authMode === 'register' ? 'toggle active' : 'toggle'}
                  onClick={() => setAuthMode('register')}
                >
                  Crear cuenta
                </button>
              </div>

              {authMode === 'register' ? (
                <label>
                  Username
                  <input
                    value={authForm.username}
                    onChange={(event) =>
                      setAuthForm((current) => ({ ...current, username: event.target.value }))
                    }
                    placeholder="Tu nombre"
                  />
                </label>
              ) : null}

              <label>
                Email
                <input
                  value={authForm.email}
                  onChange={(event) =>
                    setAuthForm((current) => ({ ...current, email: event.target.value }))
                  }
                  placeholder="correo@ejemplo.com"
                  type="email"
                />
              </label>

              <label>
                Password
                <input
                  value={authForm.password}
                  onChange={(event) =>
                    setAuthForm((current) => ({ ...current, password: event.target.value }))
                  }
                  placeholder="********"
                  type="password"
                />
              </label>

              <button className="primary-button" type="submit" disabled={loading}>
                {loading ? 'Procesando...' : authMode === 'login' ? 'Entrar' : 'Crear cuenta'}
              </button>
              <p className="hint">
                Cuenta demo: <strong>admin@gameforall.com</strong> / <strong>admin123</strong>
              </p>
            </form>
          </section>
        ) : null}

        <footer className="site-footer">
          <div className="footer-links">
            <a href="#contact">Contact</a>
            <a href="#about">About Us</a>
            <a href="#support">Support</a>
          </div>
          <p>@2026 Game For All</p>
        </footer>
      </main>
    </div>
  );
}

export default App;
