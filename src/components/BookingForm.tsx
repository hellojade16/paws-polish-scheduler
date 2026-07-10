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

  // Custom Responsive Toast State Engine
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Auto-dismiss handler for notifications
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showNotification = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  // Reusable timeline allocation algorithm tracking live conflicts
  const calculateTimelineAvailability = async () => {
    if (!appointmentDate || !selectedServiceId || !selectedStaffId) {
      setAvailableTimes([]);
      return;
    }

    setIsLoadingTimes(true);

    // REAL-TIME CHECK: Ensure the selected service and staff profile are still valid and active in database
    const [staffCheck, serviceCheck] = await Promise.all([
      supabase.from('staff').select('is_active').eq('id', selectedStaffId).single(),
      supabase.from('services').select('id').eq('id', selectedServiceId).single()
    ]);

    if (staffCheck.data && !staffCheck.data.is_active) {
      showNotification("The selected specialist is currently unavailable. Please pick another groomer.", "error");
      setAvailableTimes([]);
      setIsLoadingTimes(false);
      return;
    }

    if (!serviceCheck.data) {
      showNotification("Selected service data modified. Please reselect your service package.", "error");
      setAvailableTimes([]);
      setIsLoadingTimes(false);
      return;
    }

    // Fetch up-to-the-second reservation locks for the designated date parameter
    const { data, error } = await supabase
      .from('bookings')
      .select('appointment_time, duration_minutes, staff_id, status')
      .eq('appointment_date', appointmentDate)
      .neq('status', 'Cancelled'); // Do not block times for cancelled appointments

    if (error) {
      console.error("Supabase Matrix Error:", error);
      setIsLoadingTimes(false);
      return;
    }

    const BUFFER_MINUTES = 10;
    const serviceDuration = getDurationForService(selectedServiceId);

    const freeTimes = ALL_TIME_SLOTS.filter((time12h) => {
      const startTime24 = convertTo24Hour(time12h);
      const [startH, startM] = startTime24.split(':').map(Number);
      const startMinutes = (startH * 60) + startM;
      const proposedEndMinutes = startMinutes + serviceDuration + BUFFER_MINUTES;

      const hasConflict = data.some((booking) => {
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
  };

  // Real-time synchronization hooks listening for admin dashboard adjustments
  useEffect(() => {
    calculateTimelineAvailability();

    // Stream changes to bookings (catches admin walk-ins instantly)
    const bookingsChannel = supabase
      .channel('realtime-booking-clashes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        calculateTimelineAvailability();
      })
      .subscribe();

    // Stream staff adjustments (catches instant groomer deactivations)
    const staffChannel = supabase
      .channel('realtime-staff-status')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'staff' }, () => {
        calculateTimelineAvailability();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(bookingsChannel);
      supabase.removeChannel(staffChannel);
    };
  }, [appointmentDate, selectedServiceId, selectedStaffId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServiceId || !selectedStaffId || !appointmentTime) return;

    setIsSubmitting(true);
    const dbFormattedTime = convertTo24Hour(appointmentTime);
    const duration = getDurationForService(selectedServiceId);

    // Double-verify matching slots directly inside database record arrays
    const { data: conflicts, error: conflictError } = await supabase
      .from('bookings')
      .select('id')
      .eq('appointment_date', appointmentDate)
      .eq('appointment_time', dbFormattedTime)
      .eq('staff_id', selectedStaffId)
      .neq('status', 'Cancelled');

    if (conflictError || (conflicts && conflicts.length > 0)) {
      showNotification("This specific time block was just reserved by another client or walk-in. Please pick an alternate time slot.", "error");
      calculateTimelineAvailability(); // Re-sync slots immediately
      setIsSubmitting(false);
      return;
    }

    const { error } = await supabase.from('bookings').insert([
      {
        service_id: selectedServiceId,
        staff_id: selectedStaffId,
        customer_name: customerName.trim(),
        customer_email: customerEmail.trim(),
        pet_name: petName.trim(),
        appointment_date: appointmentDate,
        appointment_time: dbFormattedTime,
        duration_minutes: duration,
        booking_type: 'Scheduled',
        status: 'Confirmed'
      }
    ]);

    if (error) {
      showNotification('Database transmission failure. Please try completing your reservation again.', "error");
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
      } catch (e) { 
        console.error("Email configuration pipeline failed:", e); 
      }
      setSuccess(true);
    }
  };

  if (success) return (
    <div className="bg-teal-50 border border-teal-200 text-teal-800 p-12 rounded-3xl text-center shadow-sm max-w-3xl mx-auto mt-4 animate-in fade-in duration-300">
      <div className="text-6xl mb-4">🎉</div>
      <h3 className="text-3xl font-bold mb-2">Booking Confirmed!</h3>
      <p className="text-teal-700 mb-8">Your appointment for {petName} has been securely saved. Please check your email and spam for confirmation.</p>
      <button onClick={() => window.location.reload()} className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-all cursor-pointer">
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
    <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm max-w-3xl mx-auto mt-4 relative overflow-visible">
      
      {/* Universal Responsive Floating Notification Toast */}
      {toast && (
        <div className="fixed top-6 left-6 right-6 md:left-auto md:w-full md:max-w-sm z-[10000] bg-white rounded-2xl shadow-2xl shadow-slate-900/10 border border-slate-100 p-4 flex items-start gap-3 animate-in slide-in-from-top-5 md:slide-in-from-right-5 fade-in duration-300">
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
            <p className="text-xs font-black text-slate-800 tracking-tight">{toast.type === 'success' ? 'Booking Success' : 'Reservation Alert'}</p>
            <p className="text-[11px] text-slate-500 font-semibold leading-relaxed mt-0.5">{toast.message}</p>
          </div>
          <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded-lg hover:bg-slate-50 cursor-pointer">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-6">
        <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-bold">3</div>
        <h3 className="text-2xl font-bold text-slate-800">Complete Your Booking</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Your Name</label>
            <input type="text" required value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="e.g. Juan Dela Cruz" className="w-full p-4 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all text-sm font-semibold text-slate-700" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
            <input type="email" required value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="juan@example.com" className="w-full p-4 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all text-sm font-semibold text-slate-700" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Pet's Name</label>
            <input type="text" required value={petName} onChange={(e) => setPetName(e.target.value)} placeholder="e.g. Bantay 🐶" className="w-full p-4 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all text-sm font-semibold text-slate-700" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">1. Pick a Date</label>
            <input type="date" required min={today} value={appointmentDate} onChange={(e) => setAppointmentDate(e.target.value)} className="w-full p-4 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all text-sm font-bold text-slate-600 cursor-pointer" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-bold text-slate-700">2. Available Times</label>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {isLoadingTimes ? (
                <div className="col-span-full p-4 text-center text-teal-600 font-bold animate-pulse border border-teal-100 rounded-xl bg-teal-50 text-xs">Checking availability...</div>
              ) : availableTimes.length > 0 ? (
                availableTimes.map((time) => {
                  const isSelected = appointmentTime === time;
                  return (
                    <button key={time} type="button" onClick={() => setAppointmentTime(time)} className={`p-3 text-xs font-bold border rounded-xl transition-all text-center cursor-pointer ${isSelected ? 'bg-teal-600 text-white border-teal-600 shadow-md scale-[0.98]' : 'text-teal-700 bg-teal-50 border-teal-200 hover:bg-teal-600 hover:text-white hover:shadow-md'}`}>
                      {time}
                    </button>
                  );
                })
              ) : (
                <div className="col-span-full p-4 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-500 text-xs font-semibold">
                  {appointmentDate ? 'Fully booked on this date! 😔' : 'Please select a date first.'}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="pt-6 mt-6 border-t border-slate-100">
          <button 
            type="submit" 
            disabled={isSubmitting || !appointmentTime} 
            className={`w-full font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer text-sm ${isSubmitting || !appointmentTime ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none' : 'bg-teal-600 hover:bg-teal-700 text-white'}`}
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Securing Your Slot...</span>
              </>
            ) : (
              <>
                <span>Confirm Appointment</span> <span>🐾</span>
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
}