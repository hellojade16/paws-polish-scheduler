import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';

// 1. Custom Modern Dropdown Component
const CustomDropdown = ({ label, options, value, onChange }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-1.5 px-4 py-2 bg-slate-50 border border-slate-200 rounded-full cursor-pointer text-xs font-semibold text-slate-700 transition-all w-32 hover:border-teal-300 outline-none"
      >
        <span className="truncate">{label}</span>
        <svg className={`w-3 h-3 opacity-50 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-32 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden">
          {options.map((o: any) => (
            <button
              key={o.id}
              type="button"
              onClick={() => { onChange(o.id); setIsOpen(false); }}
              className={`block w-full text-left px-4 py-2.5 text-xs font-medium hover:bg-teal-50 hover:text-teal-700 transition-colors truncate ${value == o.id ? 'bg-teal-50 text-teal-700' : 'text-slate-600'}`}
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
}

export default function AdminDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [staffList, setStaffList] = useState<{ id: number; name: string }[]>([]);
  const [search, setSearch] = useState('');
  const [filterGroomer, setFilterGroomer] = useState('all');
  const today = new Date().toISOString().split('T')[0];
  const [loading, setLoading] = useState(true);
  

  const formatTime = (timeStr: string) => {
    const [h, m] = timeStr.split(':');
    const hour = parseInt(h);
    const suffix = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${m} ${suffix}`;
  };

  const todayBookings = bookings.filter(b => b.appointment_date === today && b.status !== 'Cancelled');
  
 const filteredBookings = todayBookings.filter((b) => {
  if (b.status === 'Completed') return false;
  
  const matchesSearch = b.customer_name.toLowerCase().includes(search.toLowerCase()) || 
                        b.pet_name.toLowerCase().includes(search.toLowerCase());

  const dbStaffId = b.staff_id ? String(b.staff_id).trim() : 'unassigned';
  const selectedStaffId = String(filterGroomer).trim();
  
  const matchesGroomer = filterGroomer === 'all' || dbStaffId === selectedStaffId;  
  return matchesSearch && matchesGroomer;
});

  const completedToday = todayBookings.filter(b => b.status === 'Completed').length;
  const pendingToday = todayBookings.length - completedToday;

  const updateStatus = async (id: number, newStatus: string) => {
    await supabase.from('bookings').update({ status: newStatus }).eq('id', id);
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
  };

  const cancelBooking = async (id: number) => {
    if (!window.confirm("Are you sure?")) return;
    const { error } = await supabase.from('bookings').update({ status: 'Cancelled' }).eq('id', id);
    if (!error) setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'Cancelled' } : b));
  };

  useEffect(() => {
    async function fetchData() {
      const [ { data: s }, { data: b } ] = await Promise.all([
        supabase.from('staff').select('id, name').eq('is_active', true),
        supabase.from('bookings').select('*, services(name)').gte('appointment_date', today)
      ]);
      if (s) setStaffList(s); 
      if (b) setBookings(b);
      setLoading(false);
    }
    fetchData();
    const channel = supabase.channel('dashboard-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => fetchData()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [today]);

  // Skeleton Loading State
  if (loading) return (
    <div className="p-8 max-w-7xl mx-auto animate-pulse">
      <div className="mb-8">
        <div className="h-10 w-48 bg-slate-200 rounded-lg mb-2"></div>
        <div className="h-4 w-64 bg-slate-100 rounded"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[1, 2, 3].map((i) => <div key={i} className="h-32 bg-slate-200 rounded-3xl"></div>)}
      </div>
      <div className="mb-6 h-12 w-full bg-slate-200 rounded-full"></div>
      <div className="h-96 bg-slate-100 rounded-3xl w-full"></div>
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800">Dashboard</h2>
        <p className="text-slate-500 text-sm">Today's operations at a glance.</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm"><p className="text-slate-400 text-xs font-bold uppercase">Total Bookings</p><h3 className="text-4xl font-black text-slate-800 mt-2">{todayBookings.length}</h3></div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm"><p className="text-slate-400 text-xs font-bold uppercase">Completed</p><h3 className="text-4xl font-black text-green-600 mt-2">{completedToday}</h3></div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm"><p className="text-slate-400 text-xs font-bold uppercase">Pending</p><h3 className="text-4xl font-black text-yellow-600 mt-2">{pendingToday}</h3></div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex items-end gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase ml-3">Search</label>
          <input 
            type="text" 
            placeholder="Name or Pet" 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="w-40 px-4 py-2 bg-white border border-slate-200 rounded-full text-xs font-semibold text-slate-700 outline-none hover:border-teal-300" 
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase ml-3">Groomer</label>
          <CustomDropdown 
            label={filterGroomer === 'all' ? 'All Groomers' : staffList.find(s => s.id == Number(filterGroomer))?.name} 
            options={[{id: 'all', name: 'All Groomers'}, ...staffList]} 
            value={filterGroomer} 
            onChange={setFilterGroomer} 
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-4 text-left text-xs font-bold text-slate-500 uppercase">Time</th>
              <th className="px-3 py-4 text-left text-xs font-bold text-slate-500 uppercase">Customer</th>
              <th className="px-3 py-4 text-left text-xs font-bold text-slate-500 uppercase">Email</th>
              <th className="px-3 py-4 text-left text-xs font-bold text-slate-500 uppercase">Pet</th>
              <th className="px-3 py-4 text-left text-xs font-bold text-slate-500 uppercase">Service</th>
              <th className="px-3 py-4 text-left text-xs font-bold text-slate-500 uppercase">Groomer</th>
              <th className="px-3 py-4 text-left text-xs font-bold text-slate-500 uppercase">Status</th>
              <th className="px-3 py-4 text-left text-xs font-bold text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.map((b) => (
              <tr key={b.id} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="px-3 py-4 text-sm text-slate-600">{formatTime(b.appointment_time)}</td>
                <td className="px-3 py-4 text-sm font-bold text-slate-800">{b.customer_name}</td>
                <td className="px-3 py-4 text-sm text-slate-600">{b.customer_email}</td>
                <td className="px-3 py-4 text-sm text-slate-600">{b.pet_name}</td>
                <td className="px-3 py-4 text-sm text-slate-600">{b.services?.name || '—'}</td>
                <td className="px-3 py-4 text-sm font-medium text-teal-700">{staffList.find(s => s.id === Number(b.staff_id))?.name || '—'}</td>
                <td className="px-3 py-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${b.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {b.status}
                  </span>
                </td>
                <td className="px-3 py-4 flex gap-2">
                  <button onClick={() => updateStatus(b.id, 'Completed')} className="text-green-600 hover:bg-green-50 px-2 py-1 rounded-md text-xs font-bold">Done</button>
                  <button onClick={() => cancelBooking(b.id)} className="text-red-600 hover:bg-red-50 px-2 py-1 rounded-md text-xs font-bold">Cancel</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}