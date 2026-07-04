// src/components/AdminLayout.tsx
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-slate-50">
      {isSidebarOpen && (
        <Sidebar onClose={() => setIsSidebarOpen(false)} />
      )}
      
      <main className="flex-1 overflow-y-auto relative pl-20 pt-8">
        {!isSidebarOpen && (
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="absolute top-6 left-6 p-2 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-100 transition-all duration-200 cursor-pointer z-50">
            <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
        </button>
        )}
        
        <div className="p-0">
           <Outlet />
        </div>
      </main>
    </div>
  );
}