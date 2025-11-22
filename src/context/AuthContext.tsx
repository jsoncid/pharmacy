import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Account, ID } from 'appwrite';
import client from '../lib/appwrite';

const account = new Account(client);

interface User {
  $id: string;
  name: string;
  email: string;
  // Add other user properties as needed
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  updateName: (name: string) => Promise<void>;
  updateEmail: (email: string, password: string) => Promise<void>;
  updatePassword: (oldPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const userData = await account.get();
      setUser(userData as User);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    await account.createEmailPasswordSession(email, password);
    await checkUser();
  };

  const signup = async (email: string, password: string, name: string) => {
    await account.create(ID.unique(), email, password, name);
    await login(email, password); // Auto-login after signup
  };

  const logout = async () => {
    await account.deleteSession('current');
    setUser(null);
  };

  const updateName = async (name: string) => {
    await account.updateName(name);
    await checkUser(); // Refresh user data
  };

  const updateEmail = async (email: string, password: string) => {
    await account.updateEmail(email, password);
    await checkUser(); // Refresh user data
  };

  const updatePassword = async (oldPassword: string, newPassword: string) => {
    await account.updatePassword(newPassword, oldPassword);
    // Password update doesn't change user data, so no need to refresh
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    signup,
    logout,
    updateName,
    updateEmail,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
