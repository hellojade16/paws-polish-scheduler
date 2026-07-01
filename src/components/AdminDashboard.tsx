import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

interface Booking {
  id: number;
  customer_name: string;
  customer_email: string;
  pet_name: string;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  status?: string;
  booking_type?: string;
  staff_id?: number | string;
}

export default function AdminDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('Pet Care Specialist');
  
  // Filter States
  const [search, setSearch] = useState('');
  const [filterGroomer, setFilterGroomer] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');

  // Form States
  const [customerName, setCustomerName] = useState('');
  const [petName, setPetName] = useState('');
  const [serviceId, setServiceId] = useState(''); 
  const [staffId, setStaffId] = useState('');    
  const [walkInDate, setWalkInDate] = useState(''); 
  const [walkInTime, setWalkInTime] = useState(''); 
  const [staffList, setStaffList] = useState<{ id: number; name: string }[]>([]);
  const [services, setServices] = useState<{ id: number; name: string; duration_minutes: number }[]>([]);
  const navigate = useNavigate();

  const handleLogout = async () => {
  await supabase.auth.signOut();
  navigate('/login');
};

  const clearFilters = () => {
    setSearch(''); setFilterGroomer('all'); setFilterDate(''); setFilterStatus('all'); setFilterType('all');
  };

  const filteredBookings = bookings.filter((b) => {
    const matchesSearch = b.customer_name.toLowerCase().includes(search.toLowerCase()) || b.pet_name.toLowerCase().includes(search.toLowerCase());
    const matchesGroomer = filterGroomer === 'all' || String(b.staff_id) === filterGroomer;
    const matchesDate = filterDate === '' || b.appointment_date === filterDate;
    const matchesStatus = filterStatus === 'all' || b.status === filterStatus;
    const matchesType = filterType === 'all' || b.booking_type === filterType;
    return matchesSearch && matchesGroomer && matchesDate && matchesStatus && matchesType;
  });

  const deleteBooking = async (id: number) => {
    if (!window.confirm("Cancel this booking?")) return;
    await supabase.from('bookings').delete().eq('id', id);
    setBookings(bookings.filter((b) => b.id !== id));
  };

  const updateStatus = async (id: number, newStatus: string) => {
    await supabase.from('bookings').update({ status: newStatus }).eq('id', id);
    setBookings(bookings.map(b => b.id === id ? { ...b, status: newStatus } : b));
  };

  const addWalkIn = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from('bookings').insert([{ customer_name: customerName, customer_email: 'N/A', pet_name: petName, service_id: parseInt(serviceId), staff_id: parseInt(staffId), appointment_date: walkInDate, appointment_time: walkInTime, status: 'Confirmed', booking_type: 'Walk-in' }]);
    setCustomerName(''); setPetName(''); setIsModalOpen(false);
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('staff').insert([{ name: newStaffName, role: newStaffRole, is_active: true }]);
    if (error) alert("Error adding staff: " + error.message);
    else {
      alert("Staff added!");
      setNewStaffName(''); setNewStaffRole('Pet Care Specialist'); setIsStaffModalOpen(false);
      const { data } = await supabase.from('staff').select('id, name').eq('is_active', true);
      if (data) setStaffList(data);
    }
  };

  useEffect(() => {
  // 1. Listen for Bookings changes
  const bookingChannel = supabase
    .channel('realtime-bookings')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, (payload) => {
      if (payload.eventType === 'INSERT') setBookings(prev => [...prev, payload.new as Booking]);
      if (payload.eventType === 'DELETE') setBookings(prev => prev.filter(b => b.id !== payload.old.id));
      if (payload.eventType === 'UPDATE') setBookings(prev => prev.map(b => b.id === payload.new.id ? { ...b, ...(payload.new as Booking) } : b));
    })
    .subscribe();

  // 2. Listen for Staff changes
  const staffChannel = supabase
    .channel('realtime-staff')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'staff' }, () => {
      // Re-fetch the staff list whenever a change happens (Add/Update/Delete)
      supabase.from('staff').select('id, name').eq('is_active', true).then(({ data }) => {
        if (data) setStaffList(data);
      });
    })
    .subscribe();

  // Initial Fetch
  async function fetchData() {
    const today = new Date().toISOString().split('T')[0];
    const [ { data: s }, { data: sv }, { data: b } ] = await Promise.all([
      supabase.from('staff').select('id, name').eq('is_active', true),
      supabase.from('services').select('id, name, duration_minutes'),
      supabase.from('bookings').select('*').gte('appointment_date', today)
    ]);
    if (s) setStaffList(s); if (sv) setServices(sv); if (b) setBookings(b);
    setLoading(false);
  }
  fetchData();

  // Cleanup
  return () => { 
    supabase.removeChannel(bookingChannel); 
    supabase.removeChannel(staffChannel);
  };
}, []);

  if (loading) return <div className="p-12 text-center text-teal-600 font-bold">Loading...</div>;

  return (
    
    <div className="p-8 max-w-7xl mx-auto">
      <button 
  onClick={handleLogout} 
  className="text-red-500 font-bold hover:underline"
>
  Logout
</button>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Dashboard</h2>
          <p className="text-slate-500 text-sm">Manage appointments and staff members.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setIsStaffModalOpen(true)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-6 rounded-2xl transition-all">+ Add Staff</button>
          <button onClick={() => setIsModalOpen(true)} className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-6 rounded-2xl shadow-lg transition-all">+ Add Walk-in</button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm mb-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
        <div className="col-span-2 lg:col-span-1"><label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Search</label><input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" /></div>
        <div><label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Groomer</label><select value={filterGroomer} onChange={(e) => setFilterGroomer(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm"><option value="all">All</option>{staffList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
        <div><label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Date</label><input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" /></div>
        <div><label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Status</label><select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm"><option value="all">All</option><option value="Confirmed">Confirmed</option><option value="Completed">Completed</option></select></div>
        <div><label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Type</label><select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm"><option value="all">All</option><option value="Scheduled">Scheduled</option><option value="Walk-in">Walk-in</option></select></div>
        <button onClick={clearFilters} className="p-3 text-slate-400 hover:text-red-500 font-bold text-sm bg-slate-50 rounded-xl">Clear</button>
      </div>

      {filteredBookings.length > 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr><th className="p-4 text-left text-xs font-bold text-slate-500 uppercase">Date</th><th className="p-4 text-left text-xs font-bold text-slate-500 uppercase">Time</th><th className="p-4 text-left text-xs font-bold text-slate-500 uppercase">Customer</th><th className="p-4 text-left text-xs font-bold text-slate-500 uppercase">Pet</th><th className="p-4 text-left text-xs font-bold text-slate-500 uppercase">Groomer</th><th className="p-4 text-left text-xs font-bold text-slate-500 uppercase">Type</th><th className="p-4 text-left text-xs font-bold text-slate-500 uppercase">Status</th><th className="p-4 text-left text-xs font-bold text-slate-500 uppercase">Actions</th></tr>
            </thead>
            <tbody>
              {filteredBookings.map((b) => (
                <tr key={b.id} className="border-t border-slate-100 hover:bg-slate-50 transition-colors"><td className="p-4 text-sm font-medium text-slate-800">{b.appointment_date}</td><td className="p-4 text-sm text-slate-600">{b.appointment_time}</td><td className="p-4 text-sm font-bold text-slate-800">{b.customer_name}</td><td className="p-4 text-sm text-slate-600">{b.pet_name}</td><td className="p-4 text-sm text-slate-600">{staffList.find(s => s.id === Number(b.staff_id))?.name || '—'}</td><td className="p-4"><span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${b.booking_type === 'Walk-in' ? 'bg-purple-100 text-purple-700' : 'bg-teal-100 text-teal-700'}`}>{b.booking_type || 'Scheduled'}</span></td><td className="p-4 text-sm font-bold text-slate-600">{b.status || 'Confirmed'}</td><td className="p-4 flex gap-2">{b.status === 'Confirmed' ? (<><button onClick={() => updateStatus(b.id, 'Completed')} className="text-green-600 hover:bg-green-50 px-2 py-1 rounded-md text-xs font-bold">Done</button><button onClick={() => deleteBooking(b.id)} className="text-red-600 hover:bg-red-50 px-2 py-1 rounded-md text-xs font-bold">Cancel</button></>) : <span className="text-slate-400 text-xs italic px-2">Archived</span>}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white p-12 text-center rounded-3xl border border-dashed border-slate-200"><p className="text-slate-400 font-medium">No appointments match your search/filters.</p><button onClick={clearFilters} className="text-teal-600 font-bold hover:underline mt-2">Clear all filters</button></div>
      )}

      {/* Add Walk-in Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full relative shadow-2xl">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 text-xl">✕</button>
            <h3 className="text-2xl font-bold mb-6">Add Walk-in</h3>
            <form onSubmit={addWalkIn} className="space-y-4">
              <input type="text" placeholder="Customer Name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full p-3 border rounded-xl" required />
              <input type="text" placeholder="Pet Name" value={petName} onChange={(e) => setPetName(e.target.value)} className="w-full p-3 border rounded-xl" required />
              <div className="grid grid-cols-2 gap-4">
                <select value={serviceId} onChange={(e) => setServiceId(e.target.value)} className="w-full p-3 border rounded-xl" required><option value="" disabled>Service</option>{services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
                <select value={staffId} onChange={(e) => setStaffId(e.target.value)} className="w-full p-3 border rounded-xl" required><option value="" disabled>Staff</option>{staffList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
              </div>
              <div className="grid grid-cols-2 gap-4"><input type="date" value={walkInDate} onChange={(e) => setWalkInDate(e.target.value)} className="p-3 border rounded-xl" required /><input type="time" value={walkInTime} onChange={(e) => setWalkInTime(e.target.value)} className="p-3 border rounded-xl" required /></div>
              <button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 rounded-xl mt-4">Save Walk-in</button>
            </form>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full relative shadow-2xl">
            <button onClick={() => setIsStaffModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 text-xl">✕</button>
            <h3 className="text-2xl font-bold mb-6">Add Staff</h3>
            <form onSubmit={handleAddStaff} className="space-y-4">
              <input type="text" placeholder="Staff Name" value={newStaffName} onChange={(e) => setNewStaffName(e.target.value)} className="w-full p-3 border rounded-xl" required />
              <input type="text" placeholder="Role (e.g. Stylist)" value={newStaffRole} onChange={(e) => setNewStaffRole(e.target.value)} className="w-full p-3 border rounded-xl" required />
              <button type="submit" className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-4 rounded-xl mt-4">Save Staff</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}