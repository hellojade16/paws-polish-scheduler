// src/components/Sidebar.tsx
import { NavLink, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface SidebarProps {
  onClose: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const linkClass = ({ isActive }: { isActive: boolean }) => 
    `block p-3 rounded-xl font-bold transition-all ${
      isActive ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'
    }`;

 return (
    <div className="w-64 h-screen bg-white border-r border-slate-200 p-6 flex flex-col justify-between">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-800">Paws & Polish</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all"> ✕ </button>
        </div>
        
        <nav className="space-y-2">
          <NavLink to="/admin" end className={linkClass}>Dashboard</NavLink>
          <NavLink to="/admin/staff" className={linkClass}>Manage Staff</NavLink>
          <NavLink to="/admin/bookings" className={linkClass}>View Bookings</NavLink>
        </nav>
      </div>
      
      <button onClick={handleLogout} className="text-red-500 font-bold p-3 hover:bg-red-50 rounded-xl">
        Logout
      </button>
    </div>
  );
}