import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import './styles/blog.css'
import './styles/admin.css'
import AboutMe from './components/AboutMe'
import Homepage from './components/Homepage'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'
import AdminLayout from './layouts/AdminLayout'
import PublicLayout from './layouts/PublicLayout'
import BlogDetailPage from './pages/BlogDetailPage'
import BlogListPage from './pages/BlogListPage'
import NotFoundPage from './pages/NotFoundPage'
import AdminBlogEditorPage from './pages/admin/AdminBlogEditorPage'
import AdminBlogListPage from './pages/admin/AdminBlogListPage'
import AdminLoginPage from './pages/admin/AdminLoginPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public marketing site + blog */}
          <Route element={<PublicLayout />}>
            <Route index element={<Homepage />} />
            <Route path="about" element={<AboutMe />} />
            <Route path="blogs" element={<BlogListPage />} />
            <Route path="blogs/:slug" element={<BlogDetailPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          {/* Admin authentication */}
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* Admin CMS (guarded by Sanctum session + is_admin) */}
          <Route path="/admin" element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/blogs" replace />} />
              <Route path="blogs" element={<AdminBlogListPage />} />
              <Route path="blogs/new" element={<AdminBlogEditorPage />} />
              <Route path="blogs/:id/edit" element={<AdminBlogEditorPage />} />
              <Route
                path="*"
                element={<Navigate to="/admin/blogs" replace />}
              />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
