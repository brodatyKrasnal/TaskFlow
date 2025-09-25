export type Priority = "P0" | "P1" | "P2" | "P3" | "P4" | "P5"
export type IssueStatus = "Todo" | "In Progress" | "In Review" | "Done"
export type SprintStatus = "Planned" | "Active" | "Completed"
export type IssueType = "Epic" | "Story" | "Task" | "Sub-task"
export type DependencyType = "FS" | "SS" | "FF" | "SF" // Finish-to-Start, Start-to-Start, Finish-to-Finish, Start-to-Finish
export type ZoomLevel = "Day" | "Week" | "Month" | "Quarter"
export type SwimlaneType = "Epic" | "Team" | "Assignee" | "Sprint" | "Priority"

export interface Issue {
  id: string
  title: string
  description: string
  priority: Priority
  status: IssueStatus
  assignee: string
  sprintId?: string
  startDate?: Date
  deliveryDate?: Date
  createdAt: Date
  updatedAt: Date
  // Timeline-specific fields
  type?: IssueType
  parentId?: string
  progress?: number
  isBlocked?: boolean
  hasRisk?: boolean
  labels?: string[]
  team?: string
}

export interface Dependency {
  id: string
  fromIssueId: string
  toIssueId: string
  type: DependencyType
  lag?: number // in days
}

export interface TimelineItem {
  id: string
  issue: Issue
  startDate: Date
  endDate: Date
  level: number // for hierarchy
  dependencies: Dependency[]
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

export type ViewType = "issues" | "current-sprint" | "timeline" | "sprints" | "reporting"
