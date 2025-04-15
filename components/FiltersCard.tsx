// @ts-nocheck
"use client"

import React, { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, RefreshCw, Clock, HelpCircle } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { formatDate } from '@/lib/utils'


const minSelectableDate = new Date('2024-10-01T00:00:00')
const minSelectableDateUTC = new Date('2024-10-01T00:00:00Z')

const TimePicker = ({ value, onChange }) => {
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'))
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'))

  const [selectedHour, selectedMinute] = value.split(':')

  return (
    <div className="flex space-x-2 justify-center">
      <Select 
        value={selectedHour}
        onValueChange={(hour) => onChange(`${hour}:${selectedMinute}`)}
      >
        <SelectTrigger className="w-[70px] bg-[#1F1F1F] text-[#DBDBDB] border-[#3a3a3a]">
          <SelectValue placeholder="HH" />
        </SelectTrigger>
        <SelectContent className="bg-[#2a2a2a] text-[#DBDBDB] border-[#3a3a3a]">
          {hours.map((hour) => (
            <SelectItem 
              key={hour} 
              value={hour} 
              className="hover:bg-[#4BA500] hover:text-white focus:bg-[#4BA500] focus:text-white"
            >
              {hour}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={selectedMinute}
        onValueChange={(minute) => onChange(`${selectedHour}:${minute}`)}
      >
        <SelectTrigger className="w-[70px] bg-[#1F1F1F] text-[#DBDBDB] border-[#3a3a3a]">
          <SelectValue placeholder="MM" />
        </SelectTrigger>
        <SelectContent className="bg-[#2a2a2a] text-[#DBDBDB] border-[#3a3a3a]">
          {minutes.map((minute) => (
            <SelectItem 
              key={minute} 
              value={minute} 
              className="hover:bg-[#4BA500] hover:text-white focus:bg-[#4BA500] focus:text-white"
            >
              {minute}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export default function FiltersCard({ dateRange, setDateRange, selectedCoordinators, setSelectedCoordinators, availableCoordinators, autoReload, setAutoReload, useUTC, setUseUTC }) {
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    if (selectedCoordinators.length === 0 && availableCoordinators.length > 0) {
      setSelectedCoordinators([...availableCoordinators])
    }
  }, [availableCoordinators, selectedCoordinators, setSelectedCoordinators])

  const handleUTCToggle = () => {
    setUseUTC(!useUTC)
  }

  const handleDateTimeChange = (type, date, timeString) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      return; // Invalid time, don't update
    }
    
    let newDate = new Date(date);
    
    if (useUTC) {
      // Convert UTC time to local time
      const utcDate = new Date(Date.UTC(
        newDate.getFullYear(),
        newDate.getMonth(),
        newDate.getDate(),
        hours,
        minutes
      ));
      newDate = new Date(utcDate.toLocaleString());
    } else {
      // Use the time as local time
      newDate.setHours(hours, minutes);
    }
    
    setDateRange(prev => ({ ...prev, [type]: newDate }));
  };

  const formatTimeForDisplay = (date) => {
    if(useUTC){
      return date ? `${date.getUTCHours().toString().padStart(2, '0')}:${date.getUTCMinutes().toString().padStart(2, '0')}` : '00:00';
    }
    return date ? `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}` : '00:00';
  }

  const formatTimeForInput = (date) => {
    if(useUTC){
      return date ? `${date.getUTCHours().toString().padStart(2, '0')}:${date.getUTCMinutes().toString().padStart(2, '0')}` : '00:00';
    }
    return date ? `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}` : '00:00';
  }

  return (
    <Card className="bg-[#2a2a2a] border-[#3a3a3a] mb-6">
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-3">
        <CardTitle className="text-[#DBDBDB] text-xl">Filters and Settings</CardTitle>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setAutoReload(!autoReload)}
            className={`${autoReload ? 'text-[#4BA500]' : 'text-[#3a3a3a]'} hover:bg-[#4BA500] hover:text-white`}
            title={autoReload ? "Disable auto-reload" : "Enable auto-reload"}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleUTCToggle}
            className={`${useUTC ? 'text-[#4BA500]' : 'text-[#3a3a3a]'} hover:bg-[#4BA500] hover:text-white`}
            title={useUTC ? "Switch to local time" : "Switch to UTC"}
          >
            <Clock className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="hover:bg-[#4BA500] hover:text-white"
          >
            {collapsed ? <ChevronDown className="h-4 w-4 text-[#DBDBDB]" /> : <ChevronUp className="h-4 w-4 text-[#DBDBDB]" />}
          </Button>
        </div>
      </CardHeader>
      {!collapsed && (
        <CardContent className="pt-2">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-[#DBDBDB]">Since</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={`w-full justify-start text-left font-normal bg-[#1F1F1F] text-[#DBDBDB] border-[#3a3a3a] hover:bg-[#4BA500] hover:text-white`}
                  >
                    {dateRange.since ? formatDate(dateRange.since, useUTC) : <span>Pick a date and time</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-[#2a2a2a] border-[#3a3a3a]" align="start">
                  <div className="p-2">
                    <Calendar
                      mode="single"
                      selected={dateRange.since}
                      onSelect={(date) => handleDateTimeChange('since', date || minSelectableDate, formatTimeForInput(dateRange.since))}
                      disabled={(date) => date > new Date() || date < minSelectableDate}
                      initialFocus
                      className="bg-[#2a2a2a] text-[#DBDBDB]"
                    />
                    <div className="mt-2">
                      <TimePicker
                        value={formatTimeForDisplay(dateRange.since)}
                        onChange={(time) => handleDateTimeChange('since', dateRange.since || minSelectableDate, time)}
                      />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-[#DBDBDB]">Until</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={`w-full justify-start text-left font-normal bg-[#1F1F1F] text-[#DBDBDB] border-[#3a3a3a] hover:bg-[#4BA500] hover:text-white`}
                  >
                    {dateRange.until ? formatDate(dateRange.until, useUTC) : <span>Pick a date and time</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-[#2a2a2a] border-[#3a3a3a]" align="start">
                  <div className="p-2">
                    <Calendar
                      mode="single"
                      selected={dateRange.until}
                      onSelect={(date) => handleDateTimeChange('until', date || new Date(), formatTimeForInput(dateRange.until))}
                      disabled={(date) => date > new Date() || date < minSelectableDate}
                      initialFocus
                      className="bg-[#2a2a2a] text-[#DBDBDB]"
                    />
                    <div className="mt-2">
                      <TimePicker
                        value={formatTimeForDisplay(dateRange.until)}
                        onChange={(time) => handleDateTimeChange('until', dateRange.until || new Date(), time)}
                      />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-[#DBDBDB]">
                  Coordinator Endpoints
                </label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-[#DBDBDB] cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Shift + click to select only one</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex flex-wrap gap-2">
                {availableCoordinators.map((coord) => {
                  const isSelected = selectedCoordinators.includes(coord);
                  return (
                    <Badge
                      key={coord}
                      variant={isSelected ? "primary" : "secondary"}
                      className={`text-xs ${isSelected ? "bg-[#3B7D00]" : "bg-[#3a3a3a]"} text-[#DBDBDB] cursor-pointer select-none`}
                      onClick={(e) => {
                        if (e.shiftKey) {
                          setSelectedCoordinators([coord]);
                        } else {
                          if (isSelected) {
                            setSelectedCoordinators(selectedCoordinators.filter(c => c !== coord));
                          } else {
                            setSelectedCoordinators([...selectedCoordinators, coord]);
                          }
                        }
                      }}
                    >
                      {coord}
                    </Badge>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      )}
      <style jsx global>{`
        .rdp-button:hover:not([disabled]):not(.rdp-day_selected) {
          background-color: #4BA500 !important;
          color: white !important;
        }
        .rdp-day_selected, .rdp-day_selected:focus-visible, .rdp-day_selected:hover {
          background-color: #4BA500 !important;
          color: white !important;
        }
        [cmdk-item][data-selected=true] {
          background-color: #4BA500;
          color: white;
        }
        [cmdk-item]:hover {
          background-color: #4BA500;
          color: white;
        }
      `}</style>
    </Card>
  )
}