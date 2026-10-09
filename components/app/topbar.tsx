"use client"

import { useState } from "react"
import { Bell, FlaskConical, Loader2, Menu, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { formatDateTime } from "@/lib/format"
import { useAppState } from "./app-state"
import { NAV_ITEMS } from "./nav-config"
import { Logo, SidebarNav } from "./sidebar"
import { ActivityList } from "./activity-list"

export function Topbar() {
  const { view, assessment, isAssessing, isStale, runAssessment, unread, markRead, activity, navigate } = useAppState()
  const [menuOpen, setMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const item = NAV_ITEMS.find((n) => n.id === view) ?? NAV_ITEMS[0]

  return (
    <>
      <div className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:px-6">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setMenuOpen(true)}
          aria-label="Open navigation"
        >
          <Menu />
        </Button>
        <div className="lg:hidden">
          <Logo />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-md border border-dashed border-warning/40 px-2 py-1 text-xs text-warning sm:inline-flex">
            <FlaskConical className="size-3.5" aria-hidden="true" />
            Simulated environment
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => {
              setNotifOpen(true)
              markRead()
            }}
            aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
          >
            <Bell />
            {unread > 0 ? (
              <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-destructive font-mono text-[10px] font-semibold text-white">
                {unread > 9 ? "9+" : unread}
              </span>
            ) : null}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-b px-4 py-4 sm:flex-row sm:items-end sm:justify-between lg:px-6">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold tracking-tight text-foreground text-balance">{item.title}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground text-pretty">{item.description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-xs leading-tight text-muted-foreground" aria-live="polite">
            <span className="block">Last evaluation</span>
            <span className="font-mono text-foreground">{formatDateTime(assessment.evaluatedAt)}</span>
            {isStale ? <span className="block text-warning">Data changed — re-run needed</span> : null}
          </div>
          <Button onClick={runAssessment} disabled={isAssessing} size="lg">
            {isAssessing ? <Loader2 className="animate-spin" aria-hidden="true" /> : <RefreshCw aria-hidden="true" />}
            {isAssessing ? "Assessing…" : "Run Risk Assessment"}
          </Button>
        </div>
      </div>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-72 bg-sidebar p-0">
          <SheetHeader className="border-b">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <SheetDescription className="sr-only">Switch between application views</SheetDescription>
            <Logo />
          </SheetHeader>
          <div className="p-3">
            <SidebarNav onNavigate={() => setMenuOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={notifOpen} onOpenChange={setNotifOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader className="border-b">
            <SheetTitle>Notifications</SheetTitle>
            <SheetDescription>Recent simulated events and assessments.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4">
            <ActivityList events={activity.slice(0, 8)} compact />
          </div>
          <div className="border-t p-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setNotifOpen(false)
                navigate("activity")
              }}
            >
              View full activity log
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
