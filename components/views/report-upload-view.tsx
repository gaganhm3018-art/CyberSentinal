"use client"

import { useState } from "react"
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  FileText,
  Loader2,
  Settings,
  Upload,
  UploadCloud,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAppState } from "@/components/app/app-state"

export function ReportUploadView() {
  const { navigate } = useAppState()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [analyzed, setAnalyzed] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setError(null)
    setAnalyzed(false)
    if (file) {
      const validTypes = [
        "application/pdf",
        "application/json",
        "text/csv",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/plain",
      ]
      const validExtensions = [".pdf", ".json", ".csv", ".xlsx", ".txt"]
      const hasValidExt = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext))

      if (!validTypes.includes(file.type) && !hasValidExt) {
        setError("Invalid file format. Please upload a PDF, JSON, CSV, XLSX, or TXT security report.")
        setSelectedFile(null)
        return
      }

      // Check max size 25MB
      if (file.size > 25 * 1024 * 1024) {
        setError("File is too large. Maximum file size is 25MB.")
        setSelectedFile(null)
        return
      }

      setSelectedFile(file)
    }
  }

  const handleAnalyze = () => {
    if (!selectedFile) {
      setError("Please select a security report file before submitting.")
      return
    }
    setError(null)
    setIsAnalyzing(true)

    setTimeout(() => {
      setIsAnalyzing(false)
      setAnalyzed(true)
    }, 1200)
  }

  return (
    <div className="flex min-h-svh w-full flex-col items-center justify-start p-4 md:p-8">
      <div className="w-full max-w-4xl space-y-6">
        {/* Top bar with Back button and Settings shortcut */}
        <div className="flex items-center justify-between border-b pb-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => navigate("landing")}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to Home
          </Button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-foreground">CyberSentinel AI</span>
            <span className="text-xs text-muted-foreground">· Security Report Analysis</span>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => navigate("settings")}
            className="text-xs text-muted-foreground hover:text-foreground"
            title="Settings"
          >
            <Settings className="size-4" />
          </Button>
        </div>

        {/* Header */}
        <div>
          <div className="flex items-center gap-2 text-primary font-semibold text-lg">
            <UploadCloud className="size-5" />
            <span>Security Report Upload & Analysis</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Upload automated vulnerability scan results, penetration test summaries, or compliance audit reports to extract findings.
          </p>
        </div>

        {/* Upload Card */}
        <Card className="border-primary/20 bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Select or Drop Document</CardTitle>
            <CardDescription className="text-xs">
              Supported formats: PDF, JSON, CSV, XLSX, TXT (Maximum 25MB).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border-2 border-dashed border-border bg-card/50 p-8 text-center transition-colors hover:border-primary/50">
              <input
                type="file"
                id="report-upload-input"
                className="hidden"
                onChange={handleFileChange}
                accept=".pdf,.json,.csv,.xlsx,.txt"
              />
              <label
                htmlFor="report-upload-input"
                className="flex flex-col items-center justify-center cursor-pointer gap-3"
              >
                <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Upload className="size-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    Click to select a security report or drag & drop
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Nessus, Qualys, Burp Suite, SOC 2, or raw scan exports
                  </p>
                </div>
              </label>

              {selectedFile && (
                <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-md border bg-muted/40 px-4 py-3 text-left">
                  <div className="flex items-center gap-3">
                    <FileText className="size-5 text-primary shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-foreground truncate max-w-xs sm:max-w-md">
                        {selectedFile.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground font-mono">
                        {(selectedFile.size / 1024).toFixed(1)} KB · {selectedFile.type || "Document"}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="shrink-0"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="mr-2 size-3.5 animate-spin" />
                        Analyzing Report…
                      </>
                    ) : (
                      "Analyze Report"
                    )}
                  </Button>
                </div>
              )}

              {error && (
                <div className="mt-4 flex items-center gap-2 text-xs text-destructive text-left rounded-md bg-destructive/10 p-2.5 border border-destructive/20">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Processed state banner with transition to Dashboard */}
        {analyzed && (
          <Card className="border-warning/30 bg-warning/5 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 text-warning">
                <AlertCircle className="size-5" />
                <CardTitle className="text-base">Document Ingestion Notice</CardTitle>
              </div>
              <CardDescription className="text-foreground font-medium">
                Document parsed: <span className="font-mono text-xs">{selectedFile?.name}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs leading-relaxed text-muted-foreground">
              <p>
                Security report parsing pipeline has cataloged the document findings. You can now explore the overall risk posture and itemized vulnerabilities directly in the dashboard.
              </p>
              <div className="pt-2 flex flex-wrap gap-3">
                <Button size="sm" onClick={() => navigate("overview")}>
                  Proceed to Executive Overview
                  <ArrowRight className="size-3.5 ml-1.5" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate("explorer")}>
                  View Asset & Vulnerability Explorer
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Accepted schemas footer */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold">Accepted Report Standards</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="rounded-md border p-2.5 bg-muted/20">
                <span className="font-medium text-foreground block mb-0.5 text-[11px]">Vulnerability Scanners</span>
                <p className="text-muted-foreground text-[10px]">Nessus XML/JSON, Qualys Guard, OpenVAS</p>
              </div>
              <div className="rounded-md border p-2.5 bg-muted/20">
                <span className="font-medium text-foreground block mb-0.5 text-[11px]">Audit Frameworks</span>
                <p className="text-muted-foreground text-[10px]">SOC 2, ISO 27001, CIS Benchmarks</p>
              </div>
              <div className="rounded-md border p-2.5 bg-muted/20">
                <span className="font-medium text-foreground block mb-0.5 text-[11px]">Cloud Posture</span>
                <p className="text-muted-foreground text-[10px]">AWS Security Hub, Defender, Prisma Cloud</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
