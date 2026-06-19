// src/components/StaffList.tsx
import type { Staff } from '../types/types';

// We added 'role' and 'avatarUrl' for the UI
const mockStaff: (Staff & { role: string, avatarUrl: string })[] = [
  { id: '1', name: 'Sarah', isActive: true, role: 'Head Groomer', avatarUrl: 'https://api.dicebear.com/7.x/notionists/svg?seed=Sarah&backgroundColor=ccfbf1' },
  { id: '2', name: 'Mike', isActive: true, role: 'Stylist', avatarUrl: 'https://api.dicebear.com/7.x/notionists/svg?seed=Mike&backgroundColor=ccfbf1' },
  { id: '3', name: 'Jane', isActive: false, role: 'Bather', avatarUrl: '' }, // Inactive
];

export default function StaffList() {
  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-bold">2</div>
        <h3 className="text-2xl font-bold text-slate-800">Choose Your Groomer</h3>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {mockStaff
          .filter((staff) => staff.isActive)
          .map((staff) => (
            <button 
              key={staff.id} 
              className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-teal-400 hover:bg-teal-50/30 transition-all text-center focus:outline-none focus:ring-4 focus:ring-teal-500/20 group"
            >
              <div className="w-20 h-20 mx-auto mb-3 rounded-full overflow-hidden bg-slate-100 border-4 border-white shadow-sm group-hover:border-teal-100 transition-colors">
                <img src={staff.avatarUrl} alt={staff.name} className="w-full h-full object-cover" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">{staff.name}</h4>
              <p className="text-xs text-teal-600 font-bold uppercase tracking-wider mt-1">{staff.role}</p>
            </button>
          ))}
      </div>
    </section>
  );
}