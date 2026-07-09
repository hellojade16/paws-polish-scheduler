// src/components/AdminLayout.tsx
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar Frame */}
      {isSidebarOpen && (
        <Sidebar onClose={() => setIsSidebarOpen(false)} />
      )}
      
      {/* Main Content Workspace */}
      <main className="flex-1 overflow-y-auto relative transition-all duration-300">
        
        {/* Modern Closed Sidebar Trigger Button */}
        {!isSidebarOpen && (
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="absolute top-6 left-6 p-2.5 bg-white border border-slate-100 rounded-2xl shadow-md shadow-slate-200/60 hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-all duration-200 cursor-pointer z-50 group focus:ring-2 focus:ring-teal-500/20 outline-none"
          >
            <svg 
              className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        
        {/* Dynamic Inner Page Wrapper */}
        <div className={`transition-all duration-300 ${!isSidebarOpen ? 'pl-24 pt-6 pr-6' : 'p-0'}`}>
          <Outlet />
        </div>
        
      </main>
    </div>
  );
}