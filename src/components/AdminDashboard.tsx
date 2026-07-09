import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import ReactDOM from 'react-dom';

// Custom Modern Dropdown Component with dynamic width configurations
const CustomDropdown = ({ label, options, value, onChange, className = "w-36" }: any) => {
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
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-2xl cursor-pointer text-xs font-bold text-slate-700 transition-all w-full hover:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none select-none h-[46px]"
      >
        <span className="truncate">{label || 'Select'}</span>
        <svg className={`w-3.5 h-3.5 opacity-60 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 w-full bg-white border border-slate-100 rounded-2xl shadow-xl shadow-slate-200/60 z-50 max-h-60 overflow-y-auto overflow-x-hidden animate-in fade-in slide-in-from-top-1 duration-150">
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
  service_id?: number;
}

export default function AdminDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [staffList, setStaffList] = useState<{ id: number; name: string }[]>([]);
  const [servicesList, setServicesList] = useState<{ id: number; name: string }[]>([]);
  const [search, setSearch] = useState('');
  const [filterGroomer, setFilterGroomer] = useState('all');
  const today = new Date().toISOString().split('T')[0];
  const [loading, setLoading] = useState(true);

  // Walk-In Form Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [petName, setPetName] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [selectedStaff, setSelectedStaff] = useState<string | number>('unassigned');
  const [selectedService, setSelectedService] = useState<string | number>('');

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '—';
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
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;
    const { error } = await supabase.from('bookings').update({ status: 'Cancelled' }).eq('id', id);
    if (!error) setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'Cancelled' } : b));
  };

  const openWalkInModal = () => {
    const now = new Date();
    const currentHHMM = now.toTimeString().split(' ')[0].substring(0, 5);
    
    setCustomerName('');
    setCustomerEmail('');
    setPetName('');
    setAppointmentTime(currentHHMM);
    setSelectedStaff('unassigned');
    setSelectedService(servicesList[0]?.id || '');
    setIsModalOpen(true);
  };

  const saveWalkIn = async () => {
    if (!customerName.trim() || !petName.trim() || !selectedService) {
      alert("Please populate the Customer Name, Pet Profile, and Service Suite selections.");
      return;
    }

    const newWalkIn = {
      customer_name: customerName,
      customer_email: customerEmail || 'walkin@pawsnpolish.com',
      pet_name: petName,
      appointment_date: today,
      appointment_time: appointmentTime,
      status: 'Confirmed',
      booking_type: 'Walk-in',
      service_id: Number(selectedService),
      staff_id: selectedStaff === 'unassigned' ? null : Number(selectedStaff)
    };

    const { data, error } = await supabase.from('bookings').insert(newWalkIn).select('*, services(name)');
    
    if (error) {
      alert("Failed to store walk-in: " + error.message);
    } else if (data) {
      setIsModalOpen(false);
      setBookings(prev => [...prev, data[0]]);
    }
  };

  async function fetchData() {
    const [ { data: s }, { data: b }, { data: serv } ] = await Promise.all([
      supabase.from('staff').select('id, name').eq('is_active', true),
      supabase.from('bookings').select('*, services(name)').gte('appointment_date', today),
      supabase.from('services').select('id, name')
    ]);
    if (s) setStaffList(s); 
    if (b) setBookings(b);
    if (serv) setServicesList(serv);
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
    const channel = supabase.channel('dashboard-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => fetchData()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [today]);

  if (loading) return (
    <div className="p-8 max-w-7xl mx-auto animate-pulse space-y-8">
      <div>
        <div className="h-10 w-48 bg-slate-200 rounded-2xl mb-2"></div>
        <div className="h-4 w-64 bg-slate-100 rounded-full"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => <div key={i} className="h-28 bg-slate-200 rounded-[28px]"></div>)}
      </div>
      <div className="h-12 w-96 bg-slate-200 rounded-full"></div>
      <div className="h-96 bg-slate-100 rounded-[32px] w-full"></div>
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Header Container Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Dashboard</h2>
          <p className="text-slate-400 text-sm mt-1">Today's active operations and real-time scheduling metrics.</p>
        </div>
        
        <button 
          onClick={openWalkInModal}
          className="flex items-center justify-center gap-2 bg-teal-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-teal-700 transition-all hover:shadow-lg hover:shadow-teal-600/20 active:scale-95 group shrink-0 cursor-pointer text-sm"
        >
          <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Add Walk-In
        </button>
      </div>

      {/* Walk-In Booking Portal Modal */}
      {isModalOpen && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white p-8 rounded-[32px] w-full max-w-lg shadow-2xl border border-slate-100/80 animate-in fade-in zoom-in duration-200 overflow-visible">
            
            <div className="mb-6">
              <h3 className="text-2xl font-black text-slate-900">Register Walk-In Customer</h3>
              <p className="text-slate-400 text-xs mt-1">Direct check-in for counter arrivals on today's rotation.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-visible">
              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1 mb-1.5 block">Customer Name</label>
                <input 
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-sm font-medium text-slate-800 placeholder-slate-300" 
                  placeholder="Owner's name" 
                  value={customerName} 
                  onChange={(e) => setCustomerName(e.target.value)} 
                />
              </div>
              
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1 mb-1.5 block">Email Address (Optional)</label>
                <input 
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-sm font-medium text-slate-800 placeholder-slate-300" 
                  placeholder="customer@email.com" 
                  value={customerEmail} 
                  onChange={(e) => setCustomerEmail(e.target.value)} 
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1 mb-1.5 block">Pet Profile Name / Breed</label>
                <input 
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-sm font-medium text-slate-800 placeholder-slate-300" 
                  placeholder="e.g. Sam (Shih Tzu)" 
                  value={petName} 
                  onChange={(e) => setPetName(e.target.value)} 
                />
              </div>

              {/* Elevated Service Selection via Custom Dropdown */}
              <div className="relative">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1 mb-1.5 block">Service Suite</label>
                <CustomDropdown 
                  label={servicesList.find(s => s.id == selectedService)?.name || 'Select Service'}
                  options={servicesList}
                  value={selectedService}
                  onChange={setSelectedService}
                  className="w-full"
                />
              </div>

              {/* Elevated Groomer Selection via Custom Dropdown */}
              <div className="relative">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1 mb-1.5 block">Assign Stylist</label>
                <CustomDropdown 
                  label={selectedStaff === 'unassigned' ? 'Leave Unassigned' : staffList.find(s => s.id == selectedStaff)?.name}
                  options={[{ id: 'unassigned', name: 'Leave Unassigned' }, ...staffList]}
                  value={selectedStaff}
                  onChange={setSelectedStaff}
                  className="w-full"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1 mb-1.5 block">Check-In Arrival Time</label>
                <input 
                  type="time"
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-sm font-bold text-slate-700" 
                  value={appointmentTime} 
                  onChange={(e) => setAppointmentTime(e.target.value)} 
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-bold transition-colors text-sm cursor-pointer">Cancel</button>
              <button onClick={saveWalkIn} className="flex-1 py-3.5 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-teal-600/20 text-sm cursor-pointer">Check In Pet</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm shadow-slate-100/40 flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Total Active Bookings</p>
            <h3 className="text-4xl font-black text-slate-900 mt-2 tracking-tight">{todayBookings.length}</h3>
          </div>
          <div className="w-12 h-12 bg-slate-50 border border-slate-100 flex items-center justify-center rounded-2xl text-slate-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm shadow-slate-100/40 flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Completed Sessions</p>
            <h3 className="text-4xl font-black text-emerald-600 mt-2 tracking-tight">{completedToday}</h3>
          </div>
          <div className="w-12 h-12 bg-emerald-50/50 border border-emerald-100/40 flex items-center justify-center rounded-2xl text-emerald-500">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm shadow-slate-100/40 flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Pending / Confirmed</p>
            <h3 className="text-4xl font-black text-amber-600 mt-2 tracking-tight">{pendingToday}</h3>
          </div>
          <div className="w-12 h-12 bg-amber-50/50 border border-amber-100/40 flex items-center justify-center rounded-2xl text-amber-500">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 09 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Control Filters Layer */}
      <div className="flex flex-wrap items-end gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100/80 w-fit">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Search Database</label>
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search client or pet..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="w-52 pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700 outline-none hover:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all placeholder-slate-300" 
            />
            <svg className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Filter Specialist</label>
          <CustomDropdown 
            label={filterGroomer === 'all' ? 'All Groomers' : staffList.find(s => s.id == Number(filterGroomer))?.name} 
            options={[{id: 'all', name: 'All Groomers'}, ...staffList]} 
            value={filterGroomer} 
            onChange={setFilterGroomer} 
          />
        </div>
      </div>

      {/* Main Table Matrix */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm shadow-slate-100/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-slate-50/60 border-b border-slate-100">
              <tr>
                <th className="pl-8 pr-4 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Scheduled Time</th>
                <th className="px-4 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Customer (Pet)</th>
                <th className="px-4 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</th>
                <th className="px-4 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Service Suite</th>
                <th className="px-4 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned Stylist</th>
                <th className="px-4 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Workflow Status</th>
                <th className="pl-4 pr-8 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              
              {/* SCENARIO 1: No upcoming Pending or Confirmed bookings left for today */}
              {pendingToday === 0 ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <div className="w-14 h-14 bg-emerald-50 border border-emerald-100 flex items-center justify-center rounded-2xl text-emerald-600 mx-auto mb-4">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-base font-bold text-slate-800">All caught up for today!</h3>
                    <p className="text-slate-400 text-xs mt-1 max-w-xs mx-auto">There are no pending or active upcoming appointments remaining on the schedule.</p>
                  </td>
                </tr>
              ) : filteredBookings.length === 0 ? (
                /* SCENARIO 2: Active bookings exist, but filter parameters hide them all */
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <div className="w-14 h-14 bg-slate-50 border border-slate-100 flex items-center justify-center rounded-2xl text-slate-400 mx-auto mb-4">
                      <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <h3 className="text-base font-bold text-slate-800">No matching active reservations</h3>
                    <p className="text-slate-400 text-xs mt-1 max-w-xs mx-auto">We couldn't locate matching records. Try modifying your search or clearing the groomer criteria filter.</p>
                  </td>
                </tr>
              ) : (
                /* SCENARIO 3: Render matching active table matrix rows */
                filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="pl-8 pr-4 py-4.5 text-slate-800 font-bold text-sm select-none">{formatTime(b.appointment_time)}</td>
                    
                    {/* Combined Customer and Pet profile column block wrapper */}
                    <td className="px-4 py-4.5 text-sm font-bold text-slate-800 tracking-tight">
                      {b.customer_name} <span className="text-slate-400 font-normal text-xs ml-0.5">({b.pet_name})</span>
                    </td>
                    
                    <td className="px-4 py-4.5 text-sm text-slate-500 font-medium">{b.customer_email}</td>
                    <td className="px-4 py-4.5 text-sm text-slate-600 font-semibold tracking-tight">
                      {b.services?.name || 'Standard Package'}
                    </td>
                    <td className="px-4 py-4.5 text-sm font-bold text-teal-700">{staffList.find(s => s.id === Number(b.staff_id))?.name || <span className="text-slate-300 italic font-medium">Unassigned</span>}</td>
                    <td className="px-4 py-4.5">
                      <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black tracking-wide border flex items-center gap-1.5 w-fit ${b.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${b.status === 'Completed' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></span>
                        {b.status?.toUpperCase()}
                      </span>
                    </td>
                    <td className="pl-4 pr-8 py-4.5 text-right">
                      <div className="inline-flex gap-1.5">
                        <button 
                          onClick={() => updateStatus(b.id, 'Completed')} 
                          className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 text-slate-600 hover:text-emerald-700 hover:border-emerald-200 hover:bg-emerald-50/30 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm bg-white active:scale-95"
                        >
                          <svg className="w-3.5 h-3.5 text-emerald-600 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                          Done
                        </button>
                        <button 
                          onClick={() => cancelBooking(b.id)} 
                          className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 text-slate-600 hover:text-rose-700 hover:border-rose-200 hover:bg-rose-50/30 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm bg-white active:scale-95"
                        >
                          <svg className="w-3.5 h-3.5 text-rose-600 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}