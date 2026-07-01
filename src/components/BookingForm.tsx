// src/components/BookingForm.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import emailjs from '@emailjs/browser';

interface BookingFormProps {
  selectedServiceId: number | null;
  selectedStaffId: number | null;
}

const getDurationForService = (serviceId: number | null) => {
  if (serviceId === 1) return 120; // Full Grooming
  if (serviceId === 2) return 60;  // Bath & Blowdry
  if (serviceId === 3) return 15;  // Nail Trimming
  return 60;
};

const generateTimeSlots = (startHour: number, endHour: number, intervalMinutes: number) => {
  const times = [];
  for (let minutes = startHour * 60; minutes < endHour * 60; minutes += intervalMinutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12; 
    const formattedHours = String(displayHours).padStart(2, '0');
    const formattedMins = String(mins).padStart(2, '0');
    times.push(`${formattedHours}:${formattedMins} ${ampm}`);
  }
  return times;
};

const ALL_TIME_SLOTS = generateTimeSlots(9, 17, 30);
const today = new Date().toISOString().split('T')[0];

const convertTo24Hour = (time12h: string) => {
  const [time, modifier] = time12h.split(' ');
  let [hours, minutes] = time.split(':');
  if (hours === '12') hours = '00';
  if (modifier === 'PM') hours = String(parseInt(hours, 10) + 12);
  return `${hours.padStart(2, '0')}:${minutes}:00`;
};

export default function BookingForm({ selectedServiceId, selectedStaffId }: BookingFormProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [petName, setPetName] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [isLoadingTimes, setIsLoadingTimes] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

 useEffect(() => {
    async function fetchAvailableTimes() {
      // 1. Guard clause: Ensure we have the selection
      if (!appointmentDate || !selectedServiceId || !selectedStaffId) {
        setAvailableTimes([]);
        return;
      }

      setIsLoadingTimes(true);

      // 2. Fetch all bookings for the day (to avoid type-mismatch filter failures)
      // We will handle the staff filtering in Javascript
      const { data, error } = await supabase
        .from('bookings')
        .select('appointment_time, duration_minutes, staff_id')
        .eq('appointment_date', appointmentDate);

      if (error) {
        console.error("Supabase Error:", error);
        setIsLoadingTimes(false);
        return;
      }

      // 3. Conflict Filtering Logic
      const BUFFER_MINUTES = 10;
      const serviceDuration = getDurationForService(selectedServiceId);

      const freeTimes = ALL_TIME_SLOTS.filter((time12h) => {
        const startTime24 = convertTo24Hour(time12h);
        const [startH, startM] = startTime24.split(':').map(Number);
        const startMinutes = (startH * 60) + startM;
        const proposedEndMinutes = startMinutes + serviceDuration + BUFFER_MINUTES;

        // Check for conflicts only against the selected groomer
        const hasConflict = data.some((booking) => {
          // Robust check: Ensure staff_id matches (casting to Number)
          if (Number(booking.staff_id) !== Number(selectedStaffId)) return false;

          const [bookedH, bookedM] = booking.appointment_time.split(':').map(Number);
          const bookedStart = (bookedH * 60) + bookedM;
          const bookedEnd = bookedStart + (booking.duration_minutes || 60) + BUFFER_MINUTES;
          
          return (startMinutes < bookedEnd) && (proposedEndMinutes > bookedStart);
        });

        return !hasConflict;
      });

      setAvailableTimes(freeTimes);
      setIsLoadingTimes(false);
    }

    fetchAvailableTimes();
  }, [appointmentDate, selectedServiceId, selectedStaffId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServiceId || !selectedStaffId || !appointmentTime) return;

    setIsSubmitting(true);
    const dbFormattedTime = convertTo24Hour(appointmentTime);
    const duration = getDurationForService(selectedServiceId);

    const { data: conflicts, error: conflictError } = await supabase
      .from('bookings')
      .select('id')
      .eq('appointment_date', appointmentDate)
      .eq('appointment_time', dbFormattedTime)
      .eq('staff_id', selectedStaffId);

    if (conflictError || (conflicts && conflicts.length > 0)) {
      alert("This slot was just taken. Please refresh.");
      setIsSubmitting(false);
      return;
    }

    const { error } = await supabase.from('bookings').insert([
      {
        service_id: selectedServiceId,
        staff_id: selectedStaffId,
        customer_name: customerName,
        customer_email: customerEmail,
        pet_name: petName,
        appointment_date: appointmentDate,
        appointment_time: dbFormattedTime,
        duration_minutes: duration,
        booking_type: 'Scheduled',
      }
    ]);

    if (error) {
      alert('Error saving booking.');
      setIsSubmitting(false);
    } else {
      try {
        await emailjs.send('service_yqjxytp', 'template_hv76pwl', {
          customer_name: customerName,
          customer_email: customerEmail,
          pet_name: petName,
          date: appointmentDate,
          time: appointmentTime,
        }, 'n_hl8PKCBrvItPmWw');
      } catch (e) { console.error("Email failed"); }
      setSuccess(true);
    }
  };

  if (success) return (
    <div className="bg-teal-50 border border-teal-200 text-teal-800 p-12 rounded-3xl text-center shadow-sm max-w-3xl mx-auto mt-4">
      <div className="text-6xl mb-4">🎉</div>
      <h3 className="text-3xl font-bold mb-2">Booking Confirmed!</h3>
      <p className="text-teal-700 mb-8">Your appointment for {petName} has been securely saved.</p>
      <button onClick={() => window.location.reload()} className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-all">
        Book Another Appointment
      </button>
    </div>
  );

  if (!selectedServiceId || !selectedStaffId) return (
    <div className="bg-white p-12 rounded-3xl border-2 border-dashed border-slate-200 shadow-sm max-w-3xl mx-auto mt-4 text-center">
      <div className="text-4xl mb-4">🐾</div>
      <h3 className="text-xl font-bold text-slate-800 mb-2">Ready to Book?</h3>
      <p className="text-slate-500 mb-6">Please select a service and your preferred groomer above to view available time slots.</p>
      <div className="inline-block bg-teal-50 text-teal-700 px-6 py-3 rounded-xl font-bold border border-teal-200">
        Waiting for your selection...
      </div>
    </div>
  );

  return (
    <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm max-w-3xl mx-auto mt-4 relative overflow-hidden">
      <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-6">
        <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-bold">3</div>
        <h3 className="text-2xl font-bold text-slate-800">Complete Your Booking</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Your Name</label>
            <input type="text" required value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="e.g. Juan Dela Cruz" className="w-full p-4 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
            <input type="email" required value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="juan@example.com" className="w-full p-4 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Pet's Name</label>
            <input type="text" required value={petName} onChange={(e) => setPetName(e.target.value)} placeholder="e.g. Bantay 🐶" className="w-full p-4 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">1. Pick a Date</label>
            <input type="date" required min={today} value={appointmentDate} onChange={(e) => setAppointmentDate(e.target.value)} className="w-full p-4 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all text-slate-600 cursor-pointer" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-bold text-slate-700">2. Available Times</label>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {isLoadingTimes ? (
                <div className="col-span-full p-4 text-center text-teal-600 font-bold animate-pulse border border-teal-100 rounded-xl bg-teal-50">Checking availability...</div>
              ) : availableTimes.length > 0 ? (
                availableTimes.map((time) => {
                  const isSelected = appointmentTime === time;
                  return (
                    <button key={time} type="button" onClick={() => setAppointmentTime(time)} className={`p-3 text-sm font-bold border rounded-xl transition-all text-center ${isSelected ? 'bg-teal-600 text-white border-teal-600 shadow-md' : 'text-teal-700 bg-teal-50 border-teal-200 hover:bg-teal-600 hover:text-white hover:shadow-md'}`}>
                      {time}
                    </button>
                  );
                })
              ) : (
                <div className="col-span-full p-4 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-500 text-sm">
                  {appointmentDate ? 'Fully booked on this date! 😔' : 'Please select a date first.'}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="pt-6 mt-6 border-t border-slate-100">
          <button type="submit" disabled={isSubmitting || !appointmentTime} className={`w-full font-bold py-4 rounded-xl shadow-lg transition-all ${isSubmitting || !appointmentTime ? 'bg-slate-300 text-slate-500' : 'bg-teal-600 hover:bg-teal-700 text-white'}`}>
            <span>{isSubmitting ? 'Saving...' : 'Confirm Appointment'}</span> <span>🐾</span>
          </button>
        </div>
      </form>
    </section>
  );
}