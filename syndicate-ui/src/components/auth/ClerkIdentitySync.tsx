/**
 * ClerkIdentitySync - bridges Clerk's signed-in user into app state.
 * Mount once near the root, inside ClerkProvider. Renders nothing.
 */

import { useEffect } from "react";
import { useUser } from "@clerk/react";

let _userEmail: string | null = null;
export function getUserEmail() { return _userEmail; }

export function ClerkIdentitySync(): null {
  const { isLoaded, isSignedIn, user } = useUser();

  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn && user) {
      _userEmail = user.primaryEmailAddress?.emailAddress ?? null;
    } else {
      _userEmail = null;
    }
  }, [isLoaded, isSignedIn, user]);

  return null;
}
