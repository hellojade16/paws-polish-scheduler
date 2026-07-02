import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface Booking {
  id: number;
  customer_name: string;
  pet_name: string;
  appointment_date: string;
  appointment_time: string;
  status?: string;
  booking_type?: string;
  staff_id?: number | string;
}

export default function ViewBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [staffList, setStaffList] = useState<{ id: number; name: string }[]>([]);

  // Filter States
  const [search, setSearch] = useState('');
  const [filterGroomer, setFilterGroomer] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');

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

  useEffect(() => {
    async function fetchData() {
      // Fetch EVERYTHING (removed the .gte filter to show history)
      const [ { data: s }, { data: b } ] = await Promise.all([
        supabase.from('staff').select('id, name'),
        supabase.from('bookings').select('*').order('appointment_date', { ascending: false })
      ]);
      if (s) setStaffList(s); 
      if (b) setBookings(b);
      setLoading(false);
    }
    fetchData();
  }, []);

 return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800">Booking History</h2>
        <p className="text-slate-500 text-sm">View, search, and audit all past and future appointments.</p>
      </div>

      {loading ? (
        /* Modern Skeleton Loader */
        <div className="animate-pulse space-y-8">
          <div className="bg-slate-200 h-24 rounded-3xl w-full"></div>
          <div className="bg-slate-200 h-96 rounded-3xl w-full"></div>
        </div>
      ) : (
        <>
          {/* Filters */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm mb-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
            <div className="col-span-2 lg:col-span-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Search</label>
              <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Groomer</label>
              <select value={filterGroomer} onChange={(e) => setFilterGroomer(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm">
                <option value="all">All</option>{staffList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Date</label>
              <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Status</label>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm">
                <option value="all">All</option><option value="Confirmed">Confirmed</option><option value="Completed">Completed</option><option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Type</label>
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm">
                <option value="all">All</option><option value="Scheduled">Scheduled</option><option value="Walk-in">Walk-in</option>
              </select>
            </div>
            <button onClick={clearFilters} className="p-3 text-slate-400 hover:text-red-500 font-bold text-sm bg-slate-50 rounded-xl">Clear All</button>
          </div>

          {/* Data Table or Empty State */}
          {filteredBookings.length > 0 ? (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase">Date</th>
                    <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase">Time</th>
                    <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase">Customer</th>
                    <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase">Pet</th>
                    <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase">Groomer</th>
                    <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((b) => (
                    <tr key={b.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="p-4 text-sm font-medium text-slate-800">{b.appointment_date}</td>
                      <td className="p-4 text-sm text-slate-600">{b.appointment_time}</td>
                      <td className="p-4 text-sm font-bold text-slate-800">{b.customer_name}</td>
                      <td className="p-4 text-sm text-slate-600">{b.pet_name}</td>
                      <td className="p-4 text-sm text-slate-600">{staffList.find(s => s.id === Number(b.staff_id))?.name || '—'}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                          b.status === 'Completed' ? 'bg-green-100 text-green-700' : 
                          b.status === 'Cancelled' ? 'bg-red-100 text-red-700' : 
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white p-16 text-center rounded-3xl border-2 border-dashed border-slate-200">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-bold text-slate-700">No results found</h3>
              <p className="text-slate-500 mt-2">Try adjusting your filters or search terms.</p>
              <button onClick={clearFilters} className="mt-4 text-teal-600 font-bold hover:underline">Clear all filters</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}