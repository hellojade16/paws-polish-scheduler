export interface Service {
    id: string;
    name: string;
    durationMinutes: number;
    price: number;
}

export interface Staff {
    id: string;
    name: string;
    isActive: boolean;
}

export interface Appointment {
    id: string;
    customerName: string;
    petName: string;
    serviceId: string;
    staffId: string;
    startTime: string;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
}