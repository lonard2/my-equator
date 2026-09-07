import { UserRole } from "@/types";

export interface FactoryUser {
  id: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string | null;
  isActive: number;
  lastLoginAt?: string | null;
}

export const FACTORY_DEMO_ACCOUNTS: (FactoryUser & { plainPassword: string })[] = [
  {
    id: "usr-super-admin-01",
    username: "superadmin",
    name: "Ir. Budi Hartono",
    email: "budi.hartono@equatorinsole.co.id",
    role: "SUPER_ADMIN",
    plainPassword: "equator2026!",
    isActive: 1,
  },
  {
    id: "usr-factory-manager-02",
    username: "manager",
    name: "Hendra Wijaya, S.T.",
    email: "hendra.wijaya@equatorinsole.co.id",
    role: "FACTORY_MANAGER",
    plainPassword: "equator2026!",
    isActive: 1,
  },
  {
    id: "usr-warehouse-staff-03",
    username: "gudang",
    name: "Asep Sunandar",
    email: "asep.sunandar@equatorinsole.co.id",
    role: "WAREHOUSE_STAFF",
    plainPassword: "equator2026!",
    isActive: 1,
  },
  {
    id: "usr-sales-operator-04",
    username: "sales",
    name: "Siti Rahmawati",
    email: "siti.rahmawati@equatorinsole.co.id",
    role: "SALES_OPERATOR",
    plainPassword: "equator2026!",
    isActive: 1,
  },
];
