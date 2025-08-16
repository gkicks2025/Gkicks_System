"use client";

import React, { createContext, useContext, useReducer, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: "customer" | "admin" | "staff";
  avatar?: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
}

type AuthAction =
  | { type: "SET_USER"; payload: User | null }
  | { type: "SET_LOADING"; payload: boolean };

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: Error }>;
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<{ error?: Error }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<{ error?: Error }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "SET_USER":
      return { ...state, user: action.payload };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    default:
      return state;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    loading: false, // Set to false since we're not using real auth
  });
  const { toast } = useToast();

  const signIn = async (email: string, password: string) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Failed to parse login response:', jsonError);
        const error = new Error('Invalid response from server');
        return { error };
      }
      
      if (!response.ok) {
        const error = new Error(data.error || 'Login failed');
        return { error };
      }
      
      const user: User = {
        id: data.user.id.toString(),
        email: data.user.email,
        firstName: data.user.first_name || '',
        lastName: data.user.last_name || '',
        role: data.user.is_admin ? 'admin' : 'customer',
        avatar: data.user.avatar_url || '',
      };
      
      dispatch({ type: "SET_USER", payload: user });
      
      // Store token if provided
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
      }
      
      return {};
    } catch (error) {
      console.error("Sign in error:", error);
      const authError = error instanceof Error ? error : new Error("An error occurred");
      return { error: authError };
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const signUp = async (email: string, password: string, firstName?: string, lastName?: string) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          password, 
          firstName: firstName || '', 
          lastName: lastName || '' 
        }),
      });
      
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Failed to parse register response:', jsonError);
        const error = new Error('Invalid response from server');
        return { error };
      }
      
      if (!response.ok) {
        const error = new Error(data.error || 'Registration failed');
        return { error };
      }
      
      toast({
        title: "Account created!",
        description: "Your account has been created successfully. Please sign in.",
      });
      
      return {};
    } catch (error) {
      console.error("Sign up error:", error);
      const authError = error instanceof Error ? error : new Error("An error occurred");
      return { error: authError };
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const resetPasswordForEmail = async (email: string) => {
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Failed to parse reset password response:', jsonError);
        const error = new Error('Invalid response from server');
        return { error };
      }
      
      if (!response.ok) {
        const error = new Error(data.error || 'Password reset failed');
        return { error };
      }
      
      toast({
        title: "Password reset email sent",
        description: "Check your email for password reset instructions.",
      });
      
      return {};
    } catch (error) {
      console.error("Reset password error:", error);
      const authError = error instanceof Error ? error : new Error("An error occurred");
      return { error: authError };
    }
  };

  const signOut = async () => {
    try {
      // Clear local storage
      localStorage.removeItem('auth_token');
      
      // Make logout API call if needed
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
      } catch (apiError) {
        // Continue with logout even if API call fails
        console.warn('Logout API call failed:', apiError);
      }
      
      dispatch({ type: "SET_USER", payload: null });
      
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });
    } catch (error) {
      console.error("Sign out error:", error);
      toast({
        title: "Sign out failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    try {
      if (!state.user) throw new Error("No user logged in");
      
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/profiles', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          first_name: updates.firstName,
          last_name: updates.lastName,
          avatar_url: updates.avatar,
        }),
      });
      
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Failed to parse profile update response:', jsonError);
        throw new Error('Invalid response from server');
      }
      
      if (!response.ok) {
        throw new Error(data.error || 'Profile update failed');
      }
      
      // Update user profile locally with server response
      const updatedUser = { ...state.user, ...updates };
      dispatch({ type: "SET_USER", payload: updatedUser });
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      console.error("Update profile error:", error);
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Initialize and check for existing authentication
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        dispatch({ type: "SET_LOADING", payload: true });
        
        const token = localStorage.getItem('auth_token');
        console.log('🔐 Auth Context: Initializing auth, token exists:', !!token);
        if (!token) {
          dispatch({ type: "SET_LOADING", payload: false });
          return;
        }
        
        // Validate token with server
        console.log('🔐 Auth Context: Calling /api/auth/me');
        const response = await fetch('/api/auth/me', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          try {
            const data = await response.json();
            console.log('🔐 Auth Context: Received user data from /api/auth/me:', data.user);
            const user: User = {
              id: data.user.id.toString(),
              email: data.user.email,
              firstName: data.user.first_name || '',
              lastName: data.user.last_name || '',
              role: data.user.role || (data.user.is_admin ? 'admin' : 'customer'),
              avatar: data.user.avatar_url || '',
            };
            console.log('🔐 Auth Context: Setting user in context:', user);
            dispatch({ type: "SET_USER", payload: user });
          } catch (jsonError) {
            console.error('Failed to parse auth response:', jsonError);
            localStorage.removeItem('auth_token');
          }
        } else {
          // Token is invalid, remove it
          localStorage.removeItem('auth_token');
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        localStorage.removeItem('auth_token');
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    };
    
    initializeAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user: state.user,
        loading: state.loading,
        signIn,
        signUp,
        signOut,
        updateProfile,
        resetPasswordForEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
