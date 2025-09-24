"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { IssueCard } from "./issue-card"
import { IssueForm } from "./issue-form"
import { Search, Plus, ChevronDown, ChevronRight, ArrowUpDown } from "lucide-react"
import type { Issue, Sprint, Priority, IssueStatus } from "@/types"

interface IssuesListProps {
  issues: Issue[]
  sprints: Sprint[]
  onCreateIssue: (issueData: Partial<Issue>) => void
  onEditIssue: (issue: Issue) => void
  onDeleteIssue: (issueId: string) => void
  onAssignToSprint: (issueId: string, sprintId: string | undefined) => void
}

export function IssuesList({
  issues,
  sprints,
  onCreateIssue,
  onEditIssue,
  onDeleteIssue,
  onAssignToSprint,
}: IssuesListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [priorityFilter, setPriorityFilter] = useState<Priority | "all">("all")
  const [statusFilter, setStatusFilter] = useState<IssueStatus | "all">("all")
  const [sprintFilter, setSprintFilter] = useState<string>("all")
  const [showDoneIssues, setShowDoneIssues] = useState(false)
  const [sortBy, setSortBy] = useState<"none" | "sprint" | "status">("none")

  const allFilteredIssues = issues.filter((issue) => {
    const matchesSearch =
      issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.assignee.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesPriority = priorityFilter === "all" || issue.priority === priorityFilter
    const matchesStatus = statusFilter === "all" || issue.status === statusFilter
    const matchesSprint =
      sprintFilter === "all" || (sprintFilter === "backlog" && !issue.sprintId) || issue.sprintId === sprintFilter

    return matchesSearch && matchesPriority && matchesStatus && matchesSprint
  })

  // Apply sorting
  const sortedIssues = [...allFilteredIssues].sort((a, b) => {
    if (sortBy === "sprint") {
      const aSprint = sprints.find(s => s.id === a.sprintId)
      const bSprint = sprints.find(s => s.id === b.sprintId)
      
      // Issues without sprint go to the end
      if (!aSprint && !bSprint) return 0
      if (!aSprint) return 1
      if (!bSprint) return -1
      
      // Sort by sprint start date (earliest first)
      return new Date(aSprint.startDate).getTime() - new Date(bSprint.startDate).getTime()
    }
    
    if (sortBy === "status") {
      const statusOrder = { "Todo": 0, "In Progress": 1, "In Review": 2, "Done": 3 }
      return statusOrder[a.status] - statusOrder[b.status]
    }
    
    return 0 // No sorting
  })

  const activeIssues = sortedIssues.filter((issue) => issue.status !== "Done")
  const doneIssues = sortedIssues.filter((issue) => issue.status === "Done")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Issues</h1>
        <IssueForm
          sprints={sprints}
          onSubmit={onCreateIssue}
          trigger={
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Issue
            </Button>
          }
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search issues..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500">Priority:</span>
            <Select value={priorityFilter} onValueChange={(value: Priority | "all") => setPriorityFilter(value)}>
              <SelectTrigger className="h-8 px-3 text-xs border-0 rounded-md bg-transparent hover:bg-gray-50/50 focus:ring-0 focus:ring-offset-0 outline-none">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="P0">P0</SelectItem>
                <SelectItem value="P1">P1</SelectItem>
                <SelectItem value="P2">P2</SelectItem>
                <SelectItem value="P3">P3</SelectItem>
                <SelectItem value="P4">P4</SelectItem>
                <SelectItem value="P5">P5</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500">Status:</span>
            <Select value={statusFilter} onValueChange={(value: IssueStatus | "all") => setStatusFilter(value)}>
              <SelectTrigger className="h-8 px-3 text-xs border-0 rounded-md bg-transparent hover:bg-gray-50/50 focus:ring-0 focus:ring-offset-0 outline-none">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="Todo">Todo</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="In Review">In Review</SelectItem>
                <SelectItem value="Done">Done</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500">Sprint:</span>
            <Select value={sprintFilter} onValueChange={setSprintFilter}>
              <SelectTrigger className="h-8 px-3 text-xs border-0 rounded-md bg-transparent hover:bg-gray-50/50 focus:ring-0 focus:ring-offset-0 outline-none">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="backlog">Backlog</SelectItem>
                {sprints.map((sprint) => (
                  <SelectItem key={sprint.id} value={sprint.id}>
                    {sprint.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500">Sort:</span>
            <Select value={sortBy} onValueChange={(value: "none" | "sprint" | "status") => setSortBy(value)}>
              <SelectTrigger className="h-8 px-3 text-xs border-0 rounded-md bg-transparent hover:bg-gray-50/50 focus:ring-0 focus:ring-offset-0 outline-none">
                <div className="flex items-center gap-1">
                  <ArrowUpDown className="h-3 w-3 text-gray-400" />
                  <SelectValue placeholder="None" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="sprint">By Sprint</SelectItem>
                <SelectItem value="status">By Status</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        Showing {activeIssues.length} active issues{doneIssues.length > 0 && `, ${doneIssues.length} completed`} of {issues.length} total
      </div>

      {/* Active Issues */}
      <div className="grid gap-4 grid-cols-1">
        {activeIssues.map((issue) => (
          <IssueCard
            key={issue.id}
            issue={issue}
            sprints={sprints}
            onEdit={onEditIssue}
            onDelete={onDeleteIssue}
            onAssignToSprint={onAssignToSprint}
          />
        ))}
      </div>

      {/* Collapsible Done Issues */}
      {doneIssues.length > 0 && (
        <Collapsible open={showDoneIssues} onOpenChange={setShowDoneIssues}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <span>Completed Issues ({doneIssues.length})</span>
              {showDoneIssues ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 mt-4">
            <div className="grid gap-4 grid-cols-1">
              {doneIssues.map((issue) => (
                <IssueCard
                  key={issue.id}
                  issue={issue}
                  sprints={sprints}
                  onEdit={onEditIssue}
                  onDelete={onDeleteIssue}
                  onAssignToSprint={onAssignToSprint}
                />
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {activeIssues.length === 0 && doneIssues.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No issues found matching your filters.</p>
        </div>
      )}
    </div>
  )
}
