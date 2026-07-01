// src/components/BookingPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ServiceList from '../components/ServiceList';
import StaffList from '../components/StaffList';
import BookingForm from '../components/BookingForm';

export default function BookingPage() {
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800 pb-20">
      {/* Navbar */}
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
            className="hidden md:block px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-sm font-semibold transition-colors"
          >
            Admin Login
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-6 py-10 space-y-12">
        <div className="text-center space-y-4 max-w-2xl mx-auto mb-12">
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">
            Pamper your pet. <br/><span className="text-teal-600">Stress-free booking.</span>
          </h2>
          <p className="text-slate-500 text-lg">
            Select a grooming service and your favorite stylist to get started.
          </p>
        </div>

        <ServiceList 
          selectedId={selectedServiceId} 
          onSelect={setSelectedServiceId} 
        />
        
        <StaffList 
          selectedId={selectedStaffId} 
          onSelect={setSelectedStaffId} 
        />
        
        <BookingForm 
          selectedServiceId={selectedServiceId}
          selectedStaffId={selectedStaffId}
        />
      </main>
    </div>
  );
}