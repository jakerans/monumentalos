import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ClientManagement() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate(createPageUrl('OnboardDashboard'), { replace: true });
  }, [navigate]);
  return null;
}