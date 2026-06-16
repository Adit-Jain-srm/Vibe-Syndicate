import { Show, SignInButton, UserButton } from '@clerk/react';
import AppRouter from './AppRouter';

const hasClerk = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

export default function App() {
  return (
    <>
      {hasClerk && (
        <header className="fixed top-0 right-0 p-4 z-50 flex items-center gap-3">
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button className="px-4 py-2 text-sm font-medium text-[#f7f8f8] bg-[#5e6ad2] rounded-full hover:opacity-90 transition-opacity">
                Sign In
              </button>
            </SignInButton>
          </Show>
          <Show when="signed-in">
            <UserButton appearance={{ elements: { avatarBox: "w-8 h-8" } }} />
          </Show>
        </header>
      )}
      <AppRouter />
    </>
  );
}
