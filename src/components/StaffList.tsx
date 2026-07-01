import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface Staff {
  id: number;
  name: string;
  is_active: boolean;
  role: string; // Now coming from the database
}

interface StaffListProps {
  selectedId: number | null;
  onSelect: (id: number) => void;
}

// Simplified to only handle avatar generation
const getAvatarUrl = (name: string) => {
  return `https://api.dicebear.com/7.x/notionists/svg?seed=${name}&backgroundColor=ccfbf1`;
};

export default function StaffList({ selectedId, onSelect }: StaffListProps) {
  const [staffMembers, setStaffMembers] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStaff() {
      // Select '*' will now automatically include your new 'role' column
      const { data, error } = await supabase.from('staff').select('*');
      if (error) console.error('Error fetching staff:', error);
      else setStaffMembers(data || []);
      setLoading(false);
    }
    fetchStaff();
  }, []);

  if (loading) return <div className="py-10 text-center text-slate-500">Loading groomers...</div>;

  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-bold">2</div>
        <h3 className="text-2xl font-bold text-slate-800">Choose Your Groomer</h3>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {staffMembers
          .filter((staff) => staff.is_active)
          .map((staff) => {
            const avatarUrl = getAvatarUrl(staff.name);
            const isSelected = selectedId === staff.id;

            return (
              <button 
                key={staff.id} 
                onClick={() => onSelect(staff.id)} 
                className={`p-5 rounded-3xl border transition-all text-center group ${
                  isSelected
                    ? 'border-teal-400 bg-teal-50/30 shadow-lg ring-4 ring-teal-500/20'
                    : 'bg-white border-slate-200 shadow-sm hover:shadow-lg hover:border-teal-400 hover:bg-teal-50/30'
                }`}
              >
                <div className={`w-20 h-20 mx-auto mb-3 rounded-full overflow-hidden bg-slate-100 border-4 shadow-sm transition-colors ${
                  isSelected ? 'border-teal-300' : 'border-white group-hover:border-teal-100'
                }`}>
                  <img src={avatarUrl} alt={staff.name} className="w-full h-full object-cover" />
                </div>
                <h4 className="text-lg font-bold text-slate-900">{staff.name}</h4>
                {/* Now displaying dynamic staff.role */}
                <p className="text-xs text-teal-600 font-bold uppercase tracking-wider mt-1">{staff.role}</p>
              </button>
            );
          })}
      </div>
    </section>
  );
}