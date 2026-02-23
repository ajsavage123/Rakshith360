import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const USERS_KEY = 'rakshith360_users';
const SESSION_KEY = 'rakshith360_session';

interface StoredUser {
  uid: string;
  email: string;
  displayName: string;
  passwordHash: string; // simple base64 — NOT for production use
}

interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  initializing: boolean;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

// Helpers
const getUsers = (): StoredUser[] => {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  } catch {
    return [];
  }
};

const saveUsers = (users: StoredUser[]) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

const hashPassword = (password: string) => btoa(password); // simple obfuscation only
const generateUid = () => `user_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  // Restore session on mount
  useEffect(() => {
    try {
      const sessionData = localStorage.getItem(SESSION_KEY);
      if (sessionData) {
        const parsed: User = JSON.parse(sessionData);
        setUser(parsed);
      }
    } catch {
      // ignore corrupt session
    } finally {
      setInitializing(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      if (!email || !password) throw new Error('Email and password are required');

      const users = getUsers();
      const found = users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase() && u.passwordHash === hashPassword(password)
      );

      if (!found) throw new Error('Invalid email or password');

      const sessionUser: User = { uid: found.uid, email: found.email, displayName: found.displayName };
      localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
      setUser(sessionUser);
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    setLoading(true);
    try {
      if (!email || !password || !name) throw new Error('All fields are required');
      if (password.length < 6) throw new Error('Password must be at least 6 characters long');

      const users = getUsers();
      const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (existing) throw new Error('An account with this email already exists');

      const newUser: StoredUser = {
        uid: generateUid(),
        email,
        displayName: name,
        passwordHash: hashPassword(password),
      };

      saveUsers([...users, newUser]);

      const sessionUser: User = { uid: newUser.uid, email: newUser.email, displayName: newUser.displayName };
      localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
      setUser(sessionUser);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      localStorage.removeItem(SESSION_KEY);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    setLoading(true);
    try {
      if (!email) throw new Error('Email is required');
      const users = getUsers();
      const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (!found) throw new Error('No account found with this email');
      // In a real app, send a reset email. Here we just confirm the account exists.
      alert(`Password reset: Since we are running locally, please contact the admin to reset the password for ${email}.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, initializing, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
};