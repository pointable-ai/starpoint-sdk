/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  extensionsToTreatAsEsm: [".ts"],
  transformIgnorePatterns: ["/node_modules/(?!(ky))"],
};
