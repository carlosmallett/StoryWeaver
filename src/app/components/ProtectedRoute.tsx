import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { AccountRole } from '../utils/localAuth';

export function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: ReactNode;
  allowedRoles?: AccountRole[];
}) {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if user is logged in
    const currentUser = localStorage.getItem('currentUser');
    
    if (!currentUser) {
      // No user logged in, redirect to login
      navigate('/login');
      return;
    }

    if (allowedRoles && allowedRoles.length > 0) {
      try {
        const parsedUser = JSON.parse(currentUser);
        if (!allowedRoles.includes(parsedUser.role)) {
          navigate('/login');
        }
      } catch {
        navigate('/login');
      }
    }
  }, [allowedRoles, navigate]);

  // Check current user
  const currentUser = localStorage.getItem('currentUser');
  
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (allowedRoles && allowedRoles.length > 0) {
    try {
      const parsedUser = JSON.parse(currentUser);
      if (!allowedRoles.includes(parsedUser.role)) {
        return (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-700 font-semibold">You do not have access to this page.</p>
            </div>
          </div>
        );
      }
    } catch {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}