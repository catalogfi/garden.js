const { execSync } = require("child_process");

const compareVersions = (version1, version2) => {
    const v1Components = version1.split('.');
    const v2Components = version2.split('.');
    
    for (let i = 0; i < v1Components.length; i++) {
        const v1Value = parseInt(v1Components[i]) || 0;
        const v2Value = parseInt(v2Components[i]) || 0;
        
        if (v1Value < v2Value) {
            return -1;
        } else if (v1Value > v2Value) {
            return 1;
        }
    }
    
    return 0;
}

const SCOPE = "@gardenfi";

const package = process.argv[2];

const publishedVersion = JSON.parse(Buffer.from(execSync(`yarn npm info ${SCOPE}/${package} --json`), "hex"))["dist-tags"]['latest'];
const currentVersion = require(`../packages/${package}/package.json`).version;

const isCurrentVersionGreater = compareVersions(currentVersion, publishedVersion) > 0;

if(isCurrentVersionGreater) {
    console.log(`Publishing package ${SCOPE}/${package} ${publishedVersion} => ${currentVersion}`);
    execSync(`yarn workspace ${SCOPE}/${package} npm publish`);
}