// Mock data storage - in a real app, this would be a database
const transactions = [
  {
    id: "1",
    date: "2023-04-01T10:30:00Z",
    from: "Main Warehouse",
    to: "Workshop A",
    voucherType: "Issue",
    voucherNo: "ISS-001",
    metalType: "Gold",
    weight: 31.2,
  },
  {
    id: "2",
    date: "2023-04-02T14:15:00Z",
    from: "Supplier XYZ",
    to: "Main Warehouse",
    voucherType: "Receipt",
    voucherNo: "REC-001",
    metalType: "Gold",
    weight: 50.0,
  },
  {
    id: "3",
    date: "2023-04-03T09:45:00Z",
    from: "Workshop A",
    to: "Main Warehouse",
    voucherType: "Receipt",
    voucherNo: "REC-002",
    metalType: "Gold",
    weight: 9.0,
  },
  {
    id: "4",
    date: "2023-04-04T11:20:00Z",
    from: "Main Warehouse",
    to: "Showroom B",
    voucherType: "Issue",
    voucherNo: "ISS-002",
    metalType: "Diamond",
    weight: 50.25,
  },
  {
    id: "5",
    date: "2023-04-05T16:30:00Z",
    from: "Supplier ABC",
    to: "Main Warehouse",
    voucherType: "Receipt",
    voucherNo: "REC-003",
    metalType: "Diamond",
    weight: 75.5,
  },
  {
    id: "6",
    date: "2023-04-06T13:10:00Z",
    from: "Supplier DEF",
    to: "Main Warehouse",
    voucherType: "Receipt",
    voucherNo: "REC-004",
    metalType: "Silver",
    weight: 350.0,
  },
  {
    id: "7",
    date: "2023-04-07T10:45:00Z",
    from: "Main Warehouse",
    to: "Workshop C",
    voucherType: "Issue",
    voucherNo: "ISS-003",
    metalType: "Silver",
    weight: 125.75,
  },
  {
    id: "8",
    date: "2023-04-08T09:30:00Z",
    from: "Supplier GHI",
    to: "Main Warehouse",
    voucherType: "Receipt",
    voucherNo: "REC-005",
    metalType: "Platinum",
    weight: 45.25,
  },
  {
    id: "9",
    date: "2023-04-09T14:20:00Z",
    from: "Workshop A",
    to: "Nitesh",
    voucherType: "Issue",
    voucherNo: "ISS-004",
    metalType: "Gold",
    weight: 10.0,
  },
  {
    id: "10",
    date: "2023-04-10T11:15:00Z",
    from: "Nitesh",
    to: "Atho",
    voucherType: "Issue",
    voucherNo: "ISS-005",
    metalType: "Gold",
    weight: 31.2,
  },
  {
    id: "11",
    date: "2023-04-11T13:45:00Z",
    from: "Subodh",
    to: "Nitesh",
    voucherType: "Issue",
    voucherNo: "ISS-006",
    metalType: "Gold",
    weight: 9.0,
  },
  {
    id: "12",
    date: "2023-04-12T15:30:00Z",
    from: "Atho",
    to: "Subodh",
    voucherType: "Issue",
    voucherNo: "ISS-007",
    metalType: "Gold",
    weight: 10.0,
  },
]

// Get all transactions
export function getTransactions() {
  // Sort by date, newest first
  return [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

// Get transactions for a specific party
export function getTransactionsByParty(partyName) {
  return [...transactions]
    .filter((t) => t.from === partyName || t.to === partyName)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

// Add a new transaction
export function addTransaction(transaction) {
  transactions.push(transaction)
}

// Calculate balances by metal type
export function calculateMetalBalances() {
  const balanceMap = new Map()

  // Process all transactions
  transactions.forEach((transaction) => {
    const { voucherType, metalType, weight } = transaction

    // Get or initialize the balance for this metal type
    if (!balanceMap.has(metalType)) {
      balanceMap.set(metalType, {
        metalType,
        issuedQty: 0,
        receiptQty: 0,
        balanceQty: 0,
      })
    }

    const balance = balanceMap.get(metalType)

    // Update quantities
    if (voucherType === "Issue") {
      balance.issuedQty += weight
    } else {
      balance.receiptQty += weight
    }

    // Calculate balance
    balance.balanceQty = balance.receiptQty - balance.issuedQty
  })

  // Convert map to array and sort by metal type
  return Array.from(balanceMap.values()).sort((a, b) => a.metalType.localeCompare(b.metalType))
}

// Calculate party balances with DR/CR format
export function getPartyMetalBalances() {
  const partyMap = new Map()

  // Get unique parties
  const uniqueParties = Array.from(new Set([...transactions.map((t) => t.from), ...transactions.map((t) => t.to)]))

  // Initialize party balances
  uniqueParties.forEach((party) => {
    partyMap.set(party, {
      party,
      goldDr: 0,
      goldCr: 0,
      diamondDr: 0,
      diamondCr: 0,
      silverDr: 0,
      silverCr: 0,
      platinumDr: 0,
      platinumCr: 0,
      totalBalance: 0,
    })
  })

  // Process all transactions
  transactions.forEach((transaction) => {
    const { from, to, metalType, weight } = transaction

    // Get party balances
    const fromParty = partyMap.get(from)
    const toParty = partyMap.get(to)

    // Update DR/CR balances based on metal type
    if (metalType === "Gold") {
      fromParty.goldDr += weight // From party is debited (DR)
      toParty.goldCr += weight // To party is credited (CR)
    } else if (metalType === "Diamond") {
      fromParty.diamondDr += weight
      toParty.diamondCr += weight
    } else if (metalType === "Silver") {
      fromParty.silverDr += weight
      toParty.silverCr += weight
    } else if (metalType === "Platinum") {
      fromParty.platinumDr += weight
      toParty.platinumCr += weight
    }

    // Calculate total balances
    fromParty.totalBalance =
      fromParty.goldCr -
      fromParty.goldDr +
      (fromParty.diamondCr - fromParty.diamondDr) +
      (fromParty.silverCr - fromParty.silverDr) +
      (fromParty.platinumCr - fromParty.platinumDr)

    toParty.totalBalance =
      toParty.goldCr -
      toParty.goldDr +
      (toParty.diamondCr - toParty.diamondDr) +
      (toParty.silverCr - toParty.silverDr) +
      (toParty.platinumCr - toParty.platinumDr)
  })

  // Convert map to array and sort by party name
  return Array.from(partyMap.values()).sort((a, b) => a.party.localeCompare(b.party))
}

// Calculate overall balances (for summary cards)
export function calculateBalances() {
  let goldBalance = 0
  let diamondBalance = 0
  let totalIssued = 0
  let totalReceived = 0

  transactions.forEach((transaction) => {
    const { voucherType, metalType, weight } = transaction

    if (voucherType === "Receipt") {
      if (metalType === "Gold") {
        goldBalance += weight
      } else if (metalType === "Diamond") {
        diamondBalance += weight
      }
      totalReceived += weight
    } else {
      if (metalType === "Gold") {
        goldBalance -= weight
      } else if (metalType === "Diamond") {
        diamondBalance -= weight
      }
      totalIssued += weight
    }
  })

  return {
    goldBalance,
    diamondBalance,
    totalIssued,
    totalReceived,
  }
}
