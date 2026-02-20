import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function RevenueDashboard() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate(createPageUrl('AccountingPL'), { replace: true });
  }, [navigate]);
  return null;
}