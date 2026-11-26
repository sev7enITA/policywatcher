export interface InsightCapture {version:number;capturedAt:string;textSha256:string;representation:'normalized-text';offsetEncoding:'utf-16-code-units';extractorVersion:null}
export interface InsightSpan {side:'before'|'after';start:number;end:number;quote:string;quoteSha256:string;textSha256:string}
export interface InsightClaim {id:string;kind:'inferred';category:'data-use'|'retention'|'licensing'|'screening';statement:string;value:{type:'text';value:string};evidence:InsightSpan[]}
export type InsightWarning='legacy_unanchored'|'source_completeness_unqualified'|'semantic_verification_not_performed'|'effective_date_unknown'|'source_metadata_not_verified'|'quote_rejected'|'quote_ambiguous'|'private_before_omitted'|'extractor_version_not_recorded'|'source_qualifications_not_proven'|'source_url_scope_redacted';
export interface InsightBody {schemaVersion:'0.1.0';id:string;revision:number;visibility:'public';provenance:{producer:'PolicyWatcher';adapterVersion:'0.1.0'};source:{policyId:string;scopeId:string;publicUrl:string;jurisdiction:string|null};times:{observedAt:string;publishedAt:string;effectiveAt:null};snapshots:{before:InsightCapture|null;after:InsightCapture};claims:InsightClaim[];quality:{identity:'not_verified';completeness:'unqualified';language:'not_verified';freshness:'not_verified';semanticVerification:'not_verified'};review:{status:'required';approved:false};decision:{state:'indeterminate';executionAuthorized:false};warnings:InsightWarning[]}
export interface InsightRecord extends InsightBody {contentDigest:string}
export const MAX_INSIGHT_BYTES:number;
export const insightSchema:Record<string,unknown>;
export function sha256(value:string):string;
export function canonicalize(value:unknown):string;
export function createInsight(body:InsightBody):InsightRecord;
export function validateInsight(value:unknown):{ok:boolean;errors:string[]};
export function parseInsight(json:string):InsightRecord;

export function strictJson(text:string):unknown;
