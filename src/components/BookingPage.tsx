// src/pages/BookingPage.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import ServiceList from '../components/ServiceList';
import StaffList from '../components/StaffList';
import BookingForm from '../components/BookingForm';

export default function BookingPage() {
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);
  const navigate = useNavigate();

  // Core data synchronization engine
  async function fetchAllData() {
    const [{ data: servicesData }, { data: staffData }] = await Promise.all([
      supabase.from('services').select('*').order('name'),
      supabase.from('staff').select('*').order('name') // Fetches master roster to manage state filters smoothly
    ]);
    
    setServices(servicesData || []);
    setStaff(staffData || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchAllData();

    // 1. Mount Realtime Channel Listener for Staff adjustments
    const staffChannel = supabase
      .channel('public-staff-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'staff' }, (payload) => {
        fetchAllData();
        
       if (payload.eventType === 'UPDATE' && !payload.new?.is_active) {
      if (selectedStaffId === payload.new?.id) {
        setSelectedStaffId(null);
      }
    }
  })
  .subscribe();

    // 2. Mount Realtime Channel Listener for Service adjustments
    const servicesChannel = supabase
      .channel('public-services-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'services' }, () => {
        fetchAllData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(staffChannel);
      supabase.removeChannel(servicesChannel);
    };
  }, [selectedStaffId]);

  // Filters the list down dynamically in JavaScript so customers ONLY see active groomers on their screen
  const visibleStaff = staff.filter(s => s.is_active);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800 pb-20">
      {/* Navbar - Kept visible during load */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-3xl">🐾</span>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Paws <span className="text-teal-600">&</span> Polish
            </h1>
          </div>
          <button 
            onClick={() => navigate('/login')}
            className="hidden md:block px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-sm font-semibold transition-colors cursor-pointer"
          >
            Admin Login
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-6 py-10 space-y-12">
        {loading ? (
          /* SKELETON UI: Mimics the page structure */
          <div className="animate-pulse space-y-12">
            {/* Hero Header Skeleton */}
            <div className="text-center space-y-4 max-w-2xl mx-auto mb-12">
              <div className="h-12 bg-slate-200 rounded-lg w-3/4 mx-auto"></div>
              <div className="h-6 bg-slate-200 rounded-lg w-1/2 mx-auto"></div>
            </div>

            {/* Service List Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-slate-200 rounded-3xl"></div>
              ))}
            </div>

            {/* Staff List Skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-40 bg-slate-200 rounded-3xl"></div>
              ))}
            </div>
          </div>
        ) : (
          /* ACTUAL CONTENT: Only shows when loading is finished */
          <>
            <div className="text-center space-y-4 max-w-2xl mx-auto mb-12 animate-in fade-in duration-300">
              <h2 className="text-4xl font-black text-slate-900 tracking-tight">
                Pamper your pet. <br/><span className="text-teal-600">Stress-free booking.</span>
              </h2>
              <p className="text-slate-500 text-lg">
                Select a grooming service and your favorite stylist to get started.
              </p>
            </div>

            <ServiceList 
              services={services}
              selectedId={selectedServiceId} 
              onSelect={setSelectedServiceId} 
            />
            
            <StaffList 
              staff={visibleStaff} // Streams down strictly operational active profiles
              selectedId={selectedStaffId} 
              onSelect={setSelectedStaffId} 
            />
            
            <BookingForm 
              selectedServiceId={selectedServiceId}
              selectedStaffId={selectedStaffId}
            />
          </>
        )}
      </main>
    </div>
  );
}