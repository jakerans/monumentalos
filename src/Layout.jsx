import React from 'react';
import { Toaster } from '@/components/ui/toaster';

export default function Layout({ children }) {
  return (
    <>
      {children}
      <Toaster />
    </>
  );
}