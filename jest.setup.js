jest.mock("node-cron", () => ({
  schedule: jest.fn(() => ({
    stop: jest.fn(),
  })),
}));
