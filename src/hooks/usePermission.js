// src/hooks/usePermission.js
// =============================================================================
// AZM Business Portal — Permission Hook
//
// Resolves the current user's effective permission set for the active
// business. Owners and admins always have all permissions. Employees get
// their resolved permissions from their BusinessEmployee record.
//
// Usage:
//   const { hasPermission, permissions } = usePermission();
//   if (hasPermission('employees.create')) { ... }
//
// For view-level gates (hide the element entirely):
//   {hasPermission('finance.view') && <FinanceWidget />}
//
// For action-level gates (show but disabled):
//   <button disabled={!hasPermission('orders.refund')}>Refund</button>
// =============================================================================

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { request } from '@/lib/api';

// Cache resolved permissions per business to avoid re-fetching on every render
let _permCache = { bizId: null, perms: [] };

export function usePermission() {
  const { bizProfile, user, isAdmin } = useAuth();
  const [permissions, setPermissions] = useState([]);

  const bizId = bizProfile?.id;

  useEffect(() => {
    // Admin users always have all permissions
    if (isAdmin) {
      setPermissions(['*']);
      _permCache = { bizId, perms: ['*'] };
      return;
    }

    // Business owner (userId matches) always has all permissions
    if (bizProfile && user && bizProfile.userId === user.id) {
      setPermissions(['*']);
      _permCache = { bizId, perms: ['*'] };
      return;
    }

    // For employees, we need to fetch their resolved permissions.
    // The backend /employees/me endpoint returns the employee record
    // which includes their permissions array and role.
    // We use the permission templates to resolve the full set.
    if (!bizId || !user?.id) {
      setPermissions([]);
      return;
    }

    // Check cache first
    if (_permCache.bizId === bizId) {
      setPermissions(_permCache.perms);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        // Fetch the employee's own record which includes role + permissions
        const data = await request('/api/business-os/employees/me');
        if (cancelled) return;

        if (!data?.employee) {
          setPermissions([]);
          return;
        }

        const emp = data.employee;
        let perms = [];

        // If permissions contains '*' or role is OWNER, all permissions
        if (emp.permissions?.includes('*') || emp.role === 'OWNER') {
          perms = ['*'];
        } else {
          // Merge template defaults with explicit permissions
          // The backend already resolves these, so we trust the permissions array
          // But we also need to check if the role has a template
          perms = emp.permissions || [];
        }

        if (!cancelled) {
          setPermissions(perms);
          _permCache = { bizId, perms };
        }
      } catch (err) {
        // If the endpoint fails (not an employee, or no business), no permissions
        if (!cancelled) setPermissions([]);
      }
    })();

    return () => { cancelled = true; };
  }, [bizId, user?.id, isAdmin, bizProfile?.userId]);

  const hasPermission = useCallback((key) => {
    if (!key) return true;
    if (permissions.includes('*')) return true;
    return permissions.includes(key);
  }, [permissions]);

  return { hasPermission, permissions };
}

// Convenience wrapper for one-off permission checks
// Usage: const canRefund = useCan('orders.refund');
export function useCan(key) {
  const { hasPermission } = usePermission();
  return hasPermission(key);
}
