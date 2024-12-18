module.exports = {
  preset: "ts-jest",
  verbose: true,
  testEnvironment: "node",
  setupFilesAfterEnv: ["./jest.setup.js"], // Sesuaikan dengan nama file setup
};
