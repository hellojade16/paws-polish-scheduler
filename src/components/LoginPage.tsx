// src/components/LoginPage.tsx
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      alert(error.message);
    } else {
      navigate('/admin'); // Success! Go to dashboard
    }
    setLoading(false);
  };

  return (
    <div className="flex justify-center items-center h-screen bg-slate-50">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 w-96 space-y-4">
        <h2 className="text-2xl font-bold text-slate-800">Admin Login</h2>
        <input type="email" placeholder="Email" onChange={(e) => setEmail(e.target.value)} className="w-full p-3 border border-slate-200 rounded-xl" required />
        <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} className="w-full p-3 border border-slate-200 rounded-xl" required />
        <button
          type="submit"
          disabled={loading} // Prevents double-clicking
          className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center"
        >
          {loading ? (
            /* The Spinner */
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            /* The Text */
            "Login"
          )}
        </button>
      </form>
    </div>
  );
}