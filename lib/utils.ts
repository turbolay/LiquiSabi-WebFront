import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatDate = (dateString: string, useUTC: boolean = false) => {
  const date = new Date(dateString)
  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }
  
  if (useUTC) {
    options.timeZone = 'UTC'
  }

  return new Intl.DateTimeFormat('en-GB', options).format(date)
}

export const truncateTxId = (txId: string) => `${txId.slice(0, 4)}...${txId.slice(-4)}`

export const formatNumber = (number: number, decimals = 0) => {
  return number.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}
