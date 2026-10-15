if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile();
  } catch {
    try {
      process.loadEnvFile(new URL('../.env', import.meta.url));
    } catch {
      try {
        process.loadEnvFile(new URL('../../../.env', import.meta.url));
      } catch {
        // Ignore if .env is missing
      }
    }
  }
}
