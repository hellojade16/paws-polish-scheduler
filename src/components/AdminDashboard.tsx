import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface Booking {
  id: number;
  customer_name: string;
  customer_email: string;
  pet_name: string;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  status?: string;
}

export default function AdminDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [customerName, setCustomerName] = useState('');
  const [petName, setPetName] = useState('');
  const [serviceId, setServiceId] = useState(''); 
  const [staffId, setStaffId] = useState('');     
  const [walkInDate, setWalkInDate] = useState(''); 
  const [walkInTime, setWalkInTime] = useState(''); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [staffList, setStaffList] = useState<{ id: number; name: string }[]>([]);
  const [services, setServices] = useState<{ id: number; name: string; duration_minutes: number }[]>([]);

  const deleteBooking = async (id: number) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;

    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', id);

    if (error) {
      alert("Error deleting booking: " + error.message);
    } else {
      // Update UI immediately without refreshing
      setBookings(bookings.filter((b) => b.id !== id));
    }
  };

  const updateStatus = async (id: number, newStatus: string) => {
  const { error } = await supabase
    .from('bookings')
    .update({ status: newStatus })
    .eq('id', id);

  if (error) alert("Error updating status");
  else {
    setBookings(bookings.map(b => b.id === id ? { ...b, status: newStatus } : b));
  }
};

const addWalkIn = async (e: React.FormEvent) => {
  e.preventDefault();
  
  const { error } = await supabase.from('bookings').insert([
    { 
      customer_name: customerName,
      customer_email: 'N/A',
      pet_name: petName,
      service_id: parseInt(serviceId),
      staff_id: parseInt(staffId),
      appointment_date: walkInDate,
      appointment_time: walkInTime,
      duration_minutes: serviceId === '1' ? 120 : 60, 
      status: 'Completed'
    }
  ]);

  if (error) {
    alert("Error: " + error.message);
  } else {
    alert("Walk-in added successfully!");
    setCustomerName('');
    setPetName('');
  }
};
useEffect(() => {
  // 1. Set up the Realtime Subscription
  const channel = supabase
    .channel('realtime-bookings')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'bookings' },
      (payload) => {
        const today = new Date().toISOString().split('T')[0];

        if (payload.eventType === 'INSERT') {
          const newBooking = payload.new as any;
          // Only add to state if it's today or in the future
          if (newBooking.appointment_date >= today) {
            setBookings((prev) => [...prev, newBooking].sort((a, b) => 
              `${a.appointment_date} ${a.appointment_time}`.localeCompare(`${b.appointment_date} ${b.appointment_time}`)
            ));
          }
        }
        
        if (payload.eventType === 'DELETE') {
          setBookings((prev) => prev.filter((b) => b.id !== payload.old.id));
        }

        if (payload.eventType === 'UPDATE') {
          setBookings((prev) => 
            prev.map((b) => b.id === payload.new.id ? { ...b, ...payload.new } : b)
              .sort((a, b) => `${a.appointment_date} ${a.appointment_time}`.localeCompare(`${b.appointment_date} ${b.appointment_time}`))
          );
        }
      }
    )
    .subscribe();

  // 2. Fetch Initial Data with Sorting & Filtering
  async function fetchDashboardData() {
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];

    const [
      { data: staffData },
      { data: serviceData },
      { data: bookingData, error: bookingError }
    ] = await Promise.all([
      supabase.from('staff').select('id, name').eq('is_active', true),
      supabase.from('services').select('id, name, duration_minutes'),
      supabase.from('bookings')
        .select('*')
        .gte('appointment_date', today) // Filter: Get only today or future
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true })
    ]);

    if (staffData) setStaffList(staffData);
    if (serviceData) setServices(serviceData); 
    if (bookingData) setBookings(bookingData);
    if (bookingError) console.error('Error fetching data:', bookingError);

    setLoading(false);
  }

  fetchDashboardData();

  // 3. Cleanup
  return () => {
    supabase.removeChannel(channel);
  };
}, []);
if (loading) return <div>Loading schedule...</div>;

 return (
  <div className="p-8">
  {/* Header Section */}
  <div className="flex justify-between items-center mb-6">
    <h2 className="text-2xl font-bold">Upcoming Appointments</h2>
    <button 
      onClick={() => setIsModalOpen(true)}
      className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-6 rounded-xl transition-all"
    >
      + Add Walk-in
    </button>
  </div>

  {/* Conditional Table or Empty State */}
  {bookings.length > 0 ? (
    <table className="w-full bg-white rounded-lg shadow-sm border border-slate-200">
      <thead className="bg-slate-50">
        <tr>
          <th className="p-4 text-left">Date</th>
          <th className="p-4 text-left">Time</th>
          <th className="p-4 text-left">Customer</th>
          <th className="p-4 text-left">Email</th>
          <th className="p-4 text-left">Pet</th>
          <th className="p-4 text-left">Status</th>
          <th className="p-4 text-left">Actions</th>
        </tr>
      </thead>
      <tbody>
        {bookings.map((b) => (
          <tr key={b.id} className="border-t border-slate-100">
            <td className="p-4">{b.appointment_date}</td>
            <td className="p-4">{b.appointment_time}</td>
            <td className="p-4">{b.customer_name}</td>
            <td className="p-4 text-slate-500">{b.customer_email}</td>
            <td className="p-4">{b.pet_name}</td>
            <td className="p-4 font-bold text-slate-600">{b.status || 'Confirmed'}</td>
            <td className="p-4 space-x-2">
              {b.status === 'Confirmed' ? (
                <>
                  <button onClick={() => updateStatus(b.id, 'Completed')} className="text-green-600 hover:text-green-800 font-bold text-sm">Done</button>
                  <button onClick={() => updateStatus(b.id, 'No-Show')} className="text-amber-600 hover:text-amber-800 font-bold text-sm">No-Show</button>
                  <button onClick={() => deleteBooking(b.id)} className="text-red-600 hover:text-red-800 font-bold text-sm">Cancel</button>
                </>
              ) : (
                <span className="text-slate-400 text-sm italic">Archived</span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  ) : (
    <div className="w-full p-12 text-center bg-white rounded-lg border border-slate-200 shadow-sm text-slate-500">
      <div className="text-4xl mb-4">🗓️</div>
      <h3 className="text-xl font-bold text-slate-800 mb-2">No upcoming appointments</h3>
      <p>Everything is clear for now. Enjoy your day!</p>
    </div>
  )}

  {/* Modal Section (The Walk-in Form) */}
  {isModalOpen && (
    <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-lg w-full relative shadow-2xl">
        <button 
          onClick={() => setIsModalOpen(false)}
          className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 font-bold text-xl"
        >
          ✕
        </button>
        
        <h3 className="text-2xl font-bold mb-6 text-slate-800">Add Walk-in Appointment</h3>
        
        <form onSubmit={async (e) => {
          await addWalkIn(e);
          setIsModalOpen(false);
        }} className="space-y-4">
          <input type="text" placeholder="Customer Name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full p-3 border border-slate-200 rounded-xl" required />
          <input type="text" placeholder="Pet Name" value={petName} onChange={(e) => setPetName(e.target.value)} className="w-full p-3 border border-slate-200 rounded-xl" required />
          
          <div className="grid grid-cols-2 gap-4">
            <select 
              value={serviceId} 
              onChange={(e) => setServiceId(e.target.value)} 
              className="w-full p-3 border border-slate-200 rounded-xl" 
              required
            >
              <option value="" disabled>Select Service</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
            <select 
              value={staffId} 
              onChange={(e) => setStaffId(e.target.value)} 
              className="w-full p-3 border border-slate-200 rounded-xl" 
              required
            >
              <option value="" disabled>Select Staff</option>
              {staffList.map((staff) => (
                <option key={staff.id} value={staff.id}>
                  {staff.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <input type="date" value={walkInDate} onChange={(e) => setWalkInDate(e.target.value)} className="p-3 border border-slate-200 rounded-xl" required />
            <input type="time" value={walkInTime} onChange={(e) => setWalkInTime(e.target.value)} className="p-3 border border-slate-200 rounded-xl" required />
          </div>
          
          <button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 rounded-xl shadow-lg mt-4">
            Save Walk-in
          </button>
        </form>
      </div>
    </div>
  )}
</div>
);
}