import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface Staff {
  id: number;
  name: string;
  role: string;
  is_active: boolean;
}

export default function ManageStaff() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [isActive, setIsActive] = useState(true);
  
  // State for the Form/Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');

  useEffect(() => {
  fetchStaff();

  // 2. Add Realtime Subscription
  const channel = supabase
    .channel('staff-changes')
    .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'staff' 
    }, () => {
      fetchStaff(); 
    })
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}, []);


  async function fetchStaff() {
    setLoading(true);
    const { data } = await supabase.from('staff').select('*').order('name');
    if (data) setStaff(data);
    setLoading(false);
  }

  // Open Modal for Add/Edit
  const openModal = (s?: Staff) => {
  if (s) {
    setEditingStaff(s);
    setName(s.name);
    setRole(s.role);
    setIsActive(s.is_active); 
  } else {
    setEditingStaff(null);
    setName('');
    setRole('');
    setIsActive(true); 
  }
  setIsModalOpen(true);
};

const saveStaff = async () => {
    if (editingStaff) {
      await supabase.from('staff').update({ name, role, is_active: isActive }).eq('id', editingStaff.id);
    } else {
      await supabase.from('staff').insert({ name, role, is_active: isActive });
    }
    setIsModalOpen(false);
  };

  const toggleStatus = async (id: number, currentStatus: boolean) => {
    await supabase.from('staff').update({ is_active: !currentStatus }).eq('id', id);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Manage Staff</h2>
          <p className="text-slate-500">Add, edit, or toggle groomer availability.</p>
        </div>
        <button onClick={() => openModal()} className="bg-teal-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-teal-700">
          + Add New Staff
        </button>
      </div>

      {/* Modal / Form */}
      {isModalOpen && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl">
      <h3 className="text-xl font-bold mb-4">{editingStaff ? 'Edit Staff' : 'Add New Staff'}</h3>
      
      <input className="w-full p-3 mb-4 border rounded-xl" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
      <input className="w-full p-3 mb-4 border rounded-xl" placeholder="Role (e.g. Groomer)" value={role} onChange={(e) => setRole(e.target.value)} />
      
      <label className="flex items-center gap-3 mb-6 p-4 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
        <input 
          type="checkbox" 
          checked={isActive} 
          onChange={(e) => setIsActive(e.target.checked)} 
          className="w-5 h-5 accent-teal-600"
        />
        <span className="font-bold text-slate-700">
          Status: {isActive ? 'Active (Visible in Booking)' : 'Inactive (Hidden)'}
        </span>
      </label>

      <div className="flex gap-4">
        <button onClick={() => setIsModalOpen(false)} className="flex-1 p-3 bg-slate-100 rounded-xl font-bold">Cancel</button>
        <button onClick={saveStaff} className="flex-1 p-3 bg-teal-600 text-white rounded-xl font-bold">Save</button>
      </div>
    </div>
  </div>
)}
      {/* Table */}
      {loading ? (
        <div className="animate-pulse h-96 bg-slate-200 rounded-3xl w-full"></div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase">Name</th>
                <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase">Role</th>
                <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase">Status</th>
                <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s) => (
                <tr key={s.id} className="border-t border-slate-100">
                  <td className="p-4 font-bold text-slate-800">{s.name}</td>
                  <td className="p-4 text-slate-600">{s.role}</td>
                  <td className="p-4">
                  <button 
                    onClick={() => toggleStatus(s.id, s.is_active)} 
                    className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all duration-200 cursor-pointer 
                                hover:scale-105 active:scale-95 hover:shadow-sm
                                ${s.is_active 
                                  ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                  >
                    {s.is_active ? '● Active' : '○ Inactive'}
                  </button>
                </td>
                  <td className="p-4">
                    <button onClick={() => openModal(s)} className="text-teal-600 font-bold hover:underline">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}