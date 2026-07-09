// src/components/Sidebar.tsx
import { NavLink, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface SidebarProps {
  onClose: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) navigate('/login');
  };

  const linkClass = ({ isActive }: { isActive: boolean }) => 
    `flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-200 group ${
      isActive 
        ? 'bg-teal-50 text-teal-700 shadow-sm shadow-teal-600/5' 
        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
    }`;

  return (
    <div className="w-64 h-screen bg-white border-r border-slate-100 p-6 flex flex-col justify-between select-none">
      <div className="space-y-8">
        
        {/* Branding Header matching image_7fb28d.png */}
        <div className="flex items-center justify-between">
          <div className="flex items-center select-none">
            <span className="text-lg font-black text-slate-900 tracking-tight">
              Paws <span className="text-teal-600">&</span> Polish
            </span>
          </div>
          
          {/* Close Trigger */}
          <button 
            onClick={onClose} 
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Navigation Layer */}
        <nav className="space-y-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-4 mb-2 block">Menu</span>
          
          <NavLink to="/admin" end className={linkClass}>
            <svg className="w-4 h-4 opacity-80 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V16zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V16z" />
            </svg>
            Dashboard
          </NavLink>
          
          <NavLink to="/admin/staff" className={linkClass}>
            <svg className="w-4 h-4 opacity-80 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Manage Staff
          </NavLink>
          
          <NavLink to="/admin/bookings" className={linkClass}>
            <svg className="w-4 h-4 opacity-80 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            View Bookings
          </NavLink>
        </nav>
      </div>
      
      {/* Refined Logout Trigger */}
      <button 
        onClick={handleLogout} 
        className="flex items-center gap-3 w-full px-4 py-3 text-sm font-bold text-rose-600 hover:bg-rose-50/60 rounded-2xl transition-all duration-200 group cursor-pointer"
      >
        <svg className="w-4 h-4 group-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        Logout
      </button>
      
    </div>
  );
}