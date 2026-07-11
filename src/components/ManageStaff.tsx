// src/components/ManageStaff.tsx
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import ReactDOM from 'react-dom';

interface Staff {
  id: number;
  name: string;
  role: string;
  is_active: boolean;
}

export default function ManageStaff() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Custom Toast State Engine
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Auto-dismiss handler for notifications
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    fetchStaff();
    const channel = supabase
      .channel('staff-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'staff' }, () => {
        fetchStaff();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchStaff() {
    setLoading(true);
    const { data } = await supabase.from('staff').select('*').order('name');
    if (data) setStaff(data);
    setLoading(false);
  }

  const showNotification = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  const openModal = (s?: Staff) => {
    if (s) {
      setEditingStaff(s);
      setName(s.name);
      setRole(s.role);
      setIsActive(s.is_active);
    } else {
      setEditingStaff(null);
      setName('');
      setRole('');
      setIsActive(true);
    }
    setIsModalOpen(true);
  };

  const saveStaff = async () => {
    // Replaces browser pop-up with a premium inline notification bar
    if (!name.trim() || !role.trim()) {
      showNotification("Please fill out both the Name and Role Description fields.", "error");
      return;
    }

    const staffPayload = { 
      name: name.trim(), 
      role: role.trim(), 
      is_active: isActive 
    };

    try {
      if (editingStaff) {
        await supabase.from('staff').update(staffPayload).eq('id', editingStaff.id);
        showNotification(`${staffPayload.name} updated successfully!`, "success");
      } else {
        await supabase.from('staff').insert(staffPayload);
        showNotification(`${staffPayload.name} added to the team roster!`, "success");
      }
      setIsModalOpen(false);
    } catch (err) {
      showNotification("Database communication pipeline failure.", "error");
    }
  };

  const toggleStatus = async (id: number, currentStatus: boolean) => {
    const { error } = await supabase.from('staff').update({ is_active: !currentStatus }).eq('id', id);
    if (!error) {
      showNotification("Specialist work status shifted seamlessly.", "success");
    } else {
      showNotification("Failed to toggle system eligibility state.", "error");
    }
  };

  const getInitials = (fullName: string) => {
    return fullName ? fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '??';
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300 relative">
      
      {/* Premium Floating Notification System */}
      {toast && (
        <div className="fixed top-6 right-6 z-[10000] max-w-sm w-full bg-white rounded-2xl shadow-2xl shadow-slate-200/80 border border-slate-100 p-4 flex items-start gap-3 animate-in slide-in-from-top-5 slide-in-from-right-5 fade-in duration-300">
          <div className={`p-2 rounded-xl shrink-0 ${toast.type === 'success' ? 'bg-teal-50 text-teal-600' : 'bg-rose-50 text-rose-600'}`}>
            {toast.type === 'success' ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
          </div>
          <div className="flex-1 pt-0.5">
            <p className="text-xs font-black text-slate-800 tracking-tight">{toast.type === 'success' ? 'System Success' : 'Attention Required'}</p>
            <p className="text-[11px] text-slate-500 font-semibold leading-relaxed mt-0.5">{toast.message}</p>
          </div>
          <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded-lg hover:bg-slate-50 cursor-pointer">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      {/* Header Container */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Manage Staff</h2>
          <p className="text-slate-400 text-sm mt-1">Add new specialists, monitor real-time availability, and update profiles.</p>
        </div>
        
        <button 
          onClick={() => openModal()} 
          className="flex items-center justify-center gap-2 bg-teal-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-teal-700 transition-all hover:shadow-lg hover:shadow-teal-600/20 active:scale-95 group shrink-0 cursor-pointer text-sm"
        >
          <svg className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
          </svg>
          Add New Staff
        </button>
      </div>

      {/* Modal Portal UI */}
      {isModalOpen && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white p-8 rounded-[32px] w-full max-w-md shadow-2xl border border-slate-100/80 animate-in fade-in zoom-in duration-200">
            
            <div className="mb-6">
              <h3 className="text-2xl font-black text-slate-900">
                {editingStaff ? 'Edit Staff Details' : 'Add New Staff'}
              </h3>
              <p className="text-slate-400 text-xs mt-1">Configure profile data and dynamic system parameters.</p>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1 mb-1.5 block">Full Name</label>
                <input 
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-sm text-slate-800 placeholder-slate-300 font-medium" 
                  placeholder="e.g. Jane Doe" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1 mb-1.5 block">Role Descriptor</label>
                <input 
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-sm text-slate-800 placeholder-slate-300 font-medium" 
                  placeholder="e.g. Pet Care Specialist" 
                  value={role} 
                  onChange={(e) => setRole(e.target.value)} 
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-700">System Visibility</span>
                <span className="text-[11px] text-slate-400 font-medium mt-0.5">Allow this profile to accept public client bookings</span>
              </div>
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 ease-in-out cursor-pointer relative ${isActive ? 'bg-teal-600' : 'bg-slate-200'}`}
              >
                <span className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition duration-200 ease-in-out ${isActive ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-bold transition-colors text-sm cursor-pointer">Cancel</button>
              <button onClick={saveStaff} className="flex-1 py-3.5 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-teal-600/20 text-sm cursor-pointer">Save Changes</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Structural Table Core Handler */}
      {loading ? (
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-6 space-y-4">
          <div className="flex justify-between pb-4 border-b border-slate-50">
            <div className="h-3 w-1/4 bg-slate-200 rounded-full animate-pulse" />
            <div className="h-3 w-1/6 bg-slate-200 rounded-full animate-pulse" />
          </div>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center justify-between py-4 border-b border-slate-50 last:border-none">
              <div className="flex items-center gap-3 w-1/3">
                <div className="w-10 h-10 rounded-xl bg-slate-200 animate-pulse shrink-0" />
                <div className="h-4 w-2/3 bg-slate-200 rounded-full animate-pulse" />
              </div>
              <div className="h-4 w-1/4 bg-slate-200 rounded-full animate-pulse" />
              <div className="h-7 w-20 bg-slate-200 rounded-full animate-pulse" />
              <div className="h-4 w-16 bg-slate-200 rounded-full animate-pulse" />
            </div>
          ))}
        </div>
      ) : staff.length === 0 ? (
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-16 text-center max-w-2xl mx-auto flex flex-col items-center">
          <div className="w-16 h-16 bg-slate-50 border border-slate-100 flex items-center justify-center rounded-2xl text-slate-400 mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-slate-800">No team members setup yet</h3>
          <p className="text-slate-400 text-sm mt-1 max-w-sm">Get started by creating your initial staff listing to begin assigning client reservations.</p>
          <button 
            onClick={() => openModal()} 
            className="mt-5 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Create Staff Profile
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm shadow-slate-100/40 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="bg-slate-50/60 border-b border-slate-100">
                <tr>
                  <th className="pl-8 pr-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Specialist Name</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned Designation</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Work Status</th>
                  <th className="pl-6 pr-8 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Control Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staff.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="pl-8 pr-6 py-4.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl font-bold text-xs flex items-center justify-center select-none shadow-inner shrink-0 ${
                          s.is_active 
                            ? 'bg-teal-50 text-teal-700 border border-teal-100/60' 
                            : 'bg-slate-100 text-slate-400 border border-slate-200/40'
                        }`}>
                          {getInitials(s.name)}
                        </div>
                        <span className="font-bold text-slate-800 tracking-tight text-sm group-hover:text-teal-950 transition-colors">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4.5 text-slate-500 font-medium text-sm">{s.role}</td>
                    <td className="px-6 py-4.5">
                      <button 
                        onClick={() => toggleStatus(s.id, s.is_active)} 
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-bold tracking-wide transition-all flex items-center gap-2 border w-fit cursor-pointer select-none active:scale-95
                          ${s.is_active 
                            ? 'bg-emerald-50/60 text-emerald-700 border-emerald-200/70 hover:bg-emerald-50' 
                            : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${s.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
                        {s.is_active ? 'ACTIVE' : 'INACTIVE'}
                      </button>
                    </td>
                    <td className="pl-6 pr-8 py-4.5 text-right">
                      <button 
                        onClick={() => openModal(s)} 
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-600 hover:text-teal-700 hover:border-teal-200 hover:bg-teal-50/30 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm bg-white active:scale-95"
                      >
                        <svg className="w-3.5 h-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}