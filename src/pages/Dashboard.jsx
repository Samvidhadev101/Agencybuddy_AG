import React from 'react';
import { useApp } from '../context/AppContext';
import Tier1Dashboard from './Tier1Dashboard';
import Tier2Dashboard from './Tier2Dashboard';
import Tier3Dashboard from './Tier3Dashboard';

export default function Dashboard() {
  const { userProfile } = useApp();

  if (!userProfile) return null;

  const { role } = userProfile;

  if (role === 'admin') {
    return <Tier1Dashboard />;
  }

  if (role === 'manager') {
    return <Tier2Dashboard />;
  }

  if (role === 'executive' || role === 'custom') {
    return <Tier3Dashboard />;
  }

  // Fallback
  return <Tier3Dashboard />;
}
