const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

/**
 * Pins AGP to 8.5.2 by patching RN's version catalog.
 * expo-modules-autolinking 3.x plugins are compiled against AGP 8.5.0;
 * the AGP 8.11.0 that RN's version catalog requests causes "No variants exist".
 */
const withAgpVersion = (config) =>
  withDangerousMod(config, [
    "android",
    async (cfg) => {
      const libsPath = path.join(
        cfg.modRequest.projectRoot,
        "node_modules/react-native/gradle/libs.versions.toml",
      );
      if (fs.existsSync(libsPath)) {
        let contents = fs.readFileSync(libsPath, "utf8");
        contents = contents.replace(/agp = "8\.11\.\d+"/, 'agp = "8.5.2"');
        fs.writeFileSync(libsPath, contents);
        console.log(
          "[withAgpVersion] Patched AGP to 8.5.2 in libs.versions.toml",
        );
      }
      return cfg;
    },
  ]);

module.exports = withAgpVersion;
