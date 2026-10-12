import React, { useEffect } from 'react';
import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  useNavigate
} from '@tanstack/react-router';
import { Navbar } from '../components/common/Navbar';
import { AuthModal } from '../components/auth/AuthModal';
import { useAuth } from '../context/AuthContext';
import { useAuthModal } from '../context/AuthModalContext';
import { Toaster } from 'react-hot-toast';
import { Building2, ArrowLeft } from 'lucide-react';

// Import Pages
import { RoomsPage } from '../pages/RoomsPage';
import { RoomDetailPage } from '../pages/RoomDetailPage';
import { BookingPage } from '../pages/BookingPage';
import { RoomCalendar } from '../components/calendar/RoomCalendar';
import { MyBookingsPage } from '../pages/MyBookingsPage';
import { AdminDashboardPage } from '../pages/AdminDashboardPage';
import { RoomFormPage } from '../pages/RoomFormPage';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';

// 404 Not Found Component
const NotFoundComponent: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="py-24 text-center max-w-md mx-auto animate-fadeIn px-4">
      <div className="w-16 h-16 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto mb-4">
        <Building2 size={32} />
      </div>
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">404 - ไม่พบหน้าที่คุณต้องการ</h2>
      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-6">
        หน้าที่คุณกำลังค้นหาไม่มีอยู่ หรืออาจถูกย้ายไปยังตำแหน่งอื่น
      </p>
      <button
        onClick={() => navigate({ to: '/rooms' as any })}
        className="px-4 py-2.5 rounded-sm bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/25 transition-all inline-flex items-center gap-2 cursor-pointer"
      >
        <ArrowLeft size={14} />
        <span>กลับหน้ารายการห้องประชุม</span>
      </button>
    </div>
  );
};

// Root Layout Component
const RootLayout: React.FC = () => {
  const { user } = useAuth();
  const { isOpen, mode, closeModal, openLogin } = useAuthModal();
  const navigate = useNavigate();

  return (
    <div className="app-container">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          className: 'dark:!bg-slate-800 dark:!text-slate-100 dark:!border dark:!border-slate-700 dark:!shadow-2xl'
        }}
      />
      <Navbar />

      <main className="main-content">
        <Outlet />
      </main>

      {/* Global Auth Modal */}
      {isOpen && (
        <AuthModal
          initialMode={mode}
          onClose={closeModal}
          onSuccess={(loggedInUser) => {
            closeModal();
            const role = String(loggedInUser?.role || user?.role || '').toLowerCase();
            if (role === 'admin') {
              navigate({ to: '/admin/bookings' as any });
            }
          }}
        />
      )}
    </div>
  );
};

// 1. Root Route
const rootRoute = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundComponent
});

// 2. Index Route (/) - Auto redirect based on role
const IndexRedirectComponent: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const stored = localStorage.getItem('auth_user');
      let isAdmin = String(user?.role || '').toLowerCase() === 'admin';
      if (stored) {
        const parsed = JSON.parse(stored);
        if (String(parsed?.role || '').toLowerCase() === 'admin') {
          isAdmin = true;
        }
      }
      if (isAdmin) {
        navigate({ to: '/admin/bookings' as any, replace: true });
        return;
      }
    } catch {
      // fallback
    }
    navigate({ to: '/rooms' as any, replace: true });
  }, [user, navigate]);

  return (
    <div className="py-24 text-center">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
      <p className="text-xs text-slate-400">กำลังนำคุณเข้าสู่ระบบ...</p>
    </div>
  );
};

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: IndexRedirectComponent
});

// 3. Rooms Route (/rooms)
const roomsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/rooms',
  component: RoomsPage
});

// 4. Room Detail Route (/rooms/$roomId)
const roomDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/rooms/$roomId',
  component: RoomDetailPage
});

// 5. Room New Route (/rooms/new)
const roomNewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/rooms/new',
  component: RoomFormPage
});

// 6. Room Edit Route (/rooms/$roomId/edit)
const roomEditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/rooms/$roomId/edit',
  component: RoomFormPage
});

// 7. Booking Route (/booking)
const bookingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/booking',
  validateSearch: (search: Record<string, unknown>) => {
    return {
      roomId: search.roomId ? String(search.roomId) : undefined,
      bookingId: search.bookingId ? String(search.bookingId) : undefined,
      date: search.date ? String(search.date) : undefined
    };
  },
  component: BookingPage
});

// 8. Calendar Route (/calendar)
const calendarRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/calendar',
  component: RoomCalendar
});

// 9. My Bookings Route (/my-bookings)
const myBookingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/my-bookings',
  component: MyBookingsPage
});

// 10. Admin Routes - Separate page routes for each section
const AdminRedirectComponent: React.FC = () => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate({ to: '/admin/bookings' as any, replace: true });
  }, [navigate]);
  return (
    <div className="py-24 text-center">
      <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
      <p className="text-xs text-slate-400">กำลังนำคุณไปยังหน้ารายการคำขอจองห้อง...</p>
    </div>
  );
};

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  component: AdminRedirectComponent
});

const adminBookingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/bookings',
  component: () => <AdminDashboardPage defaultTab="requests" />
});

const adminUsersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/users',
  component: () => <AdminDashboardPage defaultTab="users" />
});

const adminDepartmentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/departments',
  component: () => <AdminDashboardPage defaultTab="departments" />
});

const adminRoomsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/rooms',
  component: () => <AdminDashboardPage defaultTab="rooms" />
});

const adminReportsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/reports',
  component: () => <AdminDashboardPage defaultTab="reports" />
});

// 11. Login Route (/login)
const LoginRouteComponent: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="py-8">
      <LoginPage
        onSuccess={() => navigate({ to: '/rooms' as any })}
        onSwitchToRegister={() => navigate({ to: '/register' as any })}
      />
    </div>
  );
};

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginRouteComponent
});

// 12. Register Route (/register)
const RegisterRouteComponent: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="py-8">
      <RegisterPage
        onSuccess={() => navigate({ to: '/login' as any })}
        onSwitchToLogin={() => navigate({ to: '/login' as any })}
      />
    </div>
  );
};

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register',
  component: RegisterRouteComponent
});

// Assemble Route Tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  roomsRoute,
  roomNewRoute,
  roomDetailRoute,
  roomEditRoute,
  bookingRoute,
  calendarRoute,
  myBookingsRoute,
  adminRoute,
  adminBookingsRoute,
  adminUsersRoute,
  adminDepartmentsRoute,
  adminRoomsRoute,
  adminReportsRoute,
  loginRoute,
  registerRoute
]);

// Create Router Instance
export const router = createRouter({
  routeTree,
  defaultPreload: 'intent'
});

// Register Router for full TypeScript support
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
