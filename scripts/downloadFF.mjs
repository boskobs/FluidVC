#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const allTargets = ['win32', 'linux'];
const apps = ['ffmpeg', 'ffprobe'];

const getDownloadUrl = (app, platform) => `https://github.com/eugeneware/ffmpeg-static/releases/download/b6.1.1/${app}-${platform}-x64`;

const argTarget = process.argv[2];
if (argTarget && !allTargets.includes(argTarget)) {
    console.error(`Unknown target: "${argTarget}". Valid targets: ${allTargets.join(', ')}`);
    process.exit(1);
}
const targets = argTarget ? [argTarget] : allTargets;

if (!fs.existsSync('../resources')) fs.mkdirSync('../resources');

async function downloadFile(url, outputPath) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to download ${url}: ${res.statusText}`);
    const buffer = await res.arrayBuffer();
    await fs.promises.writeFile(outputPath, Buffer.from(buffer));
}

async function main() {
    for (const platform of targets) {
        for (const app of apps) {
            const url = getDownloadUrl(app, platform);
            const outputPath = path.join('..', 'resources', `${app}${platform === 'win32' ? '.exe' : ''}`);
            console.log(`Downloading ${app} for ${platform}...`);
            await downloadFile(url, outputPath);
            console.log(`Saved to ${outputPath}`);
            // Make executable on non-Windows platforms
            if (platform !== 'win32') {
                await fs.promises.chmod(outputPath, 0o755);
            }
        }
    }
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});