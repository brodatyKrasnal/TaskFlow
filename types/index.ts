export type Priority = "P0" | "P1" | "P2" | "P3" | "P4" | "P5"
export type IssueStatus = "Todo" | "In Progress" | "In Review" | "Done"
export type SprintStatus = "Planned" | "Active" | "Completed"

export interface Issue {
  id: string
  title: string
  description: string
  priority: Priority
  status: IssueStatus
  assignee: string
  sprintId?: string
  createdAt: Date
  updatedAt: Date
}

export interface Sprint {
  id: string
  name: string
  status: SprintStatus
  startDate: Date
  endDate: Date
  createdAt: Date
  updatedAt: Date
}

export type ViewType = "issues" | "current-sprint" | "sprints"
