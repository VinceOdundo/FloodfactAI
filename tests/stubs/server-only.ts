// Vitest runs in plain Node, not Next's bundler, so the real `server-only`
// package (which relies on a bundler-specific "react-server" export
// condition) always throws here. The protection it gives — catching a
// server-only module accidentally pulled into a client bundle — is a
// build-time concern; it has nothing to check at test time, so tests alias
// the real package to this no-op stub (see vitest.config.mts).
export {};
