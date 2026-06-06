import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

export const API_URL = 'http://localhost:5000/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('vb_token') || null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [simulatedEmails, setSimulatedEmails] = useState([]);

  useEffect(() => {
    if (token) {
      fetchUserInfo();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUserInfo = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        // Token might have expired
        logout();
      }
    } catch (err) {
      console.error('Error fetching user:', err);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('vb_token', data.token);
        setToken(data.token);
        setUser(data.user);
        showToast(`Welcome back, ${data.user.name}!`, 'success');
        return { success: true };
      } else {
        showToast(data.message || 'Login failed', 'error');
        return { success: false, message: data.message };
      }
    } catch (err) {
      showToast('Backend connection error', 'error');
      return { success: false, message: 'Server unreachable' };
    }
  };

  const logout = () => {
    localStorage.removeItem('vb_token');
    setToken(null);
    setUser(null);
    showToast('Logged out successfully', 'info');
  };

  const showToast = (message, type = 'info') => {
    const id = Date.now() + Math.random().toString(36).substr(2, 4);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Helper for components to make authenticated API requests
  const apiFetch = async (endpoint, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers || {})
    };

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers
      });

      if (res.status === 401 || res.status === 403) {
        // Unauthorized - session clear
        logout();
        throw new Error('Unauthorized or Expired session');
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `API Error: ${res.statusText}`);
      }

      return await res.json();
    } catch (err) {
      console.error(`API Fetch Error [${endpoint}]:`, err.message);
      throw err;
    }
  };

  // In-app mock email tracking
  const logSimulatedEmail = (emailObj) => {
    setSimulatedEmails((prev) => [
      {
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        ...emailObj
      },
      ...prev
    ]);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      logout,
      toasts,
      showToast,
      apiFetch,
      simulatedEmails,
      logSimulatedEmail
    }}>
      {children}
      
      {/* Global Toasts rendering */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast-message ${toast.type}`}>
            <span>{toast.type === 'success' ? '✓' : toast.type === 'error' ? '✗' : 'ℹ'}</span>
            <div>{toast.message}</div>
          </div>
        ))}
      </div>
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
