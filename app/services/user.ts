import { doc, getDoc, setDoc, updateDoc, collection, query, where, limit, getDocs, increment } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { UserProfile, DoctorProfile, PatientProfile } from '@/types/user';

// =============== PROFILE MANAGEMENT ===============
export const createUserProfile = async (userProfile: UserProfile | DoctorProfile | PatientProfile): Promise<void> => {
  try {
    await setDoc(doc(db, 'users', userProfile.uid), userProfile);
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    } else {
      console.log('No such document!');
      return null;
    }
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

export const updateUserProfile = async (uid: string, data: Partial<UserProfile | DoctorProfile | PatientProfile>) => {
  try {
    const docRef = doc(db, 'users', uid);
    await updateDoc(docRef, data);
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

export const getUserByDoctorCode = async (code: string): Promise<UserProfile | null> => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('doctorCode', '==', code), limit(1));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data() as UserProfile;
    }
    return null;
    return null;
  } catch (error) {
    console.error('Error finding doctor by code:', error);
    throw error;
  }
};

export const incrementPatientCount = async (uid: string) => {
  try {
    const docRef = doc(db, 'users', uid);
    await updateDoc(docRef, {
      'stats.patientCount': increment(1)
    });
  } catch (error) {
    console.error('Error incrementing patient count:', error);
  }
};

export const incrementPendingReports = async (uid: string) => {
  try {
    const docRef = doc(db, 'users', uid);
    await updateDoc(docRef, {
      'stats.pendingReports': increment(1)
    });
  } catch (error) {
    console.error('Error incrementing pending reports:', error);
  }
};

// =============== PATIENT MANAGEMENT ===============
export const getPatientById = async (patientId: string): Promise<PatientProfile | null> => {
  try {
    const docRef = doc(db, 'users', patientId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.role === 'patient') {
        return data as PatientProfile;
      }
    }
    return null;
  } catch (error) {
    console.error('Error getting patient by ID:', error);
    return null;
  }
};

export const getPatientsByDoctor = async (doctorId: string): Promise<PatientProfile[]> => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('role', '==', 'patient'),
      where('linkedDoctorId', '==', doctorId)
    );
    
    const querySnapshot = await getDocs(q);
    const patients: PatientProfile[] = [];
    
    querySnapshot.docs.forEach(doc => {
      patients.push({
        uid: doc.id,
        ...doc.data()
      } as PatientProfile);
    });
    
    return patients;
  } catch (error) {
    console.error('Error getting patients by doctor:', error);
    return [];
  }
};

export const getPatientsByName = async (name: string, doctorId?: string): Promise<PatientProfile[]> => {
  try {
    let q;
    const usersRef = collection(db, 'users');
    
    if (doctorId) {
      q = query(
        usersRef,
        where('role', '==', 'patient'),
        where('linkedDoctorId', '==', doctorId)
      );
    } else {
      q = query(
        usersRef,
        where('role', '==', 'patient')
      );
    }
    
    const querySnapshot = await getDocs(q);
    const patients: PatientProfile[] = [];
    
    querySnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.displayName?.toLowerCase().includes(name.toLowerCase())) {
        patients.push({
          uid: doc.id,
          ...data
        } as PatientProfile);
      }
    });
    
    return patients;
  } catch (error) {
    console.error('Error searching patients:', error);
    return [];
  }
};

// =============== DOCTOR MANAGEMENT ===============
export const getDoctorById = async (doctorId: string): Promise<DoctorProfile | null> => {
  try {
    const docRef = doc(db, 'users', doctorId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.role === 'doctor') {
        return data as DoctorProfile;
      }
    }
    return null;
  } catch (error) {
    console.error('Error getting doctor by ID:', error);
    return null;
  }
};


