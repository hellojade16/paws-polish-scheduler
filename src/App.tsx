import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AdminDashboard from './components/AdminDashboard';
import LoginPage from './components/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import BookingPage from './components/BookingPage'; 
import AdminLayout from './components/AdminLayout';
import ViewBookings from './components/ViewBookings';
import ManageStaff from './components/ManageStaff';

export default function App() {
  return (
    <BrowserRouter>
  <Routes>
    <Route path="/" element={<BookingPage />} />
    <Route path="/login" element={<LoginPage />} />
    
    <Route path="/admin" element={
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    }>
      <Route index element={<AdminDashboard />} />
      <Route path="bookings" element={<ViewBookings />} />
      <Route path="/admin/staff" element={<ManageStaff />} />
    </Route>
  </Routes>
</BrowserRouter>
  );
}