import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface ErrorAlertProps {
  error: string | Error;
  title?: string;
  className?: string;
}

export function ErrorAlert({ error, title = "Error", className }: ErrorAlertProps) {
  const errorMessage = typeof error === 'string' ? error : error.message;

  return (
    <Alert variant="destructive" className={className}>
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{errorMessage}</AlertDescription>
    </Alert>
  );
}
