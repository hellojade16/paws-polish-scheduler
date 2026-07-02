// src/components/StaffList.tsx

interface Staff {
  id: number;
  name: string;
  is_active: boolean;
  role: string;
}

interface StaffListProps {
  staff: Staff[]; // Now receiving the data as a prop
  selectedId: number | null;
  onSelect: (id: number) => void;
}

const getAvatarUrl = (name: string) => {
  return `https://api.dicebear.com/7.x/notionists/svg?seed=${name}&backgroundColor=ccfbf1`;
};

export default function StaffList({ staff, selectedId, onSelect }: StaffListProps) {
  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-bold">2</div>
        <h3 className="text-2xl font-bold text-slate-800">Choose Your Groomer</h3>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {staff
          .filter((s) => s.is_active) // Filter based on the prop received
          .map((s) => {
            const avatarUrl = getAvatarUrl(s.name);
            const isSelected = selectedId === s.id;

            return (
              <button 
                key={s.id} 
                onClick={() => onSelect(s.id)} 
                className={`p-5 rounded-3xl border transition-all text-center group ${
                  isSelected
                    ? 'border-teal-400 bg-teal-50/30 shadow-lg ring-4 ring-teal-500/20'
                    : 'bg-white border-slate-200 shadow-sm hover:shadow-lg hover:border-teal-400 hover:bg-teal-50/30'
                }`}
              >
                <div className={`w-20 h-20 mx-auto mb-3 rounded-full overflow-hidden bg-slate-100 border-4 shadow-sm transition-colors ${
                  isSelected ? 'border-teal-300' : 'border-white group-hover:border-teal-100'
                }`}>
                  <img src={avatarUrl} alt={s.name} className="w-full h-full object-cover" />
                </div>
                <h4 className="text-lg font-bold text-slate-900">{s.name}</h4>
                <p className="text-xs text-teal-600 font-bold uppercase tracking-wider mt-1">{s.role}</p>
              </button>
            );
          })}
      </div>
    </section>
  );
}