import React, { createContext, useContext, useState } from 'react';

type AuthModalMode = 'login' | 'register';

interface AuthModalContextType {
  isOpen: boolean;
  mode: AuthModalMode;
  openLogin: () => void;
  openRegister: () => void;
  closeModal: () => void;
  switchMode: (mode: AuthModalMode) => void;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export const AuthModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<AuthModalMode>('login');

  const openLogin = () => {
    setMode('login');
    setIsOpen(true);
  };

  const openRegister = () => {
    setMode('register');
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  const switchMode = (newMode: AuthModalMode) => {
    setMode(newMode);
  };

  return (
    <AuthModalContext.Provider
      value={{
        isOpen,
        mode,
        openLogin,
        openRegister,
        closeModal,
        switchMode
      }}
    >
      {children}
    </AuthModalContext.Provider>
  );
};

export const useAuthModal = () => {
  const context = useContext(AuthModalContext);
  if (!context) {
    throw new Error('useAuthModal must be used within an AuthModalProvider');
  }
  return context;
};
