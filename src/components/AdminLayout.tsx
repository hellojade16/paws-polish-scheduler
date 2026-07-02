// src/components/AdminLayout.tsx
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function AdminLayout() {
  return (
    // 1. Lock the layout to the screen height with h-screen
    // 2. Prevent the whole page from scrolling with overflow-hidden
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      
      {/* 3. Let only this section scroll internally */}
      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}