"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import useSWR, { mutate } from "swr";
import { ApiError, send } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Department, Employee, Position } from "@/lib/types";
import { Button, Field, inputCls, Notice, Panel } from "./ui";

type FormState = Record<string, string>;

const EMPTY: FormState = {
  first_name: "", last_name: "", email: "", phone: "", gender: "", date_of_birth: "", address: "",
  hire_date: "", department_id: "", position_id: "", employment_type: "full_time", status: "active",
  salary: "", emergency_contact_name: "", emergency_contact_phone: "",
  password: "", role: "employee",
};

function fromEmployee(e: Employee): FormState {
  const s: FormState = { ...EMPTY };
  (Object.keys(EMPTY) as (keyof Employee)[]).forEach((k) => {
    const v = e[k];
    if (v !== null && v !== undefined && typeof v !== "object") s[k as string] = String(v);
  });
  if (e.salary) s.salary = String(Math.round(Number(e.salary)));
  return s;
}

export default function EmployeeForm({ initial }: { initial?: Employee }) {
  const router = useRouter();
  const user = useAuth();
  const { data: departments } = useSWR<Department[]>("departments");
  const { data: positions } = useSWR<Position[]>("positions");

  const [form, setForm] = useState<FormState>(initial ? fromEmployee(initial) : EMPTY);
  const [createAccount, setCreateAccount] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));
  const err = (k: string) => errors[k]?.[0];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    setMessage("");

    const body: Record<string, unknown> = {};
    Object.entries(form).forEach(([k, v]) => {
      if (k === "password" || k === "role") return;
      body[k] = v === "" ? null : v;
    });
    if (!initial && createAccount) {
      body.password = form.password;
      body.role = form.role;
    }

    try {
      const saved = initial
        ? await send<Employee>("PUT", `employees/${initial.id}`, body)
        : await send<Employee>("POST", "employees", body);
      await mutate((key) => typeof key === "string" && key.startsWith("employees"));
      router.push(`/employees/${saved.id}`);
    } catch (ex) {
      if (ex instanceof ApiError) {
        setErrors(ex.errors);
        setMessage(Object.keys(ex.errors).length ? "Fix the highlighted fields and save again." : ex.message);
      } else {
        setMessage("Something went wrong. Try again.");
      }
      setBusy(false);
    }
  }

  const text = (name: string, labelText: string, extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <Field label={labelText} error={err(name)}>
      {(id) => <input id={id} className={inputCls} value={form[name]} onChange={set(name)} {...extra} />}
    </Field>
  );

  return (
    <form onSubmit={submit} className="space-y-6">
      {message && <Notice>{message}</Notice>}

      <Panel title="Personal details">
        <div className="grid gap-4 p-4 sm:grid-cols-2">
          {text("first_name", "First name", { required: true })}
          {text("last_name", "Last name", { required: true })}
          {text("email", "Work email", { type: "email", required: true })}
          {text("phone", "Phone", { type: "tel" })}
          <Field label="Gender" error={err("gender")}>
            {(id) => (
              <select id={id} className={inputCls} value={form.gender} onChange={set("gender")}>
                <option value="">Not specified</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>
            )}
          </Field>
          {text("date_of_birth", "Date of birth", { type: "date" })}
          <Field label="Address" error={err("address")} className="sm:col-span-2">
            {(id) => <textarea id={id} rows={2} className={inputCls} value={form.address} onChange={set("address")} />}
          </Field>
        </div>
      </Panel>

      <Panel title="Employment">
        <div className="grid gap-4 p-4 sm:grid-cols-2">
          <Field label="Department" error={err("department_id")}>
            {(id) => (
              <select id={id} className={inputCls} value={form.department_id} onChange={set("department_id")}>
                <option value="">No department</option>
                {departments?.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            )}
          </Field>
          <Field label="Position" error={err("position_id")}>
            {(id) => (
              <select id={id} className={inputCls} value={form.position_id} onChange={set("position_id")}>
                <option value="">No position</option>
                {positions
                  ?.filter((p) => !form.department_id || p.department_id === null || String(p.department_id) === form.department_id)
                  .map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            )}
          </Field>
          {text("hire_date", "Hire date", { type: "date", required: true })}
          <Field label="Employment type" error={err("employment_type")}>
            {(id) => (
              <select id={id} className={inputCls} value={form.employment_type} onChange={set("employment_type")}>
                <option value="full_time">Full time</option>
                <option value="part_time">Part time</option>
                <option value="contract">Contract</option>
                <option value="intern">Intern</option>
              </select>
            )}
          </Field>
          <Field label="Status" error={err("status")}>
            {(id) => (
              <select id={id} className={inputCls} value={form.status} onChange={set("status")}>
                <option value="active">Active</option>
                <option value="on_leave">On leave</option>
                <option value="terminated">Terminated</option>
              </select>
            )}
          </Field>
          {text("salary", "Monthly salary", { type: "number", min: 0, step: "any", inputMode: "decimal" })}
        </div>
      </Panel>

      <Panel title="Emergency contact">
        <div className="grid gap-4 p-4 sm:grid-cols-2">
          {text("emergency_contact_name", "Contact name")}
          {text("emergency_contact_phone", "Contact phone", { type: "tel" })}
        </div>
      </Panel>

      {!initial && (
        <Panel title="Sign-in account">
          <div className="space-y-4 p-4">
            <label className="flex items-start gap-3 text-sm">
              <input type="checkbox" className="mt-0.5 h-4 w-4 accent-brand" checked={createAccount} onChange={(e) => setCreateAccount(e.target.checked)} />
              <span>
                <span className="font-medium">Let this person sign in</span>
                <span className="block text-muted">Creates a login using their work email so they can clock in and request leave.</span>
              </span>
            </label>
            {createAccount && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Temporary password" error={err("password")} hint="At least 8 characters. Ask them to keep it private.">
                  {(id) => <input id={id} type="password" required minLength={8} autoComplete="new-password" className={inputCls} value={form.password} onChange={set("password")} />}
                </Field>
                <Field label="Access level" error={err("role")}>
                  {(id) => (
                    <select id={id} className={inputCls} value={form.role} onChange={set("role")}>
                      <option value="employee">Employee</option>
                      <option value="hr">HR</option>
                      {user.role === "admin" && <option value="admin">Admin</option>}
                    </select>
                  )}
                </Field>
              </div>
            )}
          </div>
        </Panel>
      )}

      <div className="flex gap-3">
        <Button type="submit" loading={busy}>{initial ? "Save changes" : "Add employee"}</Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  );
}
