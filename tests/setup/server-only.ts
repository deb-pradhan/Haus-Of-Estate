// Next resolves the real marker through its `react-server` condition. Vitest
// runs server modules in plain Node, so this test-only alias keeps the marker a
// no-op without weakening application bundles.
export {};
