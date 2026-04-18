#!/bin/bash
# Patch AGP version in React Native's version catalog
# expo-modules-autolinking 3.x requires AGP 8.5.x, not 8.11.x

TOML_PATH="node_modules/react-native/gradle/libs.versions.toml"

if [ -f "$TOML_PATH" ]; then
  echo "[eas-build-post-install] Patching AGP 8.11.x -> 8.5.2 in $TOML_PATH"
  sed -i 's/agp = "8\.11\.[0-9]*"/agp = "8.5.2"/' "$TOML_PATH"
  grep "agp =" "$TOML_PATH"
else
  echo "[eas-build-post-install] WARNING: $TOML_PATH not found"
fi
