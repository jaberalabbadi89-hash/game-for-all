import { useCallback } from 'react';

/**
 * Centralized Role-Based Access Control hook.
 * Simplifies permission checks across the UI and ensures scalability for future roles.
 * 
 * Roles hierarchy: admin > moderator > user > guest
 */
export function useRBAC(user, token, setStatus, setActiveSection) {
  const hasSession = Boolean(token);
  const currentUserId = user ? (user.id || user.id_user) : null;
  const role = user?.role || 'guest';

  const requireAuth = useCallback((callback) => {
    if (!hasSession) {
      setActiveSection('auth');
      setStatus('Debes iniciar sesión para realizar esta acción');
      setTimeout(() => setStatus(''), 3000);
      return;
    }
    callback();
  }, [hasSession, setActiveSection, setStatus]);

  const canEditGame = useCallback((game) => {
    if (!hasSession) return false;
    return role === 'admin' || game?.owner?.id === currentUserId;
  }, [hasSession, role, currentUserId]);

  const canDeleteGame = useCallback((game) => {
    if (!hasSession) return false;
    // Currently, edit and delete share the same business rules, but keeping them
    // separate allows us to diverge easily in the future (e.g. moderators can edit but not delete).
    return role === 'admin' || game?.owner?.id === currentUserId;
  }, [hasSession, role, currentUserId]);

  const isAdmin = role === 'admin';
  const isGuest = !hasSession;

  return {
    requireAuth,
    canEditGame,
    canDeleteGame,
    isAdmin,
    isGuest,
    role
  };
}
