"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Edit, Play, Square, Calendar } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { SprintForm } from "./sprint-form"
import type { Sprint, Issue } from "@/types"

interface SprintCardProps {
  sprint: Sprint
  issues: Issue[]
  onEdit: (sprint: Sprint) => void
  onStart: (sprintId: string) => void
  onEnd: (sprintId: string) => void
  canStart: boolean
}

export function SprintCard({ sprint, issues, onEdit, onStart, onEnd, canStart }: SprintCardProps) {
  const sprintIssues = issues.filter((issue) => issue.sprintId === sprint.id)
  const completedIssues = sprintIssues.filter((issue) => issue.status === "Done")

  const getStatusColor = () => {
    switch (sprint.status) {
      case "Active":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "Completed":
        return "bg-green-100 text-green-800 border-green-200"
      case "Planned":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const getSprintProgress = (sprint: Sprint) => {
    const now = new Date()
    const start = new Date(sprint.startDate)
    const end = new Date(sprint.endDate)
    
    // If sprint hasn't started yet
    if (now < start) return 0
    
    // If sprint has ended
    if (now > end) return 100
    
    // Calculate progress percentage
    const totalDuration = end.getTime() - start.getTime()
    const elapsed = now.getTime() - start.getTime()
    const progress = (elapsed / totalDuration) * 100
    
    return Math.min(Math.max(progress, 0), 100)
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-medium">{sprint.name}</h3>
              <Badge className={getStatusColor()} variant="outline">
                {sprint.status}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {formatDate(sprint.startDate)} - {formatDate(sprint.endDate)}
              </span>
            </div>
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>Sprint Progress</span>
                <span>{Math.round(getSprintProgress(sprint))}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    sprint.status === "Completed" 
                      ? "bg-green-500" 
                      : sprint.status === "Active" 
                      ? "bg-orange-500" 
                      : "bg-blue-500"
                  }`}
                  style={{
                    width: `${getSprintProgress(sprint)}%`,
                  }}
                />
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <SprintForm
                sprint={sprint}
                onSubmit={onEdit}
                trigger={
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                }
              />
              {sprint.status === "Planned" && (
                <DropdownMenuItem onClick={() => onStart(sprint.id)} disabled={!canStart}>
                  <Play className="h-4 w-4 mr-2" />
                  Start Sprint
                </DropdownMenuItem>
              )}
              {sprint.status === "Active" && (
                <DropdownMenuItem onClick={() => onEnd(sprint.id)}>
                  <Square className="h-4 w-4 mr-2" />
                  End Sprint
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Issues</span>
            <span className="font-medium">
              {completedIssues.length} / {sprintIssues.length} completed
            </span>
          </div>
          {sprintIssues.length > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${(completedIssues.length / sprintIssues.length) * 100}%`,
                }}
              />
            </div>
          )}
          <div className="text-xs text-muted-foreground">
            {sprintIssues.length === 0 ? "No issues assigned" : `${sprintIssues.length} issues in this sprint`}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
