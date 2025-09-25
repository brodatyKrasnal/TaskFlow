"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BarChart3, Users, CheckCircle, Clock, AlertCircle, Target } from "lucide-react"
import type { Issue, Sprint } from "@/types"

interface ReportingViewProps {
  issues: Issue[]
  sprints: Sprint[]
}

interface DeveloperMetrics {
  assignee: string
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  todoTasks: number
  completionRate: number
  averageTaskDuration: number
  currentSprintTasks: number
  currentSprintCompleted: number
}

export function ReportingView({ issues, sprints }: ReportingViewProps) {
  // Get unique assignees
  const assignees = Array.from(new Set(issues.map(issue => issue.assignee)))
  
  // Calculate metrics for each developer
  const developerMetrics: DeveloperMetrics[] = assignees.map(assignee => {
    const developerIssues = issues.filter(issue => issue.assignee === assignee)
    const completedTasks = developerIssues.filter(issue => issue.status === "Done").length
    const inProgressTasks = developerIssues.filter(issue => issue.status === "In Progress").length
    const todoTasks = developerIssues.filter(issue => issue.status === "Todo").length
    const totalTasks = developerIssues.length
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
    
    // Calculate average task duration (simplified - using days since creation)
    const now = new Date()
    const totalDuration = developerIssues.reduce((sum, issue) => {
      const created = new Date(issue.createdAt)
      const updated = issue.status === "Done" ? new Date(issue.updatedAt) : now
      return sum + (updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
    }, 0)
    const averageTaskDuration = totalTasks > 0 ? totalDuration / totalTasks : 0
    
    // Current sprint tasks
    const activeSprint = sprints.find(sprint => sprint.status === "Active")
    const currentSprintTasks = activeSprint ? 
      developerIssues.filter(issue => issue.sprintId === activeSprint.id).length : 0
    const currentSprintCompleted = activeSprint ? 
      developerIssues.filter(issue => issue.sprintId === activeSprint.id && issue.status === "Done").length : 0
    
    return {
      assignee,
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks,
      completionRate,
      averageTaskDuration,
      currentSprintTasks,
      currentSprintCompleted
    }
  })

  // Sort by completion rate (highest first)
  const sortedMetrics = developerMetrics.sort((a, b) => b.completionRate - a.completionRate)

  // Overall team metrics
  const totalIssues = issues.length
  const totalCompleted = issues.filter(issue => issue.status === "Done").length
  const totalInProgress = issues.filter(issue => issue.status === "In Progress").length
  const teamCompletionRate = totalIssues > 0 ? (totalCompleted / totalIssues) * 100 : 0

  const getCompletionRateColor = (rate: number) => {
    if (rate >= 80) return "text-green-600"
    if (rate >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getCompletionRateBadge = (rate: number) => {
    if (rate >= 80) return "bg-green-100 text-green-800 border-green-200"
    if (rate >= 60) return "bg-yellow-100 text-yellow-800 border-yellow-200"
    return "bg-red-100 text-red-800 border-red-200"
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Developer Utilization Report</h1>
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Team Performance</span>
        </div>
      </div>

      {/* Team Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Developers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignees.length}</div>
            <p className="text-xs text-muted-foreground">Active team members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Total Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalIssues}</div>
            <p className="text-xs text-muted-foreground">Across all sprints</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalCompleted}</div>
            <p className="text-xs text-muted-foreground">{teamCompletionRate.toFixed(1)}% completion rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalInProgress}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>
      </div>

      {/* Team Progress Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Team Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Completion</span>
              <span className="font-medium">{teamCompletionRate.toFixed(1)}%</span>
            </div>
            <Progress value={teamCompletionRate} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{totalCompleted} completed</span>
              <span>{totalIssues - totalCompleted} remaining</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Developer Metrics */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Developer Performance</h2>
        
        <div className="grid gap-4">
          {sortedMetrics.map((metrics) => (
            <Card key={metrics.assignee} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">{metrics.assignee}</h3>
                      <p className="text-sm text-muted-foreground">
                        {metrics.totalTasks} total tasks
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge className={getCompletionRateBadge(metrics.completionRate)} variant="outline">
                      {metrics.completionRate.toFixed(1)}% complete
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Completion Rate</span>
                      <span className={`font-medium ${getCompletionRateColor(metrics.completionRate)}`}>
                        {metrics.completionRate.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={metrics.completionRate} className="h-2" />
                  </div>

                  {/* Task Breakdown */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-green-600">{metrics.completedTasks}</div>
                      <div className="text-xs text-muted-foreground">Completed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-blue-600">{metrics.inProgressTasks}</div>
                      <div className="text-xs text-muted-foreground">In Progress</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-600">{metrics.todoTasks}</div>
                      <div className="text-xs text-muted-foreground">Todo</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-purple-600">{metrics.currentSprintTasks}</div>
                      <div className="text-xs text-muted-foreground">Current Sprint</div>
                    </div>
                  </div>

                  {/* Additional Metrics */}
                  <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t">
                    <span>Avg. task duration: {metrics.averageTaskDuration.toFixed(1)} days</span>
                    {metrics.currentSprintTasks > 0 && (
                      <span>
                        Sprint progress: {metrics.currentSprintCompleted}/{metrics.currentSprintTasks}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {assignees.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
            <Users className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">No Developer Data</h3>
          <p className="text-muted-foreground">Create some issues and assign them to developers to see utilization metrics.</p>
        </div>
      )}
    </div>
  )
}

