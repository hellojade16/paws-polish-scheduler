import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';

// custom dropdown component
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

  if (!isEditable) return <span className="text-slate-400 text-sm italic">{label}</span>;

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-1.5 px-3 py-1 bg-slate-100 hover:bg-teal-50 border border-slate-200 rounded-full cursor-pointer text-xs font-semibold text-slate-700 transition-all w-30 outline-none"
      >
        <span className="truncate">{label}</span>
        <svg className={`w-3 h-3 opacity-50 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu - Renders inside the flow, visible because of overflow-visible parent */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-32 bg-white border border-slate-100 rounded-2xl shadow-xl z-[9999]">
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
  service_id: number;
}

export default function ViewBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [staffList, setStaffList] = useState<{ id: number; name: string }[]>([]);
  const [servicesList, setServicesList] = useState<{ id: number; name: string }[]>([]);
  const today = new Date().toISOString().split('T')[0];
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [search, setSearch] = useState('');
  const [filterGroomer, setFilterGroomer] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');

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
    if (error) alert("Failed: " + error.message);
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
    // 1. Search Logic
    const searchLower = search.toLowerCase();
    const matchesSearch = b.customer_name.toLowerCase().includes(searchLower) || 
                          b.pet_name.toLowerCase().includes(searchLower);

    // 2. Groomer Filter (Robust Type-Safe Comparison)
    // We trim and convert both to strings to ensure 1 matches "1"
    const dbStaffId = b.staff_id != null ? String(b.staff_id).trim() : 'unassigned';
    const filterId = String(filterGroomer).trim();
    const matchesGroomer = filterGroomer === 'all' || dbStaffId === filterId;

    // 3. Other Filters
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
    <div className="py-8 pr-8 pl-4 w-full">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800">Booking History</h2>
        <p className="text-slate-500 text-sm">View, search, and audit all past and future appointments.</p>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-8">
          <div className="bg-slate-200 h-96 rounded-3xl w-full"></div>
        </div>
      ) : (
        <>
          <div className="bg-white p-3 rounded-3xl border border-slate-100 shadow-sm mb-8 grid grid-cols-2 md:grid-cols-6 gap-1 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-3">Search</label>
              <input type="text" placeholder="Name or Pet" value={search} onChange={(e) => setSearch(e.target.value)} className="w-30 px-4 py-1 bg-slate-50 border border-slate-200 rounded-full text-xs font-semibold text-slate-700 outline-none" />
            </div>
            <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-3">Groomer</label>
            <CustomDropdown 
              label={filterGroomer === 'all' ? 'All' : (staffList.find(s => String(s.id) === String(filterGroomer))?.name || 'Unassigned')} 
              options={[{id: 'all', name: 'All'}, ...staffList]} 
              value={filterGroomer} 
              onChange={(val: any) => {
                setFilterGroomer(val);
              }} 
            />
          </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-3">Date</label>
              <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="w-32 px-4 py-1 bg-slate-50 border border-slate-200 rounded-full text-xs font-semibold text-slate-700" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-3">Status</label>
              <CustomDropdown label={filterStatus === 'all' ? 'All' : filterStatus} options={[{id: 'all', name: 'All'}, {id: 'Confirmed', name: 'Confirmed'}, {id: 'Completed', name: 'Completed'}, {id: 'Cancelled', name: 'Cancelled'}]} value={filterStatus} onChange={setFilterStatus} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-3">Type</label>
              <CustomDropdown label={filterType === 'all' ? 'All' : filterType} options={[{id: 'all', name: 'All'}, {id: 'Scheduled', name: 'Scheduled'}, {id: 'Walk-in', name: 'Walk-in'}]} value={filterType} onChange={setFilterType} />
            </div>
            <button onClick={() => { setSearch(''); setFilterGroomer('all'); setFilterDate(''); setFilterStatus('all'); setFilterType('all'); }} className="w-30 px-4 py-1 bg-slate-50 border border-slate-200 rounded-full text-xs font-bold text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all">Clear All</button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-visible">
            <table className="w-full">
             <thead className="bg-slate-50">
  <tr>
    <th className="px-3 py-4 text-left text-xs font-bold text-slate-500 uppercase">Time</th> {/* Added */}
    <th className="px-3 py-4 text-left text-xs font-bold text-slate-500 uppercase cursor-pointer" onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}>Date</th>
    <th className="px-3 py-4 text-left text-xs font-bold text-slate-500 uppercase">Customer (Pet)</th>
    <th className="px-3 py-4 text-left text-xs font-bold text-slate-500 uppercase">Email</th>
    <th className="px-3 py-4 text-left text-xs font-bold text-slate-500 uppercase">Service</th>
    <th className="px-3 py-4 text-left text-xs font-bold text-slate-500 uppercase">Type</th>
    <th className="px-3 py-4 text-left text-xs font-bold text-slate-500 uppercase">Groomer</th>
    <th className="px-3 py-4 text-left text-xs font-bold text-slate-500 uppercase">Status</th>
  </tr>
</thead>
<tbody>
  {filteredBookings.map((b) => (
    <tr key={b.id} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
      <td className="px-3 py-4 text-sm font-medium text-slate-800">{formatTime(b.appointment_time)}</td> {/* Added */}
      <td className="px-3 py-4 text-sm font-medium text-slate-800">{b.appointment_date}</td>
      <td className="px-3 py-4 text-sm font-bold text-slate-800">{b.customer_name} <span className="text-slate-400 font-normal">({b.pet_name})</span></td>
      <td className="px-3 py-4 text-sm text-slate-600">{b.customer_email}</td>
      <td className="px-3 py-4">
        <CustomDropdown 
          isEditable={b.appointment_date > today}
          label={servicesList.find(s => s.id === Number(b.service_id))?.name || 'Select'}
          value={b.service_id}
          options={servicesList}
          onChange={(val: any) => updateBooking(b.id, 'service_id', val)}
        />
      </td>
      <td className="px-3 py-4 text-sm text-slate-600">{b.booking_type}</td>
      <td className="px-3 py-4">
        <CustomDropdown 
          isEditable={b.appointment_date > today}
          label={staffList.find(s => s.id === Number(b.staff_id))?.name || 'Unassigned'}
          value={b.staff_id}
          options={staffList}
          onChange={(val: any) => updateBooking(b.id, 'staff_id', val)}
        />
      </td>
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
        </>
      )}
    </div>
  );
}