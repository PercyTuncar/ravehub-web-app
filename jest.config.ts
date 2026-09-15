import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  dir: './',
});

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/.claude/',
    '/.kilo/',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(react-markdown|remark-gfm|micromark|decode-named-character-reference|character-entities|unist-.*|unified|bail|is-plain-obj|trough|vfile|vfile-message|mdast-util-.*|ccount|escape-string-regexp|markdown-table)/)',
  ],
};

export default createJestConfig(config);
