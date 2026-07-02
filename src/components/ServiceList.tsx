// src/components/ServiceList.tsx

interface Service {
  id: number;
  name: string;
  price: number;
  duration_minutes: number;
}

interface ServiceListProps {
  services: Service[]; // Now receiving this list from the parent
  selectedId: number | null;
  onSelect: (id: number) => void;
}

const getServiceVisuals = (name: string) => {
  if (name.toLowerCase().includes('grooming')) return { icon: '✂️', description: 'Complete spa day including haircut, bath, and styling.' };
  if (name.toLowerCase().includes('bath') || name.toLowerCase().includes('blowdry')) return { icon: '🛁', description: 'Deep clean wash, premium shampoo, and fluff dry.' };
  if (name.toLowerCase().includes('nail')) return { icon: '🐾', description: 'Quick and safe nail clipping and filing.' };
  return { icon: '✨', description: 'Premium pet care service.' };
};

export default function ServiceList({ services, selectedId, onSelect }: ServiceListProps) {
  // No useEffect or supabase fetching here anymore! 
  // We just render the services passed in from the parent.

  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-bold">1</div>
        <h3 className="text-2xl font-bold text-slate-800">Select a Service</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {services.map((service) => {
          const visuals = getServiceVisuals(service.name);
          const isSelected = selectedId === service.id;

          return (
            <div 
              key={service.id} 
              onClick={() => onSelect(service.id)} 
              className={`group relative p-6 rounded-3xl border transition-all duration-300 cursor-pointer flex flex-col h-full text-left ${
                isSelected 
                  ? 'border-teal-400 bg-teal-50/30 shadow-lg ring-4 ring-teal-500/20' 
                  : 'bg-white border-slate-200 shadow-sm hover:shadow-lg hover:border-teal-400 hover:bg-teal-50/30'
              }`}
            >
              <div className={`text-4xl mb-4 transition-transform origin-left ${isSelected ? 'scale-110' : 'group-hover:scale-110'}`}>
                {visuals.icon}
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-2">{service.name}</h4>
              <p className="text-slate-500 text-sm mb-6 flex-grow">{visuals.description}</p>
              
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase ${
                  isSelected ? 'bg-teal-600 text-white' : 'bg-teal-50 text-teal-700 group-hover:bg-teal-100'
                }`}>
                  {service.duration_minutes} mins
                </span>
                <span className="text-lg font-black text-slate-800">₱{service.price}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}