module.exports = {
    testRegex: "\\.test\\.ts$",
    moduleFileExtensions: ["ts", "tsx", "js", "json"],
    testPathIgnorePatterns: ["/node_modules/", "./dist"],
    testEnvironment: "node",
    transform: {
        "^.+\\.ts$": "ts-jest"
    },
    globals: {
        "ts-jest": {
            diagnostics: true
        }
    },
    unmockedModulePathPatterns: ["node_modules"],
    setupFilesAfterEnv: ["./src/jest.setup.js"]
};
