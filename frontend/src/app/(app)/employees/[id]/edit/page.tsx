"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import useSWR from "swr";
import EmployeeForm from "@/components/EmployeeForm";
import { Loading, PageHeader } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import type { Employee } from "@/lib/types";

export default function EditEmployeePage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuth();
  const router = useRouter();
  const { data } = useSWR<Employee>(`employees/${id}`);

  useEffect(() => {
    if (!user.is_hr) router.replace(`/employees/${id}`);
  }, [user.is_hr, id, router]);

  if (!user.is_hr || !data) return <Loading />;

  return (
    <>
      <PageHeader title={`Edit ${data.full_name}`} description={data.employee_number} />
      <EmployeeForm initial={data} />
    </>
  );
}
