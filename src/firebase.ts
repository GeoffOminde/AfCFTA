import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as fbSignOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { AuditResult } from './types';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with specific database ID as required
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Initialize Authentication
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    // Ensure user record is initialized in Firestore
    if (result.user) {
      const userRef = doc(db, 'users', result.user.uid);
      await setDoc(userRef, {
        uid: result.user.uid,
        email: result.user.email || '',
        displayName: result.user.displayName || 'Agro-Exporter',
        photoURL: result.user.photoURL || '',
        lastLogin: new Date().toISOString()
      }, { merge: true });
    }
    return result.user;
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
}

export async function signOutUser(): Promise<void> {
  await fbSignOut(auth);
}

// Save or sync an audit dossier to Firestore
export async function saveAuditToFirestore(userId: string, audit: AuditResult): Promise<void> {
  if (!userId) return;
  try {
    const auditDocRef = doc(db, 'users', userId, 'audits', audit.id);
    await setDoc(auditDocRef, {
      ...audit,
      userId,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error(`Failed to save audit ${audit.id} to Firestore:`, error);
    throw error;
  }
}

// Fetch user audits from Firestore
export async function getAuditsFromFirestore(userId: string): Promise<AuditResult[]> {
  if (!userId) return [];
  try {
    const auditsRef = collection(db, 'users', userId, 'audits');
    const q = query(auditsRef, orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    const audits: AuditResult[] = [];
    snapshot.forEach(docSnap => {
      audits.push(docSnap.data() as AuditResult);
    });
    return audits;
  } catch (error) {
    console.error('Failed to load audits from Firestore:', error);
    return [];
  }
}

// Delete an audit from Firestore
export async function deleteAuditFromFirestore(userId: string, auditId: string): Promise<void> {
  if (!userId || !auditId) return;
  try {
    const auditDocRef = doc(db, 'users', userId, 'audits', auditId);
    await deleteDoc(auditDocRef);
  } catch (error) {
    console.error(`Failed to delete audit ${auditId} from Firestore:`, error);
    throw error;
  }
}

export { onAuthStateChanged };
export type { User };
