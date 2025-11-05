'use client';

import { SignUp } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { useTheme } from 'next-themes';

export default function Page() {
  const { resolvedTheme } = useTheme();

  return (
    <SignUp
      appearance={{
        baseTheme: resolvedTheme === 'dark' ? dark : undefined,
        variables: {
          colorPrimary: '#0F172A',
          colorBackground: '#F8FAFC',
          colorText: '#0F172A',
          colorInputBackground: '#FFFFFF',
          colorInputText: '#0F172A',
        },
      }}
    />
  );
}