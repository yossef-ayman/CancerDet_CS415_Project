import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  updateDoc, 
  doc, 
  serverTimestamp,
  Timestamp,
  limit,
  getDoc
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Appointment, UserProfile } from '@/types/user';

// Create new appointment
export const createAppointment = async (appointmentData: Partial<Appointment>): Promise<string> => {
  try {
    const appointmentsRef = collection(db, 'appointments');
    
    const newAppointment = {
      ...appointmentData,
      status: 'pending',
      paymentStatus: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    const docRef = await addDoc(appointmentsRef, newAppointment);
    return docRef.id;
  } catch (error) {
    console.error('Error creating appointment:', error);
    throw new Error('Failed to create appointment');
  }
};

// Get upcoming appointments for user
export const getUpcomingAppointments = async (userId: string): Promise<Appointment[]> => {
  try {
    const appointmentsRef = collection(db, 'appointments');
    
    // Get today's date at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Query for upcoming appointments (today or later)
    const q = query(
      appointmentsRef,
      where('date', '>=', today.toISOString().split('T')[0]),
      where('status', 'in', ['pending', 'confirmed']),
      where('patientId', '==', userId),
      orderBy('date', 'asc'),
      orderBy('time', 'asc'),
      limit(10)
    );
    
    // For doctors, query where doctorId matches
    const doctorQ = query(
      appointmentsRef,
      where('date', '>=', today.toISOString().split('T')[0]),
      where('status', 'in', ['pending', 'confirmed']),
      where('doctorId', '==', userId),
      orderBy('date', 'asc'),
      orderBy('time', 'asc'),
      limit(10)
    );
    
    const querySnapshot = await getDocs(q);
    const doctorQuerySnapshot = await getDocs(doctorQ);
    
    // Combine results
    const appointments: Appointment[] = [];
    
    querySnapshot.docs.forEach(doc => {
      appointments.push({
        id: doc.id,
        ...doc.data()
      } as Appointment);
    });
    
    doctorQuerySnapshot.docs.forEach(doc => {
      appointments.push({
        id: doc.id,
        ...doc.data()
      } as Appointment);
    });
    
    // Sort by date and time
    appointments.sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return dateA.getTime() - dateB.getTime();
    });
    
    return appointments;
  } catch (error) {
    console.error('Error getting appointments:', error);
    return [];
  }
};

// Get available doctors
export const getAvailableDoctors = async (): Promise<UserProfile[]> => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('role', '==', 'doctor'),
      where('isVerified', '==', true),
      limit(20)
    );
    
    const querySnapshot = await getDocs(q);
    const doctors: UserProfile[] = [];
    
    querySnapshot.docs.forEach(doc => {
      doctors.push({
        uid: doc.id,
        ...doc.data()
      } as UserProfile);
    });
    
    return doctors;
  } catch (error) {
    console.error('Error getting doctors:', error);
    return [];
  }
};

// Get doctor's schedule
export const getDoctorSchedule = async (doctorId: string, date: string): Promise<Appointment[]> => {
  try {
    const appointmentsRef = collection(db, 'appointments');
    const q = query(
      appointmentsRef,
      where('doctorId', '==', doctorId),
      where('date', '==', date),
      where('status', 'in', ['confirmed']),
      orderBy('time', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    const appointments: Appointment[] = [];
    
    querySnapshot.docs.forEach(doc => {
      appointments.push({
        id: doc.id,
        ...doc.data()
      } as Appointment);
    });
    
    return appointments;
  } catch (error) {
    console.error('Error getting doctor schedule:', error);
    return [];
  }
};

// Update appointment status
export const updateAppointmentStatus = async (
  appointmentId: string, 
  status: Appointment['status'],
  notes?: string
): Promise<void> => {
  try {
    const appointmentRef = doc(db, 'appointments', appointmentId);
    await updateDoc(appointmentRef, {
      status,
      ...(notes && { notes }),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating appointment:', error);
    throw new Error('Failed to update appointment');
  }
};

// Cancel appointment
export const cancelAppointment = async (appointmentId: string, reason?: string): Promise<void> => {
  try {
    const appointmentRef = doc(db, 'appointments', appointmentId);
    await updateDoc(appointmentRef, {
      status: 'cancelled',
      ...(reason && { cancellationReason: reason }),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    throw new Error('Failed to cancel appointment');
  }
};

// Get appointment by ID
export const getAppointmentById = async (appointmentId: string): Promise<Appointment | null> => {
  try {
    const appointmentRef = doc(db, 'appointments', appointmentId);
    const appointmentSnap = await getDoc(appointmentRef);
    
    if (appointmentSnap.exists()) {
      return {
        id: appointmentSnap.id,
        ...appointmentSnap.data()
      } as Appointment;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting appointment:', error);
    return null;
  }
};

// Get appointments for date range
export const getAppointmentsForDateRange = async (
  userId: string,
  startDate: string,
  endDate: string,
  role: 'patient' | 'doctor'
): Promise<Appointment[]> => {
  try {
    const appointmentsRef = collection(db, 'appointments');
    
    const field = role === 'patient' ? 'patientId' : 'doctorId';
    
    const q = query(
      appointmentsRef,
      where(field, '==', userId),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'asc'),
      orderBy('time', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    const appointments: Appointment[] = [];
    
    querySnapshot.docs.forEach(doc => {
      appointments.push({
        id: doc.id,
        ...doc.data()
      } as Appointment);
    });
    
    return appointments;
  } catch (error) {
    console.error('Error getting appointments for date range:', error);
    return [];
  }
};

// Get appointment statistics
export const getAppointmentStats = async (userId: string, role: 'patient' | 'doctor') => {
  try {
    const field = role === 'patient' ? 'patientId' : 'doctorId';
    const appointmentsRef = collection(db, 'appointments');
    
    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    
    // Query for today's appointments
    const todayQ = query(
      appointmentsRef,
      where(field, '==', userId),
      where('date', '==', today),
      where('status', 'in', ['pending', 'confirmed'])
    );
    
    // Query for upcoming appointments
    const upcomingQ = query(
      appointmentsRef,
      where(field, '==', userId),
      where('date', '>=', today),
      where('status', 'in', ['pending', 'confirmed'])
    );
    
    // Query for completed appointments
    const completedQ = query(
      appointmentsRef,
      where(field, '==', userId),
      where('status', '==', 'completed')
    );
    
    const [todaySnapshot, upcomingSnapshot, completedSnapshot] = await Promise.all([
      getDocs(todayQ),
      getDocs(upcomingQ),
      getDocs(completedQ)
    ]);
    
    return {
      today: todaySnapshot.size,
      upcoming: upcomingSnapshot.size,
      completed: completedSnapshot.size,
    };
  } catch (error) {
    console.error('Error getting appointment stats:', error);
    return { today: 0, upcoming: 0, completed: 0 };
  }
};