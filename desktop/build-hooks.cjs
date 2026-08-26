"use strict";

/**
 * The desktop editor only uses Electron and Node.js built-ins at runtime.
 * Returning false tells electron-builder that application dependencies are
 * already handled, so it must not collect the React portal's node_modules.
 */
async function beforeBuild() {
  return false;
}

module.exports = { beforeBuild };
