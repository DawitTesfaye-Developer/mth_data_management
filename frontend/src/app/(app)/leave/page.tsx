"use client";

import { Plus } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import useSWR, { mutate as globalMutate } from "swr";
import { Button, Empty, Field, inputCls, Loading, Modal, Notice, PageHeader, Pagination, Panel, StatusBadge, Table } from "@/components/ui";
import { ApiError, errorMessage, qs, send } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { fmtDate, todayISO } from "@/lib/format";
import type { LeaveRequest, LeaveType, Paginated } from "@/lib/types";

export default function LeavePage() {
  return (
    <Suspense fallback={<Loading />}>
      <LeaveContent />
    </Suspense>
  );
}

function LeaveContent() {
  const user = useAuth();
  const params = useSearchParams();
  const [status, setStatus] = useState(params.get("status") ?? "");
  const [page, setPage] = useState(1);
  const [requesting, setRequesting] = useState(false);
  const [rejecting, setRejecting] = useState<LeaveRequest | null>(null);
  const [error, setError] = useState("");

  const key = `leave-requests${qs({ status, page })}`;
  const { data, mutate } = useSWR<Paginated<LeaveRequest>>(key, { keepPreviousData: true });

  async function refresh() {
    await mutate();
    globalMutate("dashboard");
  }

  async function approve(r: LeaveRequest) {
    setError("");
    try {
      await send("PATCH", `leave-requests/${r.id}/approve`, {});
      await refresh();
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  async function cancel(r: LeaveRequest) {
    setError("");
    try {
      await send("DELETE", `leave-requests/${r.id}`);
      await refresh();
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  const head = user.is_hr
    ? ["Employee", "Type", "Dates", "Days", "Status", "Reason", ""]
    : ["Type", "Dates", "Days", "Status", "Reason", ""];

  return (
    <>
      <PageHeader
        title="Leave"
        description={user.is_hr ? "Review requests from the whole company." : "Your leave requests and their status."}
        actions={user.employee_id && <Button onClick={() => setRequesting(true)}><Plus className="h-4 w-4" aria-hidden /> Request leave</Button>}
      />

      <div className="mb-4">
        <select aria-label="Status" className={`${inputCls} w-auto`} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {error && <div className="mb-4"><Notice>{error}</Notice></div>}

      <Panel>
        {!data ? (
          <Loading />
        ) : data.data.length === 0 ? (
          <Empty title="No leave requests">{user.employee_id ? "Use “Request leave” to submit one." : "Requests will appear here once employees submit them."}</Empty>
        ) : (
          <>
            <Table head={head}>
              {data.data.map((r) => {
                const own = r.employee_id === user.employee_id;
                return (
                  <tr key={r.id} className="align-top">
                    {user.is_hr && <td className="px-4 py-3 font-medium">{r.employee?.full_name}</td>}
                    <td className="px-4 py-3">{r.leave_type?.name}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {fmtDate(r.start_date)}
                      {r.end_date !== r.start_date && ` – ${fmtDate(r.end_date)}`}
                    </td>
                    <td className="px-4 py-3 tabular-nums">{r.days}</td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                    <td className="max-w-[16rem] px-4 py-3 text-muted">
                      {r.reason ?? "—"}
                      {r.review_note && <span className="mt-1 block text-xs">HR note: {r.review_note}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        {r.status === "pending" && user.is_hr && !own && (
                          <>
                            <Button small onClick={() => approve(r)}>Approve</Button>
                            <Button small variant="secondary" onClick={() => setRejecting(r)}>Reject</Button>
                          </>
                        )}
                        {r.status === "pending" && own && (
                          <Button small variant="secondary" onClick={() => cancel(r)}>Cancel request</Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </Table>
            <Pagination page={data.current_page} last={data.last_page} total={data.total} onChange={setPage} />
          </>
        )}
      </Panel>

      {requesting && <RequestModal onClose={() => setRequesting(false)} onSaved={async () => { setRequesting(false); await refresh(); }} />}
      {rejecting && <RejectModal request={rejecting} onClose={() => setRejecting(null)} onDone={async () => { setRejecting(null); await refresh(); }} />}
    </>
  );
}

function RequestModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { data: types } = useSWR<LeaveType[]>("leave-types");
  const [form, setForm] = useState({ leave_type_id: "", start_date: "", end_date: "", reason: "" });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value, ...(k === "start_date" && f.end_date < e.target.value ? { end_date: e.target.value } : {}) }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    setMessage("");
    try {
      await send("POST", "leave-requests", { ...form, reason: form.reason || null });
      onSaved();
    } catch (ex) {
      if (ex instanceof ApiError) setErrors(ex.errors);
      setMessage(errorMessage(ex));
      setBusy(false);
    }
  }

  return (
    <Modal title="Request leave" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {message && <Notice>{message}</Notice>}
        <Field label="Leave type" error={errors.leave_type_id?.[0]}>
          {(id) => (
            <select id={id} required className={inputCls} value={form.leave_type_id} onChange={set("leave_type_id")}>
              <option value="">Select a type</option>
              {types?.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          )}
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="From" error={errors.start_date?.[0]}>
            {(id) => <input id={id} type="date" required min={todayISO()} className={inputCls} value={form.start_date} onChange={set("start_date")} />}
          </Field>
          <Field label="To" error={errors.end_date?.[0]}>
            {(id) => <input id={id} type="date" required min={form.start_date || todayISO()} className={inputCls} value={form.end_date} onChange={set("end_date")} />}
          </Field>
        </div>
        <Field label="Reason" hint="Optional" error={errors.reason?.[0]}>
          {(id) => <textarea id={id} rows={3} className={inputCls} value={form.reason} onChange={set("reason")} />}
        </Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={busy}>Submit request</Button>
        </div>
      </form>
    </Modal>
  );
}

function RejectModal({ request, onClose, onDone }: { request: LeaveRequest; onClose: () => void; onDone: () => void }) {
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      await send("PATCH", `leave-requests/${request.id}/reject`, { review_note: note || null });
      onDone();
    } catch (ex) {
      setMessage(errorMessage(ex));
      setBusy(false);
    }
  }

  return (
    <Modal title="Reject leave request" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {message && <Notice>{message}</Notice>}
        <p className="text-sm">
          {request.employee?.full_name} asked for {request.days} {request.days === 1 ? "day" : "days"} of {request.leave_type?.name.toLowerCase()} from {fmtDate(request.start_date)}.
        </p>
        <Field label="Note to employee" hint="Optional. Explain why so they can plan.">
          {(id) => <textarea id={id} rows={3} className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} />}
        </Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Back</Button>
          <Button type="submit" variant="danger" loading={busy}>Reject request</Button>
        </div>
      </form>
    </Modal>
  );
}
