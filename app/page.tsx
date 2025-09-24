"use client"

import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { IssuesList } from "@/components/issues-list"
import { CurrentSprintView } from "@/components/current-sprint-view"
import { SprintsView } from "@/components/sprints-view"
import { initialIssues, initialSprints, generateTaskId } from "@/lib/data"
import type { Issue, Sprint, ViewType, IssueStatus } from "@/types"

export default function TaskFlowApp() {
  const [currentView, setCurrentView] = useState<ViewType>("issues")
  const [issues, setIssues] = useState<Issue[]>(initialIssues)
  const [sprints, setSprints] = useState<Sprint[]>(initialSprints)

  // Issue management functions
  const handleCreateIssue = (issueData: Partial<Issue>) => {
    const newIssue: Issue = {
      id: generateTaskId(issues),
      title: issueData.title || "",
      description: issueData.description || "",
      priority: issueData.priority || "P3",
      status: issueData.status || "Todo",
      assignee: issueData.assignee || "",
      sprintId: issueData.sprintId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    setIssues([...issues, newIssue])
  }

  const handleEditIssue = (updatedIssue: Issue) => {
    setIssues(
      issues.map((issue) =>
        issue.id === updatedIssue.id
          ? {
              ...issue,
              ...updatedIssue,
              updatedAt: new Date(),
            }
          : issue,
      ),
    )
  }

  const handleDeleteIssue = (issueId: string) => {
    setIssues(issues.filter((issue) => issue.id !== issueId))
  }

  const handleUpdateIssueStatus = (issueId: string, newStatus: IssueStatus) => {
    setIssues(
      issues.map((issue) =>
        issue.id === issueId
          ? {
              ...issue,
              status: newStatus,
              updatedAt: new Date(),
            }
          : issue,
      ),
    )
  }

  const handleAssignToSprint = (issueId: string, sprintId: string | undefined) => {
    setIssues(
      issues.map((issue) =>
        issue.id === issueId
          ? {
              ...issue,
              sprintId,
              updatedAt: new Date(),
            }
          : issue,
      ),
    )
  }

  // Sprint management functions
  const handleCreateSprint = (sprintData: Partial<Sprint>) => {
    const newSprint: Sprint = {
      id: `sprint-${Date.now()}`,
      name: sprintData.name || "",
      status: "Planned",
      startDate: sprintData.startDate || new Date(),
      endDate: sprintData.endDate || new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    setSprints([...sprints, newSprint])
  }

  const handleEditSprint = (updatedSprint: Sprint) => {
    setSprints(
      sprints.map((sprint) =>
        sprint.id === updatedSprint.id
          ? {
              ...sprint,
              ...updatedSprint,
              updatedAt: new Date(),
            }
          : sprint,
      ),
    )
  }

  const handleStartSprint = (sprintId: string) => {
    setSprints(
      sprints.map((sprint) =>
        sprint.id === sprintId
          ? {
              ...sprint,
              status: "Active" as const,
              updatedAt: new Date(),
            }
          : sprint,
      ),
    )
  }

  const handleEndSprint = (sprintId: string) => {
    // Move unfinished issues back to backlog
    const unfinishedIssues = issues.filter((issue) => issue.sprintId === sprintId && issue.status !== "Done")

    setIssues(
      issues.map((issue) =>
        unfinishedIssues.some((ui) => ui.id === issue.id)
          ? {
              ...issue,
              sprintId: undefined,
              updatedAt: new Date(),
            }
          : issue,
      ),
    )

    // Update sprint status
    setSprints(
      sprints.map((sprint) =>
        sprint.id === sprintId
          ? {
              ...sprint,
              status: "Completed" as const,
              updatedAt: new Date(),
            }
          : sprint,
      ),
    )
  }

  // Get current active sprint
  const activeSprint = sprints.find((sprint) => sprint.status === "Active")

  const renderCurrentView = () => {
    switch (currentView) {
      case "issues":
        return (
          <IssuesList
            issues={issues}
            sprints={sprints}
            onCreateIssue={handleCreateIssue}
            onEditIssue={handleEditIssue}
            onDeleteIssue={handleDeleteIssue}
            onAssignToSprint={handleAssignToSprint}
          />
        )
      case "current-sprint":
        return (
          <CurrentSprintView
            sprint={activeSprint || null}
            issues={issues}
            onUpdateIssueStatus={handleUpdateIssueStatus}
          />
        )
      case "sprints":
        return (
          <SprintsView
            sprints={sprints}
            issues={issues}
            onCreateSprint={handleCreateSprint}
            onEditSprint={handleEditSprint}
            onStartSprint={handleStartSprint}
            onEndSprint={handleEndSprint}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation currentView={currentView} onViewChange={setCurrentView} issues={issues} sprints={sprints} />
      <main className="container mx-auto px-4 py-8">{renderCurrentView()}</main>
    </div>
  )
}
