// Brightloop Role-Based Route Guard
import React from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from 'src/context/AuthContext';
import { UserRole } from 'src/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requireAdmin = false,
}) => {
  const { isAuthenticated, role } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // If page requires Admin and user is not Admin
  if (requireAdmin && role !== 'admin') {
    return <Navigate to="/auth/403" replace />;
  }

  // If specific roles are specified and current role is not in the list
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/auth/403" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
