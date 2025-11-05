// Firebase Auth Helper Functions for Next.js
// Based on Firebase Auth SDK documentation

import type { User } from 'firebase/auth';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  sendPasswordResetEmail,
  confirmPasswordReset,
  updatePassword,
  updateEmail,
  updateProfile,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
  sendEmailVerification,
  reload,
} from 'firebase/auth';
import { Timestamp } from 'firebase/firestore';
import { auth } from './firebase';
import type { UserProfile } from '@/types';

// Auth state management
export class AuthService {
  /**
   * Sign in with email and password
   */
  static async signInWithEmail(email: string, password: string): Promise<User> {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (error: any) {
      console.error('Email sign-in error:', error);
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  /**
   * Create new user account
   */
  static async signUpWithEmail(email: string, password: string): Promise<User> {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (error: any) {
      console.error('Email sign-up error:', error);
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  /**
   * Sign in with Google
   */
  static async signInWithGoogle(): Promise<User> {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');

      // For Next.js, prefer popup over redirect for better UX
      const result = await signInWithPopup(auth, provider);
      return result.user;
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  /**
   * Sign in with Google redirect (for mobile/redirect flows)
   */
  static async signInWithGoogleRedirect(): Promise<void> {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      await signInWithRedirect(auth, provider);
    } catch (error: any) {
      console.error('Google redirect sign-in error:', error);
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  /**
   * Get redirect result after Google sign-in
   */
  static async getGoogleRedirectResult(): Promise<User | null> {
    try {
      const result = await getRedirectResult(auth);
      return result?.user || null;
    } catch (error: any) {
      console.error('Google redirect result error:', error);
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  /**
   * Sign out current user
   */
  static async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error: any) {
      console.error('Sign-out error:', error);
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  /**
   * Send password reset email
   */
  static async sendPasswordReset(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      console.error('Password reset error:', error);
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  /**
   * Confirm password reset with code and new password
   */
  static async confirmPasswordReset(code: string, newPassword: string): Promise<void> {
    try {
      await confirmPasswordReset(auth, code, newPassword);
    } catch (error: any) {
      console.error('Password reset confirmation error:', error);
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  /**
   * Update user password
   */
  static async updatePassword(newPassword: string): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No authenticated user');

      await updatePassword(user, newPassword);
    } catch (error: any) {
      console.error('Password update error:', error);
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  /**
   * Update user email
   */
  static async updateEmail(newEmail: string): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No authenticated user');

      await updateEmail(user, newEmail);
    } catch (error: any) {
      console.error('Email update error:', error);
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(updates: {
    displayName?: string;
    photoURL?: string;
  }): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No authenticated user');

      await updateProfile(user, updates);
      await reload(user); // Refresh user data
    } catch (error: any) {
      console.error('Profile update error:', error);
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  /**
   * Send email verification
   */
  static async sendEmailVerification(): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No authenticated user');

      await sendEmailVerification(user);
    } catch (error: any) {
      console.error('Email verification error:', error);
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  /**
   * Reauthenticate user with credential
   */
  static async reauthenticate(password: string): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user || !user.email) throw new Error('No authenticated user');

      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
    } catch (error: any) {
      console.error('Reauthentication error:', error);
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  /**
   * Delete user account
   */
  static async deleteAccount(): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No authenticated user');

      await deleteUser(user);
    } catch (error: any) {
      console.error('Account deletion error:', error);
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  /**
   * Get current user
   */
  static getCurrentUser(): User | null {
    return auth?.currentUser || null;
  }

  /**
   * Listen to auth state changes
   */
  static onAuthStateChanged(callback: (user: User | null) => void): () => void {
    if (!auth) {
      // Return no-op function for server-side
      return () => {};
    }
    return onAuthStateChanged(auth, callback);
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    return auth?.currentUser !== null;
  }

  /**
   * Convert Firebase User to UserProfile
   */
  static userToProfile(user: User): UserProfile {
    return {
      uid: user.uid,
      createdAt: Timestamp.fromDate(new Date(user.metadata.creationTime || Date.now())),
      updatedAt: Timestamp.fromDate(new Date(user.metadata.lastSignInTime || Date.now())),
    };
  }

  /**
   * Get user-friendly error messages
   */
  private static getErrorMessage(code: string): string {
    const errorMessages: Record<string, string> = {
      'auth/user-disabled': 'Account has been disabled',
      'auth/user-not-found': 'User not found',
      'auth/wrong-password': 'Invalid password',
      'auth/invalid-email': 'Invalid email address',
      'auth/email-already-in-use': 'Email already in use',
      'auth/weak-password': 'Password is too weak',
      'auth/operation-not-allowed': 'Operation not allowed',
      'auth/account-exists-with-different-credential': 'Account exists with different credential',
      'auth/invalid-credential': 'Invalid credential',
      'auth/invalid-verification-code': 'Invalid verification code',
      'auth/invalid-verification-id': 'Invalid verification ID',
      'auth/requires-recent-login': 'Recent login required for this operation',
      'auth/too-many-requests': 'Too many requests, try again later',
      'auth/network-request-failed': 'Network request failed',
      'auth/popup-blocked': 'Popup was blocked by browser',
      'auth/popup-closed-by-user': 'Popup closed by user',
      'auth/cancelled-popup-request': 'Popup request cancelled',
      'auth/redirect-cancelled-by-user': 'Redirect cancelled by user',
    };

    return errorMessages[code] || 'An unknown error occurred';
  }
}

// React hooks for Next.js (client-side only)
export class AuthHooks {
  /**
   * Hook for auth state (use in client components)
   */
  static useAuthState(): {
    user: User | null;
    loading: boolean;
  } {
    // This would be implemented as a React hook in a component
    // For now, return static interface
    return {
      user: auth.currentUser,
      loading: false,
    };
  }

  /**
   * Hook for protected routes
   */
  static useRequireAuth(): {
    user: User | null;
    loading: boolean;
  } {
    // This would redirect to login if not authenticated
    return {
      user: auth.currentUser,
      loading: false,
    };
  }
}

export default AuthService;
