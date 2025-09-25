"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { List, Kanban, Calendar, Target, BarChart3, BarChart } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ViewType, Issue, Sprint } from "@/types"

interface NavigationProps {
  currentView: ViewType
  onViewChange: (view: ViewType) => void
  issues: Issue[]
  sprints: Sprint[]
}

export function Navigation({ currentView, onViewChange, issues, sprints }: NavigationProps) {
  const activeSprint = sprints.find((sprint) => sprint.status === "Active")
  const activeSprintIssues = issues.filter((issue) => issue.sprintId === activeSprint?.id)

  const navItems = [
    {
      id: "current-sprint" as ViewType,
      label: "Current Sprint",
      icon: Kanban,
      count: activeSprintIssues.length,
      disabled: !activeSprint,
    },
    {
      id: "timeline" as ViewType,
      label: "Timeline",
      icon: BarChart,
      count: issues.filter(issue => issue.startDate || issue.deliveryDate).length,
    },
    {
      id: "issues" as ViewType,
      label: "Issues",
      icon: List,
      count: issues.length,
    },
    {
      id: "sprints" as ViewType,
      label: "Sprints",
      icon: Calendar,
      count: sprints.length,
    },
    {
      id: "reporting" as ViewType,
      label: "Reporting",
      icon: BarChart3,
      count: new Set(issues.map(issue => issue.assignee)).size,
    },
  ]

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-xl shadow-sm supports-[backdrop-filter]:bg-white/90">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <Target className="w-8 h-8 text-primary" />
              <h1 className="text-xl font-semibold">Tymek FlowChart</h1>
            </div>

            <div className="flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = currentView === item.id
                const isDisabled = item.disabled

                return (
                  <Button
                    key={item.id}
                    variant={isActive ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => !isDisabled && onViewChange(item.id)}
                    disabled={isDisabled}
                    className={cn(
                      "flex items-center gap-2",
                      isActive && "bg-secondary text-secondary-foreground",
                      isDisabled && "opacity-50 cursor-not-allowed",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                    <Badge variant="outline" className="ml-1 text-xs">
                      {item.count}
                    </Badge>
                  </Button>
                )
              })}
            </div>
          </div>

          {!activeSprint && currentView === "current-sprint" && (
            <div className="text-sm text-muted-foreground">No active sprint</div>
          )}
        </div>
      </div>
    </nav>
  )
}
