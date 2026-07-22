import { Outlet } from 'react-router-dom'
import { SiteDataProvider, useSiteData } from '../context/SiteDataContext'
import Header from './Header'
import Footer from './Footer'
import FloatingMessengers from './FloatingMessengers'
import StickyCTA from './StickyCTA'
import ScrollToTop from './ScrollToTop'
import VisitTracker from './VisitTracker'
import Analytics from './Analytics'
import JsonLd from './JsonLd'
import { buildOrganizationSchema } from '../utils/structuredData'

function OrganizationJsonLd() {
  const { settings } = useSiteData()
  return <JsonLd data={buildOrganizationSchema(settings)} />
}

export default function Layout() {
  return (
    <SiteDataProvider>
      <ScrollToTop />
      <VisitTracker />
      <Analytics />
      <OrganizationJsonLd />
      <Header />
      <main className="site-main">
        <Outlet />
      </main>
      <Footer />
      <FloatingMessengers />
      <StickyCTA />
    </SiteDataProvider>
  )
}
