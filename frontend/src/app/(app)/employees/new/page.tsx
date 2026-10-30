"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import EmployeeForm from "@/components/EmployeeForm";
import { PageHeader } from "@/components/ui";
import { useAuth } from "@/lib/auth";

export default function NewEmployeePage() {
  const user = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user.is_hr) router.replace("/employees");
  }, [user.is_hr, router]);

  if (!user.is_hr) return null;

  return (
    <>
      <PageHeader title="Add employee" description="Create the employee record. You can add a sign-in account at the end." />
      <EmployeeForm />
    </>
  );
}
