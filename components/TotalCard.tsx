import React, { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { formatNumber } from '@/lib/utils'

export default function TotalCard({ total }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <Card className="bg-[#2a2a2a] border-[#3a3a3a] mb-6">
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-3">
        <CardTitle className="text-[#DBDBDB] text-xl">Total</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="hover:bg-[#4BA500] hover:text-white"
        >
          {collapsed ? <ChevronDown className="h-4 w-4 text-[#DBDBDB]" /> : <ChevronUp className="h-4 w-4 text-[#DBDBDB]" />}
        </Button>
      </CardHeader>
      {!collapsed && (
        <CardContent className="pt-2">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-400">Number of Rounds</p>
              <p className="text-2xl font-bold text-[#DBDBDB]">{formatNumber(total.NumberOfRounds)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-400">Input Count</p>
              <p className="text-2xl font-bold text-[#DBDBDB]">{formatNumber(total.InputCount)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-400">Output Count</p>
              <p className="text-2xl font-bold text-[#DBDBDB]">{formatNumber(total.OutputCount)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-400">Input Amount</p>
              <p className="text-2xl font-bold text-[#DBDBDB]">
                {formatNumber(total.TotalInputAmount, 2)} <span className="text-sm text-gray-400">BTC</span>
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-400">Fresh Inputs Est.</p>
              <p className="text-2xl font-bold text-[#DBDBDB]">
                {formatNumber(total.FreshInputsEstimateBtc, 2)} <span className="text-sm text-gray-400">BTC</span>
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-400">Coordinator Earnings Est.</p>
              <p className="text-2xl font-bold text-[#DBDBDB]">
                {formatNumber(total.EstimatedCoordinatorEarningsSats)} <span className="text-sm text-gray-400">sats</span>
              </p>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
