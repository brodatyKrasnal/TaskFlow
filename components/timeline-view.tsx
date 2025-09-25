"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Calendar, 
  Users, 
  Target, 
  Filter, 
  ZoomIn, 
  ZoomOut, 
  Download, 
  Plus,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Lock,
  ArrowRight,
  Clock,
  User,
  Tag
} from "lucide-react"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import type { Issue, Sprint, ZoomLevel, IssueType, DependencyType } from "@/types"

interface TimelineViewProps {
  issues: Issue[]
  sprints: Sprint[]
  onEditIssue: (issue: Issue) => void
  onCreateIssue: (issueData: Partial<Issue>) => void
  onDeleteIssue: (issueId: string) => void
}


export function TimelineView({ issues, sprints, onEditIssue, onCreateIssue, onDeleteIssue }: TimelineViewProps) {
  const { toast } = useToast()
  const timelineRef = useRef<HTMLDivElement>(null)
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>("Month")
  const [selectedIssues, setSelectedIssues] = useState<Set<string>>(new Set())
  const [draggedIssue, setDraggedIssue] = useState<string | null>(null)
  const [resizingIssue, setResizingIssue] = useState<string | null>(null)
  const [resizeType, setResizeType] = useState<'start' | 'end' | null>(null)
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null)
  const [resizePreview, setResizePreview] = useState<Date | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  // Add global mouse event listeners for resize
  useEffect(() => {
    const handleGlobalMouseMove = (event: MouseEvent) => {
      if (resizingIssue && resizeType) {
        handleResizeMove(event as any)
      }
    }

    const handleGlobalMouseUp = () => {
      if (resizingIssue) {
        handleResizeEnd()
      }
    }

    if (resizingIssue) {
      document.addEventListener('mousemove', handleGlobalMouseMove)
      document.addEventListener('mouseup', handleGlobalMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove)
      document.removeEventListener('mouseup', handleGlobalMouseUp)
    }
  }, [resizingIssue, resizeType, resizePreview])
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterPriority, setFilterPriority] = useState<string>("all")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [timelineStart, setTimelineStart] = useState(new Date())
  const [timelineEnd, setTimelineEnd] = useState(new Date())
  const [focusedDate, setFocusedDate] = useState<Date | null>(null)

  // Calculate timeline bounds - from earliest issue start date to one year ahead
  const timelineBounds = useMemo(() => {
    if (focusedDate) {
      // When focused on a specific date, show 12 months from that date
      const startDate = new Date(focusedDate.getFullYear(), focusedDate.getMonth(), 1)
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 12, 0)
      return {
        start: startDate,
        end: endDate
      }
    }

    // If user has navigated, use the navigation state
    if (timelineStart.getTime() !== new Date().getTime() || timelineEnd.getTime() !== new Date().getTime()) {
      return {
        start: timelineStart,
        end: timelineEnd
      }
    }

    const dates = issues
      .filter(issue => issue.startDate || issue.deliveryDate)
      .flatMap(issue => [
        issue.startDate,
        issue.deliveryDate
      ])
      .filter(Boolean) as Date[]

    if (dates.length === 0) {
      // If no issues with dates, show current month + 11 months ahead
      const now = new Date()
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 12, 0)
      return {
        start: startDate,
        end: endDate
      }
    }

    // Find the earliest start date
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())))
    
    // Start from the first day of the earliest month
    const startDate = new Date(minDate.getFullYear(), minDate.getMonth(), 1)
    
    // Extend exactly 12 months from the start date
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 12, 0)
    
    return {
      start: startDate,
      end: endDate
    }
  }, [issues, focusedDate, timelineStart, timelineEnd])

  // Calculate pixel width for timeline
  const getTimelineWidth = () => {
    const totalDays = Math.ceil((timelineBounds.end.getTime() - timelineBounds.start.getTime()) / (1000 * 60 * 60 * 24))
    const pixelsPerDay = zoomLevel === "Day" ? 40 : zoomLevel === "Week" ? 20 : zoomLevel === "Month" ? 5 : 2
    return totalDays * pixelsPerDay
  }

  // Calculate position for a given date
  const getDatePosition = (date: Date) => {
    const daysFromStart = Math.ceil((date.getTime() - timelineBounds.start.getTime()) / (1000 * 60 * 60 * 24))
    const pixelsPerDay = zoomLevel === "Day" ? 40 : zoomLevel === "Week" ? 20 : zoomLevel === "Month" ? 5 : 2
    return daysFromStart * pixelsPerDay
  }

  // Calculate width for a date range
  const getDateRangeWidth = (startDate: Date, endDate: Date) => {
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    const pixelsPerDay = zoomLevel === "Day" ? 40 : zoomLevel === "Week" ? 20 : zoomLevel === "Month" ? 5 : 2
    return Math.max(days * pixelsPerDay, 20) // Minimum 20px width
  }

  // Filter issues based on search and filters
  const filteredIssues = useMemo(() => {
    return issues.filter(issue => {
      const matchesSearch = 
        issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.assignee.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = filterStatus === "all" || issue.status === filterStatus
      const matchesPriority = filterPriority === "all" || issue.priority === filterPriority
      
      return matchesSearch && matchesStatus && matchesPriority
    })
  }, [issues, searchTerm, filterStatus, filterPriority])


  // Handle issue selection
  const handleIssueSelect = (issueId: string, multiSelect: boolean = false) => {
    if (multiSelect) {
      setSelectedIssues(prev => {
        const newSet = new Set(prev)
        if (newSet.has(issueId)) {
          newSet.delete(issueId)
        } else {
          newSet.add(issueId)
        }
        return newSet
      })
    } else {
      setSelectedIssues(new Set([issueId]))
    }
  }

  // Handle drag start
  const handleDragStart = (issueId: string, event: React.MouseEvent) => {
    setDraggedIssue(issueId)
    if (!selectedIssues.has(issueId)) {
      setSelectedIssues(new Set([issueId]))
    }
    const rect = timelineRef.current?.getBoundingClientRect()
    if (rect) {
      setDragOffset({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      })
    }
  }

  // Handle drag end
  const handleDragEnd = () => {
    setDraggedIssue(null)
    setDragOffset(null)
  }

  // Handle drag move
  const handleDragMove = (event: React.MouseEvent) => {
    if (!draggedIssue || !timelineRef.current) return

    const rect = timelineRef.current.getBoundingClientRect()
    const x = event.clientX - rect.left
    const newDate = getDateFromPosition(x)
    
    if (newDate) {
      const issue = issues.find(i => i.id === draggedIssue)
      if (issue) {
        const duration = issue.deliveryDate ? 
          issue.deliveryDate.getTime() - issue.startDate!.getTime() : 
          7 * 24 * 60 * 60 * 1000 // Default 7 days
        
        const newStartDate = newDate
        const newEndDate = new Date(newStartDate.getTime() + duration)
        
        onEditIssue({
          ...issue,
          startDate: newStartDate,
          deliveryDate: newEndDate,
          updatedAt: new Date()
        })
      }
    }
  }

  // Get date from position
  const getDateFromPosition = (x: number) => {
    const pixelsPerDay = zoomLevel === "Day" ? 40 : zoomLevel === "Week" ? 20 : zoomLevel === "Month" ? 5 : 2
    const diffTime = (x / pixelsPerDay) * (1000 * 60 * 60 * 24)
    return new Date(timelineBounds.start.getTime() + diffTime)
  }

  // Handle resize start
  const handleResizeStart = (issueId: string, type: 'start' | 'end', event: React.MouseEvent) => {
    event.stopPropagation()
    setResizingIssue(issueId)
    setResizeType(type)
  }

  // Handle resize move - only show preview, don't update yet
  const handleResizeMove = (event: MouseEvent | React.MouseEvent) => {
    if (!resizingIssue || !resizeType || !timelineRef.current) return

    const rect = timelineRef.current.getBoundingClientRect()
    const x = event.clientX - rect.left
    const newDate = getDateFromPosition(x)
    
    if (newDate) {
      setResizePreview(newDate)
    }
  }

  // Handle resize end - save the date when user drops
  const handleResizeEnd = () => {
    if (resizingIssue && resizeType && resizePreview) {
      const issue = issues.find(i => i.id === resizingIssue)
      if (issue) {
        if (resizeType === 'start') {
          // Ensure start date doesn't go beyond delivery date
          const currentEndDate = issue.deliveryDate || new Date(issue.startDate!.getTime() + 7 * 24 * 60 * 60 * 1000)
          const adjustedDate = resizePreview < currentEndDate ? resizePreview : new Date(currentEndDate.getTime() - 24 * 60 * 60 * 1000)
          
          onEditIssue({
            ...issue,
            startDate: adjustedDate,
            updatedAt: new Date()
          })
        } else {
          // Ensure delivery date doesn't go before start date
          const currentStartDate = issue.startDate || new Date()
          const adjustedDate = resizePreview > currentStartDate ? resizePreview : new Date(currentStartDate.getTime() + 24 * 60 * 60 * 1000)
          
          onEditIssue({
            ...issue,
            deliveryDate: adjustedDate,
            updatedAt: new Date()
          })
        }
      }
    }
    
    setResizingIssue(null)
    setResizeType(null)
    setResizePreview(null)
  }

  // Handle zoom
  const handleZoom = (direction: "in" | "out") => {
    const levels: ZoomLevel[] = ["Day", "Week", "Month", "Quarter"]
    const currentIndex = levels.indexOf(zoomLevel)
    
    if (direction === "in" && currentIndex > 0) {
      setZoomLevel(levels[currentIndex - 1])
    } else if (direction === "out" && currentIndex < levels.length - 1) {
      setZoomLevel(levels[currentIndex + 1])
    }
  }

  // Handle date focus
  const handleDateFocus = (date: Date) => {
    setFocusedDate(date)
  }

  // Reset focus to show all data
  const handleResetFocus = () => {
    setFocusedDate(null)
  }

  // Reset timeline to show full range
  const handleResetTimeline = () => {
    setTimelineStart(new Date())
    setTimelineEnd(new Date())
    setFocusedDate(null)
  }

  // Handle timeline navigation - move by 6 months
  const handleTimelineNavigation = (direction: "left" | "right") => {
    const months = 6
    const offset = direction === "left" ? -months : months
    
    setTimelineStart(prev => {
      const newStart = new Date(prev.getFullYear(), prev.getMonth() + offset, 1)
      return newStart
    })
    setTimelineEnd(prev => {
      const newEnd = new Date(prev.getFullYear(), prev.getMonth() + offset + 6, 0)
      return newEnd
    })
  }

  // Generate calendar headers based on zoom level
  const generateTimelineHeaders = () => {
    const headers = []
    const startDate = new Date(timelineBounds.start)
    const endDate = new Date(timelineBounds.end)
    
    if (zoomLevel === "Day") {
      // Generate daily headers
      const current = new Date(startDate)
      while (current <= endDate) {
        const isToday = current.toDateString() === new Date().toDateString()
        const isWeekend = current.getDay() === 0 || current.getDay() === 6
        const isFocused = focusedDate && current.toDateString() === focusedDate.toDateString()
        
        headers.push(
          <div
            key={current.toISOString()}
            className={`text-xs text-center border-r border-gray-200 cursor-pointer hover:bg-gray-100 ${
              isWeekend ? "bg-gray-50" : ""
            } ${isToday ? "bg-blue-50 border-blue-200 font-semibold" : ""} ${
              isFocused ? "bg-yellow-100 border-yellow-300 font-semibold" : ""
            }`}
            style={{ width: "40px" }}
            onClick={() => handleDateFocus(current)}
          >
            <div className="p-1">
              <div className="font-medium">{current.getDate()}</div>
              <div className="text-xs text-gray-500">{current.toLocaleDateString("en-US", { weekday: "short" })}</div>
            </div>
          </div>
        )
        current.setDate(current.getDate() + 1)
      }
    } else if (zoomLevel === "Week") {
      // Generate weekly headers
      const current = new Date(startDate)
      // Start from the beginning of the week
      const dayOfWeek = current.getDay()
      current.setDate(current.getDate() - dayOfWeek)
      
      while (current <= endDate) {
        const weekEnd = new Date(current)
        weekEnd.setDate(weekEnd.getDate() + 6)
        const isCurrentWeek = current <= new Date() && weekEnd >= new Date()
        const isFocused = focusedDate && current <= focusedDate && weekEnd >= focusedDate
        
        headers.push(
          <div
            key={current.toISOString()}
            className={`text-xs text-center border-r border-gray-200 cursor-pointer hover:bg-gray-100 ${
              isCurrentWeek ? "bg-blue-50 border-blue-200 font-semibold" : ""
            } ${isFocused ? "bg-yellow-100 border-yellow-300 font-semibold" : ""}`}
            style={{ width: "120px" }}
            onClick={() => handleDateFocus(current)}
          >
            <div className="p-2">
              <div className="font-medium">
                {current.getDate()}-{weekEnd.getDate()}
              </div>
              <div className="text-xs text-gray-500">
                {current.toLocaleDateString("en-US", { month: "short" })}
              </div>
            </div>
          </div>
        )
        current.setDate(current.getDate() + 7)
      }
    } else if (zoomLevel === "Month") {
      // Generate monthly headers
      const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1)
      while (current <= endDate) {
        const isCurrentMonth = current.getMonth() === new Date().getMonth() && current.getFullYear() === new Date().getFullYear()
        const isFocused = focusedDate && current.getMonth() === focusedDate.getMonth() && current.getFullYear() === focusedDate.getFullYear()
        
        headers.push(
          <div
            key={current.toISOString()}
            className={`text-xs text-center border-r border-gray-200 cursor-pointer hover:bg-gray-100 ${
              isCurrentMonth ? "bg-blue-50 border-blue-200 font-semibold" : ""
            } ${isFocused ? "bg-yellow-100 border-yellow-300 font-semibold" : ""}`}
            style={{ width: "150px" }}
            onClick={() => handleDateFocus(current)}
          >
            <div className="p-2">
              <div className="font-medium">
                {current.toLocaleDateString("en-US", { month: "long" })}
              </div>
              <div className="text-xs text-gray-500">
                {current.getFullYear()}
              </div>
            </div>
          </div>
        )
        current.setMonth(current.getMonth() + 1)
      }
    } else {
      // Generate quarterly headers
      const current = new Date(startDate.getFullYear(), Math.floor(startDate.getMonth() / 3) * 3, 1)
      while (current <= endDate) {
        const quarter = Math.ceil((current.getMonth() + 1) / 3)
        const isCurrentQuarter = current.getFullYear() === new Date().getFullYear() && quarter === Math.ceil((new Date().getMonth() + 1) / 3)
        const isFocused = focusedDate && current.getFullYear() === focusedDate.getFullYear() && quarter === Math.ceil((focusedDate.getMonth() + 1) / 3)
        
        headers.push(
          <div
            key={current.toISOString()}
            className={`text-xs text-center border-r border-gray-200 cursor-pointer hover:bg-gray-100 ${
              isCurrentQuarter ? "bg-blue-50 border-blue-200 font-semibold" : ""
            } ${isFocused ? "bg-yellow-100 border-yellow-300 font-semibold" : ""}`}
            style={{ width: "200px" }}
            onClick={() => handleDateFocus(current)}
          >
            <div className="p-2">
              <div className="font-medium">Q{quarter}</div>
              <div className="text-xs text-gray-500">{current.getFullYear()}</div>
            </div>
          </div>
        )
        current.setMonth(current.getMonth() + 3)
      }
    }
    
    return headers
  }

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-semibold">Timeline</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTimelineNavigation("left")}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTimelineNavigation("right")}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={focusedDate ? focusedDate.toISOString().split('T')[0] : ''}
              onChange={(e) => {
                if (e.target.value) {
                  handleDateFocus(new Date(e.target.value))
                } else {
                  handleResetFocus()
                }
              }}
              placeholder="Focus on date"
              className="w-40"
            />
                    {focusedDate && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleResetFocus}
                      >
                        Reset Focus
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleResetTimeline}
                    >
                      Reset to Full View
                    </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-gray-100 rounded-md p-1">
            <Button
              variant={zoomLevel === "Day" ? "default" : "ghost"}
              size="sm"
              onClick={() => setZoomLevel("Day")}
              className="h-8 px-2"
            >
              Day
            </Button>
            <Button
              variant={zoomLevel === "Week" ? "default" : "ghost"}
              size="sm"
              onClick={() => setZoomLevel("Week")}
              className="h-8 px-2"
            >
              Week
            </Button>
            <Button
              variant={zoomLevel === "Month" ? "default" : "ghost"}
              size="sm"
              onClick={() => setZoomLevel("Month")}
              className="h-8 px-2"
            >
              Month
            </Button>
            <Button
              variant={zoomLevel === "Quarter" ? "default" : "ghost"}
              size="sm"
              onClick={() => setZoomLevel("Quarter")}
              className="h-8 px-2"
            >
              Quarter
            </Button>
          </div>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <span className="text-sm font-medium">Filters:</span>
        </div>
        
        <Input
          placeholder="Search issues..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-64"
        />
        
        
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Todo">Todo</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="In Review">In Review</SelectItem>
            <SelectItem value="Done">Done</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="P0">P0</SelectItem>
            <SelectItem value="P1">P1</SelectItem>
            <SelectItem value="P2">P2</SelectItem>
            <SelectItem value="P3">P3</SelectItem>
            <SelectItem value="P4">P4</SelectItem>
            <SelectItem value="P5">P5</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Timeline Container */}
      <div className="border rounded-lg overflow-hidden">
        <div className="flex">
          {/* Timeline Content */}
          <div className="flex-1 overflow-x-auto">
            {/* Timeline Headers */}
            <div className="flex border-b bg-gray-50">
              {generateTimelineHeaders()}
            </div>

            {/* Timeline Bars */}
            <div 
              className="relative" 
              style={{ height: "400px" }}
              onMouseMove={(e) => {
                handleDragMove(e)
              }}
              onMouseUp={(e) => {
                handleDragEnd()
              }}
              onMouseLeave={(e) => {
                handleDragEnd()
              }}
            >
              {/* Calendar Grid Background */}
              {zoomLevel === "Day" && (
                <>
                  {/* Weekend shading */}
                  {(() => {
                    const gridLines = []
                    const current = new Date(timelineBounds.start)
                    while (current <= timelineBounds.end) {
                      if (current.getDay() === 0 || current.getDay() === 6) {
                        const x = getDatePosition(current)
                        gridLines.push(
                          <div
                            key={`weekend-${current.toISOString()}`}
                            className="absolute top-0 bottom-0 bg-gray-100"
                            style={{
                              left: x,
                              width: "40px"
                            }}
                          />
                        )
                      }
                      current.setDate(current.getDate() + 1)
                    }
                    return gridLines
                  })()}
                  
                  {/* Vertical grid lines for each day */}
                  {(() => {
                    const gridLines = []
                    const current = new Date(timelineBounds.start)
                    while (current <= timelineBounds.end) {
                      const x = getDatePosition(current)
                      gridLines.push(
                        <div
                          key={`grid-${current.toISOString()}`}
                          className="absolute top-0 bottom-0 w-px bg-gray-200"
                          style={{ left: x }}
                        />
                      )
                      current.setDate(current.getDate() + 1)
                    }
                    return gridLines
                  })()}
                </>
              )}
              
              {zoomLevel === "Week" && (
                <>
                  {/* Vertical grid lines for each week */}
                  {(() => {
                    const gridLines = []
                    const current = new Date(timelineBounds.start)
                    const dayOfWeek = current.getDay()
                    current.setDate(current.getDate() - dayOfWeek)
                    
                    while (current <= timelineBounds.end) {
                      const x = getDatePosition(current)
                      gridLines.push(
                        <div
                          key={`week-grid-${current.toISOString()}`}
                          className="absolute top-0 bottom-0 w-px bg-gray-200"
                          style={{ left: x }}
                        />
                      )
                      current.setDate(current.getDate() + 7)
                    }
                    return gridLines
                  })()}
                </>
              )}
              
              {zoomLevel === "Month" && (
                <>
                  {/* Vertical grid lines for each month */}
                  {(() => {
                    const gridLines = []
                    const current = new Date(timelineBounds.start.getFullYear(), timelineBounds.start.getMonth(), 1)
                    while (current <= timelineBounds.end) {
                      const x = getDatePosition(current)
                      gridLines.push(
                        <div
                          key={`month-grid-${current.toISOString()}`}
                          className="absolute top-0 bottom-0 w-px bg-gray-200"
                          style={{ left: x }}
                        />
                      )
                      current.setMonth(current.getMonth() + 1)
                    }
                    return gridLines
                  })()}
                </>
              )}
              {/* Today indicator */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                style={{
                  left: getDatePosition(new Date()),
                }}
              />
              
              {/* Resize preview indicator */}
              {resizePreview && resizingIssue && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-blue-500 z-20"
                  style={{
                    left: getDatePosition(resizePreview),
                  }}
                />
              )}
              
              {filteredIssues.map((issue, issueIndex) => {
                const startDate = issue.startDate || new Date()
                const endDate = issue.deliveryDate || new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000)
                
                const bar = {
                  id: issue.id,
                  issue,
                  startDate,
                  endDate,
                  x: getDatePosition(startDate),
                  width: getDateRangeWidth(startDate, endDate),
                  y: issueIndex * 60 + 10,
                  level: 0,
                  isSelected: selectedIssues.has(issue.id),
                  isDragging: draggedIssue === issue.id
                }
                
                return (
                  <div
                    key={bar.id}
                    className={`absolute cursor-move rounded-md border-2 transition-all ${
                      bar.isSelected ? "ring-2 ring-blue-500" : ""
                    } ${
                      draggedIssue === bar.id ? "opacity-75 scale-105 shadow-lg" : ""
                    } ${
                      resizingIssue === bar.id ? "opacity-75 scale-105 shadow-lg" : ""
                    } ${
                      bar.issue.isBlocked ? "border-red-500 bg-red-50" :
                      bar.issue.hasRisk ? "border-yellow-500 bg-yellow-50" :
                      bar.issue.status === "Done" ? "border-green-500 bg-green-50" :
                      bar.issue.status === "In Progress" ? "border-blue-500 bg-blue-50" :
                      "border-gray-300 bg-white"
                    }`}
                    style={{
                      left: bar.x,
                      top: bar.y,
                      width: bar.width,
                      height: "50px"
                    }}
                    onMouseDown={(e) => handleDragStart(bar.id, e)}
                    onClick={(e) => handleIssueSelect(bar.id, e.ctrlKey || e.metaKey)}
                  >
                    <div className="p-2 h-full flex flex-col justify-between relative">
                      {/* Resize handles */}
                      <div 
                        className="absolute left-0 top-0 w-3 h-full cursor-ew-resize bg-blue-500 opacity-0 hover:opacity-80 transition-opacity rounded-l-md"
                        onMouseDown={(e) => handleResizeStart(bar.id, 'start', e)}
                        title="Drag to change start date"
                      />
                      <div 
                        className="absolute right-0 top-0 w-3 h-full cursor-ew-resize bg-blue-500 opacity-0 hover:opacity-80 transition-opacity rounded-r-md"
                        onMouseDown={(e) => handleResizeStart(bar.id, 'end', e)}
                        title="Drag to change delivery date"
                      />
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium truncate">
                          {bar.issue.title}
                        </span>
                        <div className="flex items-center gap-1">
                          {bar.issue.isBlocked && <Lock className="h-3 w-3 text-red-500" />}
                          {bar.issue.hasRisk && <AlertTriangle className="h-3 w-3 text-yellow-500" />}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {bar.issue.assignee} • {bar.issue.priority}
                      </div>
                      {bar.issue.progress !== undefined && (
                        <Progress 
                          value={bar.issue.progress} 
                          className="h-1 mt-1"
                        />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Legend */}
      <div className="flex items-center gap-6 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-green-500 bg-green-50 rounded"></div>
          <span>Done</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-500 bg-blue-50 rounded"></div>
          <span>In Progress</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-gray-300 bg-white rounded"></div>
          <span>Todo</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-red-500 bg-red-50 rounded"></div>
          <span>Blocked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-yellow-500 bg-yellow-50 rounded"></div>
          <span>At Risk</span>
        </div>
      </div>
      
      <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
        <div className="font-medium mb-2">Interactive Calendar Timeline:</div>
        <div className="space-y-1">
          <div>• <strong>Day view</strong>: Shows individual days with weekend shading</div>
          <div>• <strong>Week view</strong>: Shows weekly periods with grid lines</div>
          <div>• <strong>Month view</strong>: Shows monthly periods for long-term planning</div>
          <div>• <strong>Quarter view</strong>: Shows quarterly periods for strategic planning</div>
          <div>• <strong>Drag issues</strong> to move them to different time periods</div>
          <div>• <strong>Drag left edge</strong> to change start date</div>
          <div>• <strong>Drag right edge</strong> to change delivery date</div>
          <div>• <strong>Click issues</strong> to select them (Ctrl+Click for multiple selection)</div>
          <div>• <strong>Red line</strong> shows today's date</div>
        </div>
      </div>
    </div>
  )
}
