"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

export function AdminGate({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return <p className="text-sm text-slate-600">Loading...</p>;
  }

  if (!user) {
    return (
      <div className="card space-y-3">
        <h1 className="text-2xl font-semibold">Admin</h1>
        <p className="text-sm text-slate-600">Log in to access the admin panel.</p>
        <Link href="/login" className="button">
          Log in
        </Link>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="card space-y-3">
        <h1 className="text-2xl font-semibold">Admin access required</h1>
        <p className="text-sm text-slate-600">
          Your account is not listed as an admin. Add your UID to the Firestore
          `admins` collection to grant access.
        </p>
        <p className="text-sm text-slate-600">
          Your UID: <strong>{user.uid}</strong>
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
