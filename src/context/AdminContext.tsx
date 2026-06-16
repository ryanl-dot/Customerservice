import { createContext, useContext, useState } from 'react';

interface AdminContextType {
  isAdmin: boolean;
  toggleAdmin: () => void;
}

const AdminContext = createContext<AdminContextType>({ isAdmin: false, toggleAdmin: () => {} });

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  return (
    <AdminContext.Provider value={{ isAdmin, toggleAdmin: () => setIsAdmin(a => !a) }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() { return useContext(AdminContext); }
