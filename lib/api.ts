export const fetchData = async (dateRange, selectedCoordinators) => {
  const params = {
    since: dateRange.since.toISOString(),
    until: dateRange.until.toISOString(),
    coordinatorEndpoint: selectedCoordinators.length ? selectedCoordinators : undefined
  }

  const [summaryRes, roundsRes] = await Promise.all([
    fetch('/api', {
      method: 'POST',
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "1",
        method: "average",
        params
      })
    }),
    fetch('/api', {
      method: 'POST',
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "2",
        method: "rounds",
        params
      })
    })
  ])

  const summaryData = await summaryRes.json()
  const roundsData = await roundsRes.json()

  return { summaryData, roundsData }
}

export const fetchGraphData = async (selectedCoordinators: string[]) => {
  const response = await fetch('/api', {
    method: 'POST',
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "3",
      method: "graph",
      params: { coordinatorEndpoint: selectedCoordinators.length ? selectedCoordinators : undefined }
    })
  })

  const data = await response.json()
  return data.result
}