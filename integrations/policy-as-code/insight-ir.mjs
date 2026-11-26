import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
export const MAX_INSIGHT_BYTES = 131072;
export const insightSchema = JSON.parse(readFileSync(new URL('./insight-ir.schema.json', import.meta.url), 'utf8'));
export const sha256 = value => createHash('sha256').update(value, 'utf8').digest('hex');
const blocked = new Set(['__proto__', 'constructor', 'prototype']);
const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
/** Sorted-key JSON for this restricted contract; not a claim of RFC8785 conformance. */
export function canonicalize(value) {
    if (Array.isArray(value))
        return '[' + value.map(canonicalize).join(',') + ']';
    if (value && typeof value === 'object')
        return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + canonicalize(value[k])).join(',') + '}';
    return JSON.stringify(value);
}
function assertPlain(value, seen = new Set(), depth = 0) {
    if (depth > 16)
        throw new Error('insight_depth');
    if (value && typeof value === 'object') {
        if (seen.has(value))
            throw new Error('insight_cycle');
        seen.add(value);
        if (!Array.isArray(value) && Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null)
            throw new Error('insight_object');
        for (const k of Object.keys(value)) {
            if (blocked.has(k) || !own(Object.getOwnPropertyDescriptor(value, k), 'value'))
                throw new Error('insight_key');
            assertPlain(value[k], seen, depth + 1);
        }
        seen.delete(value);
    }
    else if (!['string', 'number', 'boolean'].includes(typeof value) && value !== null)
        throw new Error('insight_value');
    else if (typeof value === 'number' && !Number.isSafeInteger(value))
        throw new Error('insight_number');
}
function schemaErrors(v, schema, path, errors) {
    if (own(schema, 'const') && v !== schema.const)
        errors.push(path + ':const');
    if (schema.enum && !schema.enum.includes(v))
        errors.push(path + ':enum');
    if (schema.anyOf) {
        if (!schema.anyOf.some(s => { const e = []; schemaErrors(v, s, path, e); return !e.length; }))
            errors.push(path + ':anyOf');
        return;
    }
    if (!schema.type)
        return;
    const match = schema.type === 'object' ? !!v && typeof v === 'object' && !Array.isArray(v) : schema.type === 'array' ? Array.isArray(v) : schema.type === 'integer' ? Number.isSafeInteger(v) : schema.type === 'null' ? v === null : typeof v === schema.type;
    if (!match) {
        errors.push(path + ':type');
        return;
    }
    if (schema.type === 'object') {
        for (const k of schema.required || [])
            if (!own(v, k))
                errors.push(path + '.' + k + ':required');
        for (const k of Object.keys(v))
            if (!own(schema.properties, k))
                errors.push(path + ':unknown_field');
            else
                schemaErrors(v[k], schema.properties[k], path + '.' + k, errors);
    }
    if (schema.type === 'array') {
        if (v.length < (schema.minItems || 0))
            errors.push(path + ':minItems');
        if (v.length > schema.maxItems)
            errors.push(path + ':maxItems');
        if (schema.uniqueItems && new Set(v.map(canonicalize)).size !== v.length)
            errors.push(path + ':unique');
        v.forEach((x, i) => schemaErrors(x, schema.items, path + '[' + i + ']', errors));
    }
    if (schema.type === 'string') {
        if (Array.from(v).length < (schema.minLength || 0) || Array.from(v).length > (schema.maxLength || Infinity) || (schema.pattern && !new RegExp(schema.pattern).test(v)))
            errors.push(path + ':string');
        if (/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(v))
            errors.push(path + ':unicode');
        if (schema.format === 'date-time' && (!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(v) || !Number.isFinite(Date.parse(v)) || new Date(v).toISOString() !== v))
            errors.push(path + ':date');
        if (schema.format === 'uri') {
            try {
                const u = new URL(v);
                if (u.protocol !== 'https:' || u.username || u.password || u.search || u.hash || u.href !== v)
                    throw 0;
            }
            catch {
                errors.push(path + ':url');
            }
        }
    }
    if (schema.type === 'integer' && (v < schema.minimum || v > schema.maximum))
        errors.push(path + ':range');
}
function digestBody(value) { const { contentDigest: omitted, ...body } = value; void omitted; return sha256(canonicalize(body)); }
export function validateInsight(value) {
    const errors = [];
    try {
        assertPlain(value);
        if (Buffer.byteLength(JSON.stringify(value), 'utf8') > MAX_INSIGHT_BYTES)
            throw new Error('insight_size');
        schemaErrors(value, insightSchema, '$', errors);
        if (!errors.length) {
            if (value.contentDigest !== digestBody(value))
                errors.push('digest_mismatch');
            if (value.source.scopeId !== 'policywatcher:policy:' + value.source.policyId)
                errors.push('scope_mismatch');
            if (value.revision !== value.snapshots.after.version)
                errors.push('revision_mismatch');
            if (Date.parse(value.times.observedAt) > Date.parse(value.times.publishedAt))
                errors.push('time_order');
            if (value.times.observedAt !== value.snapshots.after.capturedAt)
                errors.push('observation_capture_mismatch');
            const before = value.snapshots.before, after = value.snapshots.after;
            if (before && (Date.parse(before.capturedAt) > Date.parse(after.capturedAt) || before.version >= after.version))
                errors.push('snapshot_order');
            for (const warning of ['source_completeness_unqualified', 'semantic_verification_not_performed', 'effective_date_unknown', 'source_metadata_not_verified', 'extractor_version_not_recorded']) {
                if (!value.warnings.includes(warning))
                    errors.push('missing_warning:' + warning);
            }
            if (value.claims.some(claim => !claim.evidence.length) && !value.warnings.includes('legacy_unanchored'))
                errors.push('missing_warning:legacy_unanchored');
            const ids = new Set();
            for (const claim of value.claims) {
                if (ids.has(claim.id))
                    errors.push('duplicate_claim');
                ids.add(claim.id);
                for (const span of claim.evidence) {
                    const cap = value.snapshots[span.side];
                    if (!cap || cap.textSha256 !== span.textSha256 || span.end <= span.start || span.end - span.start !== span.quote.length || sha256(span.quote) !== span.quoteSha256)
                        errors.push('span_mismatch');
                }
            }
        }
    }
    catch {
        errors.push('invalid_insight');
    }
    return { ok: !errors.length, errors };
}
export function createInsight(body) {
    assertPlain(body);
    if (own(body, 'contentDigest'))
        throw new Error('unexpected_digest');
    const record = { ...body, contentDigest: sha256(canonicalize(body)) };
    const result = validateInsight(record);
    if (!result.ok)
        throw new Error('invalid_insight:' + result.errors.join(','));
    return record;
}
/** Recursive parser retains duplicate-key evidence that JSON.parse would discard. */
export function strictJson(text) {
    let pos = 0;
    const ws = () => { while (/[ \t\r\n]/.test(text[pos] || '') && pos < text.length)
        pos++; };
    function string() { const start = pos++; while (pos < text.length) {
        if (text[pos] === '\\') {
            pos += 2;
            continue;
        }
        if (text[pos++] === '"')
            return JSON.parse(text.slice(start, pos));
    } throw new Error('json_string'); }
    function val(depth = 0) {
        if (depth > 16)
            throw new Error('json_depth');
        ws();
        const ch = text[pos];
        if (ch === '"')
            return string();
        if (ch === '{') {
            pos++;
            const o = {};
            ws();
            if (text[pos] === '}') {
                pos++;
                return o;
            }
            while (pos < text.length) {
                ws();
                if (text[pos] !== '"')
                    throw new Error('json_key');
                const k = string();
                if (blocked.has(k) || own(o, k))
                    throw new Error('json_duplicate_or_unsafe_key');
                ws();
                if (text[pos++] !== ':')
                    throw new Error('json_colon');
                o[k] = val(depth + 1);
                ws();
                const c = text[pos++];
                if (c === '}')
                    return o;
                if (c !== ',')
                    throw new Error('json_object');
            }
            throw new Error('json_object');
        }
        if (ch === '[') {
            pos++;
            const a = [];
            ws();
            if (text[pos] === ']') {
                pos++;
                return a;
            }
            while (pos < text.length) {
                a.push(val(depth + 1));
                ws();
                const c = text[pos++];
                if (c === ']')
                    return a;
                if (c !== ',')
                    throw new Error('json_array');
            }
            throw new Error('json_array');
        }
        const m = /^(?:true|false|null|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)/.exec(text.slice(pos));
        if (!m)
            throw new Error('json_value');
        pos += m[0].length;
        return JSON.parse(m[0]);
    }
    const value = val();
    ws();
    if (pos !== text.length)
        throw new Error('json_trailing');
    return value;
}
export function parseInsight(json) {
    if (typeof json !== 'string' || Buffer.byteLength(json, 'utf8') > MAX_INSIGHT_BYTES)
        throw new Error('insight_size');
    const value = strictJson(json);
    const result = validateInsight(value);
    if (!result.ok)
        throw new Error('invalid_insight:' + result.errors.join(','));
    return value;
}
