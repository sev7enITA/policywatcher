#!/usr/bin/env node
import fs from 'node:fs';
import { importDraft } from './draft-importer.mjs';
import { MAX_INSIGHT_BYTES } from './insight-ir.mjs';
const names = new Set(['--input', '--draft-root', '--tenant', '--project', '--actor']);
try {
    const args = process.argv.slice(2), opts = {};
    for (let i = 0; i < args.length; i += 2) {
        if (!names.has(args[i]) || typeof args[i + 1] !== 'string' || args[i + 1].startsWith('--') || Object.prototype.hasOwnProperty.call(opts, args[i]))
            throw new Error('invalid_arguments');
        opts[args[i]] = args[i + 1];
    }
    if (Object.keys(opts).length !== names.size)
        throw new Error('required_arguments');
    const fd = fs.openSync(opts['--input'], fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
    let json;
    try {
        const st = fs.fstatSync(fd);
        if (!st.isFile() || st.size > MAX_INSIGHT_BYTES)
            throw new Error('invalid_input_file');
        json = fs.readFileSync(fd, 'utf8');
    }
    finally {
        fs.closeSync(fd);
    }
    const result = importDraft({ json, draftRoot: opts['--draft-root'], tenant: opts['--tenant'], project: opts['--project'], actor: opts['--actor'] });
    console.log(JSON.stringify({ status: result.status, path: result.path, sourcePayloadDigest: result.receipt.sourcePayloadDigest, statusOfImport: 'draft', executionAuthorized: false }));
}
catch {
    console.error('Draft import rejected. Validate the input, explicit context and private draft directory.');
    process.exitCode = 1;
}
