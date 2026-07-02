import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface Booking {
  id: number;
  customer_name: string;
  customer_email: string;
  pet_name: string;
  appointment_date: string;
  appointment_time: string;
  status?: string;
  staff_id?: number | string;
}

export default function AdminDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [staffList, setStaffList] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  
  
  // Filter States
  const [search, setSearch] = useState('');
  const [filterGroomer, setFilterGroomer] = useState('all');

  // Time Formatter
  const formatTime = (timeStr: string) => {
    const [h, m] = timeStr.split(':');
    const hour = parseInt(h);
    const suffix = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${m} ${suffix}`;
  };

  // Derived state for Today
  const today = new Date().toISOString().split('T')[0];
  const todayBookings = bookings.filter(b => b.appointment_date === today && b.status !== 'Cancelled');
  
  // Apply Filters
  const filteredBookings = todayBookings.filter((b) => {
    if (b.status === 'Completed') return false; // Hides completed from table
    const matchesSearch = b.customer_name.toLowerCase().includes(search.toLowerCase()) || 
                          b.pet_name.toLowerCase().includes(search.toLowerCase());
    const matchesGroomer = filterGroomer === 'all' || String(b.staff_id) === filterGroomer;
    return matchesSearch && matchesGroomer;
  });

  const completedToday = todayBookings.filter(b => b.status === 'Completed').length;
  const pendingToday = todayBookings.length - completedToday;

  const updateStatus = async (id: number, newStatus: string) => {
    await supabase.from('bookings').update({ status: newStatus }).eq('id', id);
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
  };

  const cancelBooking = async (id: number) => {
  if (!window.confirm("Are you sure you want to cancel this booking?")) return;
  
  // Instead of .delete(), we use .update()
  const { error } = await supabase
    .from('bookings')
    .update({ status: 'Cancelled' }) // Mark as Cancelled instead of deleting
    .eq('id', id);

  if (error) {
    alert("Error canceling booking: " + error.message);
  } else {
    // Update the local state so the UI reflects the change immediately
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'Cancelled' } : b));
  }
};

 useEffect(() => {
  // 1. Initial Fetch
  async function fetchData() {
    const [ { data: s }, { data: b } ] = await Promise.all([
      supabase.from('staff').select('id, name').eq('is_active', true),
      supabase.from('bookings').select('*').gte('appointment_date', today)
    ]);
    if (s) setStaffList(s); 
    if (b) setBookings(b);
    setLoading(false);
  }
  fetchData();

  // 2. Add Realtime Subscription
  const channel = supabase
    .channel('dashboard-changes')
    .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'bookings' 
    }, () => {
      fetchData(); 
    })
    .subscribe();

  // 3. Cleanup on unmount
  return () => {
    supabase.removeChannel(channel);
  };
}, [today]);

  if (loading) return (
    <div className="p-8 max-w-7xl mx-auto animate-pulse">
      {/* Header Skeleton */}
      <div className="mb-8">
        <div className="h-10 w-48 bg-slate-200 rounded-lg mb-2"></div>
        <div className="h-4 w-64 bg-slate-100 rounded"></div>
      </div>

      {/* Metric Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-slate-200 rounded-3xl"></div>
        ))}
      </div>

      {/* Filters Skeleton */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-16 bg-slate-200 rounded-2xl"></div>
        <div className="h-16 bg-slate-200 rounded-2xl"></div>
      </div>

      {/* Table Skeleton */}
      <div className="h-96 bg-slate-200 rounded-3xl w-full"></div>
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Dashboard</h2>
          <p className="text-slate-500">Today's operations at a glance.</p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-slate-400 text-sm font-bold uppercase">Total Bookings</p>
          <h3 className="text-4xl font-black text-slate-800 mt-2">{todayBookings.length}</h3>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-slate-400 text-sm font-bold uppercase">Completed</p>
          <h3 className="text-4xl font-black text-green-600 mt-2">{completedToday}</h3>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-slate-400 text-sm font-bold uppercase">Pending</p>
          <h3 className="text-4xl font-black text-yellow-600 mt-2">{pendingToday}</h3>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <input 
          type="text" 
          placeholder="Search by name or pet..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          className="p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-teal-200" 
        />
        <select 
          value={filterGroomer} 
          onChange={(e) => setFilterGroomer(e.target.value)} 
          className="p-4 bg-white border border-slate-200 rounded-2xl outline-none"
        >
          <option value="all">All Groomers</option>
          {staffList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {/* Table or Empty State */}
      {filteredBookings.length > 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase">Time</th>
                <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase">Customer</th>
                <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase">Email</th>
                <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase">Pet</th>
                <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase">Groomer</th>
                <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase">Status</th>
                <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((b) => (
                <tr key={b.id} className="border-t border-slate-100 hover:bg-slate-50">
                  {/* Updated display to use formatTime */}
                  <td className="p-4 text-sm text-slate-600">{formatTime(b.appointment_time)}</td>
                  <td className="p-4 text-sm font-bold text-slate-800">{b.customer_name}</td>
                  <td className="p-4 text-sm text-slate-600">{b.customer_email}</td>
                  <td className="p-4 text-sm text-slate-600">{b.pet_name}</td>
                  <td className="p-4 text-sm font-medium text-teal-700">{staffList.find(s => s.id === Number(b.staff_id))?.name || '—'}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                      b.status === 'Completed' ? 'bg-green-100 text-green-700' : 
                      b.status === 'Cancelled' ? 'bg-red-100 text-red-700' : 
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="p-4 flex gap-2">
                    {b.status === 'Confirmed' ? (
                      <>
                        <button onClick={() => updateStatus(b.id, 'Completed')} className="text-green-600 hover:bg-green-50 px-2 py-1 rounded-md text-xs font-bold">Done</button>
                        <button onClick={() => cancelBooking(b.id)} className="text-red-600 hover:bg-red-50 px-2 py-1 rounded-md text-xs font-bold">Cancel</button>
                      </>
                    ) : (
                      <span className="text-slate-400 text-xs italic px-2">{b.status}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white p-16 text-center rounded-3xl border-2 border-dashed border-slate-200">
          <div className="text-6xl mb-4">🐾</div>
          <h3 className="text-2xl font-bold text-slate-700">No appointments today!</h3>
          <p className="text-slate-500 mt-2">Take a breather, grab a coffee. You're all caught up.</p>
        </div>
      )}
    </div>
  );
}