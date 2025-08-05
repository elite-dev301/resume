"use client";

import { useActionState, useEffect, useState } from 'react';
import { TextField, Button, Container, Typography, Box } from '@mui/material';
import { useSearchParams } from 'next/navigation';
import { authenticate } from '@/app/lib/actions';
import { useFormState, useFormStatus } from 'react-dom';

const SubmitButton = () => {

  const {pending} = useFormStatus();

  return (
    <Button
      type="submit"
      fullWidth
      variant="contained"
      sx={{ mt: 3, mb: 2 }}
      loading={pending}
    >
      Sign In
    </Button>
  )
}

export const LoginForm = () => {
  const [userID, setUserID] = useState('');
  const [password, setPassword] = useState('');

  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const [errorMessage, formAction] = useFormState(
    authenticate,
    undefined,
  );

  return (
    <Container maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h5">
          Sign In
        </Typography>
        <Box sx={{ mt: 1 }}>
          <form action={formAction}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="userID"
              label="User ID"
              name="userID"
              autoComplete="userID"
              autoFocus
              value={userID}
              onChange={(e) => setUserID(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {errorMessage && (
              <Typography color="error" variant="body2">
                {errorMessage}
              </Typography>
            )}
            <input type="hidden" name="redirectTo" value={callbackUrl} />
            <SubmitButton />
          </form>
        </Box>
      </Box>
    </Container>
  );
}