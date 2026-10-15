import React from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from '../components/Layout/AppLayout';
import HomePage from '../pages/Home/HomePage';
import FamiliesPage from '../pages/Families/FamiliesPage';
import VolunteersPage from '../pages/Volunteers/VolunteersPage';
import VolunteerDetailPage from '../pages/Volunteers/VolunteerDetailPage';
import RidesPage from '../pages/Rides/RidesPage';
import MatchingPage from '../pages/Matching/MatchingPage';

const AppRoutes: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="families" element={<FamiliesPage />} />
          <Route path="volunteers" element={<VolunteersPage />} />
          <Route path="volunteers/:id" element={<VolunteerDetailPage />} />
          <Route path="rides" element={<RidesPage />} />
          <Route path="matching" element={<MatchingPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default AppRoutes;
