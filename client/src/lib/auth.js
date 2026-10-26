import { createAuthClient } from 'better-auth/react';
import { usernameClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
  baseURL: window.location.origin,
  plugins: [usernameClient()],
});

export const { useSession, signIn, signUp, signOut } = authClient;
