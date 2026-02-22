#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const targets = ['win32', 'linux'];
const apps = ['ffmpeg', 'ffprobe'];

const getDownloadUrl = (app, platform) => `https://github.com/eugeneware/ffmpeg-static/releases/download/b6.1.1/${app}-${platform}-x64`;

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
        }
    }
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});