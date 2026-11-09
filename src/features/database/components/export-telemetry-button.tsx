"use client";

import { useState } from "react";
import { FileDown, FileText, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DashboardTelemetry } from "../types/database.types";

interface ExportTelemetryButtonProps {
  telemetry: DashboardTelemetry;
}

export function ExportTelemetryButton({ telemetry }: ExportTelemetryButtonProps) {
  const [downloadedFormat, setDownloadedFormat] = useState<string | null>(null);

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportJson = () => {
    const jsonStr = JSON.stringify(telemetry, null, 2);
    const today = new Date().toISOString().slice(0, 10);
    downloadFile(jsonStr, `pokeiring-telemetry-${today}.json`, "application/json");
    setDownloadedFormat("json");
    setTimeout(() => setDownloadedFormat(null), 2500);
  };

  const handleExportCsv = () => {
    const today = new Date().toISOString().slice(0, 10);
    const rows: string[] = [];

    // Summary section
    rows.push("POKE: IRING TELEMETRY REPORT");
    rows.push(`Exported At,${new Date().toISOString()}`);
    rows.push("");
    rows.push("Metric,Value");
    rows.push(`Total Verified Cat Sightings,${telemetry.totalSightings}`);
    rows.push(`Sightings (Last 7 Days),${telemetry.sightingsLast7Days}`);
    rows.push(`Registered Explorers,${telemetry.totalExplorers}`);
    rows.push(`Active Territories (Cities),${telemetry.totalTerritories}`);
    rows.push(`Total Seeded Barangays,${telemetry.totalBarangays}`);
    rows.push(`Detected Mock Records,${telemetry.totalMockRecords}`);
    rows.push("");

    // 7-Day Activity Breakdown
    rows.push("7-DAY SIGHTINGS VOLUME");
    rows.push("Day,Date,Verified Sightings");
    for (const bar of telemetry.weeklyActivity) {
      rows.push(`${bar.day},${bar.dateKey},${bar.sightings}`);
    }
    rows.push("");

    // Recent Explorer Activity Log
    rows.push("RECENT COMMUNITY ACTIVITY");
    rows.push("Timestamp,Actor,Territory/Badge,Action");
    for (const act of telemetry.recentActivity) {
      const cleanActor = act.actor.replace(/,/g, " ");
      const cleanBadge = act.badge.replace(/,/g, " ");
      const cleanAction = act.action.replace(/,/g, " ");
      rows.push(`${act.timestampIso},"${cleanActor}","${cleanBadge}","${cleanAction}"`);
    }

    const csvContent = rows.join("\r\n");
    downloadFile(csvContent, `pokeiring-telemetry-${today}.csv`, "text/csv;charset=utf-8;");
    setDownloadedFormat("csv");
    setTimeout(() => setDownloadedFormat(null), 2500);
  };

  return (
    <div className="flex items-center gap-1.5">
      <Button
        variant="outline"
        size="sm"
        onClick={handleExportCsv}
        className="gap-1.5 border-neutral-800 text-xs text-neutral-300 hover:text-neutral-100"
      >
        {downloadedFormat === "csv" ? (
          <Check className="h-3.5 w-3.5 text-emerald-400" />
        ) : (
          <FileText className="h-3.5 w-3.5 text-[#FF8C1A]" />
        )}
        Export CSV
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleExportJson}
        className="gap-1.5 border-neutral-800 text-xs text-neutral-300 hover:text-neutral-100"
      >
        {downloadedFormat === "json" ? (
          <Check className="h-3.5 w-3.5 text-emerald-400" />
        ) : (
          <FileDown className="h-3.5 w-3.5 text-neutral-400" />
        )}
        JSON
      </Button>
    </div>
  );
}
