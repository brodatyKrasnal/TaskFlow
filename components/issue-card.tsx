"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MoreHorizontal, Edit, Trash2, ArrowUpDown, User, Calendar } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { IssueForm } from "./issue-form"
import { IssueAssignmentDialog } from "./issue-assignment-dialog"
import { priorityColors, statusColors } from "@/lib/data"
import type { Issue, Sprint } from "@/types"
import { Input } from "@/components/ui/input"

interface IssueCardProps {
  issue: Issue
  sprints: Sprint[]
  onEdit: (issue: Issue) => void
  onDelete: (issueId: string) => void
  onAssignToSprint: (issueId: string, sprintId: string | undefined) => void
  showSprint?: boolean
}

export function IssueCard({ issue, sprints, onEdit, onDelete, onAssignToSprint, showSprint = true }: IssueCardProps) {
  const sprint = sprints.find((s) => s.id === issue.sprintId)
  const { toast } = useToast()

  const getStatusCardStyle = (status: string) => {
    switch (status) {
      case "Todo":
        return "border-l-4 border-l-gray-400"
      case "In Progress":
        return "border-l-4 border-l-blue-500"
      case "In Review":
        return "border-l-4 border-l-yellow-500"
      case "Done":
        return "border-l-4 border-l-green-500"
      default:
        return "border-l-4 border-l-gray-400"
    }
  }

  return (
    <Card className={`hover:shadow-md transition-shadow ${getStatusCardStyle(issue.status)}`}>
      <CardContent className="pt-[3px] pr-[3px] pl-[3px] pb-[2px]">
        <div className="flex gap-4 pl-[1%] pr-[5%]">
          {/* 100% - Task Info Section */}
          <div className="flex-[0_0_100%] min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <span className="text-sm font-mono text-muted-foreground">{issue.id}</span>
                <Badge className={statusColors[issue.status]} variant="outline">
                  {issue.status}
                </Badge>
                <h3 className="font-medium leading-tight mr-4">{issue.title}</h3>
                {showSprint && (
                  <Select
                    value={issue.assignee}
                    onValueChange={(value) => {
                      onEdit({ ...issue, assignee: value })
                      toast({
                        title: "Done!",
                        description: "Assignee updated",
                        className: "bg-green-100 text-green-800 border-green-200",
                      })
                    }}
                  >
                    <SelectTrigger className="h-6 text-xs w-32 border-0 shadow-none bg-transparent hover:bg-transparent focus:ring-0 focus:ring-offset-0 outline-none inline-flex">
                      <div className="flex items-center gap-1">
                        <User className={`h-3 w-3 ${issue.assignee && issue.assignee !== 'unassigned' ? 'text-gray-900' : 'text-gray-400'}`} />
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      <SelectItem value="Alice Johnson">Alice Johnson</SelectItem>
                      <SelectItem value="Bob Smith">Bob Smith</SelectItem>
                      <SelectItem value="Charlie Brown">Charlie Brown</SelectItem>
                      <SelectItem value="Diana Prince">Diana Prince</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <IssueForm
                    issue={issue}
                    sprints={sprints}
                    onSubmit={onEdit}
                    trigger={
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                    }
                  />
                  <IssueAssignmentDialog
                    issue={issue}
                    sprints={sprints}
                    onAssign={onAssignToSprint}
                    trigger={
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <ArrowUpDown className="h-4 w-4 mr-2" />
                        Assign to Sprint
                      </DropdownMenuItem>
                    }
                  />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Issue</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{issue.title}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDelete(issue.id)} className="bg-red-500 hover:bg-red-600">
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {issue.description && <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{issue.description}</p>}
            
            {/* Sprint and Date Section moved below description */}
            {showSprint && (
              <div className="mb-1">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span>Sprint:</span>
                  <Select
                    value={issue.sprintId || "backlog"}
                    onValueChange={(value) => {
                      onAssignToSprint(issue.id, value === "backlog" ? undefined : value)
                      toast({
                        title: "Done!",
                        description: "Sprint assignment updated",
                        className: "bg-green-100 text-green-800 border-green-200",
                      })
                    }}
                  >
                    <SelectTrigger className="h-6 text-xs w-[25%] border-0 shadow-none bg-transparent hover:bg-transparent focus:ring-0 focus:ring-offset-0 outline-none inline-flex">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="backlog">Backlog</SelectItem>
                      {sprints.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <span>•</span>
                  
                  <span>Start:</span>
                  <Input
                    type="date"
                    value={issue.startDate ? new Date(issue.startDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => {
                      const startDate = e.target.value ? new Date(e.target.value) : undefined
                      onEdit({ ...issue, startDate, updatedAt: new Date() })
                      toast({
                        title: "Done!",
                        description: "Start date updated",
                        className: "bg-green-100 text-green-800 border-green-200",
                      })
                    }}
                    className="h-6 w-36 text-xs border-0 shadow-none bg-transparent focus:ring-0 focus:ring-offset-0 outline-none"
                  />
                  
                  <span>•</span>
                  
                  <span>Delivery:</span>
                  <Input
                    type="date"
                    value={issue.deliveryDate ? new Date(issue.deliveryDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => {
                      const deliveryDate = e.target.value ? new Date(e.target.value) : undefined
                      onEdit({ ...issue, deliveryDate, updatedAt: new Date() })
                      toast({
                        title: "Done!",
                        description: "Delivery date updated",
                        className: "bg-green-100 text-green-800 border-green-200",
                      })
                    }}
                    className="h-6 w-36 text-xs border-0 shadow-none bg-transparent focus:ring-0 focus:ring-offset-0 outline-none"
                  />
                </div>
              </div>
            )}
          </div>


        </div>
      </CardContent>
    </Card>
  )
}
