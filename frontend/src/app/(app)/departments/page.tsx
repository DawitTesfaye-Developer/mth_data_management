"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";
import { Button, Empty, Field, inputCls, Loading, Modal, Notice, PageHeader, Panel, Table } from "@/components/ui";
import { ApiError, errorMessage, send } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Department } from "@/lib/types";

export default function DepartmentsPage() {
  const user = useAuth();
  const { data, mutate } = useSWR<Department[]>("departments");
  const [editing, setEditing] = useState<Department | "new" | null>(null);
  const [deleting, setDeleting] = useState<Department | null>(null);

  return (
    <>
      <PageHeader
        title="Departments"
        description="How the company is organised and how many people sit in each team."
        actions={user.is_hr && <Button onClick={() => setEditing("new")}><Plus className="h-4 w-4" aria-hidden /> Add department</Button>}
      />

      <Panel>
        {!data ? (
          <Loading />
        ) : data.length === 0 ? (
          <Empty title="No departments yet">Add the first one to start grouping employees.</Empty>
        ) : (
          <Table head={user.is_hr ? ["Name", "Description", "Employees", ""] : ["Name", "Description", "Employees"]}>
            {data.map((d) => (
              <tr key={d.id}>
                <td className="px-4 py-3 font-medium">{d.name}</td>
                <td className="px-4 py-3 text-muted">{d.description ?? "—"}</td>
                <td className="px-4 py-3 tabular-nums">{d.employees_count}</td>
                {user.is_hr && (
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button small variant="ghost" aria-label={`Edit ${d.name}`} onClick={() => setEditing(d)}><Pencil className="h-4 w-4" /></Button>
                      <Button small variant="ghost" aria-label={`Delete ${d.name}`} onClick={() => setDeleting(d)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </Table>
        )}
      </Panel>

      {editing && (
        <DepartmentModal
          department={editing === "new" ? undefined : editing}
          onClose={() => setEditing(null)}
          onSaved={async () => { setEditing(null); await mutate(); }}
        />
      )}
      {deleting && (
        <DeleteModal department={deleting} onClose={() => setDeleting(null)} onDeleted={async () => { setDeleting(null); await mutate(); }} />
      )}
    </>
  );
}

function DepartmentModal({ department, onClose, onSaved }: { department?: Department; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(department?.name ?? "");
  const [description, setDescription] = useState(department?.description ?? "");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    setMessage("");
    try {
      const body = { name, description: description || null };
      if (department) await send("PUT", `departments/${department.id}`, body);
      else await send("POST", "departments", body);
      onSaved();
    } catch (ex) {
      if (ex instanceof ApiError) setErrors(ex.errors);
      setMessage(errorMessage(ex));
      setBusy(false);
    }
  }

  return (
    <Modal title={department ? "Edit department" : "Add department"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {message && <Notice>{message}</Notice>}
        <Field label="Name" error={errors.name?.[0]}>
          {(id) => <input id={id} required autoFocus className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />}
        </Field>
        <Field label="Description" error={errors.description?.[0]}>
          {(id) => <textarea id={id} rows={3} className={inputCls} value={description} onChange={(e) => setDescription(e.target.value)} />}
        </Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={busy}>{department ? "Save changes" : "Add department"}</Button>
        </div>
      </form>
    </Modal>
  );
}

function DeleteModal({ department, onClose, onDeleted }: { department: Department; onClose: () => void; onDeleted: () => void }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function remove() {
    setBusy(true);
    setMessage("");
    try {
      await send("DELETE", `departments/${department.id}`);
      onDeleted();
    } catch (ex) {
      setMessage(errorMessage(ex));
      setBusy(false);
    }
  }

  return (
    <Modal title="Delete department" onClose={onClose}>
      <div className="space-y-4">
        {message && <Notice>{message}</Notice>}
        <p className="text-sm">Delete <strong>{department.name}</strong>? This cannot be undone.</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Keep department</Button>
          <Button variant="danger" loading={busy} onClick={remove}>Delete department</Button>
        </div>
      </div>
    </Modal>
  );
}
