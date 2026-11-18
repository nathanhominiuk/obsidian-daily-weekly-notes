import { readFileSync, writeFileSync } from "fs";

const targetVersion = process.env.npm_package_version;
const write = (file, data) => writeFileSync(file, JSON.stringify(data, null, "\t") + "\n");

// read minAppVersion from manifest.json and bump version to target version
const manifest = JSON.parse(readFileSync("manifest.json", "utf8"));
const { minAppVersion } = manifest;
manifest.version = targetVersion;
write("manifest.json", manifest);

// versions.json only needs an entry when minAppVersion changes
const versions = JSON.parse(readFileSync("versions.json", "utf8"));
if (!Object.values(versions).includes(minAppVersion)) {
	versions[targetVersion] = minAppVersion;
	write("versions.json", versions);
}
