"use client";

import { LogIn, LogOut } from "lucide-react";
import { useState } from "react";
import useSWR, { mutate } from "swr";
import { errorMessage, send } from "@/lib/api";
import { fmtTime } from "@/lib/format";
import type { Attendance } from "@/lib/types";
import { Button, Notice, Panel } from "./ui";

export default function ClockCard() {
  const { data: today, mutate: refresh } = useSWR<Attendance | null>("attendance/today");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function act(kind: "clock-in" | "clock-out") {
    setBusy(true);
    setError("");
    try {
      await send("POST", `attendance/${kind}`);
      await refresh();
      mutate((key) => typeof key === "string" && key.startsWith("attendance"));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  const clockedIn = !!today?.clock_in;
  const clockedOut = !!today?.clock_out;

  return (
    <Panel title="Today">
      <div className="space-y-3 p-4">
        {error && <Notice>{error}</Notice>}
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-muted">Clocked in</dt>
            <dd className="text-lg font-semibold">{fmtTime(today?.clock_in)}</dd>
          </div>
          <div>
            <dt className="text-muted">Clocked out</dt>
            <dd className="text-lg font-semibold">{fmtTime(today?.clock_out)}</dd>
          </div>
        </dl>
        {!clockedIn && (
          <Button onClick={() => act("clock-in")} loading={busy} className="w-full">
            <LogIn className="h-4 w-4" aria-hidden /> Clock in
          </Button>
        )}
        {clockedIn && !clockedOut && (
          <Button onClick={() => act("clock-out")} loading={busy} variant="secondary" className="w-full">
            <LogOut className="h-4 w-4" aria-hidden /> Clock out
          </Button>
        )}
        {clockedOut && <p className="text-sm text-muted">You&apos;re done for today{today?.worked_hours ? ` · ${today.worked_hours} h worked` : ""}.</p>}
      </div>
    </Panel>
  );
}
