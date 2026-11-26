import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { canonicalize, strictJson, parseInsight, sha256, validateInsight, MAX_INSIGHT_BYTES } from './insight-ir.mjs';
const COMPONENT = /^[a-z0-9][a-z0-9_-]{0,63}$/;
const ACTOR = /^[a-zA-Z0-9][a-zA-Z0-9._@-]{0,127}$/;
function directory(dir, create = false) {
    if (create) {
        try {
            fs.mkdirSync(dir, { mode: 0o700 });
        }
        catch (e) {
            if (e.code !== 'EEXIST')
                throw e;
        }
    }
    const stat = fs.lstatSync(dir);
    if (!stat.isDirectory() || stat.isSymbolicLink() || (stat.mode & 0o077))
        throw new Error('unsafe_draft_directory');
}
function existingFile(file) {
    const fd = fs.openSync(file, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
    try {
        const stat = fs.fstatSync(fd);
        if (!stat.isFile() || stat.size > MAX_INSIGHT_BYTES + 8192 || (stat.mode & 0o077))
            throw new Error('unsafe_draft_file');
        return fs.readFileSync(fd, 'utf8');
    }
    finally {
        fs.closeSync(fd);
    }
}
function checkDraft(draft, expected) {
    const keys = ['schemaVersion', 'status', 'tenant', 'project', 'sourcePayloadDigest', 'importedBy', 'importedAt', 'executionAuthorized', 'insight', 'draftDigest'];
    if (!draft || Object.keys(draft).length !== keys.length || keys.some(k => !Object.prototype.hasOwnProperty.call(draft, k)))
        throw new Error('draft_integrity');
    const { draftDigest, ...body } = draft;
    if (draftDigest !== sha256(canonicalize(body)) || draft.schemaVersion !== '0.1.0' || draft.status !== 'draft' || draft.executionAuthorized !== false || draft.tenant !== expected.tenant || draft.project !== expected.project || !ACTOR.test(draft.importedBy) || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(draft.importedAt) || !Number.isFinite(Date.parse(draft.importedAt)) || new Date(draft.importedAt).toISOString() !== draft.importedAt || !validateInsight(draft.insight).ok || draft.sourcePayloadDigest !== draft.insight.contentDigest)
        throw new Error('draft_integrity');
    if (draft.insight.id !== expected.insight.id || draft.insight.revision !== expected.insight.revision || draft.sourcePayloadDigest !== expected.insight.contentDigest)
        throw new Error('draft_revision_conflict');
    return draft;
}
/** Local, trusted-caller sidecar. This function does not authenticate callers or approve rules. */
export function importDraft({ json, insight, draftRoot, tenant, project, actor, now = new Date().toISOString() }) {
    if (typeof tenant !== 'string' || !COMPONENT.test(tenant) || typeof project !== 'string' || !COMPONENT.test(project) || typeof actor !== 'string' || !ACTOR.test(actor))
        throw new Error('invalid_import_context');
    if (typeof draftRoot !== 'string' || !path.isAbsolute(draftRoot))
        throw new Error('invalid_draft_root');
    if (!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(now) || !Number.isFinite(Date.parse(now)) || new Date(now).toISOString() !== now)
        throw new Error('invalid_import_time');
    if ((json === undefined) === (insight === undefined))
        throw new Error('exactly_one_insight_input');
    if (json === undefined && !validateInsight(insight).ok)
        throw new Error('invalid_insight');
    const record = json === undefined ? parseInsight(JSON.stringify(insight)) : parseInsight(json);
    // Validate every directory component, including an existing supplied root. No model-derived paths.
    const root = path.resolve(draftRoot);
    let walk = path.parse(root).root;
    for (const piece of root.slice(walk.length).split(path.sep).filter(Boolean)) {
        walk = path.join(walk, piece);
        const stat = fs.lstatSync(walk);
        if (!stat.isDirectory() || stat.isSymbolicLink())
            throw new Error('unsafe_draft_ancestor');
    }
    directory(root);
    const tenantPath = path.join(root, tenant);
    directory(tenantPath, true);
    const projectPath = path.join(tenantPath, project);
    directory(projectPath, true);
    const file = path.join(projectPath, `${record.id}-r${record.revision}.json`);
    const context = { tenant, project, insight: record };
    const existing = () => checkDraft(strictJson(existingFile(file)), context);
    if (fs.existsSync(file))
        return { status: 'existing', path: file, receipt: existing() };
    const body = { schemaVersion: '0.1.0', status: 'draft', tenant, project, sourcePayloadDigest: record.contentDigest, importedBy: actor, importedAt: now, executionAuthorized: false, insight: record };
    const receipt = { ...body, draftDigest: sha256(canonicalize(body)) };
    const tmp = path.join(projectPath, `.import-${randomUUID()}.tmp`);
    let fd;
    try {
        fd = fs.openSync(tmp, fs.constants.O_CREAT | fs.constants.O_EXCL | fs.constants.O_WRONLY | fs.constants.O_NOFOLLOW, 0o600);
        fs.writeFileSync(fd, JSON.stringify(receipt, null, 2) + '\n');
        fs.fsyncSync(fd);
        fs.closeSync(fd);
        fd = undefined;
        try {
            fs.linkSync(tmp, file);
        }
        catch (e) {
            if (e.code !== 'EEXIST')
                throw e;
            return { status: 'existing', path: file, receipt: existing() };
        }
        const dirFd = fs.openSync(projectPath, fs.constants.O_RDONLY);
        try {
            fs.fsyncSync(dirFd);
        }
        finally {
            fs.closeSync(dirFd);
        }
        return { status: 'created', path: file, receipt };
    }
    finally {
        if (fd !== undefined)
            fs.closeSync(fd);
        try {
            fs.unlinkSync(tmp);
        }
        catch (e) {
            if (e.code !== 'ENOENT')
                throw e;
        }
    }
}
