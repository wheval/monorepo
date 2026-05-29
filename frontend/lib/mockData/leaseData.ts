/** Active deal ID for repayment method API (set via env in deployed environments). */
export const tenantDealId =
  process.env.NEXT_PUBLIC_TENANT_DEAL_ID ?? "00000000-0000-4000-8000-000000000001";

export const leaseDetails = {
  property: {
    title: "Modern 3 Bedroom Flat",
    address: "15 Admiralty Way, Lekki Phase 1, Lagos",
    type: "Apartment",
    beds: 3,
    baths: 2,
    sqm: 120,
  },
  lease: {
    startDate: "Jan 1, 2025",
    endDate: "Dec 31, 2025",
    duration: "12 months",
    annualRent: 2580000,
    monthlyPayment: 215000,
    deposit: 516000,
    status: "Active",
  },
  landlord: {
    name: "Chief Emeka Okonkwo",
    company: "Okonkwo Properties Ltd",
    phone: "+234 803 456 7890",
    email: "chief@okonkwoproperties.com",
  },
  documents: [
    {
      id: 1,
      name: "Lease Agreement",
      date: "Jan 1, 2025",
      type: "PDF",
      size: "2.4 MB",
      status: "signed",
    },
    {
      id: 2,
      name: "Property Inspection Report",
      date: "Dec 28, 2024",
      type: "PDF",
      size: "1.8 MB",
      status: "completed",
    },
    {
      id: 3,
      name: "Payment Schedule",
      date: "Jan 1, 2025",
      type: "PDF",
      size: "0.8 MB",
      status: "active",
    },
    {
      id: 4,
      name: "House Rules",
      date: "Jan 1, 2025",
      type: "PDF",
      size: "1.2 MB",
      status: "acknowledged",
    },
  ],
  paymentProgress: {
    totalPaid: 1290000,
    totalOwed: 2580000,
    paymentsCompleted: 6,
    totalPayments: 12,
  },
};
