import { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { usePermissions } from '../../hooks/usePermissions';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredTeamId: string;
}

export function ProtectedRoute({ children, requiredTeamId }: ProtectedRouteProps) {
  const { hasTeamId, loading } = usePermissions();

  if (loading) {
    // Show loading state while checking permissions
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-lg">Loading...</div>
    </div>;
  }

  // Check if user has the required team ID
  if (!hasTeamId(requiredTeamId)) {
    // Redirect to home or show unauthorized message
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
