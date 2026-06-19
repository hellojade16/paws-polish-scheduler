// src/components/ServiceList.tsx
import type { Service } from '../types/types';

// We added 'icon' and 'description' just for the UI display!
const mockServices: (Service & { icon: string, description: string })[] = [
  { id: '1', name: 'Full Grooming', durationMinutes: 120, price: 1500, icon: '✂️', description: 'Complete spa day including haircut, bath, and styling.' },
  { id: '2', name: 'Bath & Blowdry', durationMinutes: 60, price: 800, icon: '🛁', description: 'Deep clean wash, premium shampoo, and fluff dry.' },
  { id: '3', name: 'Nail Trimming', durationMinutes: 15, price: 200, icon: '🐾', description: 'Quick and safe nail clipping and filing.' },
];

export default function ServiceList() {
  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-bold">1</div>
        <h3 className="text-2xl font-bold text-slate-800">Select a Service</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {mockServices.map((service) => (
          <div 
            key={service.id} 
            className="group relative bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-teal-400 transition-all duration-300 cursor-pointer flex flex-col h-full"
          >
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform origin-left">{service.icon}</div>
            <h4 className="text-xl font-bold text-slate-900 mb-2">{service.name}</h4>
            <p className="text-slate-500 text-sm mb-6 flex-grow">{service.description}</p>
            
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
              <span className="text-teal-700 bg-teal-50 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase">
                {service.durationMinutes} mins
              </span>
              <span className="text-lg font-black text-slate-800">₱{service.price}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}