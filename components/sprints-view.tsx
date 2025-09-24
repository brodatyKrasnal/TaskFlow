"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SprintForm } from "./sprint-form"
import { Plus, MoreHorizontal, Edit, Play, Square, Calendar } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { Sprint, Issue } from "@/types"

interface SprintsViewProps {
  sprints: Sprint[]
  issues: Issue[]
  onCreateSprint: (sprintData: Partial<Sprint>) => void
  onEditSprint: (sprint: Sprint) => void
  onStartSprint: (sprintId: string) => void
  onEndSprint: (sprintId: string) => void
}

export function SprintsView({
  sprints,
  issues,
  onCreateSprint,
  onEditSprint,
  onStartSprint,
  onEndSprint,
}: SprintsViewProps) {
  const hasActiveSprint = sprints.some((sprint) => sprint.status === "Active")

  const getStatusColor = (status: string) => {
    switch (status) {
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
    
    // Calculate working days progress
    const totalWorkingDays = getWorkingDays(start, end)
    const elapsedWorkingDays = getWorkingDays(start, now)
    const progress = (elapsedWorkingDays / totalWorkingDays) * 100
    
    return Math.min(Math.max(progress, 0), 100)
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

  // Sort sprints by start date (chronological order)
  const sortedSprints = [...sprints].sort((a, b) => {
    return new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Sprints</h1>
        <SprintForm
          onSubmit={onCreateSprint}
          trigger={
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Sprint
            </Button>
          }
        />
      </div>


      <div className="space-y-3">
        {sortedSprints.map((sprint) => {
          const sprintIssues = issues.filter((issue) => issue.sprintId === sprint.id)
          const completedIssues = sprintIssues.filter((issue) => issue.status === "Done")
          const inProgressIssues = sprintIssues.filter((issue) => issue.status === "In Progress")
          const todoIssues = sprintIssues.filter((issue) => issue.status === "Todo")
          
          return (
            <div key={sprint.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow relative">
              <div className="flex items-start justify-between">
                {/* Left side - Sprint Information (70% width) */}
                <div className="flex-1 w-[70%] pr-6 border-r border-gray-200">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-3">
                      <h3 className="font-medium text-lg">{sprint.name}</h3>
                      <Badge className={getStatusColor(sprint.status)} variant="outline">
                        {sprint.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {formatDate(sprint.startDate)} - {formatDate(sprint.endDate)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Progress bars in the left area */}
                  <div className="mt-3 space-y-2">
                    {sprintIssues.length > 0 && (
                      <>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Task Completion</span>
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
                      </>
                    )}
                    
                     <div className="flex items-center justify-between text-xs text-muted-foreground">
                       <span>Sprint Progress</span>
                       <span>
                         {sprint.status === "Planned" 
                           ? `${getWorkingDays(sprint.startDate, sprint.endDate)} days`
                           : sprint.status === "Active"
                           ? `${Math.max(0, Math.ceil((new Date(sprint.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))} days left`
                           : "0 days"
                         }
                       </span>
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
                
                    {/* Right side - Sprint Stats and Actions (30% width) */}
                    <div className="w-[30%] pl-6 flex flex-col h-full relative">
                      {/* Working Days Information - At the top */}
                      <div className="text-left">
                        <div className="text-sm text-muted-foreground">
                          {getWorkingDays(sprint.startDate, sprint.endDate)} working days
                        </div>
                      </div>
                      
                      {/* Sprint Stats - Below working days */}
                      <div className="mt-4">
                        <div className="flex items-center space-x-4">
                          <div className="text-center">
                            <div className="font-semibold text-lg">{sprintIssues.length}</div>
                            <div className="text-xs text-muted-foreground">Total</div>
                          </div>
                          
                          <div className="text-center">
                            <div className="font-semibold text-lg text-green-600">{completedIssues.length}</div>
                            <div className="text-xs text-muted-foreground">Done</div>
                          </div>
                          
                          <div className="text-center">
                            <div className="font-semibold text-lg text-blue-600">{inProgressIssues.length}</div>
                            <div className="text-xs text-muted-foreground">Active</div>
                          </div>
                          
                          <div className="text-center">
                            <div className="font-semibold text-lg text-gray-600">{todoIssues.length}</div>
                            <div className="text-xs text-muted-foreground">Todo</div>
                          </div>
                        </div>
                      </div>
                  
                  {/* Actions - Positioned absolutely on the top right of 30% area with 10px margin */}
                  <div className="absolute top-2.5 right-2.5">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <SprintForm
                          sprint={sprint}
                          onSubmit={onEditSprint}
                          trigger={
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                          }
                        />
                        {sprint.status === "Planned" && (
                          <DropdownMenuItem onClick={() => onStartSprint(sprint.id)} disabled={hasActiveSprint}>
                            <Play className="h-4 w-4 mr-2" />
                            Start Sprint
                          </DropdownMenuItem>
                        )}
                        {sprint.status === "Active" && (
                          <DropdownMenuItem onClick={() => onEndSprint(sprint.id)}>
                            <Square className="h-4 w-4 mr-2" />
                            End Sprint
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {sprints.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No sprints created yet. Create your first sprint to get started.</p>
        </div>
      )}
    </div>
  )
}
