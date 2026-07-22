import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Portfolio from './pages/Portfolio'
import CatalogIndex from './pages/CatalogIndex'
import CatalogPage from './pages/CatalogPage'
import Contacts from './pages/Contacts'
import LegalPage from './pages/LegalPage'
import NotFound from './pages/NotFound'
import { LeadModalProvider } from './components/LeadModal'

// Админку видят только сотрудники, а не обычные посетители сайта, поэтому
// выносим её в отдельный чанк (динамический import) — публичные страницы
// не должны скачивать и парсить код панели управления.
const AdminLayout = lazy(() => import('./admin/AdminLayout'))
const AdminLogin = lazy(() => import('./admin/AdminLogin'))
const AdminDashboard = lazy(() => import('./admin/AdminDashboard'))
const AdminContent = lazy(() => import('./admin/AdminContent'))
const AdminLeads = lazy(() => import('./admin/AdminLeads'))
const AdminPortfolio = lazy(() => import('./admin/AdminPortfolio'))
const AdminCatalog = lazy(() => import('./admin/AdminCatalog'))
const AdminHome = lazy(() => import('./admin/AdminHome'))
const AdminLegal = lazy(() => import('./admin/AdminLegal'))

export default function App() {
  return (
    <LeadModalProvider>
      <Suspense fallback={<div className="route-loading" aria-hidden="true" />}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="services" element={<Navigate to="/catalog/uslugi/obzor" replace />} />
            <Route path="portfolio" element={<Portfolio />} />
            <Route path="catalog" element={<CatalogIndex />} />
            <Route path="catalog/*" element={<CatalogPage />} />
            <Route path="contacts" element={<Contacts />} />
            <Route path="legal/:doc" element={<LegalPage />} />
            <Route path="*" element={<NotFound />} />
          </Route>
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="home" element={<AdminHome />} />
            <Route path="hero" element={<Navigate to="/admin/home" replace />} />
            <Route path="services" element={<Navigate to="/admin/home" replace />} />
            <Route path="content" element={<AdminContent />} />
            <Route path="legal" element={<AdminLegal />} />
            <Route path="catalog" element={<AdminCatalog />} />
            <Route path="portfolio" element={<AdminPortfolio />} />
            <Route path="leads" element={<AdminLeads />} />
          </Route>
        </Routes>
      </Suspense>
    </LeadModalProvider>
  )
}
