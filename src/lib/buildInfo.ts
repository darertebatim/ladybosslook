// Build information - generated at build time
// These values are injected by Vite's define config at build time
export const BUILD_INFO = {
  buildTime: (typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : 'dev') as string,
  buildId: (typeof __BUILD_ID__ !== 'undefined' ? __BUILD_ID__ : 'DEV') as string,
  version: (typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0-dev') as string,
  mode: import.meta.env.MODE,
};

// Log build info on load
export function logBuildInfo() {
  console.log('🔨 BUILD INFO:', {
    buildTime: BUILD_INFO.buildTime,
    buildId: BUILD_INFO.buildId,
    version: BUILD_INFO.version,
    mode: BUILD_INFO.mode,
  });
}

// Format for display
export function getDisplayBuildInfo(): string {
  return `v${BUILD_INFO.version} • ${BUILD_INFO.buildId} • ${BUILD_INFO.mode}`;
}

export function getDetailedBuildInfo(): string {
  return `Version: ${BUILD_INFO.version}\nBuild: ${BUILD_INFO.buildId}\nTime: ${BUILD_INFO.buildTime}\nMode: ${BUILD_INFO.mode}`;
}
