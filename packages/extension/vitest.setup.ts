import '@testing-library/jest-dom';

// Mock Chrome Extension APIs
const chromeMock = {
  runtime: {
    onInstalled: { addListener: vi.fn() },
    onMessage: { addListener: vi.fn() },
    sendMessage: vi.fn(),
    lastError: null,
  },
  contextMenus: {
    create: vi.fn(),
    onClicked: { addListener: vi.fn() },
  },
  tabs: {
    create: vi.fn(),
    sendMessage: vi.fn(),
    query: vi.fn(),
  },
  storage: {
    sync: {
      get: vi.fn().mockResolvedValue({}),
      set: vi.fn().mockResolvedValue(undefined),
    },
  },
  cookies: {
    get: vi.fn().mockResolvedValue(null),
  },
  identity: {
    getAuthToken: vi.fn(),
    removeCachedAuthToken: vi.fn(),
  },
};

// @ts-expect-error — mocking chrome global
global.chrome = chromeMock;
