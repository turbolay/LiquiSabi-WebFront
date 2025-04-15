// @ts-nocheck
import React, { useState, useMemo } from 'react'
import { ChevronDown, ChevronUp, Copy, Check, ExternalLink, Search } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"
import { formatDate, formatNumber, truncateTxId } from '@/lib/utils'

export default function RoundsCard({ rounds, useUTC }) {
  const [collapsed, setCollapsed] = useState(false)
  const [expandedRows, setExpandedRows] = useState({})
  const [sortConfig, setSortConfig] = useState({ key: 'RoundEndTime', direction: 'descending' })
  const [copiedTxId, setCopiedTxId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  const handleSort = (key) => {
    let direction = 'ascending'
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending'
    }
    setSortConfig({ key, direction })
  }

  const filteredAndSortedRounds = useMemo(() => {
    let filteredRounds = rounds.filter(round => 
      round.TxId.toLowerCase().includes(searchTerm.toLowerCase())
    )
    
    if (sortConfig.key !== null) {
      filteredRounds.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1
        }
        return 0
      })
    }
    return filteredRounds
  }, [rounds, sortConfig, searchTerm])

  const copyToClipboard = (text) => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedTxId(text)
        setTimeout(() => setCopiedTxId(null), 2000)
      })
    } else {
      // Fallback for older browsers
      const textArea = document.createElement("textarea")
      textArea.value = text
      textArea.style.position = "fixed"
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      try {
        document.execCommand('copy')
        setCopiedTxId(text)
        setTimeout(() => setCopiedTxId(null), 2000)
      } catch (err) {
        console.error('Failed to copy: ', err)
      }
      document.body.removeChild(textArea)
    }
  }

  const openInMempool = (txId) => {
    window.open(`https://mempool.space/tx/${txId}`, '_blank')
  }

  const exportJSON = () => {
    const jsonString = `data:text/json;chatset=utf-8,${encodeURIComponent(
      JSON.stringify(rounds, null, 2)
    )}`
    const link = document.createElement("a")
    link.href = jsonString
    link.download = "coinjoin_data.json"
    link.click()
  }

  return (
    <Card className="bg-[#2a2a2a] border-[#3a3a3a] overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-3">
        <CardTitle className="text-[#DBDBDB] text-xl">Rounds</CardTitle>
        <div className="flex items-center space-x-2">
          {!collapsed && (
            <>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search TxID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 bg-[#3a3a3a] border-[#4a4a4a] text-[#DBDBDB]"
                />
              </div>
              <Button onClick={exportJSON} className="bg-[#4BA500] hover:bg-[#3a8400] text-white">
                Export JSON
              </Button>
            </>
          )}
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
          <div className="overflow-x-auto">
            <Table className="w-full border-collapse">
              <TableHeader>
                <TableRow className="border-b border-[#3a3a3a]">
                  <TableHead className="text-center cursor-pointer text-[#DBDBDB] font-bold hover:bg-transparent" onClick={() => handleSort('RoundEndTime')}>
                    Finished {sortConfig.key === 'RoundEndTime' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}
                  </TableHead>
                  <TableHead className="text-center cursor-pointer text-[#DBDBDB] font-bold hover:bg-transparent" onClick={() => handleSort('CoordinatorEndpoint')}>
                    Coordinator {sortConfig.key === 'CoordinatorEndpoint' &&  (sortConfig.direction === 'ascending' ? '▲' : '▼')}
                  </TableHead>
                  <TableHead className="text-center cursor-pointer text-[#DBDBDB] font-bold hover:bg-transparent" onClick={() => handleSort('TxId')}>
                    TxId {sortConfig.key === 'TxId' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}
                  </TableHead>
                  <TableHead className="text-center cursor-pointer text-[#DBDBDB] font-bold hover:bg-transparent" onClick={() => handleSort('InputCount')}>
                    Input Count {sortConfig.key === 'InputCount' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}
                  </TableHead>
                  <TableHead className="text-center cursor-pointer text-[#DBDBDB] font-bold hover:bg-transparent" onClick={() => handleSort('OutputCount')}>
                    Output Count {sortConfig.key === 'OutputCount' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}
                  </TableHead>
                  <TableHead className="text-center cursor-pointer text-[#DBDBDB] font-bold hover:bg-transparent" onClick={() => handleSort('AverageStandardOutputsAnonSet')}>
                    Avg Std Outputs Anon Set {sortConfig.key === 'AverageStandardOutputsAnonSet' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}
                  </TableHead>
                  <TableHead className="text-center text-[#DBDBDB] font-bold">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedRounds.map((round) => (
                  <React.Fragment key={round.TxId}>
                    <TableRow className="hover:bg-[#2a2a2a] transition-colors">
                      <TableCell className="text-center text-[#DBDBDB]">{formatDate(round.RoundEndTime, useUTC)}</TableCell>
                      <TableCell className="text-center text-[#DBDBDB]">{round.CoordinatorEndpoint}</TableCell>
                      <TableCell className="text-center font-mono text-[#DBDBDB]">
                        <div className="flex items-center justify-center space-x-2">
                          <span>{truncateTxId(round.TxId)}</span>
                          <div className="flex space-x-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      copyToClipboard(round.TxId)
                                    }}
                                    className="p-1 hover:bg-[#4BA500] hover:text-white"
                                  >
                                    {copiedTxId === round.TxId ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{copiedTxId === round.TxId ? 'Copied!' : 'Copy TxId'}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      openInMempool(round.TxId)
                                    }}
                                    className="p-1 hover:bg-[#4BA500] hover:text-white"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>View on mempool.space</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-[#DBDBDB]">{formatNumber(round.InputCount)}</TableCell>
                      <TableCell className="text-center text-[#DBDBDB]">{formatNumber(round.OutputCount)}</TableCell>
                      <TableCell className="text-center text-[#DBDBDB]">{formatNumber(round.AverageStandardOutputsAnonSet, 2)}</TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedRows({...expandedRows, [round.TxId]: !expandedRows[round.TxId]})}
                          className="hover:bg-[#4BA500] hover:text-white"
                        >
                          {expandedRows[round.TxId] ? <ChevronUp className="h-4 w-4 text-[#DBDBDB]" /> : <ChevronDown className="h-4 w-4 text-[#DBDBDB]" />}
                        </Button>
                      </TableCell>
                    </TableRow>
                    {expandedRows[round.TxId] && (
                      <TableRow>
                        <TableCell colSpan={7} className="p-0">
                          <div className="bg-[#2a2a2a] p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center">
                              <p className="text-sm font-semibold text-gray-400">Coordination Fee</p>
                              <p className="text-lg text-[#DBDBDB]">
                                {formatNumber(round.CoordinationFeeRate * 100, 2)} <span className="text-sm text-gray-400">%</span>
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-sm font-semibold text-gray-400">Mining Fee Rate</p>
                              <p className="text-lg text-[#DBDBDB]">
                                {formatNumber(round.FinalMiningFeeRate, 2)} <span className="text-sm text-gray-400">sats/vb</span>
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-sm font-semibold text-gray-400">Mining Fee</p>
                              <p className="text-lg text-[#DBDBDB]">
                                {formatNumber(round.TotalMiningFee)} <span className="text-sm text-gray-400">sats</span>
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-sm font-semibold text-gray-400">Total Leftovers</p>
                              <p className="text-lg text-[#DBDBDB]">
                                {formatNumber(round.TotalLeftovers)} <span className="text-sm text-gray-400">sats</span>
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-sm font-semibold text-gray-400">Total Input Amount</p>
                              <p className="text-lg text-[#DBDBDB]">
                                {formatNumber(round.TotalInputAmount / 100000000, 2)} <span className="text-sm text-gray-400"> BTC</span>
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-sm font-semibold text-gray-400">Fresh Inputs Est.</p>
                              <p className="text-lg text-[#DBDBDB]">
                                {formatNumber(round.FreshInputsEstimateBtc, 2)} <span className="text-sm text-gray-400">BTC</span>
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-sm font-semibold text-gray-400">Avg Std. Inputs Anon Set</p>
                              <p className="text-lg text-[#DBDBDB]">{formatNumber(round.AverageStandardInputsAnonSet, 2)}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-sm font-semibold text-gray-400">Change Outputs Amount</p>
                              <p className="text-lg text-[#DBDBDB]">
                                {formatNumber(round.ChangeOutputsAmountRatio * 100, 2)} <span className="text-sm text-gray-400">%</span>
                              </p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
