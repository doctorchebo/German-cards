const { withProjectBuildGradle } = require("@expo/config-plugins");

/**
 * Pins AGP to 8.5.2.
 * expo-modules-autolinking 3.x plugins are compiled against AGP 8.5.0;
 * the AGP 8.11.0 that RN's version catalog requests causes "No variants exist".
 */
const withAgpVersion = (config) =>
  withProjectBuildGradle(config, (cfg) => {
    const { contents } = cfg.modResults;
    cfg.modResults.contents = contents.replace(
      /com\.android\.tools\.build:gradle:[0-9]+\.[0-9]+\.[0-9]+/,
      "com.android.tools.build:gradle:8.5.2",
    );
    return cfg;
  });

module.exports = withAgpVersion;
