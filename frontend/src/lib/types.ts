export type Role = "admin" | "hr" | "employee";

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  is_hr: boolean;
  employee_id: number | null;
}

export interface Department {
  id: number;
  name: string;
  description: string | null;
  employees_count?: number;
}

export interface Position {
  id: number;
  title: string;
  department_id: number | null;
}

export interface LeaveType {
  id: number;
  name: string;
  days_per_year: number;
  paid: boolean;
}

export type EmployeeStatus = "active" | "on_leave" | "terminated";
export type EmploymentType = "full_time" | "part_time" | "contract" | "intern";

export interface Employee {
  id: number;
  employee_number: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string | null;
  gender: "male" | "female" | "other" | null;
  date_of_birth?: string | null;
  address?: string | null;
  hire_date: string;
  department_id: number | null;
  position_id: number | null;
  employment_type: EmploymentType;
  status: EmployeeStatus;
  salary?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  department?: Department | null;
  position?: Position | null;
  user?: { id: number; role: Role } | null;
}

export type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface LeaveRequest {
  id: number;
  employee_id: number;
  leave_type_id: number;
  start_date: string;
  end_date: string;
  days: number;
  reason: string | null;
  status: LeaveStatus;
  review_note: string | null;
  employee?: { id: number; full_name: string; employee_number?: string };
  leave_type?: { id: number; name: string };
}

export interface Attendance {
  id: number;
  employee_id: number;
  date: string;
  clock_in: string | null;
  clock_out: string | null;
  worked_hours: number | null;
  employee?: { id: number; full_name: string; employee_number?: string };
}

export interface Paginated<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export type Dashboard =
  | {
      scope: "hr";
      headcount: number;
      present_today: number;
      on_leave_today: number;
      pending_requests: number;
      new_hires_30d: number;
      by_department: { id: number; name: string; count: number }[];
      recent_hires: Employee[];
      pending_list: LeaveRequest[];
    }
  | { scope: "self"; pending_requests: number; leave_days_taken: number };
