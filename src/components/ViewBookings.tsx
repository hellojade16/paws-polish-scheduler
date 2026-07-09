// src/components/ViewBookings.tsx
import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';

// Unified Premium Dropdown Component
const CustomDropdown = ({ label, options, value, onChange, isEditable = true }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isEditable) {
    return (
      <span className="text-slate-400 text-xs font-semibold bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl inline-block cursor-not-allowed select-none">
        {label}
      </span>
    );
  }

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-2 px-4 py-2 bg-white border border-slate-200 rounded-2xl cursor-pointer text-xs font-bold text-slate-700 transition-all min-w-[130px] hover:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none select-none"
      >
        <span className="truncate">{label}</span>
        <svg className={`w-3.5 h-3.5 opacity-60 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 min-w-[150px] bg-white border border-slate-100 rounded-2xl shadow-xl shadow-slate-200/60 z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          {options.map((o: any) => (
            <button
              key={o.id}
              type="button"
              onClick={() => { onChange(o.id); setIsOpen(false); }}
              className={`block w-full text-left px-4 py-2.5 text-xs font-semibold transition-colors truncate ${value == o.id ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
            >
              {o.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

interface Booking {
  id: number;
  customer_name: string;
  customer_email: string;
  pet_name: string;
  appointment_date: string;
  appointment_time: string;
  status?: string;
  booking_type?: string; 
  staff_id?: number | string;
  services?: { name: string };
  service_id: number;
}

export default function ViewBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [staffList, setStaffList] = useState<{ id: number; name: string }[]>([]);
  const [servicesList, setServicesList] = useState<{ id: number; name: string }[]>([]);
  const today = new Date().toISOString().split('T')[0];
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Custom Toast State Engine
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [search, setSearch] = useState('');
  const [filterGroomer, setFilterGroomer] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');

  // Auto-dismiss handler for notifications
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showNotification = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  const fetchData = async () => {
    setLoading(true);
    const [{ data: s }, { data: b }, { data: serv }] = await Promise.all([
      supabase.from('staff').select('id, name'),
      supabase.from('bookings').select('*, services(name)').order('appointment_date', { ascending: false }),
      supabase.from('services').select('id, name')
    ]);
    if (s) setStaffList(s);
    if (b) setBookings(b);
    if (serv) setServicesList(serv);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const channel = supabase.channel('bookings-view-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const updateBooking = async (id: number, field: string, value: any) => {
    const { error } = await supabase.from('bookings').update({ [field]: value }).eq('id', id);
    if (error) {
      showNotification("Operational update failed: " + error.message, "error");
    } else {
      setBookings(prev => prev.map(b => b.id === id ? { ...b, [field]: value } : b));
      showNotification("Booking parameter modified seamlessly.", "success");
    }
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '—';
    const [h, m] = timeStr.split(':');
    const hour = parseInt(h);
    const suffix = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${m} ${suffix}`;
  };
    
  const filteredBookings = bookings
    .filter((b) => {
      const searchLower = search.toLowerCase();
      const matchesSearch = b.customer_name.toLowerCase().includes(searchLower) || 
                            b.pet_name.toLowerCase().includes(searchLower);

      const dbStaffId = b.staff_id != null ? String(b.staff_id).trim() : 'unassigned';
      const filterId = String(filterGroomer).trim();
      const matchesGroomer = filterGroomer === 'all' || dbStaffId === filterId;

      const matchesDate = filterDate === '' || b.appointment_date === filterDate;
      const matchesStatus = filterStatus === 'all' || b.status === filterStatus;
      const matchesType = filterType === 'all' || b.booking_type === filterType;
      
      return matchesSearch && matchesGroomer && matchesDate && matchesStatus && matchesType;
    })
    .sort((a, b) => {
      const dateA = new Date(a.appointment_date).getTime();
      const dateB = new Date(b.appointment_date).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

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
      
      {/* Title Header */}
      <div className="pb-2 border-b border-slate-100">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Booking History</h2>
        <p className="text-slate-400 text-sm mt-1">View, manage, and search through all present and historical shop allocations.</p>
      </div>

      {loading ? (
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-6 space-y-5 animate-pulse">
          <div className="h-14 w-full bg-slate-100 rounded-2xl" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between py-4 border-b border-slate-50 last:border-none">
              <div className="h-4 w-16 bg-slate-200 rounded-full" />
              <div className="h-4 w-24 bg-slate-200 rounded-full" />
              <div className="h-4 w-36 bg-slate-200 rounded-full" />
              <div className="h-4 w-28 bg-slate-200 rounded-full" />
              <div className="h-7 w-28 bg-slate-200 rounded-xl" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Controls & Filter Panel Matrix */}
          <div className="bg-slate-50/80 border border-slate-100 p-5 rounded-[28px] flex flex-wrap gap-x-5 gap-y-4 items-end shadow-sm shadow-slate-100/10">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Search Profile</label>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Client or pet name..." 
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)} 
                  className="w-48 pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700 outline-none hover:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all placeholder-slate-300" 
                />
                <svg className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Groomer</label>
              <CustomDropdown 
                label={filterGroomer === 'all' ? 'All Groomers' : (staffList.find(s => String(s.id) === String(filterGroomer))?.name || 'Unassigned')} 
                options={[{id: 'all', name: 'All Groomers'}, ...staffList]} 
                value={filterGroomer} 
                onChange={setFilterGroomer} 
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Calendar Date</label>
              <input 
                type="date" 
                value={filterDate} 
                onChange={(e) => setFilterDate(e.target.value)} 
                className="px-4 py-2 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 hover:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all outline-none" 
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Status</label>
              <CustomDropdown label={filterStatus === 'all' ? 'All Statuses' : filterStatus} options={[{id: 'all', name: 'All Statuses'}, {id: 'Confirmed', name: 'Confirmed'}, {id: 'Completed', name: 'Completed'}, {id: 'Cancelled', name: 'Cancelled'}]} value={filterStatus} onChange={setFilterStatus} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Channel Type</label>
              <CustomDropdown label={filterType === 'all' ? 'All Channels' : filterType} options={[{id: 'all', name: 'All Channels'}, {id: 'Scheduled', name: 'Scheduled'}, {id: 'Walk-in', name: 'Walk-in'}]} value={filterType} onChange={setFilterType} />
            </div>

            <button 
              onClick={() => { setSearch(''); setFilterGroomer('all'); setFilterDate(''); setFilterStatus('all'); setFilterType('all'); }} 
              className="px-5 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50/40 transition-all cursor-pointer h-fit shadow-sm shadow-slate-100"
            >
              Reset Filters
            </button>
          </div>

          {/* Main Table Layer */}
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm shadow-slate-100/40 overflow-visible">
            <div className="overflow-x-auto rounded-[32px]">
              <table className="w-full min-w-[1000px]">
                <thead className="bg-slate-50/60 border-b border-slate-100">
                  <tr>
                    <th className="pl-8 pr-4 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Time</th>
                    <th 
                      className="px-4 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-700 select-none group" 
                      onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                    >
                      <div className="flex items-center gap-1">
                        Date Parameters
                        <svg className={`w-3 h-3 transition-transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </th>
                    <th className="px-4 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Customer (Pet)</th>
                    <th className="px-4 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</th>
                    <th className="px-4 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Service Suite</th>
                    <th className="px-4 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Channel Type</th>
                    <th className="px-4 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned Stylist</th>
                    <th className="pl-4 pr-8 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Workflow Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  
                  {/* SCENARIO A: Absolutely no records stored in database history */}
                  {bookings.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-24 text-center">
                        <div className="w-14 h-14 bg-teal-50 border border-teal-100 flex items-center justify-center rounded-2xl text-teal-600 mx-auto mb-4 animate-in zoom-in duration-300">
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <h3 className="text-base font-bold text-slate-800">No appointments logged yet</h3>
                        <p className="text-slate-400 text-xs mt-1 max-w-xs mx-auto">There are currently zero past or upcoming customer session logs recorded within the database registry.</p>
                      </td>
                    </tr>
                  ) : filteredBookings.length === 0 ? (
                    /* SCENARIO B: System contains records, but search/filter arrays return zero matching outputs */
                    <tr>
                      <td colSpan={8} className="py-24 text-center">
                        <div className="w-14 h-14 bg-slate-50 border border-slate-100 flex items-center justify-center rounded-2xl text-slate-400 mx-auto mb-4">
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                        <h3 className="text-base font-bold text-slate-800">No parameters matched</h3>
                        <p className="text-slate-400 text-xs mt-1 max-w-xs mx-auto">We couldn't locate matching entries. Try modifying your search keywords or resetting option filters.</p>
                      </td>
                    </tr>
                  ) : (
                    /* SCENARIO C: Render regular dataset rows maps */
                    filteredBookings.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="pl-8 pr-4 py-4.5 text-slate-800 font-bold text-sm select-none">{formatTime(b.appointment_time)}</td>
                        <td className="px-4 py-4.5 text-sm font-medium text-slate-800 tracking-tight">
                          {b.appointment_date}
                        </td>
                        <td className="px-4 py-4.5 text-sm font-bold text-slate-850">
                          {b.customer_name} <span className="text-slate-400 font-semibold text-xs ml-0.5">({b.pet_name})</span>
                        </td>
                        <td className="px-4 py-4.5 text-sm text-slate-500 font-medium">{b.customer_email}</td>
                        
                        <td className="px-4 py-4.5">
                          <CustomDropdown 
                            isEditable={b.appointment_date >= today && b.status !== 'Cancelled' && b.status !== 'Completed'}
                            label={servicesList.find(s => s.id === Number(b.service_id))?.name || 'Select Service'}
                            value={b.service_id}
                            options={servicesList}
                            onChange={(val: any) => updateBooking(b.id, 'service_id', val)}
                          />
                        </td>
                        
                        <td className="px-4 py-4.5 text-sm font-bold text-slate-500 tracking-tight select-none">
                          {b.booking_type || 'Scheduled'}
                        </td>
                        
                        <td className="px-4 py-4.5">
                          <CustomDropdown 
                            isEditable={b.appointment_date >= today && b.status !== 'Cancelled' && b.status !== 'Completed'}
                            label={staffList.find(s => s.id === Number(b.staff_id))?.name || 'Unassigned'}
                            value={b.staff_id}
                            options={staffList}
                            onChange={(val: any) => updateBooking(b.id, 'staff_id', val)}
                          />
                        </td>
                        
                        <td className="pl-4 pr-8 py-4.5 text-right">
                          <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black tracking-wide border inline-flex items-center gap-1.5 w-fit ${
                            b.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                            b.status === 'Cancelled' ? 'bg-rose-50 text-rose-700 border-rose-200' : 
                            'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              b.status === 'Completed' ? 'bg-emerald-500' : 
                              b.status === 'Cancelled' ? 'bg-rose-500' : 
                              'bg-amber-500 animate-pulse'
                            }`}></span>
                            {b.status?.toUpperCase() || 'PENDING'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}