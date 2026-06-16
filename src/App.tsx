import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Upload from '@/pages/candidate/Upload';
import ResumePage from '@/pages/candidate/Resume';
import Jobs from '@/pages/hr/Jobs';
import NewJob from '@/pages/hr/NewJob';
import JobDetail from '@/pages/hr/JobDetail';
import Candidates from '@/pages/hr/Candidates';
import useAuthStore from '@/store/authStore';

function AppRoutes() {
  const { loadUser } = useAuthStore();

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route
          path="/candidate/upload"
          element={
            <ProtectedRoute role="candidate">
              <Upload />
            </ProtectedRoute>
          }
        />
        <Route
          path="/candidate/resume"
          element={
            <ProtectedRoute role="candidate">
              <ResumePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hr/jobs"
          element={
            <ProtectedRoute role="hr">
              <Jobs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hr/jobs/new"
          element={
            <ProtectedRoute role="hr">
              <NewJob />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hr/jobs/:id"
          element={
            <ProtectedRoute role="hr">
              <JobDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hr/candidates"
          element={
            <ProtectedRoute role="hr">
              <Candidates />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}
