// Minimal ambient declaration so `process.env.NODE_ENV` type-checks in
// browser-only source without pulling in the full Node.js type surface
// (Vite and Jest both replace/provide this at runtime).
declare const process: {
  env: {
    NODE_ENV?: string;
  };
};
