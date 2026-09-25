// Dev-only loader so the level/reward verification script can import modules
// that reference image assets (Vite resolves those during the normal build).
import { registerHooks } from 'node:module';

const ASSET = /\.(png|jpe?g|svg|webp|gif)$/i;

registerHooks({
  resolve(specifier, context, next) {
    if (ASSET.test(specifier)) {
      return { url: 'data:text/javascript,export default "asset-stub"', shortCircuit: true };
    }
    try {
      return next(specifier, context);
    } catch (error) {
      // Bundler-style extensionless imports ("./levels") need an explicit .ts for Node.
      if (specifier.startsWith('.')) {
        try {
          return next(`${specifier}.ts`, context);
        } catch {
          throw error;
        }
      }
      throw error;
    }
  },
});
