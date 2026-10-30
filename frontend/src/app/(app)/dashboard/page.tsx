"use client";

import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import ClockCard from "@/components/ClockCard";
import { Avatar, Button, Empty, Loading, Notice, PageHeader, Panel } from "@/components/ui";
import { errorMessage, send } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { fmtDate } from "@/lib/format";
import type { Dashboard } from "@/lib/types";

const SEGMENTS = ["#0F6B62", "#3F8F86", "#8CBFB7", "#C9A24A", "#B9704B", "#6B7F9A", "#9A8FB0", "#B7C0B8"];

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export default function DashboardPage() {
  const user = useAuth();
  const { data, mutate } = useSWR<Dashboard>("dashboard");
  const [error, setError] = useState("");

  async function review(id: number, decision: "approve" | "reject") {
    setError("");
    try {
      await send("PATCH", `leave-requests/${id}/${decision}`, {});
      await mutate();
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  const title = `${greeting()}, ${user.name.split(" ")[0]}`;
  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

  if (!data) return <Loading />;

  /* ---------- employee view ---------- */
  if (data.scope === "self") {
    return (
      <>
        <PageHeader title={title} description={today} />
        <div className="grid gap-6 md:grid-cols-2">
          {user.employee_id && <ClockCard />}
          <Panel title="Your leave">
            <dl className="grid grid-cols-2 gap-4 p-4">
              <div>
                <dt className="text-sm text-muted">Days taken this year</dt>
                <dd className="text-3xl font-semibold">{data.leave_days_taken}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted">Waiting for approval</dt>
                <dd className="text-3xl font-semibold">{data.pending_requests}</dd>
              </div>
            </dl>
            <div className="border-t border-line px-4 py-3">
              <Link href="/leave" className="text-sm font-medium text-brand hover:underline">
                Request or view leave
              </Link>
            </div>
          </Panel>
        </div>
      </>
    );
  }

  /* ---------- HR view ---------- */
  const total = data.by_department.reduce((s, d) => s + d.count, 0) || 1;
  const figures = [
    { label: "Headcount", value: data.headcount },
    { label: "Clocked in today", value: data.present_today },
    { label: "On leave today", value: data.on_leave_today },
    { label: "Joined in 30 days", value: data.new_hires_30d },
  ];

  return (
    <>
      <PageHeader title={title} description={today} />

      <div className="mb-6 grid grid-cols-2 divide-line rounded-lg border border-line bg-white lg:grid-cols-4 lg:divide-x">
        {figures.map((f) => (
          <div key={f.label} className="p-4">
            <p className="text-sm text-muted">{f.label}</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums">{f.value}</p>
          </div>
        ))}
      </div>

      {error && <div className="mb-4"><Notice>{error}</Notice></div>}

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Panel title="Headcount by department">
          <div className="p-4">
            {data.by_department.length === 0 ? (
              <Empty title="No departments yet" />
            ) : (
              <>
                <div className="flex h-4 overflow-hidden rounded-full bg-canvas" role="img" aria-label="Headcount split by department">
                  {data.by_department.map((d, i) => (
                    <div key={d.id} style={{ width: `${(d.count / total) * 100}%`, background: SEGMENTS[i % SEGMENTS.length] }} title={`${d.name}: ${d.count}`} />
                  ))}
                </div>
                <ul className="mt-4 space-y-2 text-sm">
                  {data.by_department.map((d, i) => (
                    <li key={d.id} className="flex items-center gap-3">
                      <span className="h-3 w-3 rounded-sm" style={{ background: SEGMENTS[i % SEGMENTS.length] }} aria-hidden />
                      <span className="flex-1">{d.name}</span>
                      <span className="tabular-nums text-muted">{d.count}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </Panel>

        <div className="space-y-6">
          {user.employee_id && <ClockCard />}

          <Panel
            title={`Waiting for review (${data.pending_requests})`}
            action={<Link href="/leave?status=pending" className="text-sm font-medium text-brand hover:underline">See all</Link>}
          >
            {data.pending_list.length === 0 ? (
              <Empty title="Nothing waiting" >All leave requests are reviewed.</Empty>
            ) : (
              <ul className="divide-y divide-line">
                {data.pending_list.map((r) => (
                  <li key={r.id} className="p-4">
                    <p className="text-sm font-medium">{r.employee?.full_name}</p>
                    <p className="text-sm text-muted">
                      {r.leave_type?.name} · {r.days} {r.days === 1 ? "day" : "days"} from {fmtDate(r.start_date)}
                    </p>
                    <div className="mt-2 flex gap-2">
                      <Button small onClick={() => review(r.id, "approve")}>Approve</Button>
                      <Button small variant="secondary" onClick={() => review(r.id, "reject")}>Reject</Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>

      <Panel title="Recent hires" className="mt-6">
        <ul className="divide-y divide-line">
          {data.recent_hires.map((e) => (
            <li key={e.id}>
              <Link href={`/employees/${e.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-canvas">
                <Avatar name={e.full_name} />
                <span className="flex-1">
                  <span className="block text-sm font-medium">{e.full_name}</span>
                  <span className="block text-sm text-muted">{e.position?.title ?? "No position"} · {e.department?.name ?? "No department"}</span>
                </span>
                <span className="text-sm text-muted">Joined {fmtDate(e.hire_date)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}
