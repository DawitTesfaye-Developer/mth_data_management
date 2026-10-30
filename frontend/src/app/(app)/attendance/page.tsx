"use client";

import { useState } from "react";
import useSWR from "swr";
import ClockCard from "@/components/ClockCard";
import { Empty, inputCls, Loading, PageHeader, Pagination, Panel, Table } from "@/components/ui";
import { qs } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { fmtDate, fmtTime, todayISO } from "@/lib/format";
import type { Attendance, Paginated } from "@/lib/types";

export default function AttendancePage() {
  const user = useAuth();
  const [date, setDate] = useState(user.is_hr ? todayISO() : "");
  const [page, setPage] = useState(1);
  const { data } = useSWR<Paginated<Attendance>>(`attendance${qs({ date, page })}`, { keepPreviousData: true });

  return (
    <>
      <PageHeader
        title="Attendance"
        description={user.is_hr ? "Who clocked in on a given day." : "Your recent clock-ins and clock-outs."}
        actions={
          <input
            type="date"
            aria-label="Date"
            max={todayISO()}
            className={`${inputCls} w-auto`}
            value={date}
            onChange={(e) => { setDate(e.target.value); setPage(1); }}
          />
        }
      />

      <div className={user.employee_id ? "grid gap-6 lg:grid-cols-[1fr_20rem]" : ""}>
        <Panel>
          {!data ? (
            <Loading />
          ) : data.data.length === 0 ? (
            <Empty title="No attendance records">{date ? `Nobody clocked in on ${fmtDate(date)}.` : "Clock in to start your record."}</Empty>
          ) : (
            <>
              <Table head={user.is_hr ? ["Employee", "Date", "In", "Out", "Hours"] : ["Date", "In", "Out", "Hours"]}>
                {data.data.map((a) => (
                  <tr key={a.id}>
                    {user.is_hr && <td className="px-4 py-3 font-medium">{a.employee?.full_name}</td>}
                    <td className="px-4 py-3">{fmtDate(a.date)}</td>
                    <td className="px-4 py-3 tabular-nums">{fmtTime(a.clock_in)}</td>
                    <td className="px-4 py-3 tabular-nums">{fmtTime(a.clock_out)}</td>
                    <td className="px-4 py-3 tabular-nums">{a.worked_hours ?? "—"}</td>
                  </tr>
                ))}
              </Table>
              <Pagination page={data.current_page} last={data.last_page} total={data.total} onChange={setPage} />
            </>
          )}
        </Panel>
        {user.employee_id && <div><ClockCard /></div>}
      </div>
    </>
  );
}
