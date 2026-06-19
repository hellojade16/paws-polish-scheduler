// src/components/BookingForm.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface BookingFormProps {
  selectedServiceId: number | null;
  selectedStaffId: number | null;
}

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

const ALL_TIME_SLOTS = generateTimeSlots(9, 17, 60);

const convertTo24Hour = (time12h: string) => {
  const [time, modifier] = time12h.split(' ');
  let [hours, minutes] = time.split(':');
  if (hours === '12') hours = '00';
  if (modifier === 'PM') hours = String(parseInt(hours, 10) + 12);
  return `${hours.padStart(2, '0')}:${minutes}:00`;
};

export default function BookingForm({ selectedServiceId, selectedStaffId }: BookingFormProps) {
  // Form State
  const [customerName, setCustomerName] = useState('');
  const [petName, setPetName] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  
  // Available Times State
  const [availableTimes, setAvailableTimes] = useState<string[]>(ALL_TIME_SLOTS);
  const [isLoadingTimes, setIsLoadingTimes] = useState(false);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // 2. Anti-Double-Booking Listener
  useEffect(() => {
    async function fetchAvailableTimes() {
      if (!appointmentDate) {
        setAvailableTimes(ALL_TIME_SLOTS);
        return;
      }

      setIsLoadingTimes(true);

      const { data, error } = await supabase
        .from('bookings')
        .select('appointment_time')
        .eq('appointment_date', appointmentDate);

      if (error) {
        console.error('Error fetching booked times:', error);
        setIsLoadingTimes(false);
        return;
      }

      const bookedDbTimes = data.map(booking => booking.appointment_time);

      const freeTimes = ALL_TIME_SLOTS.filter((time12h) => {
        const dbFormat = convertTo24Hour(time12h);
        return !bookedDbTimes.includes(dbFormat);
      });

      setAvailableTimes(freeTimes);
      
      if (!freeTimes.includes(appointmentTime)) {
        setAppointmentTime('');
      }

      setIsLoadingTimes(false);
    }

    fetchAvailableTimes();
  }, [appointmentDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedServiceId || !selectedStaffId || !appointmentTime) {
      alert('Please select a service, a groomer, and a time slot!');
      return;
    }

    setIsSubmitting(true);
    const dbFormattedTime = convertTo24Hour(appointmentTime);

    const { error } = await supabase.from('bookings').insert([
      {
        service_id: selectedServiceId,
        staff_id: selectedStaffId,
        customer_name: customerName,
        pet_name: petName,
        appointment_date: appointmentDate,
        appointment_time: dbFormattedTime,
      }
    ]);

    if (error) {
      console.error('Error saving booking:', error);
      alert('There was an error saving your booking. Please try again.');
    } else {
      setSuccess(true);
    }

    setIsSubmitting(false);
  };

  // 3. Success Screen UI
  if (success) {
    return (
      <div className="bg-teal-50 border border-teal-200 text-teal-800 p-12 rounded-3xl text-center shadow-sm max-w-3xl mx-auto mt-4">
        <div className="text-6xl mb-4">🎉</div>
        <h3 className="text-3xl font-bold mb-2">Booking Confirmed!</h3>
        <p className="text-teal-700 mb-8">Your appointment for {petName} has been securely saved.</p>
        <button 
          onClick={() => window.location.reload()} 
          className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-all"
        >
          Book Another Appointment
        </button>
      </div>
    );
  }

  // 4. Main Form UI
  return (
    <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm max-w-3xl mx-auto mt-4 relative overflow-hidden">
      
      <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-6">
        <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-bold">3</div>
        <h3 className="text-2xl font-bold text-slate-800">Complete Your Booking</h3>
      </div>

      {(!selectedServiceId || !selectedStaffId) && (
         <div className="mb-6 bg-amber-50 text-amber-800 p-4 rounded-xl text-sm font-medium border border-amber-200">
           ⚠️ Please select a service and groomer above before completing this form.
         </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Your Name</label>
            <input 
              type="text" 
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Juan Dela Cruz" 
              className="w-full p-4 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all" 
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Pet's Name</label>
            <input 
              type="text" 
              required
              value={petName}
              onChange={(e) => setPetName(e.target.value)}
              placeholder="e.g. Bantay 🐶" 
              className="w-full p-4 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all" 
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Date Picker */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">1. Pick a Date</label>
            <input 
              type="date" 
              required
              value={appointmentDate}
              onChange={(e) => setAppointmentDate(e.target.value)}
              className="w-full p-4 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all text-slate-600 cursor-pointer" 
            />
          </div>

          {/* Interactive Time Chips */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-bold text-slate-700">2. Available Times</label>
              {isLoadingTimes && <span className="text-xs text-teal-600 font-bold animate-pulse">Checking...</span>}
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {availableTimes.length > 0 ? (
                availableTimes.map((time) => {
                  const isSelected = appointmentTime === time;
                  return (
                    <button 
                      key={time}
                      type="button" 
                      onClick={() => setAppointmentTime(time)}
                      className={`p-3 text-sm font-bold border rounded-xl transition-all text-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 ${
                        isSelected 
                          ? 'bg-teal-600 text-white border-teal-600 shadow-md'
                          : 'text-teal-700 bg-teal-50 border-teal-200 hover:bg-teal-600 hover:text-white hover:shadow-md'
                      }`}
                    >
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
            <p className="text-xs text-slate-400 mt-3">*Showing available slots for selected date.</p>
          </div>
        </div>

        <div className="pt-6 mt-6 border-t border-slate-100">
          <button 
            type="submit" 
            disabled={isSubmitting || !selectedServiceId || !selectedStaffId || !appointmentTime}
            className={`w-full font-bold py-4 rounded-xl shadow-lg transition-all flex justify-center items-center gap-2 ${
              isSubmitting || !selectedServiceId || !selectedStaffId || !appointmentTime
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-teal-600 hover:bg-teal-700 text-white active:scale-[0.98] hover:shadow-teal-500/30'
            }`}
          >
            <span>{isSubmitting ? 'Saving...' : 'Confirm Appointment'}</span>
            <span>🐾</span>
          </button>
          <p className="text-center text-xs text-slate-400 mt-4">
            You will be redirected to Messenger to confirm with our team.
          </p>
        </div>
      </form>
    </section>
  );
}