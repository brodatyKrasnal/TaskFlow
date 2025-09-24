"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import type { Issue, Priority, IssueStatus, Sprint } from "@/types"

interface IssueFormProps {
  issue?: Issue
  sprints: Sprint[]
  onSubmit: (issueData: Partial<Issue>) => void
  trigger?: React.ReactNode
}

export function IssueForm({ issue, sprints, onSubmit, trigger }: IssueFormProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: issue?.title || "",
    description: issue?.description || "",
    priority: issue?.priority || ("P3" as Priority),
    status: issue?.status || ("Todo" as IssueStatus),
    assignee: issue?.assignee || "",
    sprintId: issue?.sprintId || "0", // Updated default value to be a non-empty string
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = "Title is required"
    }
    if (!formData.assignee.trim()) {
      newErrors.assignee = "Assignee is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    onSubmit({
      ...formData,
      sprintId: formData.sprintId === "0" ? undefined : formData.sprintId, // Handle the non-empty default value
    })

    setOpen(false)
    if (!issue) {
      // Reset form for new issues
      setFormData({
        title: "",
        description: "",
        priority: "P3",
        status: "Todo",
        assignee: "",
        sprintId: "0", // Reset to non-empty default value
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || <Button>Create Issue</Button>}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{issue ? "Edit Issue" : "Create New Issue"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter issue title"
              className={errors.title ? "border-red-500" : ""}
            />
            {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter issue description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: Priority) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="P0">P0 - Critical</SelectItem>
                  <SelectItem value="P1">P1 - High</SelectItem>
                  <SelectItem value="P2">P2 - Medium</SelectItem>
                  <SelectItem value="P3">P3 - Normal</SelectItem>
                  <SelectItem value="P4">P4 - Low</SelectItem>
                  <SelectItem value="P5">P5 - Lowest</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: IssueStatus) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todo">Todo</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="In Review">In Review</SelectItem>
                  <SelectItem value="Done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assignee">Assignee</Label>
            <Input
              id="assignee"
              value={formData.assignee}
              onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
              placeholder="Enter assignee name"
              className={errors.assignee ? "border-red-500" : ""}
            />
            {errors.assignee && <p className="text-sm text-red-500">{errors.assignee}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="sprint">Sprint (Optional)</Label>
            <Select value={formData.sprintId} onValueChange={(value) => setFormData({ ...formData, sprintId: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select sprint" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">No Sprint (Backlog)</SelectItem>{" "}
                {/* Updated value prop to be a non-empty string */}
                {sprints.map((sprint) => (
                  <SelectItem key={sprint.id} value={sprint.id}>
                    {sprint.name} ({sprint.status})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">{issue ? "Update Issue" : "Create Issue"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
