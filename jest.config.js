// Lightweight Jest config for the framework-independent governance logic.
//
// The SPFx build (gulp) compiles the web part itself; these unit tests target the
// pure analysis layer (GovernanceAnalyzer + thresholds) so they run fast on any
// Node version without the full SharePoint toolchain.
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: {
          target: 'es2017',
          module: 'commonjs',
          moduleResolution: 'node',
          esModuleInterop: true,
          skipLibCheck: true,
          types: ['jest'],
          lib: ['es2017', 'dom']
        }
      }
    ]
  },
  collectCoverageFrom: ['src/**/services/GovernanceAnalyzer.ts'],
  coverageDirectory: 'coverage'
};
