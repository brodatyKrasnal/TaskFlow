"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { MoveRight, ArrowUpDown } from "lucide-react"
import type { Issue, Sprint } from "@/types"

interface IssueAssignmentDialogProps {
  issue: Issue
  sprints: Sprint[]
  onAssign: (issueId: string, sprintId: string | undefined) => void
  trigger?: React.ReactNode
}

export function IssueAssignmentDialog({ issue, sprints, onAssign, trigger }: IssueAssignmentDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedSprintId, setSelectedSprintId] = useState<string>(issue.sprintId || "backlog")

  const currentSprint = sprints.find((s) => s.id === issue.sprintId)
  const targetSprint = selectedSprintId === "backlog" ? null : sprints.find((s) => s.id === selectedSprintId)

  const handleAssign = () => {
    const newSprintId = selectedSprintId === "backlog" ? undefined : selectedSprintId
    onAssign(issue.id, newSprintId)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <ArrowUpDown className="h-4 w-4 mr-2" />
            Assign to Sprint
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign Issue to Sprint</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Issue</h4>
            <div className="p-3 border rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono text-muted-foreground">{issue.id}</span>
                <Badge variant="secondary" className="text-xs">
                  {issue.priority}
                </Badge>
              </div>
              <p className="font-medium text-sm">{issue.title}</p>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">From</p>
                <Badge variant="outline" className="text-xs">
                  {currentSprint ? currentSprint.name : "Backlog"}
                </Badge>
              </div>
              <MoveRight className="h-4 w-4 text-muted-foreground" />
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">To</p>
                <Badge variant="outline" className="text-xs">
                  {targetSprint ? targetSprint.name : "Backlog"}
                </Badge>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="sprint-select" className="text-sm font-medium">
              Select Target Sprint
            </label>
            <Select value={selectedSprintId} onValueChange={setSelectedSprintId}>
              <SelectTrigger>
                <SelectValue placeholder="Select sprint" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="backlog">Backlog (No Sprint)</SelectItem>
                {sprints.map((sprint) => (
                  <SelectItem key={sprint.id} value={sprint.id}>
                    {sprint.name} ({sprint.status})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssign} disabled={selectedSprintId === (issue.sprintId || "backlog")}>
              Assign Issue
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
