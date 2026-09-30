import React from 'react';
import { RouterProvider } from '@tanstack/react-router';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { AuthModalProvider } from './context/AuthModalContext';
import { router } from './router';

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AuthModalProvider>
          <RouterProvider router={router} />
        </AuthModalProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}
