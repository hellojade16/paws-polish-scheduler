// src/components/BookingForm.tsx

export default function BookingForm() {
  return (
    <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm max-w-3xl mx-auto mt-4">
      
      <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-6">
        <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-bold">3</div>
        <h3 className="text-2xl font-bold text-slate-800">Complete Your Booking</h3>
      </div>

      <form className="space-y-6">
        {/* Name Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Your Name</label>
            <input 
              type="text" 
              placeholder="e.g. Juan Dela Cruz" 
              className="w-full p-4 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all" 
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Pet's Name</label>
            <input 
              type="text" 
              placeholder="e.g. Bantay 🐶" 
              className="w-full p-4 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all" 
            />
          </div>
        </div>

        {/* Date & Time Inputs - Upgraded to modern UI */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Date Picker */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">1. Pick a Date</label>
            <input 
              type="date" 
              className="w-full p-4 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all text-slate-600 cursor-pointer" 
            />
          </div>

          {/* Available Time Chips */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">2. Available Times</label>
            
            {/* We will map over available times from Firebase later. For now, mock data! */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {['09:00 AM', '10:30 AM', '01:00 PM', '02:30 PM', '04:00 PM'].map((time) => (
                <button 
                  key={time}
                  type="button" 
                  className="p-3 text-sm font-bold text-teal-700 bg-teal-50 border border-teal-200 rounded-xl hover:bg-teal-600 hover:text-white hover:shadow-md transition-all text-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                >
                  {time}
                </button>
              ))}
            </div>
            
            <p className="text-xs text-slate-400 mt-3">
              *Showing available slots for selected date.
            </p>
          </div>
          
        </div>

        {/* Submit Area */}
        <div className="pt-6 mt-6 border-t border-slate-100">
          <button 
            type="button" 
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-teal-500/30 transition-all active:scale-[0.98] flex justify-center items-center gap-2"
          >
            <span>Confirm Appointment</span>
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