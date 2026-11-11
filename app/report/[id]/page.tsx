"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import ReportView from "@/components/ReportView";
import { getReport } from "@/lib/storage";
import type { Report } from "@/lib/types";

export default function ReportPage() {
  const params = useParams<{ id: string }>();
  const id = decodeURIComponent(String(params?.id ?? ""));
  const [report, setReport] = useState<Report | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setReport(getReport(id));
    setLoaded(true);
  }, [id]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Link href="/dashboard" className="no-print mb-6 inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Back to dashboard
      </Link>
      {!loaded ? (
        <div className="glass h-64 animate-pulse" />
      ) : report ? (
        <ReportView report={report} />
      ) : (
        <div className="glass p-10 text-center">
          <h1 className="text-xl font-semibold">Report not found</h1>
          <p className="mt-2 text-sm text-slate-400">
            Reports are stored only in this browser. It may have been deleted, or it was created on another device.
          </p>
          <Link href="/screening" className="btn-primary mt-6">
            Start a new screening
          </Link>
        </div>
      )}
    </div>
  );
}
