import { useCallback, useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import DonationModal from '../components/DonationModal'

async function loadDonationTotal() {
  const response = await fetch('/api/donations/total')

  if (!response.ok) {
    throw new Error('Unable to load the donation total.')
  }

  const data = await response.json()

  if (typeof data.totalCents !== 'number') {
    throw new Error('Invalid donation total response.')
  }

  return data.totalCents
}

/**
 * Public shell: sticky header, routed page content, footer, and the global
 * donation modal. Homepage receives donation state through the outlet context.
 */
export default function PublicLayout() {
  const [isDonationOpen, setIsDonationOpen] = useState(false)
  const [donationTotalCents, setDonationTotalCents] = useState(null)
  const location = useLocation()

  const refreshDonationTotal = useCallback(() => {
    loadDonationTotal()
      .then(setDonationTotalCents)
      .catch(() => {
        // The donation total is decorative; keep the page usable on failure.
      })
  }, [])

  useEffect(() => {
    refreshDonationTotal()
  }, [refreshDonationTotal])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  const openDonation = useCallback(() => setIsDonationOpen(true), [])

  return (
    <div className="app-shell">
      <Header onDonate={openDonation} />

      <Outlet
        context={{ onDonate: openDonation, donationTotalCents }}
      />

      <Footer />

      {isDonationOpen && (
        <DonationModal
          onClose={() => setIsDonationOpen(false)}
          onDonationSuccess={refreshDonationTotal}
        />
      )}
    </div>
  )
}
