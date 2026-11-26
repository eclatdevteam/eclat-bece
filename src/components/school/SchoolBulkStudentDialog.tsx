import { useState, useId, useMemo } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  RefreshCw,
  Users,
  KeyRound,
  FileText,
  Check,
  AlertCircle
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { SchoolClassItem } from "@/hooks/useSchoolData";
import { supabase } from "@/integrations/supabase/client";
import { getEdgeFunctionError } from "@/lib/errorUtils";
import { toast } from "sonner";
import {
  ParsedStudentRow,
  ImportResult,
  normalizeCohort,
  cleanUsername,
  autoGenerateUsername,
  parseRawRosterRows,
} from "./bulkRosterParser";

export type { ParsedStudentRow, ImportResult };
export { normalizeCohort, cleanUsername, autoGenerateUsername, parseRawRosterRows };

export interface SchoolBulkStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classes: SchoolClassItem[];
  onSuccess?: () => void;
}

export function SchoolBulkStudentDialog({
  open,
  onOpenChange,
  classes,
  onSuccess,
}: SchoolBulkStudentDialogProps) {
  const [step, setStep] = useState<"upload" | "preview" | "progress" | "complete">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState("");
  const [inputMode, setInputMode] = useState<"file" | "paste">("file");
  const [defaultCohort, setDefaultCohort] = useState<"year_9" | "year_6">("year_9");
  const [defaultClassId, setDefaultClassId] = useState<string>("none");

  const [parsedRows, setParsedRows] = useState<ParsedStudentRow[]>([]);
  const [filterMode, setFilterMode] = useState<"all" | "ready" | "errors">("all");

  const [isProcessing, setIsProcessing] = useState(false);
  const [progressCount, setProgressCount] = useState(0);
  const [totalToProcess, setTotalToProcess] = useState(0);
  const [currentImportName, setCurrentImportName] = useState("");
  const [results, setResults] = useState<ImportResult[]>([]);

  const fileInputId = useId();

  // Reset dialog state
  const resetAll = () => {
    setStep("upload");
    setFile(null);
    setPastedText("");
    setParsedRows([]);
    setIsProcessing(false);
    setProgressCount(0);
    setTotalToProcess(0);
    setCurrentImportName("");
    setResults([]);
  };

  const handleClose = () => {
    if (isProcessing) {
      if (!window.confirm("Import is still in progress. Closing may interrupt account creation. Proceed?")) {
        return;
      }
    }
    resetAll();
    onOpenChange(false);
  };

  // Download pre-formatted sample Excel (.xlsx) template
  const handleDownloadExcelTemplate = () => {
    const sampleClassA = classes[0]?.name || "JSS 3A";
    const sampleClassB = classes[1]?.name || "JSS 3B";
    const sampleRows = [
      {
        "Full Name": "Ada Okafor",
        "Cohort": "year_9",
        "Class Arm": sampleClassA,
        "Username": "ada.okafor",
        "Temporary Password": "Password123!",
      },
      {
        "Full Name": "Kwame Mensah",
        "Cohort": "year_9",
        "Class Arm": sampleClassB,
        "Username": "kwame.mensah",
        "Temporary Password": "Password123!",
      },
      {
        "Full Name": "Fatima Bello",
        "Cohort": "year_6",
        "Class Arm": "",
        "Username": "fatima.bello",
        "Temporary Password": "Password123!",
      },
      {
        "Full Name": "Chidi Eze",
        "Cohort": "year_9",
        "Class Arm": sampleClassA,
        "Username": "",
        "Temporary Password": "",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleRows);
    worksheet["!cols"] = [
      { wch: 22 },
      { wch: 12 },
      { wch: 16 },
      { wch: 18 },
      { wch: 22 },
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Student Roster Template");
    XLSX.writeFile(workbook, "eclat_student_roster_template.xlsx");
    toast.success("Excel (.xlsx) template downloaded successfully");
  };

  // Download pre-formatted sample CSV template
  const handleDownloadCsvTemplate = () => {
    const sampleClassA = classes[0]?.name || "JSS 3A";
    const sampleClassB = classes[1]?.name || "JSS 3B";
    const csvContent = [
      "Full Name,Cohort,Class Arm,Username,Temporary Password",
      `Ada Okafor,year_9,${sampleClassA},ada.okafor,Password123!`,
      `Kwame Mensah,year_9,${sampleClassB},kwame.mensah,Password123!`,
      `Fatima Bello,year_6,,fatima.bello,Password123!`,
      `Chidi Eze,year_9,${sampleClassA},,`,
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "eclat_student_roster_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("CSV (.csv) template downloaded successfully");
  };

  // Parse Excel ArrayBuffer
  const processExcelBuffer = (buffer: ArrayBuffer) => {
    try {
      const data = new Uint8Array(buffer);
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        toast.error("The Excel workbook contains no worksheets.");
        return;
      }
      const worksheet = workbook.Sheets[firstSheetName];
      const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: "" });

      if (!rawRows || rawRows.length === 0) {
        toast.error("The Excel worksheet is empty or formatted incorrectly.");
        return;
      }

      const rows = parseRawRosterRows(rawRows, classes, defaultCohort, defaultClassId);

      if (rows.length === 0) {
        toast.error("No valid student rows found in the Excel file.");
        return;
      }

      setParsedRows(rows);
      setStep("preview");
      toast.info(`Parsed ${rows.length} rows from Excel. Please review before proceeding.`);
    } catch (err: any) {
      console.error("Excel parse error:", err);
      toast.error(`Excel parsing error: ${err.message || "Failed to read spreadsheet"}`);
    }
  };

  // Parse CSV string content
  const processCSVContent = (csvString: string) => {
    Papa.parse<Record<string, string>>(csvString, {
      header: true,
      skipEmptyLines: "greedy",
      complete: (parseResult) => {
        if (!parseResult.data || parseResult.data.length === 0) {
          toast.error("The CSV data is empty or formatted incorrectly.");
          return;
        }

        const rows = parseRawRosterRows(parseResult.data, classes, defaultCohort, defaultClassId);

        if (rows.length === 0) {
          toast.error("No valid student rows found in the CSV data.");
          return;
        }

        setParsedRows(rows);
        setStep("preview");
        toast.info(`Parsed ${rows.length} rows from CSV. Please review before proceeding.`);
      },
      error: (err) => {
        console.error("PapaParse error:", err);
        toast.error(`CSV parsing error: ${err.message}`);
      },
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);

    const name = selected.name.toLowerCase();
    const isExcel = name.endsWith(".xlsx") || name.endsWith(".xls");
    const isCsv = name.endsWith(".csv") || name.endsWith(".txt");

    if (isExcel) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const buffer = event.target?.result as ArrayBuffer;
        if (buffer) {
          processExcelBuffer(buffer);
        }
      };
      reader.readAsArrayBuffer(selected);
    } else if (isCsv) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          processCSVContent(text);
        }
      };
      reader.readAsText(selected);
    } else {
      // Fallback: attempt CSV text parsing
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          processCSVContent(text);
        }
      };
      reader.readAsText(selected);
    }
  };

  const handlePasteSubmit = () => {
    if (!pastedText.trim()) {
      toast.error("Please paste CSV formatted rows.");
      return;
    }
    processCSVContent(pastedText);
  };

  // Toggle selection
  const toggleRowSelect = (rowId: string) => {
    setParsedRows((prev) =>
      prev.map((r) => (r.rowId === rowId ? { ...r, selected: !r.selected } : r))
    );
  };

  const selectAll = () => {
    setParsedRows((prev) => prev.map((r) => ({ ...r, selected: r.status === "ready" })));
  };

  const deselectAll = () => {
    setParsedRows((prev) => prev.map((r) => ({ ...r, selected: false })));
  };

  const filteredPreviewRows = useMemo(() => {
    if (filterMode === "ready") return parsedRows.filter((r) => r.status === "ready");
    if (filterMode === "errors") return parsedRows.filter((r) => r.status === "error");
    return parsedRows;
  }, [parsedRows, filterMode]);

  const readyCount = parsedRows.filter((r) => r.status === "ready").length;
  const errorCount = parsedRows.filter((r) => r.status === "error").length;
  const selectedCount = parsedRows.filter((r) => r.selected).length;

  // Run batch account creation
  const handleExecuteImport = async () => {
    const targets = parsedRows.filter((r) => r.selected && r.status === "ready");
    if (targets.length === 0) {
      toast.error("No valid students selected for import.");
      return;
    }

    setStep("progress");
    setIsProcessing(true);
    setProgressCount(0);
    setTotalToProcess(targets.length);

    const importResults: ImportResult[] = [];

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Your session has expired. Please log in again.");
      }

      for (let i = 0; i < targets.length; i++) {
        const student = targets[i];
        setCurrentImportName(student.fullName);

        try {
          const { data, error } = await supabase.functions.invoke("create-student-account", {
            body: {
              fullName: student.fullName,
              classYear: student.cohort,
              username: student.username,
              password: student.password,
              classId: student.classId || undefined,
            },
            headers: { Authorization: `Bearer ${session.access_token}` },
          });

          if (error) {
            const errMsg = await getEdgeFunctionError(error, "Failed to create account");
            importResults.push({
              rowId: student.rowId,
              fullName: student.fullName,
              username: student.username,
              password: student.password,
              cohort: student.cohort,
              classArm: student.classArmName,
              success: false,
              error: errMsg,
            });
          } else if (data?.error) {
            importResults.push({
              rowId: student.rowId,
              fullName: student.fullName,
              username: student.username,
              password: student.password,
              cohort: student.cohort,
              classArm: student.classArmName,
              success: false,
              error: data.error,
            });
          } else {
            // Account created! Backup check: ensure class_id is set if specified
            if (data?.student?.id && student.classId) {
              await supabase
                .from("students")
                .update({ class_id: student.classId })
                .eq("id", data.student.id);
            }

            importResults.push({
              rowId: student.rowId,
              fullName: student.fullName,
              username: student.username,
              password: student.password,
              cohort: student.cohort,
              classArm: student.classArmName,
              success: true,
            });
          }
        } catch (err: any) {
          importResults.push({
            rowId: student.rowId,
            fullName: student.fullName,
            username: student.username,
            password: student.password,
            cohort: student.cohort,
            classArm: student.classArmName,
            success: false,
            error: err.message || "Network error",
          });
        }

        setProgressCount(i + 1);
      }

      setResults(importResults);
      setStep("complete");
      const successTotal = importResults.filter((r) => r.success).length;
      toast.success(`Successfully imported ${successTotal} of ${targets.length} students!`);
      onSuccess?.();
    } catch (err: any) {
      console.error("Batch import error:", err);
      toast.error(err.message || "Bulk import failed");
      setStep("complete");
    } finally {
      setIsProcessing(false);
    }
  };

  // Download credentials export Excel (.xlsx)
  const handleExportExcelCredentials = () => {
    if (results.length === 0) return;

    const exportRows = results.map((r) => ({
      "Full Name": r.fullName,
      "Cohort": r.cohort === "year_6" ? "Year 6 (Primary 6)" : "Year 9 (JSS 3)",
      "Class Arm": r.classArm || "Unassigned",
      "Username": r.username,
      "Temporary Password": r.password,
      "Import Status": r.success ? "Success" : "Failed",
      "Error Note": r.error || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    worksheet["!cols"] = [
      { wch: 22 },
      { wch: 20 },
      { wch: 16 },
      { wch: 18 },
      { wch: 20 },
      { wch: 14 },
      { wch: 32 },
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Student Credentials");
    XLSX.writeFile(
      workbook,
      `eclat_imported_students_credentials_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
    toast.success("Excel (.xlsx) credentials exported!");
  };

  // Download credentials export CSV (.csv)
  const handleExportCsvCredentials = () => {
    if (results.length === 0) return;

    const exportRows = [
      ["Full Name", "Cohort", "Class Arm", "Username", "Temporary Password", "Import Status", "Error Note"],
      ...results.map((r) => [
        `"${r.fullName.replace(/"/g, '""')}"`,
        r.cohort === "year_6" ? "Year 6 (Primary 6)" : "Year 9 (JSS 3)",
        `"${(r.classArm || "Unassigned").replace(/"/g, '""')}"`,
        r.username,
        r.password,
        r.success ? "Success" : "Failed",
        `"${(r.error || "").replace(/"/g, '""')}"`,
      ]),
    ];

    const csvString = exportRows.map((e) => e.join(",")).join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `eclat_imported_students_credentials_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("CSV (.csv) credentials exported!");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="border-border bg-card text-foreground w-[95vw] sm:max-w-3xl max-h-[92vh] flex flex-col p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="border-b border-[#1f2b42] px-6 py-4 bg-[#0a1220]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/10 text-[#3bc2f3] border border-sky-500/20">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-white">
                  Bulk Student Roster Ingestion (Excel & CSV)
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Import hundreds of student accounts from Excel (.xlsx, .xls) or CSV files into your school roster.
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Dialog Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* STEP 1: UPLOAD & CONFIGURE */}
          {step === "upload" && (
            <div className="space-y-6">
              {/* Guidance Banner */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-sky-500/20 bg-sky-500/5 p-4 text-xs">
                <div className="flex items-start gap-2.5">
                  <Download className="h-4 w-4 text-[#3bc2f3] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-white">Need a spreadsheet template?</p>
                    <p className="text-muted-foreground text-[11px] mt-0.5">
                      Download our pre-configured template with required columns and sample learners.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDownloadExcelTemplate}
                    className="border-sky-500/40 text-[#71c9ed] hover:bg-sky-500/10 text-xs flex-shrink-0"
                  >
                    <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" />
                    Excel (.xlsx)
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDownloadCsvTemplate}
                    className="border-sky-500/40 text-[#71c9ed] hover:bg-sky-500/10 text-xs flex-shrink-0"
                  >
                    <FileText className="mr-1.5 h-3.5 w-3.5" />
                    CSV (.csv)
                  </Button>
                </div>
              </div>

              {/* Default Cohort & Class Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="default-cohort" className="text-xs text-muted-foreground">
                    Default Exam Cohort (if unspecified in spreadsheet)
                  </Label>
                  <select
                    id="default-cohort"
                    value={defaultCohort}
                    onChange={(e) => setDefaultCohort(e.target.value as any)}
                    className="h-9 w-full rounded-lg border border-[#34415b] bg-background px-3 text-xs text-white"
                  >
                    <option value="year_9">Year 9 (JSS 3 / BECE Candidates)</option>
                    <option value="year_6">Year 6 (Primary 6 / Common Entrance)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="default-class" className="text-xs text-muted-foreground">
                    Default Class Arm (optional fallback)
                  </Label>
                  <select
                    id="default-class"
                    value={defaultClassId}
                    onChange={(e) => setDefaultClassId(e.target.value)}
                    className="h-9 w-full rounded-lg border border-[#34415b] bg-background px-3 text-xs text-white"
                  >
                    <option value="none">Auto-match from spreadsheet "Class Arm" column</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} ({cls.level})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Toggle Input Mode */}
              <div className="flex items-center gap-2 border-b border-[#233148] pb-2 text-xs">
                <button
                  type="button"
                  onClick={() => setInputMode("file")}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                    inputMode === "file"
                      ? "bg-[#2184a7] text-white"
                      : "text-muted-foreground hover:text-white"
                  }`}
                >
                  Upload File (Excel / CSV)
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode("paste")}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                    inputMode === "paste"
                      ? "bg-[#2184a7] text-white"
                      : "text-muted-foreground hover:text-white"
                  }`}
                >
                  Paste CSV Data
                </button>
              </div>

              {/* Upload Dropzone */}
              {inputMode === "file" ? (
                <div
                  onClick={() => document.getElementById(fileInputId)?.click()}
                  className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#2f4060] bg-[#081222] p-8 sm:p-10 text-center cursor-pointer hover:border-[#3bc2f3] hover:bg-[#0c1a32] transition-all"
                >
                  <input
                    id={fileInputId}
                    type="file"
                    accept=".xlsx,.xls,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#162744] text-[#3bc2f3] mb-3">
                    <Upload className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-semibold text-white">Click or drag & drop an Excel (.xlsx, .xls) or CSV file here</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                    Supports Microsoft Excel workbooks, Google Sheets downloads, and CSV exports from School Information Systems.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <textarea
                    rows={8}
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder={`Full Name,Cohort,Class Arm,Username,Temporary Password\nAda Okafor,year_9,JSS 3A,ada.okafor,Pass123\nKwame Mensah,year_9,JSS 3B,kwame.m,Pass123`}
                    className="w-full rounded-xl border border-[#34415b] bg-background p-3 text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-[#3bc2f3]"
                  />
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      onClick={handlePasteSubmit}
                      className="bg-[#2184a7] text-white hover:bg-[#2c9bc2] text-xs"
                    >
                      Parse Pasted Data
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: PREVIEW & VALIDATE */}
          {step === "preview" && (
            <div className="space-y-4">
              {/* Summary Metrics */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#233148] bg-[#0a1220] p-3.5 text-xs">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-muted-foreground">Total:</span>{" "}
                    <span className="font-bold text-white">{parsedRows.length}</span>
                  </div>
                  <div>
                    <span className="text-emerald-400 font-semibold">Ready:</span>{" "}
                    <span className="font-bold text-emerald-300">{readyCount}</span>
                  </div>
                  {errorCount > 0 && (
                    <div>
                      <span className="text-red-400 font-semibold">Errors:</span>{" "}
                      <span className="font-bold text-red-300">{errorCount}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-[#3bc2f3] font-semibold">Selected:</span>{" "}
                    <span className="font-bold text-white">{selectedCount}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={selectAll}
                    className="h-7 px-2 text-[11px] text-muted-foreground hover:text-white"
                  >
                    Select All Ready
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={deselectAll}
                    className="h-7 px-2 text-[11px] text-muted-foreground hover:text-white"
                  >
                    Deselect All
                  </Button>
                </div>
              </div>

              {/* Filter tabs */}
              <div className="flex items-center gap-2 text-xs border-b border-[#1f2b42] pb-2">
                {[
                  { key: "all", label: `All (${parsedRows.length})` },
                  { key: "ready", label: `Ready (${readyCount})` },
                  { key: "errors", label: `Issues (${errorCount})` },
                ].map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setFilterMode(t.key as any)}
                    className={`px-3 py-1 rounded-md font-semibold text-xs transition-colors ${
                      filterMode === t.key
                        ? "bg-[#2184a7] text-white"
                        : "text-muted-foreground hover:text-white"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Table */}
              <div className="rounded-xl border border-[#233148] bg-background overflow-hidden max-h-[360px] overflow-y-auto">
                <div className="grid grid-cols-[40px_1.5fr_1fr_1.2fr_1fr_100px] border-b border-[#1f2b42] bg-card px-3 py-2 text-[11px] font-semibold text-muted-foreground sticky top-0 z-10">
                  <span>#</span>
                  <span>Student Name</span>
                  <span>Cohort</span>
                  <span>Username</span>
                  <span>Class Arm</span>
                  <span className="text-right">Status</span>
                </div>

                {filteredPreviewRows.length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted-foreground">
                    No rows match this filter.
                  </div>
                ) : (
                  filteredPreviewRows.map((r) => (
                    <div
                      key={r.rowId}
                      className={`grid grid-cols-[40px_1.5fr_1fr_1.2fr_1fr_100px] items-center border-b border-[#172236] px-3 py-2.5 text-xs transition-colors ${
                        r.status === "error"
                          ? "bg-red-500/5 hover:bg-red-500/10 text-red-200"
                          : "hover:bg-[#111e33] text-slate-200"
                      }`}
                    >
                      {/* Checkbox */}
                      <div>
                        <input
                          type="checkbox"
                          checked={r.selected}
                          disabled={r.status === "error"}
                          onChange={() => toggleRowSelect(r.rowId)}
                          className="h-4 w-4 rounded accent-sky-400 cursor-pointer disabled:opacity-40"
                        />
                      </div>

                      {/* Name */}
                      <div className="min-w-0 pr-2">
                        <p className="font-semibold text-white truncate">{r.fullName || "—"}</p>
                        {r.errors.length > 0 && (
                          <p className="text-[10px] text-red-400 mt-0.5 truncate">
                            {r.errors.join(", ")}
                          </p>
                        )}
                      </div>

                      {/* Cohort */}
                      <span className="text-[11px] text-muted-foreground truncate">
                        {r.cohort === "year_6" ? "Year 6" : "Year 9"}
                      </span>

                      {/* Username */}
                      <div className="min-w-0 pr-2 font-mono text-[11px] truncate">
                        <span className="text-[#7dd3fc]">@{r.username}</span>
                        {r.isAutoUsername && (
                          <span className="ml-1 text-[9px] text-muted-foreground font-sans">(auto)</span>
                        )}
                      </div>

                      {/* Class */}
                      <span className="text-[11px] text-muted-foreground truncate">
                        {r.classArmName || <span className="text-slate-500">Unassigned</span>}
                      </span>

                      {/* Status */}
                      <div className="flex justify-end">
                        {r.status === "ready" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 border border-emerald-500/20">
                            <Check className="h-3 w-3" /> Ready
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-300 border border-red-500/20">
                            <AlertCircle className="h-3 w-3" /> Error
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* STEP 3: PROGRESS */}
          {step === "progress" && (
            <div className="space-y-6 py-8 text-center max-w-md mx-auto">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-500/10 text-[#3bc2f3] mx-auto border border-sky-500/20 animate-pulse">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-white">Creating Student Accounts...</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Provisioning logins, setting up gamification vaults, and allocating class arms.
                </p>
              </div>

              <div className="space-y-2">
                <Progress
                  value={totalToProcess > 0 ? (progressCount / totalToProcess) * 100 : 0}
                  className="h-2.5 bg-[#17243c]"
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Processing: <span className="text-white font-medium">{currentImportName}</span></span>
                  <span>{progressCount} / {totalToProcess}</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: COMPLETE */}
          {step === "complete" && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 mx-auto mb-3 border border-emerald-500/20">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold text-white">Import Complete!</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                  Student accounts have been created and linked to your institutional roster.
                </p>

                <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-emerald-500/20 text-xs">
                  <div>
                    <span className="text-muted-foreground">Successfully Created:</span>{" "}
                    <span className="font-bold text-emerald-300 text-sm">
                      {results.filter((r) => r.success).length}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Failed / Errors:</span>{" "}
                    <span className="font-bold text-red-300 text-sm">
                      {results.filter((r) => !r.success).length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Credential Export CTA */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 text-xs">
                <div className="flex items-start gap-2.5">
                  <KeyRound className="h-4 w-4 text-[#3bc2f3] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-white">Distribute Student Logins</p>
                    <p className="text-muted-foreground text-[11px] mt-0.5">
                      Download a spreadsheet of all usernames and temporary passwords to print or share with parents and students.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    onClick={handleExportExcelCredentials}
                    className="bg-[#2184a7] text-white hover:bg-[#2c9bc2] text-xs font-semibold flex-shrink-0"
                  >
                    <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" />
                    Download Excel (.xlsx)
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleExportCsvCredentials}
                    className="border-sky-500/40 text-[#71c9ed] hover:bg-sky-500/10 text-xs font-semibold flex-shrink-0"
                  >
                    <FileText className="mr-1.5 h-3.5 w-3.5" />
                    Download CSV (.csv)
                  </Button>
                </div>
              </div>

              {/* Failures List if any */}
              {results.filter((r) => !r.success).length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-red-400">Failed Accounts:</p>
                  <div className="max-h-40 overflow-y-auto rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-xs space-y-1">
                    {results
                      .filter((r) => !r.success)
                      .map((r, i) => (
                        <div key={i} className="flex items-center justify-between text-muted-foreground">
                          <span className="font-medium text-white">{r.fullName} (@{r.username})</span>
                          <span className="text-red-400 text-[11px]">{r.error}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="border-t border-[#1f2b42] px-6 py-3.5 bg-[#0a1220] flex items-center justify-between">
          {step === "upload" && (
            <>
              <Button
                variant="outline"
                onClick={handleClose}
                className="border-[#34415b] text-muted-foreground hover:text-white"
              >
                Cancel
              </Button>
              <div />
            </>
          )}

          {step === "preview" && (
            <>
              <Button
                variant="outline"
                onClick={() => setStep("upload")}
                className="border-[#34415b] text-muted-foreground hover:text-white"
              >
                Back to Upload
              </Button>
              <Button
                onClick={handleExecuteImport}
                disabled={selectedCount === 0 || isProcessing}
                className="bg-[#3bc2f3] text-[#041c2d] hover:bg-[#6cd8ff] font-bold"
              >
                Import {selectedCount} Selected {selectedCount === 1 ? "Student" : "Students"}
              </Button>
            </>
          )}

          {step === "progress" && (
            <div className="w-full text-center text-xs text-muted-foreground italic">
              Please do not close this window while accounts are being created...
            </div>
          )}

          {step === "complete" && (
            <div className="w-full flex justify-end">
              <Button
                onClick={handleClose}
                className="bg-[#2184a7] text-white hover:bg-[#2c9bc2] font-semibold"
              >
                Done
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default SchoolBulkStudentDialog;
