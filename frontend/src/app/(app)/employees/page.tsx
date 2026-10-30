"use client";

import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { Avatar, Button, Empty, inputCls, Loading, PageHeader, Pagination, Panel, StatusBadge, Table } from "@/components/ui";
import { qs } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { fmtDate, label } from "@/lib/format";
import type { Department, Employee, Paginated } from "@/lib/types";

export default function EmployeesPage() {
  const user = useAuth();
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [department, setDepartment] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data: departments } = useSWR<Department[]>("departments");
  const { data, isLoading } = useSWR<Paginated<Employee>>(
    `employees${qs({ search: debounced, department_id: department, status, page })}`,
    { keepPreviousData: true }
  );

  return (
    <>
      <PageHeader
        title="Employees"
        description="Everyone in the company, with their role and employment status."
        actions={
          user.is_hr && (
            <Link href="/employees/new">
              <Button>
                <Plus className="h-4 w-4" aria-hidden /> Add employee
              </Button>
            </Link>
          )
        }
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted" aria-hidden />
          <input
            type="search"
            aria-label="Search employees"
            placeholder="Search by name, email or employee number"
            className={`${inputCls} pl-9`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select aria-label="Department" className={`${inputCls} w-auto`} value={department} onChange={(e) => { setDepartment(e.target.value); setPage(1); }}>
          <option value="">All departments</option>
          {departments?.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        <select aria-label="Status" className={`${inputCls} w-auto`} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">Any status</option>
          <option value="active">Active</option>
          <option value="on_leave">On leave</option>
          <option value="terminated">Terminated</option>
        </select>
      </div>

      <Panel>
        {!data && isLoading ? (
          <Loading />
        ) : data && data.data.length === 0 ? (
          <Empty title="No employees match">Try a different search or clear the filters.</Empty>
        ) : data ? (
          <>
            <Table head={["Employee", "Number", "Department", "Position", "Type", "Status", "Joined"]}>
              {data.data.map((e) => (
                <tr key={e.id} className="hover:bg-canvas">
                  <td className="px-4 py-3">
                    <Link href={`/employees/${e.id}`} className="flex items-center gap-3">
                      <Avatar name={e.full_name} />
                      <span>
                        <span className="block font-medium">{e.full_name}</span>
                        <span className="block text-xs text-muted">{e.email}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 tabular-nums text-muted">{e.employee_number}</td>
                  <td className="px-4 py-3">{e.department?.name ?? "—"}</td>
                  <td className="px-4 py-3">{e.position?.title ?? "—"}</td>
                  <td className="px-4 py-3">{label(e.employment_type)}</td>
                  <td className="px-4 py-3"><StatusBadge status={e.status} /></td>
                  <td className="px-4 py-3 text-muted">{fmtDate(e.hire_date)}</td>
                </tr>
              ))}
            </Table>
            <Pagination page={data.current_page} last={data.last_page} total={data.total} onChange={setPage} />
          </>
        ) : null}
      </Panel>
    </>
  );
}
