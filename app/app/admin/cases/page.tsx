import { requireUser } from "@/lib/auth";
import { listCasesForUser } from "@/lib/data/cases";
import { StatusBadge } from "@/components/statusBadge";
import Link from "next/link";
import { Search, ArrowRight, Download, ChevronLeft, ChevronRight } from "lucide-react";
import type { CaseStatus } from "@/db/schema";
import Button from "@/components/Button";

interface AdminCasesPageProps {
  searchParams: Promise<{ search?: string; status?: string; page?: string; pageSize?: string }>;
}

export default async function AdminCasesPage({
  searchParams,
}: AdminCasesPageProps) {
  const user = await requireUser(["admin"]);
  const { search, status, page, pageSize } = await searchParams;

  const currentPage = Math.max(1, parseInt(page || "1", 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(pageSize || "10", 10) || 10));
  const offset = (currentPage - 1) * limit;

  const result = await listCasesForUser(user, {
    search,
    status: status as CaseStatus,
    limit,
    offset,
  });

  const statuses = [
    "All",
    "Draft",
    "Assigned",
    "In Progress",
    "Completed - Awaiting Approval",
    "Revision Required",
    "Approved",
  ];

  const totalPages = Math.ceil(result.totalCount / limit) || 1;

  const createPageUrl = (newPage: number) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    if (limit !== 10) params.set("pageSize", limit.toString());
    params.set("page", newPage.toString());
    return `?${params.toString()}`;
  };

  const startRecord = result.totalCount === 0 ? 0 : offset + 1;
  const endRecord = Math.min(offset + limit, result.totalCount);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:items-center justify-between gap-4 pt-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brand-text-primary">
            All Clinical Cases (Institutional Oversight)
          </h1>
          <p className="text-xs text-brand-text-muted mt-1">
            Total of {result.totalCount} clinical cases recorded across all
            departments and supervisors.
          </p>
        </div>
        <div className="flex flex-row w-full items-end justify-between">
          <Button href="/app/admin" label="Back" arrow="left" />
          <a
            href="/api/exports/cases.csv"
            download
            className="inline-flex items-center gap-2 rounded-lg bg-brand-accent px-4 py-2 text-xs font-semibold text-white hover:bg-brand-accent/90 shadow-sm transition-colors"
          >
            <Download className="h-4 w-4" />
            Export All Cases (CSV)
          </a>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-xl border border-brand-border-default bg-brand-page p-4 shadow-sm space-y-3">
        <form method="GET" className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-brand-text-muted" />
            <input
              type="text"
              name="search"
              defaultValue={search || ""}
              placeholder="Search by patient, student, diagnosis, or case number..."
              className="w-full rounded-lg border border-brand-border-default bg-brand-page pl-9 pr-3 py-2 text-xs text-brand-text-primary placeholder:text-brand-text-muted focus:outline-none focus:ring-1 focus:ring-brand-accent"
            />
          </div>

          <div className="flex gap-2">
            <select
              name="status"
              defaultValue={status || ""}
              className="rounded-lg border border-brand-border-default bg-brand-page px-3 py-2 text-xs text-brand-text-primary focus:outline-none focus:ring-1 focus:ring-brand-accent"
            >
              <option value="">All Statuses</option>
              {statuses
                .filter((s) => s !== "All")
                .map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
            </select>

            <button
              type="submit"
              className="rounded-lg bg-brand-text-primary px-4 py-2 text-xs font-semibold text-brand-page hover:opacity-90 transition-opacity"
            >
              Filter
            </button>
          </div>
        </form>
      </div>

      {/* Cases Table */}
      <div className="rounded-xl border border-brand-border-default bg-brand-page shadow-sm overflow-hidden">
        {result.cases.length === 0 ? (
          <div className="p-16 text-center text-sm text-brand-text-muted">
            No clinical cases matched your query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-brand-subtle text-brand-text-muted uppercase tracking-wider font-semibold border-b border-brand-border-default">
                <tr>
                  <th className="px-6 py-3.5">Case No</th>
                  <th className="px-6 py-3.5">Student Clinician</th>
                  <th className="px-6 py-3.5">Patient Details</th>
                  <th className="px-6 py-3.5">Diagnosis</th>
                  <th className="px-6 py-3.5">Device Type</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border-default">
                {result.cases.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-brand-subtle/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-mono font-bold text-brand-accent">
                      {c.caseNo || `#${c.id}`}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-brand-text-primary">
                        {c.studentName}
                      </div>
                      <div className="text-[11px] text-brand-text-muted">
                        {c.studentRegNo || "Reg: N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-brand-text-primary">
                        {c.patientName || "Untitled"}
                      </div>
                      <div className="text-[11px] text-brand-text-muted">
                        {c.patientGender || ""}{" "}
                        {c.patientAge ? `(${c.patientAge})` : ""}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-brand-text-secondary max-w-xs truncate">
                      {c.diagnosis || "—"}
                    </td>
                    <td className="px-6 py-4 text-brand-text-muted">
                      {c.deviceType || c.deviceCategory || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/app/cases/${c.id}`}
                        className="inline-flex items-center gap-1 rounded-lg bg-brand-subtle px-3 py-1 font-semibold text-brand-text-secondary hover:bg-brand-accent/10 hover:text-brand-accent transition-colors"
                      >
                        Inspect <ArrowRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {result.totalCount > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-brand-border-default px-6 py-3.5 bg-brand-page text-xs text-brand-text-muted">
            <div>
              Showing <span className="font-semibold text-brand-text-primary">{startRecord}</span> to{" "}
              <span className="font-semibold text-brand-text-primary">{endRecord}</span> of{" "}
              <span className="font-semibold text-brand-text-primary">{result.totalCount}</span> cases
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                {currentPage > 1 ? (
                  <Link
                    href={createPageUrl(currentPage - 1)}
                    className="inline-flex items-center gap-1 rounded-lg border border-brand-border-default bg-brand-page px-2.5 py-1.5 font-medium text-brand-text-secondary hover:bg-brand-subtle hover:text-brand-text-primary transition-colors"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Previous
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-lg border border-brand-border-default bg-brand-subtle/40 px-2.5 py-1.5 font-medium text-brand-text-muted/50 cursor-not-allowed">
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Previous
                  </span>
                )}

                <div className="flex items-center gap-1 px-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => {
                      return (
                        p === 1 ||
                        p === totalPages ||
                        Math.abs(p - currentPage) <= 1
                      );
                    })
                    .reduce<(number | string)[]>((acc, p, idx, arr) => {
                      if (idx > 0 && p - (arr[idx - 1] as number) > 1) {
                        acc.push("...");
                      }
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((item, idx) => {
                      if (typeof item === "string") {
                        return (
                          <span key={`ellipsis-${idx}`} className="px-1.5 py-1 text-brand-text-muted">
                            ...
                          </span>
                        );
                      }
                      const isCurrent = item === currentPage;
                      return (
                        <Link
                          key={item}
                          href={createPageUrl(item)}
                          className={`min-w-[28px] h-7 inline-flex items-center justify-center rounded-lg px-2 text-xs font-medium transition-colors ${
                            isCurrent
                              ? "bg-brand-accent text-white font-semibold shadow-sm"
                              : "border border-brand-border-default bg-brand-page text-brand-text-secondary hover:bg-brand-subtle hover:text-brand-text-primary"
                          }`}
                        >
                          {item}
                        </Link>
                      );
                    })}
                </div>

                {currentPage < totalPages ? (
                  <Link
                    href={createPageUrl(currentPage + 1)}
                    className="inline-flex items-center gap-1 rounded-lg border border-brand-border-default bg-brand-page px-2.5 py-1.5 font-medium text-brand-text-secondary hover:bg-brand-subtle hover:text-brand-text-primary transition-colors"
                  >
                    Next
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-lg border border-brand-border-default bg-brand-subtle/40 px-2.5 py-1.5 font-medium text-brand-text-muted/50 cursor-not-allowed">
                    Next
                    <ChevronRight className="h-3.5 w-3.5" />
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
