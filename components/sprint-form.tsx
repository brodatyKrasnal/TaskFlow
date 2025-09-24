"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import type { Sprint } from "@/types"

interface SprintFormProps {
  sprint?: Sprint
  onSubmit: (sprintData: Partial<Sprint>) => void
  trigger?: React.ReactNode
}

export function SprintForm({ sprint, onSubmit, trigger }: SprintFormProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: sprint?.name || "",
    startDate: sprint?.startDate ? sprint.startDate.toISOString().split("T")[0] : "",
    endDate: sprint?.endDate ? sprint.endDate.toISOString().split("T")[0] : "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Sprint name is required"
    }
    if (!formData.startDate) {
      newErrors.startDate = "Start date is required"
    }
    if (!formData.endDate) {
      newErrors.endDate = "End date is required"
    }
    if (formData.startDate && formData.endDate && new Date(formData.startDate) >= new Date(formData.endDate)) {
      newErrors.endDate = "End date must be after start date"
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
      startDate: new Date(formData.startDate),
      endDate: new Date(formData.endDate),
    })

    setOpen(false)
    if (!sprint) {
      // Reset form for new sprints
      setFormData({
        name: "",
        startDate: "",
        endDate: "",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || <Button>Create Sprint</Button>}</DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{sprint ? "Edit Sprint" : "Create New Sprint"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Sprint Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter sprint name"
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className={errors.startDate ? "border-red-500" : ""}
            />
            {errors.startDate && <p className="text-sm text-red-500">{errors.startDate}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate">End Date</Label>
            <Input
              id="endDate"
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className={errors.endDate ? "border-red-500" : ""}
            />
            {errors.endDate && <p className="text-sm text-red-500">{errors.endDate}</p>}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">{sprint ? "Update Sprint" : "Create Sprint"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
