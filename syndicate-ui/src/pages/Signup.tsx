/**
 * Signup page — uses Clerk's SignUp widget themed for the dark AuthShell.
 */

import { AuthShell } from '../components/auth/AuthShell';
import { ClerkAuthForm } from '../components/auth/ClerkAuthForm';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

export default function Signup() {
  return (
    <AuthShell>
      {/* Heading */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <h1 className="text-3xl font-light tracking-tight text-white">
          Create your workspace
        </h1>
        <p className="text-sm text-white/50 mt-2">
          Start building with compound AI intelligence
        </p>
      </motion.div>

      {/* Clerk SignUp widget */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <ClerkAuthForm mode="signup" />
      </motion.div>

      {/* Bottom nav */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="text-center"
      >
        <p className="text-xs text-white/40">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-accent hover:text-accent/80 transition-colors"
          >
            Sign in
          </Link>
        </p>
      </motion.div>
    </AuthShell>
  );
}
