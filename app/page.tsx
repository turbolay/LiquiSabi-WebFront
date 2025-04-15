import type { Metadata } from 'next'
import Dashboard from '@/components/Dashboard'

export const metadata: Metadata = {
  title: 'LiquiSabi: WabiSabi Liquidity Status',
  description: 'Bot tracking rounds broadcasted by WabiSabi coordinators publishing themselves on Nostr.',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function Home() {
  return <Dashboard />
}
