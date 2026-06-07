import { LinkedProvider } from '@prisma/client';
import type { DecodedIdToken } from 'firebase-admin/auth';

const FIREBASE_PROVIDER_MAP: Record<string, LinkedProvider> = {
  'google.com': LinkedProvider.Google,
  'facebook.com': LinkedProvider.Facebook,
  'twitter.com': LinkedProvider.Twitter,
  'linkedin.com': LinkedProvider.LinkedIn,
  'apple.com': LinkedProvider.Apple,
  'microsoft.com': LinkedProvider.Microsoft,
  'github.com': LinkedProvider.GitHub,
  'yahoo.com': LinkedProvider.Yahoo,
};

export interface FirebaseProviderLink {
  provider: LinkedProvider;
  providerUserId: string;
}

export function mapFirebaseProvider(firebaseProvider: string): LinkedProvider | null {
  return FIREBASE_PROVIDER_MAP[firebaseProvider] ?? null;
}

export function extractFirebaseProviderLinks(decoded: DecodedIdToken): FirebaseProviderLink[] {
  const identities = decoded.firebase?.identities ?? {};
  const links: FirebaseProviderLink[] = [];

  for (const [firebaseProvider, providerIds] of Object.entries(identities)) {
    const provider = mapFirebaseProvider(firebaseProvider);
    const providerUserId = providerIds?.[0];

    if (!provider || !providerUserId) {
      continue;
    }

    links.push({ provider, providerUserId });
  }

  const signInProvider = decoded.firebase?.sign_in_provider;
  if (signInProvider) {
    const provider = mapFirebaseProvider(signInProvider);
    if (provider && !links.some((link) => link.provider === provider)) {
      links.push({ provider, providerUserId: decoded.uid });
    }
  }

  return links;
}
