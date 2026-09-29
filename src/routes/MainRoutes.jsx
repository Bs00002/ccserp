import { lazy } from 'react';

// project imports
import Loadable from 'components/Loadable';
import DashboardLayout from 'layout/Dashboard';

const DashboardDefault = Loadable(lazy(() => import('pages/dashboard/default')));

// Partner Management
const EmployeesAdmin = Loadable(lazy(() => import('pages/management/employees')));
const DealersAdmin = Loadable(lazy(() => import('pages/management/dealers')));
const AssignmentsAdmin = Loadable(lazy(() => import('pages/management/assignments')));

// Products & Inventory
const ProductsAdmin = Loadable(lazy(() => import('pages/products/products')));

// Operations
const OrdersAdmin = Loadable(lazy(() => import('pages/orders/list')));
const OrderCreate = Loadable(lazy(() => import('pages/orders/create')));
const MyOrders = Loadable(lazy(() => import('pages/orders/MyOrders')));
const InvoicesAdmin = Loadable(lazy(() => import('pages/operations/invoices')));
const DispatchAdmin = Loadable(lazy(() => import('pages/operations/dispatch')));
const CollectionsAdmin = Loadable(lazy(() => import('pages/operations/collections')));
const PendingPayments = Loadable(lazy(() => import('pages/operations/pending-payments')));
const FieldCollections = Loadable(lazy(() => import('pages/operations/field-collections')));
const WarehouseAdmin = Loadable(lazy(() => import('pages/products/warehouse')));
const FieldExpenses = Loadable(lazy(() => import('pages/operations/field-expenses')));
const FieldAttendance = Loadable(lazy(() => import('pages/operations/FieldAttendance')));
const FieldSupport = Loadable(lazy(() => import('pages/operations/FieldSupport')));

// HR & Admin Tracking
const AttendanceAdmin = Loadable(lazy(() => import('pages/hr/attendance')));
const ExpensesAdmin = Loadable(lazy(() => import('pages/hr/expenses')));
const LiveTrackingAdmin = Loadable(lazy(() => import('pages/operations/LiveTrackingAdmin')));

// Other
const ReportsAdmin = Loadable(lazy(() => import('pages/other/reports')));
const NotificationsAdmin = Loadable(lazy(() => import('pages/other/notifications')));
const SupportAdmin = Loadable(lazy(() => import('pages/other/support')));
const SettingsAdmin = Loadable(lazy(() => import('pages/other/settings')));
const ProfilePage = Loadable(lazy(() => import('pages/other/profile')));

// Dealer specific
const DealerProducts = Loadable(lazy(() => import('pages/products/DealerProducts')));
const DealerOrders = Loadable(lazy(() => import('pages/orders/DealerOrders')));
const DealerSupport = Loadable(lazy(() => import('pages/other/DealerSupport')));
const DealerInvoices = Loadable(lazy(() => import('pages/operations/DealerInvoices')));
const DealerPayments = Loadable(lazy(() => import('pages/operations/DealerPayments')));

const MainRoutes = {
  path: '/',
  children: [
    {
      path: 'admin',
      element: <DashboardLayout />,
      children: [
        { index: true, element: <DashboardDefault /> },
        { path: 'dashboard', element: <DashboardDefault /> },
        { path: 'dealers', element: <DealersAdmin /> },
        { path: 'employees', element: <EmployeesAdmin /> },
        { path: 'assignments', element: <AssignmentsAdmin /> },
        { path: 'products', element: <ProductsAdmin /> },
        { path: 'orders', element: <OrdersAdmin /> },
        { path: 'dispatch', element: <DispatchAdmin /> },
        { path: 'invoices', element: <InvoicesAdmin /> },
        { path: 'payments', element: <PendingPayments /> },
        { path: 'collections', element: <CollectionsAdmin /> },
        { path: 'warehouse', element: <WarehouseAdmin /> },
        { path: 'expenses', element: <ExpensesAdmin /> },
        { path: 'attendance', element: <AttendanceAdmin /> },
        { path: 'tracking', element: <LiveTrackingAdmin /> },
        { path: 'notifications', element: <NotificationsAdmin /> },
        { path: 'reports', element: <ReportsAdmin /> },
        { path: 'settings', element: <SettingsAdmin /> },
        { path: 'profile', element: <ProfilePage /> }
      ]
    },
    {
      path: 'warehouse',
      element: <DashboardLayout />,
      children: [
        { index: true, element: <DispatchAdmin /> },
        { path: 'dashboard', element: <DispatchAdmin /> },
        { path: 'dispatch', element: <DispatchAdmin /> },
        { path: 'stock', element: <WarehouseAdmin /> },
        { path: 'inventory', element: <WarehouseAdmin /> },
        { path: 'orders', element: <OrdersAdmin /> },
        { path: 'profile', element: <ProfilePage /> }
      ]
    },
    {
      path: 'app',
      element: <DashboardLayout />,
      children: [
        { path: 'dispatch', element: <DispatchAdmin /> },
        { path: 'orders', element: <OrdersAdmin /> },
        { path: 'invoices', element: <InvoicesAdmin /> },
        { path: 'collections', element: <CollectionsAdmin /> },
        { path: 'warehouse', element: <WarehouseAdmin /> }
      ]
    },
    {
      path: 'field',
      element: <DashboardLayout />,
      children: [
        { index: true, element: <DashboardDefault /> },
        { path: 'dashboard', element: <DashboardDefault /> },
        { path: 'attendance', element: <FieldAttendance /> },
        { path: 'expenses', element: <FieldExpenses /> },
        { path: 'collections', element: <FieldCollections /> },
        { path: 'orders/create', element: <OrderCreate /> },
        { path: 'orders', element: <MyOrders /> },
        { path: 'support', element: <FieldSupport /> },
        { path: 'profile', element: <ProfilePage /> }
      ]
    },
    {
      path: 'dealer',
      element: <DashboardLayout />,
      children: [
        { index: true, element: <DashboardDefault /> },
        { path: 'dashboard', element: <DashboardDefault /> },
        { path: 'products', element: <DealerProducts /> },
        { path: 'orders', element: <DealerOrders /> },
        { path: 'invoices', element: <DealerInvoices /> },
        { path: 'payments', element: <DealerPayments /> },
        { path: 'profile', element: <ProfilePage /> },
        { path: 'support', element: <DealerSupport /> }
      ]
    }
  ]
};

export default MainRoutes;
