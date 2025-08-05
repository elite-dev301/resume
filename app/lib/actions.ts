'use server';

import { signIn, signOut } from '@/auth';
import { AuthError } from 'next-auth';
import { isRedirectError, redirect } from "next/dist/client/components/redirect";

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn('credentials', formData);
  } catch (error) {

    if (isRedirectError(error)) {
      throw error;
    }

    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    return `Auth Error ${error}`;
  }
}

export async function signout(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signOut();
    redirect('/auth/signin');
  } catch (error) {

    if (isRedirectError(error)) {
      throw error;
    }

    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    return `Auth Error ${error}`;
  }
}