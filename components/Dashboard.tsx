// @ts-nocheck
"use client"

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { RefreshCcw, AlertCircle, Twitter, Github, Check, Copy } from 'lucide-react'
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import FiltersCard from './FiltersCard'
import AveragesCard from './AveragesCard'
import TotalCard from './TotalCard'
import RoundsCard from './RoundsCard'
import GraphCard from './GraphCard'
import { fetchData } from '@/lib/api'


export default function Dashboard() {
  const [rounds, setRounds] = useState([])
  const [summary, setSummary] = useState(null)
  const [total, setTotal] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedCoordinators, setSelectedCoordinators] = useState([])
  const [availableCoordinators, setAvailableCoordinators] = useState([])
  const [autoReload, setAutoReload] = useState(true)
  const [useUTC, setUseUTC] = useState(false)
  const [dateRange, setDateRange] = useState(() => {
    const now = new Date()
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    return {
      since: twentyFourHoursAgo,
      until: now
    }
  })
  const [isDonationDialogOpen, setIsDonationDialogOpen] = useState(false)
  const [donationAddress, setDonationAddress] = useState('')
  const [copiedAddress, setCopiedAddress] = useState('')
  const [isDonationLoading, setIsDonationLoading] = useState(false)

  const autoUpdateIntervalRef = useRef(null)

  const copyToClipboard = (text, e) => {
    e.preventDefault()
    navigator.clipboard.writeText(text).then(() => {
      setCopiedAddress(text)
      setTimeout(() => setCopiedAddress(''), 2000)
    })
  }

  const fetchDataAndUpdateState = useCallback(async () => {
    try {
      setLoading(true)
      const { summaryData, roundsData } = await fetchData(dateRange, selectedCoordinators)

      if (JSON.stringify(summaryData.result) !== JSON.stringify(summary) ||
          JSON.stringify(roundsData.result) !== JSON.stringify(rounds)) {
        setSummary(summaryData.result)
        setRounds(roundsData.result)

        // Calculate totals
        const totalData = {
          InputCount: roundsData.result.reduce((sum, round) => sum + round.InputCount, 0),
          OutputCount: roundsData.result.reduce((sum, round) => sum + round.OutputCount, 0),
          TotalInputAmount: roundsData.result.reduce((sum, round) => sum + round.TotalInputAmount, 0) / 100000000,
          FreshInputsEstimateBtc: roundsData.result.reduce((sum, round) => sum + round.FreshInputsEstimateBtc, 0),
          EstimatedCoordinatorEarningsSats: roundsData.result.reduce((sum, round) => sum + round.EstimatedCoordinatorEarningsSats, 0),
          NumberOfRounds: roundsData.result.length,
        }
        setTotal(totalData)

        const uniqueCoordinators = [...new Set(roundsData.result.map(r => r.CoordinatorEndpoint))]
        const updatedCoordinators = [...new Set([...availableCoordinators, ...uniqueCoordinators])]
        setAvailableCoordinators(updatedCoordinators)
        localStorage.setItem('seenCoordinators', JSON.stringify(updatedCoordinators))
      }
    } catch (err) {
      console.error("Error fetching data:", err)
      // Silently fail: do nothing, don't update the data
    } finally {
      setLoading(false)
    }
  }, [dateRange, selectedCoordinators, summary, rounds, availableCoordinators])

  useEffect(() => {
    const storedCoordinators = JSON.parse(localStorage.getItem('seenCoordinators') || '[]')
    setAvailableCoordinators(storedCoordinators)
  }, [])

  useEffect(() => {
    fetchDataAndUpdateState()

    if (autoReload) {
      autoUpdateIntervalRef.current = setInterval(() => {
        const now = new Date()
        const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000)
        
        setDateRange({
          since: twentyFourHoursAgo,
          until: now
        })
      }, 2 * 60 * 1000)
    }

    return () => {
      if (autoUpdateIntervalRef.current) {
        clearInterval(autoUpdateIntervalRef.current)
      }
    }
  }, [autoReload, fetchDataAndUpdateState])

  useEffect(() => {
    fetchDataAndUpdateState()
  }, [selectedCoordinators, dateRange])

  const handleDateRangeChange = (newDateRange) => {
    setDateRange(newDateRange)
    setAutoReload(false)
  }

  const handleDonationClick = async () => {
    setIsDonationDialogOpen(true)
    setIsDonationLoading(true)
    try {
      const response = await fetch('/api', {
        method: 'POST',
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "2",
          method: "donation-address",
          params: []
        })
      })
      const data = await response.json()
      setDonationAddress(data.result)
    } catch (error) {
      console.error("Error fetching donation address:", error)
      setDonationAddress("Error fetching address. Please try again.")
    } finally {
      setIsDonationLoading(false)
    }
  }

  if (loading && rounds.length === 0) return (
    <div className="flex justify-center items-center h-screen bg-[#1F1F1F] text-[#DBDBDB]">
      <RefreshCcw className="h-8 w-8 animate-spin text-[#4BA500]" />
    </div>
  )

  if (error) return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  )

  return (
    <div className="bg-[#1F1F1F] text-[#DBDBDB] min-h-screen p-4">
      <h1 className="text-4xl font-bold text-center mb-4">LiquiSabi</h1>
      
      <div className="flex justify-center items-center mb-8 space-x-4">
      <Button
          variant="outline"
          size="icon"
          className="bg-transparent"
          onClick={() => window.open('https://github.com/turbolay/LiquiSabi/', '_blank')}
        >
          <Github className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="bg-transparent"
          onClick={() => window.open('https://x.com/LiquiSabi', '_blank')}
        >
          <Twitter className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="bg-transparent"
          onClick={() => window.open('https://njump.me/npub1u4rl3zlfa2efxslhypf4v6r8va5e0c9smxyr5676pxkyk0chn33s0teswa', '_blank')}
        >
          <svg width="21" height="24" viewBox="0 0 21 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.7084 10.1607C18.1683 13.3466 14.8705 14.0207 12.9733 13.9618C12.8515 13.958 12.7366 14.0173 12.6647 14.1157C12.4684 14.384 12.1547 14.7309 11.9125 14.7309C11.6405 14.7309 11.3957 15.254 11.284 15.5795C11.2723 15.6137 11.3059 15.6452 11.3403 15.634C14.345 14.6584 15.5241 14.3238 16.032 14.4178C16.4421 14.4937 17.209 15.8665 17.5413 16.5434C16.7155 16.5909 16.4402 15.8507 16.2503 15.7178C16.0985 15.6116 16.0415 16.0974 16.032 16.3536C15.8517 16.2587 15.6239 16.1259 15.6049 15.7178C15.5859 15.3098 15.3771 15.4142 15.2157 15.4332C15.0544 15.4521 12.5769 16.2493 12.2067 16.3536C11.8366 16.458 11.4094 16.6004 11.0582 16.8471C10.4697 17.1318 10.09 16.9325 9.98561 16.4485C9.90208 16.0614 10.4444 14.8701 10.726 14.3229C10.3779 14.4526 9.65529 14.7158 9.54898 14.7309C9.44588 14.7457 8.13815 15.7552 7.43879 16.3038C7.398 16.3358 7.37174 16.3827 7.36236 16.4336C7.25047 17.0416 6.89335 17.2118 6.27423 17.5303C5.77602 17.7867 4.036 20.4606 3.14127 21.9041C3.0794 22.0039 2.9886 22.0806 2.8911 22.1461C2.32279 22.5276 1.74399 23.4985 1.50923 23.9737C1.17511 23.0095 1.61048 22.1802 1.86993 21.886C1.75602 21.7873 1.49341 21.8449 1.37634 21.886C1.69907 20.7757 2.82862 20.7757 2.79066 20.7757C2.99948 20.5954 5.44842 17.0938 5.50538 16.9325C5.56187 16.7725 5.46892 16.0242 6.69975 15.6139C6.7193 15.6073 6.73868 15.5984 6.75601 15.5873C7.71493 14.971 8.43427 13.9774 8.67571 13.5542C7.39547 13.4662 5.92943 12.7525 5.16289 12.294C4.99765 12.1952 4.8224 12.1092 4.63108 12.0875C3.58154 11.9687 2.53067 12.6401 2.10723 13.0228C1.93258 12.7799 2.12938 12.0739 2.24961 11.7513C1.82437 11.6905 1.19916 12.308 0.939711 12.6243C0.658747 12.184 0.904907 11.397 1.06311 11.0585C0.501179 11.0737 0.120232 11.3306 0 11.4571C0.465109 7.99343 4.02275 9.00076 4.06259 9.04675C3.87275 8.84937 3.88857 8.59126 3.92021 8.48688C6.0749 8.54381 7.08105 8.18321 7.71702 7.81313C12.7288 5.01374 14.8882 6.73133 15.6856 7.1631C16.4829 7.59487 17.9304 7.77042 18.9318 7.37187C20.1278 6.83097 19.9478 5.43673 19.7054 4.90461C19.4397 4.32101 17.9399 3.51438 17.4084 2.49428C16.8768 1.47418 17.34 0.233672 17.9558 0.0607684C18.5425 -0.103972 18.9615 0.0876835 19.2831 0.378128C19.4974 0.571763 20.0994 0.710259 20.3509 0.800409C20.6024 0.890558 21.0201 1.00918 20.9964 1.08035C20.9726 1.15152 20.5699 1.14202 20.5075 1.14202C20.3794 1.14202 20.2275 1.161 20.3794 1.23217C20.5575 1.30439 20.8263 1.40936 20.955 1.47846C20.9717 1.48744 20.9683 1.51084 20.95 1.51577C20.0765 1.75085 19.2966 1.26578 18.7183 1.82526C18.1298 2.39463 19.3827 2.83114 20.0282 3.51438C20.6736 4.19762 21.3381 5.01372 20.8065 6.87365C20.395 8.31355 18.6703 9.53781 17.7795 10.0167C17.7282 10.0442 17.7001 10.1031 17.7084 10.1607Z" fill="white"/>
          </svg>


        </Button>
        <div className="flex items-center space-x-4 bg-[#202224] rounded-md p-3">
          <span className="text-white text-sm">If you find LiquiSabi useful</span>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleDonationClick}
            className="bg-[#4BA500] hover:bg-[#3a8400] text-white font-medium"
          >
            Donate
          </Button>
        </div>
      </div>

      <FiltersCard
        dateRange={dateRange}
        setDateRange={setDateRange}
        selectedCoordinators={selectedCoordinators}
        setSelectedCoordinators={setSelectedCoordinators}
        availableCoordinators={availableCoordinators}
        autoReload={autoReload}
        setAutoReload={setAutoReload}
        useUTC={useUTC}
        setUseUTC={setUseUTC}
      />

      {total && <TotalCard total={total} />}

      {summary && <AveragesCard summary={summary} />}

      <GraphCard useUTC={useUTC} selectedCoordinators={selectedCoordinators} />
      <RoundsCard rounds={rounds} useUTC={useUTC} />

      <Dialog open={isDonationDialogOpen} onOpenChange={setIsDonationDialogOpen}>
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader className="space-y-4">
        <DialogTitle className="text-2xl">Donate to LiquiSabi</DialogTitle>
        <DialogDescription className="pt-2">
          {isDonationLoading ? (
            <div className="flex flex-col items-center justify-center space-y-4 py-6">
              <RefreshCcw className="h-12 w-12 animate-spin text-[#4BA500]" />
              <p className="text-center text-sm">For protection against spam, this can take a while</p>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between font-mono bg-gray-100 p-4 rounded-md break-all">
                <span className="mr-2 mb-2 sm:mb-0 text-sm sm:text-base">{donationAddress}</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => copyToClipboard(donationAddress, e)}
                        className="p-1 hover:bg-[#4BA500] hover:text-white"
                      >
                        {copiedAddress === donationAddress ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{copiedAddress === donationAddress ? 'Copied!' : 'Copy address'}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-sm text-gray-500 text-center">Powered by Wasabi Wallet</p>
            </div>
          )}
        </DialogDescription>
      </DialogHeader>
    </DialogContent>
  </Dialog>
    </div>
  )
}