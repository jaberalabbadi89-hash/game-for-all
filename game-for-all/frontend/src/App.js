import { useEffect, useMemo, useRef, useState } from 'react';
import { io as socketIO } from 'socket.io-client';
import './App.css';
import { useRBAC } from './hooks/useRBAC';
import { HeroSection } from './components/games/HeroSection';
import { GameCard } from './components/games/GameCard';

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
  const [rejectModal, setRejectModal] = useState({
    open: false,
    tradeId: null,
    reason: '',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [myGames, setMyGames] = useState([]);
  const [profileTab, setProfileTab] = useState('games');
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedUser, setSelectedUser] = useState(null);

  // Socket.io ref — persists across renders without triggering re-renders
  const socketRef = useRef(null);
  const chatEndRef = useRef(null);



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
        // 🔍 DEBUG: log status if not OK
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          console.error('[DEBUG] loadTrades — HTTP', response.status, response.url, errData);
          return;
        }
        const data = await response.json();
        setTrades(data);
      } catch (error) {
        console.error('[DEBUG] loadTrades — Full error:', error?.message || error);
        setError('No se pudieron cargar los intercambios.');
      }
    }

    loadTrades();
  }, [token]);

  useEffect(() => {
    if (!token) {
      setMessages([]);
      return;
    }

    async function fetchMessages() {
      try {
        const response = await fetch(`${API_BASE_URL}/messages`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        // 🔍 DEBUG: log status + full response before throwing
        if (!response.ok) {
          console.error('[DEBUG] fetchMessages — HTTP', response.status, response.url, data);
          throw new Error(data.error || 'Error cargando mensajes');
        }
        setMessages(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('[DEBUG] fetchMessages — Full error:', error?.response?.data || error?.message || error);
        setError('No se pudieron cargar los mensajes.');
      }
    }

    fetchMessages();
  // Se dispara al hacer login/logout (token) y al abrir la sección de mensajes (activeSection)
  }, [token, activeSection]);



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

  // Load my games when profile is opened
  useEffect(() => {
    async function loadMyGames() {
      if (!token || activeSection !== 'profile') {
        return;
      }
      try {
        const response = await fetch(`${API_BASE_URL}/games/my-games`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setMyGames(Array.isArray(data) ? data : []);
        }
      } catch {
        // silent
      }
    }
    loadMyGames();
  }, [token, activeSection]);

  // ── Socket.io: Real-Time Private Messaging ────────────────────────────────
  useEffect(() => {
    if (!user?.id) return; // Only connect when logged in

    const SOCKET_URL = process.env.REACT_APP_API_URL
      ? process.env.REACT_APP_API_URL.replace('/api', '')
      : 'http://localhost:5000';

    // Connect to Socket.io server
    const socket = socketIO(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Socket.io] Connected:', socket.id);
      // Join the user's private room so ONLY they receive their messages
      socket.emit('join_room', user.id);
    });

    // Optimistic UI: append message directly to state — NO full API refetch
    socket.on('receive_message', (newMsg) => {
      console.log('[Socket.io] Real-time message received:', newMsg);
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [newMsg, ...prev];
      });
      // Increment unread badge unless user is already on messages tab
      setUnreadCount((c) => c + 1);
    });

    socket.on('disconnect', () => {
      console.log('[Socket.io] Disconnected');
    });

    socket.on('connect_error', (err) => {
      console.warn('[Socket.io] Connection error:', err.message);
    });

    // Cleanup: remove listeners and disconnect — prevents memory leaks
    return () => {
      socket.off('receive_message');
      socket.off('connect');
      socket.off('disconnect');
      socket.disconnect();
      socketRef.current = null;
      console.log('[Socket.io] Cleaned up');
    };
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset unread badge when user opens Messages tab in profile
  useEffect(() => {
    if (activeSection === 'profile' && profileTab === 'messages') {
      setUnreadCount(0);
    }
  }, [activeSection, profileTab]);

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

  const conversations = useMemo(() => {
    if (!user || !messages) return [];
    const map = new Map();
    // messages is sorted DESC (newest first)
    messages.forEach(msg => {
      const partner = msg.senderId === user.id ? msg.receiver : msg.sender;
      if (!partner || !partner.id) return;
      if (!map.has(partner.id)) {
        map.set(partner.id, {
          user: partner,
          lastMessage: msg
        });
      }
    });
    if (selectedUser && !map.has(selectedUser.id)) {
      map.set(selectedUser.id, {
        user: selectedUser,
        lastMessage: null
      });
    }
    return Array.from(map.values());
  }, [messages, user, selectedUser]);

  const activeChatMessages = useMemo(() => {
    if (!user || !selectedUser) return [];
    return messages
      .filter(msg =>
        (msg.senderId === user.id && msg.receiverId === selectedUser.id) ||
        (msg.senderId === selectedUser.id && msg.receiverId === user.id)
      )
      .sort((a, b) => new Date(a.sentAt) - new Date(b.sentAt));
  }, [messages, user, selectedUser]);

  const activeTrade = useMemo(() => {
    if (!user || !selectedUser) return null;
    return trades.find(t =>
      t.status === 'pending' &&
      (
        (t.requesterId === user.id && t.ownerId === selectedUser.id) ||
        (t.requesterId === selectedUser.id && t.ownerId === user.id)
      )
    );
  }, [trades, user, selectedUser]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeChatMessages]);

  // Automatically select conversation partner when messageForm.receiverId is changed by an external trigger (like contact button)
  useEffect(() => {
    if (messageForm.receiverId) {
      const rId = Number(messageForm.receiverId);
      if (selectedUser?.id === rId) return;
      const found = messageRecipients.find(r => r.id === rId);
      if (found) {
        setSelectedUser(found);
      } else {
        // Fallback search in messages
        let fallbackUser = null;
        for (const msg of messages) {
          if (msg.senderId === rId) { fallbackUser = msg.sender; break; }
          if (msg.receiverId === rId) { fallbackUser = msg.receiver; break; }
        }
        setSelectedUser(fallbackUser || { id: rId, username: `Usuario #${rId}` });
      }
    }
  }, [messageForm.receiverId, messageRecipients, messages]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const currentUserId = user ? (user.id || user.id_user) : null;
  const pendingIncomingTradesCount = trades.filter(t => (t.ownerId || t.id_receiver) === currentUserId && t.status === 'pending').length;

  const { requireAuth, canEditGame, canDeleteGame } = useRBAC(user, token, setStatus, setActiveSection);

  const visibleNavItems = useMemo(
    () => navItems.filter((item) => {
      if (token && item.id === 'auth') return false;
      if (!token && item.id === 'profile') return false;
      return true;
    }),
    [token]
  );

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
    if (!hasSession) {
      requireAuth(() => {});
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

  async function updateTradeStatus(tradeId, newStatus, rejectionReason = '') {
    setLoading(true);
    setError('');
    setStatus('');

    try {
      // ── Uses the new semantic PUT /:id/status endpoint ──────────────────
      const body = { status: newStatus };
      if (newStatus === 'rejected' && rejectionReason) {
        body.rejection_reason = rejectionReason;
      }

      const response = await fetch(`${API_BASE_URL}/trades/${tradeId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'No se pudo actualizar el intercambio');
      }

      // ── Re-fetch from Backend to get updated computed fields ────────────
      // (Never trust optimistic update — Backend is the source of truth)
      const refreshed = await fetch(`${API_BASE_URL}/trades`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (refreshed.ok) {
        const refreshedData = await refreshed.json();
        setTrades(refreshedData);
      }

      const statusLabels = {
        accepted: 'Intercambio aceptado ✅',
        rejected: 'Intercambio rechazado ❌',
        cancelled: 'Intercambio cancelado',
        completed: 'Intercambio completado 🎉',
      };
      setStatus(statusLabels[newStatus] || `Estado actualizado: ${newStatus}`);
      setRejectModal({ open: false, tradeId: null, reason: '' });
    } catch (err) {
      setError(err.message || 'Error actualizando intercambio');
    } finally {
      setLoading(false);
    }
  }

  async function handleMessageSubmit(event) {
    event.preventDefault();

    if (!token || !user) {
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
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('send_message', {
          senderId: user.id,
          receiverId: Number(messageForm.receiverId),
          messageText: messageForm.messageText,
        });
        setMessageForm((f) => ({ ...f, messageText: '' }));
      } else {
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

        setMessages((prev) => {
          if (prev.some((m) => m.id === data.id)) return prev;
          return [data, ...prev];
        });
        setMessageForm((f) => ({ ...f, messageText: '' }));
      }
      setStatus('Mensaje enviado.');
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
    setSelectedUser(null);
    setRatings([]);
    setFavorites([]);
    setSelectedGameId(null);
    setActiveSection('home');
    setStatus('Sesión cerrada.');
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
              onClick={() => {
                if (!hasSession && ['trades', 'messages', 'publish'].includes(item.id)) {
                  requireAuth(() => {});
                } else {
                  setActiveSection(item.id);
                }
              }}
            >
            <span className="mobile-nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    );
  }



  // Guest access is now allowed natively

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
              onClick={() => {
                if (!hasSession && ['trades', 'messages', 'publish'].includes(item.id)) {
                  requireAuth(() => {});
                } else {
                  setActiveSection(item.id);
                }
              }}
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {hasSession && (
              <div
                className="notification-bell"
                style={{ position: 'relative', cursor: 'pointer', fontSize: '1.4rem' }}
                onClick={() => requireAuth(() => setActiveSection('messages'))}
                title="Notificaciones"
              >
                🔔
                {pendingIncomingTradesCount > 0 && (
                  <span style={{ position: 'absolute', top: '-6px', right: '-8px', backgroundColor: '#dc3545', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                    {pendingIncomingTradesCount}
                  </span>
                )}
              </div>
            )}
            <label className="market-search market-search-dark" style={{ margin: 0 }}>
              <span className="market-search-icon">⌕</span>
              <input
                type="search"
                placeholder="Buscar juegos"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </label>
          </div>

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
              onClick={() => requireAuth(() => setActiveSection('publish'))}
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
          <HeroSection 
            user={user}
            token={token}
            gamesCount={games.length}
            activeTradesCount={currentTradeCount}
            setActiveSection={setActiveSection}
          />
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
              {visibleGames.map((game) => (
                <GameCard 
                  key={game.id}
                  game={game}
                  favorites={favorites}
                  toggleFavorite={toggleFavorite}
                  onTradeClick={() => requireAuth(() => {
                    setSelectedGameId(game.id);
                    setTradeForm(f => ({ ...f, requestedGameId: String(game.id) }));
                    setActiveSection('trades');
                  })}
                  onMessageClick={() => requireAuth(() => {
                    setMessageForm(f => ({ ...f, receiverId: String(game.owner?.id || '') }));
                    setActiveSection('messages');
                  })}
                  canEditGame={canEditGame}
                  canDeleteGame={canDeleteGame}
                  onEditClick={startEditingGame}
                  onDeleteClick={handleGameDelete}
                  onImageClick={() => openGameDetail(game.id)}
                />
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
                <h3>Mis Solicitudes de Intercambio</h3>
              </div>
              <p>Gestiona tus ofertas y solicitudes recibidas.</p>
            </div>

            {/* ── Rejection reason modal ─────────────────────────────────── */}
            {rejectModal.open && (
              <div style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 9999,
              }}>
                <div style={{
                  background: '#1f1f2e', borderRadius: '16px', padding: '2rem',
                  width: '100%', maxWidth: '440px', border: '1px solid rgba(255,255,255,0.1)',
                }}>
                  <h4 style={{ color: '#fff', marginBottom: '1rem' }}>❌ Motivo del rechazo</h4>
                  <textarea
                    rows="4"
                    placeholder="Escribe el motivo del rechazo (opcional)..."
                    value={rejectModal.reason}
                    onChange={(e) => setRejectModal((m) => ({ ...m, reason: e.target.value }))}
                    style={{
                      width: '100%', padding: '10px', borderRadius: '8px',
                      background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
                      color: '#fff', marginBottom: '1.2rem', resize: 'vertical',
                    }}
                  />
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => setRejectModal({ open: false, tradeId: null, reason: '' })}
                      style={{ padding: '8px 18px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', cursor: 'pointer' }}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => updateTradeStatus(rejectModal.tradeId, 'rejected', rejectModal.reason)}
                      disabled={loading}
                      style={{ padding: '8px 18px', borderRadius: '8px', background: '#dc3545', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      {loading ? 'Rechazando...' : 'Confirmar rechazo'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Create new trade form ──────────────────────────────────── */}
            <form className="form-card" onSubmit={handleTradeSubmit}>
              <div className="section-header">
                <div>
                  <span className="eyebrow">Nueva solicitud</span>
                  <h3>Proponer un intercambio</h3>
                </div>
              </div>

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
                  rows="3"
                  value={tradeForm.message}
                  onChange={(event) =>
                    setTradeForm((current) => ({ ...current, message: event.target.value }))
                  }
                />
              </label>

              <button className="primary-button" type="submit" disabled={loading || !token}>
                {loading ? 'Procesando...' : 'Enviar solicitud'}
              </button>
              {!token ? <p className="hint">Necesitas iniciar sesión para crear un intercambio.</p> : null}
            </form>

            {/* ── Inbox: Backend-Driven Authorization UI ────────────────── */}
            <div className="trades-split" style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginTop: '2rem' }}>

              {/* ── INCOMING ────────────────────── */}
              <div style={{ flex: '1 1 45%' }}>
                <h4 style={{ marginBottom: '1rem', color: '#a78bfa' }}>📥 Solicitudes Recibidas</h4>
                <div className="list-stack">
                  {trades.filter(t => t.is_receiver).length === 0 ? (
                    <p className="hint">No tienes solicitudes de intercambio recibidas.</p>
                  ) : trades.filter(t => t.is_receiver).map((trade) => (
                    <article className="list-item" key={trade.id} style={{
                      borderLeft: `4px solid ${
                        trade.status === 'pending'  ? '#ffc107' :
                        trade.status === 'accepted' ? '#28a745' :
                        trade.status === 'rejected' ? '#dc3545' : '#6c757d'
                      }`,
                    }}>
                      <div style={{ marginBottom: '8px' }}>
                        <strong style={{ color: '#fff' }}>#{trade.id} — {trade.requester?.username}</strong>
                        <span style={{
                          marginLeft: '12px', fontSize: '0.8em', fontWeight: 'bold',
                          textTransform: 'uppercase', padding: '2px 8px', borderRadius: '4px',
                          background: trade.status === 'pending' ? '#ffc10722' : trade.status === 'accepted' ? '#28a74522' : '#dc354522',
                          color: trade.status === 'pending' ? '#ffc107' : trade.status === 'accepted' ? '#28a745' : '#dc3545',
                        }}>
                          {trade.status === 'pending'  ? '⏳ Pendiente' :
                           trade.status === 'accepted' ? '✅ Aceptado' :
                           trade.status === 'rejected' ? '❌ Rechazado' : trade.status}
                        </span>
                      </div>

                      <div className="mini-meta" style={{ marginBottom: '10px' }}>
                        <span>Ofrece: <strong>{trade.offeredGame?.title}</strong></span>
                        <span>Solicita: <strong>{trade.requestedGame?.title}</strong></span>
                      </div>

                      {trade.message ? (
                        <p style={{ color: '#ccc', fontSize: '0.9em', marginBottom: '10px', fontStyle: 'italic' }}>
                          "{trade.message}"
                        </p>
                      ) : null}

                      {trade.can_take_action ? (
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => updateTradeStatus(trade.id, 'accepted')}
                            disabled={loading}
                            style={{ background: '#28a745', color: '#fff', padding: '7px 16px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                          >
                            ✅ Aceptar
                          </button>
                          <button
                            onClick={() => setRejectModal({ open: true, tradeId: trade.id, reason: '' })}
                            disabled={loading}
                            style={{ background: '#dc3545', color: '#fff', padding: '7px 16px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                          >
                            ❌ Rechazar
                          </button>
                        </div>
                      ) : trade.status === 'accepted' ? (
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => updateTradeStatus(trade.id, 'completed')}
                            disabled={loading}
                            style={{ background: '#007bff', color: '#fff', padding: '7px 16px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                          >
                            🎉 Marcar como completado
                          </button>
                          <button
                            onClick={() => {
                              setMessageForm((f) => ({ ...f, receiverId: String(trade.requester?.id || '') }));
                              setActiveSection('messages');
                            }}
                            style={{ background: '#6c5ce7', color: '#fff', padding: '7px 16px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                          >
                            💬 Enviar mensaje
                          </button>
                        </div>
                      ) : null}
                    </article>
                  ))}
                </div>
              </div>

              {/* ── OUTGOING ───────────────────── */}
              <div style={{ flex: '1 1 45%' }}>
                <h4 style={{ marginBottom: '1rem', color: '#60a5fa' }}>📤 Solicitudes Enviadas</h4>
                <div className="list-stack">
                  {trades.filter(t => !t.is_receiver).length === 0 ? (
                    <p className="hint">No has enviado ninguna solicitud de intercambio.</p>
                  ) : trades.filter(t => !t.is_receiver).map((trade) => (
                    <article className="list-item" key={trade.id} style={{
                      borderLeft: `4px solid ${
                        trade.status === 'pending'  ? '#ffc107' :
                        trade.status === 'accepted' ? '#28a745' :
                        trade.status === 'rejected' ? '#dc3545' : '#6c757d'
                      }`,
                    }}>
                      <div style={{ marginBottom: '8px' }}>
                        <strong style={{ color: '#fff' }}>#{trade.id} — Para: {trade.owner?.username}</strong>
                        <span style={{
                          marginLeft: '12px', fontSize: '0.8em', fontWeight: 'bold',
                          textTransform: 'uppercase', padding: '2px 8px', borderRadius: '4px',
                          background: trade.status === 'pending' ? '#ffc10722' : trade.status === 'accepted' ? '#28a74522' : '#dc354522',
                          color: trade.status === 'pending' ? '#ffc107' : trade.status === 'accepted' ? '#28a745' : '#dc3545',
                        }}>
                          {trade.status === 'pending'  ? '⏳ Pendiente' :
                           trade.status === 'accepted' ? '✅ Aceptado' :
                           trade.status === 'rejected' ? '❌ Rechazado' : trade.status}
                        </span>
                      </div>

                      <div className="mini-meta" style={{ marginBottom: '10px' }}>
                        <span>Ofreces: <strong>{trade.offeredGame?.title}</strong></span>
                        <span>Quieres: <strong>{trade.requestedGame?.title}</strong></span>
                      </div>

                      {trade.message ? (
                        <p style={{ color: '#ccc', fontSize: '0.9em', marginBottom: '10px', fontStyle: 'italic' }}>
                          "{trade.message}"
                        </p>
                      ) : null}

                      {/* Sender can only cancel a pending trade */}
                      {trade.status === 'pending' ? (
                        <button
                          onClick={() => updateTradeStatus(trade.id, 'cancelled')}
                          disabled={loading}
                          style={{ background: '#6c757d', color: '#fff', padding: '7px 16px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                        >
                          Cancelar solicitud
                        </button>
                      ) : trade.status === 'accepted' ? (
                        <button
                          onClick={() => {
                            setMessageForm((f) => ({ ...f, receiverId: String(trade.owner?.id || '') }));
                            setActiveSection('messages');
                          }}
                          style={{ background: '#6c5ce7', color: '#fff', padding: '7px 16px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                        >
                          💬 Enviar mensaje al propietario
                        </button>
                      ) : null}
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {activeSection === 'messages' ? (
          <section className="panel">
            <div className="section-header">
              <div>
                <span className="eyebrow">Notificaciones</span>
                <h3>Mensajes y Solicitudes</h3>
              </div>
            </div>

            <div className="list-stack" style={{ marginBottom: '2.5rem' }}>
              <h4 style={{ marginBottom: '1rem', color: '#333' }}>Nuevas Solicitudes de Intercambio</h4>
              {trades.filter(t => (t.ownerId || t.id_receiver) === currentUserId && t.status === 'pending').length > 0 ? (
                trades.filter(t => (t.ownerId || t.id_receiver) === currentUserId && t.status === 'pending').map((trade) => (
                  <article className="list-item" key={`notif-${trade.id}`} style={{ backgroundColor: '#fff3cd', borderLeft: '4px solid #ffc107', padding: '15px' }}>
                    <div>
                      <strong style={{ color: '#856404' }}>¡Tienes una nueva solicitud de intercambio!</strong>
                      <p style={{ margin: '8px 0', color: '#555' }}>
                        Han solicitado tu juego <strong>{trade.requestedGame?.title || trade.requestedGameId}</strong> a cambio de <strong>{trade.offeredGame?.title || trade.offeredGameId}</strong>.
                      </p>
                      <button
                        style={{ marginTop: '5px', backgroundColor: '#007bff', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                        onClick={() => setActiveSection('trades')}
                      >
                        Ver intercambio
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <p className="hint">No tienes nuevas solicitudes de intercambio.</p>
              )}
            </div>

            <h4 style={{ marginBottom: '1rem', color: '#333' }}>Enviar Mensaje</h4>
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
            {/* ── Header del Perfil ─────────────────────────────────── */}
            <div className="profile-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                <div style={{
                  width: '64px', height: '64px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6c5ce7, #a78bfa)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.8rem', fontWeight: 'bold', color: '#fff', flexShrink: 0,
                }}>
                  {(user?.username?.[0] || '?').toUpperCase()}
                </div>
                <div>
                  <span className="eyebrow">Perfil</span>
                  <h3 style={{ margin: 0 }}>{user ? user.username : 'Invitado'}</h3>
                  <p style={{ margin: 0, opacity: 0.7, fontSize: '0.9rem' }}>{user ? user.email : 'Inicia sesión para ver tu información.'}</p>
                  <div className="chips" style={{ marginTop: '6px' }}>
                    <span>{user?.role || 'guest'}</span>
                    <span>{token ? '🟢 Sesión activa' : '🔴 Sin sesión'}</span>
                  </div>
                </div>
              </div>

              {/* Estadísticas rápidas */}
              <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center', padding: '0.8rem 1.5rem', background: 'rgba(108,92,231,0.15)', borderRadius: '12px', border: '1px solid rgba(108,92,231,0.3)' }}>
                  <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#a78bfa' }}>{myGames.length}</div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Mis juegos</div>
                </div>
                <div style={{ textAlign: 'center', padding: '0.8rem 1.5rem', background: 'rgba(253,203,110,0.15)', borderRadius: '12px', border: '1px solid rgba(253,203,110,0.3)' }}>
                  <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#fdcb6e' }}>{trades.filter(t => t.is_receiver && t.status === 'pending').length}</div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Deuotes recibidas</div>
                </div>
                <div style={{ textAlign: 'center', padding: '0.8rem 1.5rem', background: 'rgba(0,206,201,0.15)', borderRadius: '12px', border: '1px solid rgba(0,206,201,0.3)' }}>
                  <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#00cec9' }}>{messages.length}</div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Mensajes</div>
                </div>
                <div style={{ textAlign: 'center', padding: '0.8rem 1.5rem', background: 'rgba(232,67,147,0.15)', borderRadius: '12px', border: '1px solid rgba(232,67,147,0.3)' }}>
                  <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#e84393' }}>{favoriteGames.length}</div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Favoritos</div>
                </div>
              </div>

              <button className="secondary-button" style={{ marginTop: '1.5rem' }} type="button" onClick={logout} disabled={!token}>
                Cerrar sesión
              </button>
            </div>

            {/* ── Tabs de navegación ────────────────────────────────── */}
            {hasSession && (
              <>
                <div style={{
                  display: 'flex', gap: '6px', margin: '2rem 0 1.5rem',
                  borderBottom: '2px solid rgba(255,255,255,0.08)', paddingBottom: '0',
                }}>
                  {[
                    { id: 'games',    icon: '🎮', label: 'Mis Juegos' },
                    { id: 'incoming', icon: '📥', label: `Deuotes recibidas ${trades.filter(t => t.is_receiver && t.status === 'pending').length > 0 ? `(${trades.filter(t => t.is_receiver && t.status === 'pending').length})` : ''}` },
                    { id: 'outgoing', icon: '📤', label: 'Mis deuotes' },
                    { id: 'messages', icon: '💬', label: unreadCount > 0 ? `Mensajes (${unreadCount} 🔴)` : 'Mensajes' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setProfileTab(tab.id)}
                      style={{
                        padding: '10px 18px', border: 'none', cursor: 'pointer',
                        fontSize: '0.9rem', fontWeight: profileTab === tab.id ? '700' : '400',
                        background: 'transparent',
                        color: profileTab === tab.id ? '#a78bfa' : 'rgba(255,255,255,0.5)',
                        borderBottom: profileTab === tab.id ? '2px solid #a78bfa' : '2px solid transparent',
                        marginBottom: '-2px', borderRadius: '0', transition: 'all 0.2s',
                      }}
                    >
                      {tab.icon} {tab.label}
                    </button>
                  ))}
                </div>

                {/* ── Tab: Mis Juegos ─────────────────────────────── */}
                {profileTab === 'games' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                      <h4 style={{ margin: 0 }}>🎮 Juegos que he publicado</h4>
                      <button
                        className="primary-button"
                        type="button"
                        style={{ padding: '8px 18px', fontSize: '0.9rem' }}
                        onClick={() => setActiveSection('publish')}
                      >
                        + Publicar nuevo
                      </button>
                    </div>
                    {myGames.length === 0 ? (
                      <div className="empty-state">
                        <h4>No tienes juegos publicados</h4>
                        <p>Publica tu primer juego para que otros usuarios puedan enviarte deuotes de intercambio.</p>
                        <button className="primary-button" type="button" onClick={() => setActiveSection('publish')}>
                          Publicar primer juego
                        </button>
                      </div>
                    ) : (
                      <div className="cards-grid">
                        {myGames.map(game => (
                          <article key={game.id} style={{
                            background: 'rgba(255,255,255,0.04)', borderRadius: '14px',
                            border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden',
                            transition: 'transform 0.2s',
                          }}>
                            {game.image ? (
                              <img
                                src={game.image}
                                alt={game.title}
                                style={{ width: '100%', height: '140px', objectFit: 'cover' }}
                              />
                            ) : (
                              <div style={{
                                height: '140px', background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '2.5rem',
                              }}>🎮</div>
                            )}
                            <div style={{ padding: '1rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                                <strong style={{ fontSize: '0.95rem' }}>{game.title}</strong>
                                <span style={{
                                  fontSize: '0.75rem', padding: '2px 8px', borderRadius: '20px',
                                  background: '#a78bfa22', color: '#a78bfa', fontWeight: '600',
                                }}>{game.platform}</span>
                              </div>
                              <p style={{ fontSize: '0.82rem', opacity: 0.6, margin: '0 0 12px' }}>{game.description || 'Sin descripción'}</p>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                  type="button"
                                  onClick={() => startEditingGame(game)}
                                  style={{
                                    flex: 1, padding: '7px', border: '1px solid rgba(167,139,250,0.4)',
                                    borderRadius: '8px', background: 'transparent', color: '#a78bfa',
                                    cursor: 'pointer', fontSize: '0.82rem',
                                  }}
                                >
                                  ✏️ Editar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleGameDelete(game.id)}
                                  style={{
                                    flex: 1, padding: '7px', border: '1px solid rgba(220,53,69,0.4)',
                                    borderRadius: '8px', background: 'transparent', color: '#dc3545',
                                    cursor: 'pointer', fontSize: '0.82rem',
                                  }}
                                >
                                  🗑️ Eliminar
                                </button>
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Tab: Deuotes recibidas ───────────────────────── */}
                {profileTab === 'incoming' && (
                  <div>
                    <h4 style={{ marginBottom: '1.2rem' }}>📥 Alguien quiere intercambiar contigo</h4>
                    {trades.filter(t => t.is_receiver).length === 0 ? (
                      <div className="empty-state">
                        <h4>No has recibido deuotes aún</h4>
                        <p>Cuando alguien quiera uno de tus juegos, te aparecerá aquí para que puedas aceptar o rechazar.</p>
                      </div>
                    ) : (
                      <div className="list-stack">
                        {trades.filter(t => t.is_receiver).map(trade => (
                          <article key={trade.id} className="list-item" style={{
                            borderLeft: `4px solid ${
                              trade.status === 'pending'  ? '#ffc107' :
                              trade.status === 'accepted' ? '#28a745' :
                              trade.status === 'rejected' ? '#dc3545' : '#6c757d'
                            }`,
                            padding: '1.2rem',
                          }}>
                            {/* Cabecera */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                              <div>
                                <strong style={{ color: '#fff', fontSize: '1rem' }}>
                                  👤 {trade.requester?.username} quiere tu juego
                                </strong>
                                <p style={{ margin: '4px 0 0', color: '#ccc', fontSize: '0.88rem' }}>
                                  Te ofrece <strong style={{ color: '#a78bfa' }}>«{trade.offeredGame?.title}»</strong> a cambio de <strong style={{ color: '#fdcb6e' }}>«{trade.requestedGame?.title}»</strong>
                                </p>
                              </div>
                              <span style={{
                                fontSize: '0.75rem', padding: '3px 10px', borderRadius: '20px', fontWeight: '700',
                                background: trade.status === 'pending' ? '#ffc10722' : trade.status === 'accepted' ? '#28a74522' : '#dc354522',
                                color: trade.status === 'pending' ? '#ffc107' : trade.status === 'accepted' ? '#28a745' : '#dc3545',
                                whiteSpace: 'nowrap',
                              }}>
                                {trade.status === 'pending' ? '⏳ Pendiente' : trade.status === 'accepted' ? '✅ Aceptado' : trade.status === 'rejected' ? '❌ Rechazado' : trade.status}
                              </span>
                            </div>

                            {trade.message && (
                              <p style={{ color: '#bbb', fontSize: '0.85rem', fontStyle: 'italic', margin: '0 0 12px', padding: '8px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                                💬 "{trade.message}"
                              </p>
                            )}

                            {/* Acciones */}
                            {trade.can_take_action ? (
                              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                <button
                                  onClick={() => updateTradeStatus(trade.id, 'accepted')}
                                  disabled={loading}
                                  style={{ padding: '9px 22px', borderRadius: '8px', background: '#28a745', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}
                                >
                                  ✅ Aceptar deuote
                                </button>
                                <button
                                  onClick={() => setRejectModal({ open: true, tradeId: trade.id, reason: '' })}
                                  disabled={loading}
                                  style={{ padding: '9px 22px', borderRadius: '8px', background: '#dc3545', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}
                                >
                                  ❌ Rechazar
                                </button>
                                <button
                                  onClick={() => {
                                    setMessageForm(f => ({ ...f, receiverId: String(trade.requester?.id || '') }));
                                    setProfileTab('messages');
                                  }}
                                  style={{ padding: '9px 22px', borderRadius: '8px', background: '#6c5ce7', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.9rem' }}
                                >
                                  💬 Contactar
                                </button>
                              </div>
                            ) : trade.status === 'accepted' ? (
                              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                <button
                                  onClick={() => updateTradeStatus(trade.id, 'completed')}
                                  disabled={loading}
                                  style={{ padding: '9px 22px', borderRadius: '8px', background: '#007bff', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}
                                >
                                  🎉 Marcar como completado
                                </button>
                              </div>
                            ) : null}
                          </article>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Tab: Mis deuotes enviadas ───────────────────── */}
                {profileTab === 'outgoing' && (
                  <div>
                    <h4 style={{ marginBottom: '1.2rem' }}>📤 Deuotes que he enviado</h4>
                    {trades.filter(t => !t.is_receiver).length === 0 ? (
                      <div className="empty-state">
                        <h4>No has enviado deuotes aún</h4>
                        <p>Ve a explorar juegos y haz clic en el botón de intercambio para proponer un trato.</p>
                        <button className="primary-button" type="button" onClick={() => setActiveSection('games')}>
                          Explorar juegos
                        </button>
                      </div>
                    ) : (
                      <div className="list-stack">
                        {trades.filter(t => !t.is_receiver).map(trade => (
                          <article key={trade.id} className="list-item" style={{
                            borderLeft: `4px solid ${
                              trade.status === 'pending'  ? '#ffc107' :
                              trade.status === 'accepted' ? '#28a745' :
                              trade.status === 'rejected' ? '#dc3545' : '#6c757d'
                            }`,
                            padding: '1.2rem',
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                              <div>
                                <strong style={{ color: '#fff', fontSize: '1rem' }}>
                                  📨 Enviado a {trade.owner?.username}
                                </strong>
                                <p style={{ margin: '4px 0 0', color: '#ccc', fontSize: '0.88rem' }}>
                                  Ofreces <strong style={{ color: '#a78bfa' }}>«{trade.offeredGame?.title}»</strong> a cambio de <strong style={{ color: '#fdcb6e' }}>«{trade.requestedGame?.title}»</strong>
                                </p>
                              </div>
                              <span style={{
                                fontSize: '0.75rem', padding: '3px 10px', borderRadius: '20px', fontWeight: '700',
                                background: trade.status === 'pending' ? '#ffc10722' : trade.status === 'accepted' ? '#28a74522' : '#dc354522',
                                color: trade.status === 'pending' ? '#ffc107' : trade.status === 'accepted' ? '#28a745' : '#dc3545',
                                whiteSpace: 'nowrap',
                              }}>
                                {trade.status === 'pending' ? '⏳ Pendiente' : trade.status === 'accepted' ? '✅ Aceptado' : trade.status === 'rejected' ? '❌ Rechazado' : trade.status}
                              </span>
                            </div>

                            {trade.message && (
                              <p style={{ color: '#bbb', fontSize: '0.85rem', fontStyle: 'italic', margin: '0 0 12px', padding: '8px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                                💬 "{trade.message}"
                              </p>
                            )}

                            {trade.status === 'pending' && (
                              <button
                                onClick={() => updateTradeStatus(trade.id, 'cancelled')}
                                disabled={loading}
                                style={{ padding: '7px 18px', borderRadius: '8px', background: '#6c757d', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.88rem' }}
                              >
                                Cancelar deuote
                              </button>
                            )}
                          </article>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Tab: Mensajes ───────────────────────────────── */}
                {profileTab === 'messages' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <h4 style={{ margin: 0 }}>💬 Chat de Intercambios</h4>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>Nuevo chat con:</span>
                        <select
                          value={messageForm.receiverId}
                          onChange={e => {
                            const val = e.target.value;
                            setMessageForm(f => ({ ...f, receiverId: val }));
                            if (val) {
                              const recipientId = Number(val);
                              const found = messageRecipients.find(r => r.id === recipientId);
                              if (found) {
                                setSelectedUser(found);
                              } else {
                                setSelectedUser({ id: recipientId, username: `Usuario #${recipientId}` });
                              }
                            }
                          }}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '8px',
                            background: '#2d3436',
                            color: '#fff',
                            border: '1px solid rgba(255,255,255,0.1)',
                            fontSize: '0.85rem',
                          }}
                        >
                          <option value="">Selecciona...</option>
                          {messageRecipients.map(r => (
                            <option key={r.id} value={r.id}>{r.username}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(12, 1fr)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      background: 'rgba(20, 20, 20, 0.6)',
                      backdropFilter: 'blur(10px)',
                      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
                      minHeight: '550px',
                    }}>
                      {/* Left Column: Conversations List */}
                      <div style={{
                        gridColumn: 'span 4',
                        borderRight: '1px solid rgba(255,255,255,0.08)',
                        background: 'rgba(255,255,255,0.02)',
                        display: 'flex',
                        flexDirection: 'column',
                        overflowY: 'auto',
                        maxHeight: '550px',
                      }}>
                        <div style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', fontWeight: 'bold', fontSize: '0.9rem', color: '#a78bfa' }}>
                          Conversaciones ({conversations.length})
                        </div>

                        {conversations.length === 0 ? (
                          <div style={{ padding: '2rem 1rem', textAlign: 'center', opacity: 0.5, fontSize: '0.85rem' }}>
                            No hay conversaciones activas.
                          </div>
                        ) : (
                          conversations.map(c => {
                            const isSelected = selectedUser?.id === c.user.id;
                            const initial = (c.user.username?.[0] || '?').toUpperCase();
                            const lastMsgText = c.lastMessage ? c.lastMessage.messageText : 'Sin mensajes aún';
                            const formattedTime = c.lastMessage
                              ? new Date(c.lastMessage.sentAt).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })
                              : '';
                            return (
                              <div
                                key={c.user.id}
                                onClick={() => {
                                  setSelectedUser(c.user);
                                  setMessageForm(f => ({ ...f, receiverId: String(c.user.id) }));
                                }}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '12px',
                                  padding: '12px 16px',
                                  cursor: 'pointer',
                                  background: isSelected ? 'rgba(108, 92, 231, 0.15)' : 'transparent',
                                  borderLeft: isSelected ? '4px solid #a78bfa' : '4px solid transparent',
                                  borderBottom: '1px solid rgba(255,255,255,0.03)',
                                  transition: 'background 0.2s',
                                }}
                              >
                                <div style={{
                                  width: '38px', height: '38px', borderRadius: '50%',
                                  background: isSelected ? 'linear-gradient(135deg, #a78bfa, #6c5ce7)' : 'linear-gradient(135deg, #4b5563, #374151)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: '0.95rem', fontWeight: 'bold', color: '#fff', flexShrink: 0
                                }}>
                                  {initial}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                    <strong style={{ color: '#fff', fontSize: '0.88rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                      {c.user.username}
                                    </strong>
                                    {formattedTime && (
                                      <span style={{ fontSize: '0.75rem', opacity: 0.4, flexShrink: 0 }}>
                                        {formattedTime}
                                      </span>
                                    )}
                                  </div>
                                  <p style={{
                                    margin: '3px 0 0 0',
                                    fontSize: '0.8rem',
                                    color: 'rgba(255,255,255,0.6)',
                                    textOverflow: 'ellipsis',
                                    overflow: 'hidden',
                                    whiteSpace: 'nowrap'
                                  }}>
                                    {lastMsgText}
                                  </p>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Right Column: Chat View */}
                      <div style={{
                        gridColumn: 'span 8',
                        display: 'flex',
                        flexDirection: 'column',
                        background: 'rgba(255,255,255,0.01)',
                        maxHeight: '550px',
                      }}>
                        {selectedUser ? (
                          <>
                            {/* Chat Header */}
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '12px 20px',
                              borderBottom: '1px solid rgba(255,255,255,0.08)',
                              background: 'rgba(0, 0, 0, 0.2)',
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{
                                  width: '32px', height: '32px', borderRadius: '50%',
                                  background: 'linear-gradient(135deg, #00cec9, #0984e3)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: '0.85rem', fontWeight: 'bold', color: '#fff'
                                }}>
                                  {(selectedUser.username?.[0] || '?').toUpperCase()}
                                </div>
                                <div>
                                  <strong style={{ color: '#fff', fontSize: '0.92rem' }}>{selectedUser.username}</strong>
                                  <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>{selectedUser.email}</div>
                                </div>
                              </div>
                            </div>

                            {/* Active Trade Banner/Widget */}
                            {activeTrade && (
                              <div style={{
                                background: 'linear-gradient(135deg, rgba(108, 92, 231, 0.2), rgba(167, 139, 250, 0.2))',
                                borderBottom: '1px solid rgba(108, 92, 231, 0.3)',
                                padding: '12px 20px',
                                display: 'flex',
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap: '15px',
                              }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                  <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', tracking: 'wide', color: '#a78bfa', fontWeight: 'bold' }}>
                                    🤝 Solicitud de Intercambio Pendiente
                                  </span>
                                  <span style={{ fontSize: '0.88rem', color: '#eee' }}>
                                    Ofrece: <strong>{activeTrade.offeredGame?.title || activeTrade.offeredGameId}</strong> <span style={{ color: '#a78bfa' }}>🔁</span> Solicita: <strong>{activeTrade.requestedGame?.title || activeTrade.requestedGameId}</strong>
                                  </span>
                                  {activeTrade.message && (
                                    <span style={{ fontSize: '0.8rem', opacity: 0.8, color: '#ccc', fontStyle: 'italic' }}>
                                      "{activeTrade.message}"
                                    </span>
                                  )}
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  {activeTrade.ownerId === user.id ? (
                                    <>
                                      <button
                                        onClick={() => updateTradeStatus(activeTrade.id, 'accepted')}
                                        disabled={loading}
                                        style={{
                                          padding: '6px 14px', borderRadius: '8px', background: '#28a745', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 'bold'
                                        }}
                                      >
                                        ✅ Aceptar
                                      </button>
                                      <button
                                        onClick={() => setRejectModal({ open: true, tradeId: activeTrade.id, reason: '' })}
                                        disabled={loading}
                                        style={{
                                          padding: '6px 14px', borderRadius: '8px', background: '#dc3545', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 'bold'
                                        }}
                                      >
                                        ❌ Rechazar
                                      </button>
                                    </>
                                  ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <span style={{ fontSize: '0.82rem', opacity: 0.7 }}>Esperando respuesta...</span>
                                      <button
                                        onClick={() => updateTradeStatus(activeTrade.id, 'cancelled')}
                                        disabled={loading}
                                        style={{
                                          padding: '6px 12px', borderRadius: '8px', background: '#6c757d', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.8rem'
                                        }}
                                      >
                                        Cancelar
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Active Chat Messages */}
                            <div style={{
                              flex: 1,
                              overflowY: 'auto',
                              padding: '1.5rem',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '12px',
                              minHeight: '0',
                            }}>
                              {activeChatMessages.length === 0 ? (
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', opacity: 0.4 }}>
                                  <span style={{ fontSize: '2.5rem' }}>💬</span>
                                  <p style={{ margin: '8px 0 0 0', fontSize: '0.9rem' }}>No hay mensajes anteriores.</p>
                                  <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem' }}>¡Escribe un mensaje para comenzar la conversación!</p>
                                </div>
                              ) : (
                                activeChatMessages.map(msg => {
                                  const isMe = msg.senderId === user.id;
                                  return (
                                    <div
                                      key={msg.id}
                                      style={{
                                        display: 'flex',
                                        justifyContent: isMe ? 'flex-end' : 'flex-start',
                                        width: '100%',
                                      }}
                                    >
                                      <div style={{
                                        maxWidth: '70%',
                                        padding: '10px 14px',
                                        borderRadius: '16px',
                                        borderBottomRightRadius: isMe ? '2px' : '16px',
                                        borderBottomLeftRadius: isMe ? '16px' : '2px',
                                        background: isMe ? '#6c5ce7' : 'rgba(255,255,255,0.08)',
                                        color: '#fff',
                                        boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                                      }}>
                                        <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.4', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                                          {msg.messageText}
                                        </p>
                                        <div style={{
                                          textAlign: 'right',
                                          fontSize: '0.7rem',
                                          opacity: 0.5,
                                          marginTop: '4px',
                                        }}>
                                          {new Date(msg.sentAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                              <div ref={chatEndRef} />
                            </div>

                            {/* Chat Input Area */}
                            <form
                              onSubmit={handleMessageSubmit}
                              style={{
                                display: 'flex',
                                gap: '10px',
                                padding: '15px 20px',
                                borderTop: '1px solid rgba(255,255,255,0.08)',
                                background: 'rgba(0,0,0,0.2)',
                                alignItems: 'center',
                              }}
                            >
                              <input
                                type="text"
                                placeholder="Escribe tu mensaje aquí..."
                                value={messageForm.messageText}
                                onChange={e => setMessageForm(f => ({ ...f, messageText: e.target.value }))}
                                disabled={loading}
                                style={{
                                  flex: 1,
                                  background: 'rgba(255, 255, 255, 0.04)',
                                  border: '1px solid rgba(255,255,255,0.12)',
                                  borderRadius: '12px',
                                  padding: '10px 16px',
                                  color: '#fff',
                                  fontSize: '0.9rem',
                                  outline: 'none',
                                }}
                              />
                              <button
                                type="submit"
                                disabled={loading || !messageForm.messageText.trim()}
                                style={{
                                  background: '#6c5ce7',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '12px',
                                  padding: '10px 20px',
                                  cursor: 'pointer',
                                  fontSize: '0.9rem',
                                  fontWeight: 'bold',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  transition: 'background 0.2s',
                                  opacity: (!messageForm.messageText.trim() || loading) ? 0.5 : 1,
                                }}
                              >
                                {loading ? 'Enviando...' : '📨 Enviar'}
                              </button>
                            </form>
                          </>
                        ) : (
                          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', opacity: 0.4 }}>
                            <span style={{ fontSize: '3.5rem' }}>💬</span>
                            <h4 style={{ margin: '15px 0 5px 0' }}>Chat de Intercambios</h4>
                            <p style={{ margin: 0, fontSize: '0.9rem' }}>Selecciona un usuario de la lista de la izquierda para comenzar a chatear.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
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

// ─────────────────────────────────────────────────────────────────────────────
// 🔧 DEBUG TOOL: debugCreateTrade()
// Paste in browser Console to verify the full Backend-Driven trades flow.
// Tests: POST create → GET with computed fields → confirms is_receiver accuracy.
// ─────────────────────────────────────────────────────────────────────────────
window.debugCreateTrade = async function (offeredGameId = 1, requestedGameId = 2) {
  const TOKEN = localStorage.getItem('gameForAllToken');
  const API = 'http://localhost:5000/api';

  if (!TOKEN) {
    console.error('❌ No token found. Please log in first.');
    return;
  }

  console.group('🔧 debugCreateTrade()');
  console.log('Token:', TOKEN.substring(0, 25) + '...');

  // Step 1: POST — create trade
  console.log('\n📤 Step 1: Creating trade...', { offeredGameId, requestedGameId });
  let tradeId;
  try {
    const res = await fetch(`${API}/trades`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
      body: JSON.stringify({ offeredGameId, requestedGameId, message: '[DEBUG] Test trade' }),
    });
    const data = await res.json();
    if (!res.ok) { console.error('❌ POST failed:', res.status, data); console.groupEnd(); return; }
    tradeId = data.id;
    console.log('✅ Trade created! id:', tradeId);
    console.log('   is_receiver:', data.is_receiver, '| can_take_action:', data.can_take_action);
    console.log('   Full payload:', data);
  } catch (e) { console.error('❌ Network error:', e); console.groupEnd(); return; }

  // Step 2: GET — verify computed fields
  console.log('\n📥 Step 2: Fetching trades to verify computed fields...');
  try {
    const res = await fetch(`${API}/trades`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    const trades = await res.json();
    if (!res.ok) { console.error('❌ GET failed:', res.status, trades); console.groupEnd(); return; }

    const created = trades.find(t => t.id === tradeId);
    if (created) {
      console.log('✅ Trade found in GET response:');
      console.table({
        id: created.id, status: created.status,
        is_receiver: created.is_receiver, can_take_action: created.can_take_action,
        requester: created.requester?.username, owner: created.owner?.username,
      });

      if (created.is_receiver === false && created.can_take_action === false) {
        console.log('\n🎯 RESULT: Backend-Driven Auth working correctly.');
        console.log('   → Sender sees is_receiver: false, can_take_action: false ✅');
        console.log('   → Login as the trade owner to see is_receiver: true, can_take_action: true');
      }
    } else {
      console.warn('⚠️ Created trade not found in GET response. Check filters.');
    }
  } catch (e) { console.error('❌ Network error:', e); }

  console.groupEnd();
};

console.log('🔧 Debug tool loaded. Run: debugCreateTrade() in the console.');

