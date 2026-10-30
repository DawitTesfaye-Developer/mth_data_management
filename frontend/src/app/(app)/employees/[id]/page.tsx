"use client";

import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import useSWR, { mutate } from "swr";
import { Avatar, Button, Loading, Modal, Notice, Panel, StatusBadge } from "@/components/ui";
import { ApiError, errorMessage, send } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { fmtDate, fmtMoney, label } from "@/lib/format";
import type { Employee } from "@/lib/types";

function Item({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted">{name}</dt>
      <dd className="mt-0.5 text-sm">{children || "—"}</dd>
    </div>
  );
}

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuth();
  const router = useRouter();
  const { data: e, error } = useSWR<Employee, ApiError>(`employees/${id}`);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");

  async function remove() {
    setBusy(true);
    setFailure("");
    try {
      await send("DELETE", `employees/${id}`);
      await mutate((key) => typeof key === "string" && key.startsWith("employees"));
      router.replace("/employees");
    } catch (ex) {
      setFailure(errorMessage(ex));
      setBusy(false);
    }
  }

  if (error) return <Notice>{error.status === 404 ? "This employee does not exist." : error.message}</Notice>;
  if (!e) return <Loading />;

  const canSeePrivate = e.salary !== undefined; // the API only sends private fields to HR or the employee

  return (
    <>
      <Link href="/employees" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" aria-hidden /> All employees
      </Link>

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <Avatar name={e.full_name} size={64} />
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">{e.full_name}</h1>
          <p className="text-sm text-muted">
            {e.position?.title ?? "No position"} · {e.department?.name ?? "No department"} · {e.employee_number}
          </p>
        </div>
        <StatusBadge status={e.status} />
        {user.is_hr && (
          <div className="flex gap-2">
            <Link href={`/employees/${e.id}/edit`}>
              <Button variant="secondary"><Pencil className="h-4 w-4" aria-hidden /> Edit</Button>
            </Link>
            <Button variant="dangerOutline" onClick={() => setConfirming(true)}>
              <Trash2 className="h-4 w-4" aria-hidden /> Remove
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Panel title="Contact">
          <dl className="grid grid-cols-2 gap-4 p-4">
            <Item name="Email">{e.email}</Item>
            <Item name="Phone">{e.phone}</Item>
            {canSeePrivate && <Item name="Address">{e.address}</Item>}
            {canSeePrivate && <Item name="Date of birth">{e.date_of_birth ? fmtDate(e.date_of_birth) : ""}</Item>}
            <Item name="Gender">{e.gender ? label(e.gender) : ""}</Item>
          </dl>
        </Panel>

        <Panel title="Employment">
          <dl className="grid grid-cols-2 gap-4 p-4">
            <Item name="Hire date">{fmtDate(e.hire_date)}</Item>
            <Item name="Type">{label(e.employment_type)}</Item>
            <Item name="Department">{e.department?.name}</Item>
            <Item name="Position">{e.position?.title}</Item>
            {canSeePrivate && <Item name="Monthly salary">{e.salary ? fmtMoney(e.salary) : ""}</Item>}
            {e.user && <Item name="Access level">{label(e.user.role)}</Item>}
          </dl>
        </Panel>

        {canSeePrivate && (
          <Panel title="Emergency contact">
            <dl className="grid grid-cols-2 gap-4 p-4">
              <Item name="Name">{e.emergency_contact_name}</Item>
              <Item name="Phone">{e.emergency_contact_phone}</Item>
            </dl>
          </Panel>
        )}
      </div>

      {confirming && (
        <Modal title="Remove employee" onClose={() => setConfirming(false)}>
          <div className="space-y-4">
            {failure && <Notice>{failure}</Notice>}
            <p className="text-sm">
              Remove <strong>{e.full_name}</strong>? Their sign-in account is deleted and they disappear from the employee list.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setConfirming(false)}>Keep employee</Button>
              <Button variant="danger" loading={busy} onClick={remove}>Remove employee</Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
