import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { useEffect } from 'react'
import { loadUserFromStorage } from './features/auth/authActions'
import Layout from './components/layout/Layout'
import Login from './pages/auth/Login'
import Dashboard from './pages/Dashboard'
import Users from './pages/admin/Users'
import Departments from './pages/admin/Departments'
import Courses from './pages/admin/Courses'
import Subjects from './pages/academic/Subjects'
import Assignments from './pages/academic/Assignments'
import Attendance from './pages/academic/Attendance'
import Placement from './pages/placement/Placement'
import Requests from './pages/requests/Requests'
import Profile from './pages/Profile'

function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated } = useSelector((state) => state.auth)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

function App() {
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(loadUserFromStorage())
  }, [dispatch])

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />

        <Route
          path="/users"
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'college_admin']}>
              <Users />
            </ProtectedRoute>
          }
        />
        <Route
          path="/departments"
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'college_admin']}>
              <Departments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses"
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'college_admin']}>
              <Courses />
            </ProtectedRoute>
          }
        />
        <Route
          path="/subjects"
          element={
            <ProtectedRoute
              allowedRoles={['super_admin', 'college_admin', 'faculty']}
            >
              <Subjects />
            </ProtectedRoute>
          }
        />
        <Route
          path="/assignments"
          element={
            <ProtectedRoute
              allowedRoles={[
                'super_admin',
                'college_admin',
                'faculty',
                'student'
              ]}
            >
              <Assignments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/attendance"
          element={
            <ProtectedRoute
              allowedRoles={[
                'super_admin',
                'college_admin',
                'faculty',
                'student'
              ]}
            >
              <Attendance />
            </ProtectedRoute>
          }
        />
        <Route
          path="/placement"
          element={
            <ProtectedRoute
              allowedRoles={[
                'super_admin',
                'college_admin',
                'placement_officer',
                'student'
              ]}
            >
              <Placement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/requests"
          element={
            <ProtectedRoute
              allowedRoles={[
                'super_admin',
                'college_admin',
                'faculty',
                'student'
              ]}
            >
              <Requests />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App
