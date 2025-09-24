"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Users, Target } from "lucide-react"
import { KanbanBoard } from "./kanban-board"
import type { Issue, Sprint, IssueStatus } from "@/types"

interface CurrentSprintViewProps {
  sprint: Sprint | null
  issues: Issue[]
  onUpdateIssueStatus: (issueId: string, newStatus: IssueStatus) => void
}

export function CurrentSprintView({ sprint, issues, onUpdateIssueStatus }: CurrentSprintViewProps) {
  if (!sprint) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Current Sprint</h1>
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
            <Target className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">No Active Sprint</h3>
          <p className="text-muted-foreground">Start a sprint from the Sprints view to see the kanban board here.</p>
        </div>
      </div>
    )
  }

  const sprintIssues = issues.filter((issue) => issue.sprintId === sprint.id)
  const completedIssues = sprintIssues.filter((issue) => issue.status === "Done")
  const inProgressIssues = sprintIssues.filter((issue) => issue.status === "In Progress")
  const inReviewIssues = sprintIssues.filter((issue) => issue.status === "In Review")

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const getDaysRemaining = () => {
    const today = new Date()
    const endDate = new Date(sprint.endDate)
    const diffTime = endDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getPolishHolidays = (year: number) => {
    return [
      new Date(year, 0, 1),   // New Year's Day
      new Date(year, 0, 6),   // Epiphany
      new Date(year, 4, 1),   // Labour Day
      new Date(year, 4, 3),   // Constitution Day
      new Date(year, 5, 7),   // Pentecost (calculated for 2024)
      new Date(year, 7, 15),  // Assumption of the Blessed Virgin Mary
      new Date(year, 10, 1),  // All Saints' Day
      new Date(year, 10, 11), // Independence Day
      new Date(year, 11, 25), // Christmas Day
      new Date(year, 11, 26), // Boxing Day
    ]
  }

  const getWorkingDays = (startDate: Date, endDate: Date) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    let workingDays = 0
    const current = new Date(start)
    
    // Get holidays for the year range
    const holidays = []
    for (let year = start.getFullYear(); year <= end.getFullYear(); year++) {
      holidays.push(...getPolishHolidays(year))
    }
    
    while (current <= end) {
      const dayOfWeek = current.getDay()
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6 // Sunday or Saturday
      const isHoliday = holidays.some(holiday => 
        holiday.getDate() === current.getDate() && 
        holiday.getMonth() === current.getMonth() && 
        holiday.getFullYear() === current.getFullYear()
      )
      
      if (!isWeekend && !isHoliday) {
        workingDays++
      }
      
      current.setDate(current.getDate() + 1)
    }
    
    return workingDays
  }

  const getSprintProgress = (sprint: Sprint) => {
    const now = new Date()
    const start = new Date(sprint.startDate)
    const end = new Date(sprint.endDate)
    
    // If sprint hasn't started yet
    if (now < start) return 0
    
    // If sprint has ended
    if (now > end) return 100
    
    // Calculate working days progress
    const totalWorkingDays = getWorkingDays(start, end)
    const elapsedWorkingDays = getWorkingDays(start, now)
    const progress = (elapsedWorkingDays / totalWorkingDays) * 100
    
    return Math.min(Math.max(progress, 0), 100)
  }

  const daysRemaining = getDaysRemaining()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Current Sprint</h1>
        <Badge className="bg-green-100 text-green-800 border-green-200" variant="outline">
          Active
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            {sprint.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" style={{ marginTop: '7px' }} />
              <div>
                <p className="text-sm font-medium">Duration</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(sprint.startDate)} - {formatDate(sprint.endDate)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-muted-foreground" style={{ marginTop: '7px' }} />
              <div className="flex-1">
                <p className="text-sm font-medium">Progress</p>
                {sprintIssues.length > 0 ? (
                  <div style={{ marginTop: '-15px' }}>
                    <div className="flex items-center justify-end text-xs text-muted-foreground mb-1">
                      <span>{Math.round((completedIssues.length / sprintIssues.length) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
                        style={{
                          width: `${(completedIssues.length / sprintIssues.length) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No tasks assigned</p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Target className="h-5 w-5 text-muted-foreground" style={{ marginTop: '7px' }} />
              <div className="flex-1">
                <p className="text-sm font-medium">Sprint Progress</p>
                <div style={{ marginTop: '-15px' }}>
                  <div className="flex items-center justify-end text-xs text-muted-foreground mb-1">
                    <span>{Math.max(0, Math.ceil((new Date(sprint.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))} days left</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-orange-500 h-1.5 rounded-full transition-all duration-300"
                      style={{
                        width: `${getSprintProgress(sprint)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>


        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {sprintIssues.filter((i) => i.status === "Todo").length}
              </div>
              <div className="text-sm text-muted-foreground">Todo</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{inProgressIssues.length}</div>
              <div className="text-sm text-muted-foreground">In Progress</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{inReviewIssues.length}</div>
              <div className="text-sm text-muted-foreground">In Review</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{completedIssues.length}</div>
              <div className="text-sm text-muted-foreground">Done</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <KanbanBoard sprint={sprint} issues={issues} onUpdateIssueStatus={onUpdateIssueStatus} />
    </div>
  )
}
