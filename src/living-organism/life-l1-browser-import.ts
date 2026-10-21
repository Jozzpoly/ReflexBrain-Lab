import type {DevCheckpoint} from './dev-runtime';
import {decodeLifeL1,encodeLifeL1} from './life-l1-codec';

/** Host-only admission of an externally simulated biography.
 * No manifest fields or researcher labels are passed to the resident's senses.
 * Hash checks accidental corruption, not authentication against malicious files.
 */
export type ImportedLife={lifeId:string;createdAt:string;simulatedSeconds:number;checkpoint:DevCheckpoint};
const DONOR_SHA='010531a0d5996ad70bba25a8b60b8324ec1c77cb';
const CONTRACT='odev-v0-l1-snapshot-v1/rapier0.20.0';
const maxBytes=28_000_000;
const isObject=(v:unknown):v is Record<string,unknown>=>v!==null&&typeof v==='object'&&!Array.isArray(v);
async function hashBody(body:Record<string,unknown>):Promise<string>{
 const bytes=new TextEncoder().encode(JSON.stringify(body));
 const digest=await crypto.subtle.digest('SHA-256',bytes);
 return Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');
}
/** Purely host-side signed portable export; in-browser input and Node resume
 * share EXACT contract without giving this metadata to DevResident. */
export async function exportLifeL1(cp:DevCheckpoint,lifeId:string,createdAt:string):Promise<string>{
 if(!/^[0-9a-f-]{36}$/i.test(lifeId)||typeof createdAt!=='string'||!Number.isFinite(Date.parse(createdAt)))
  throw Error('Invalid LIFE birth identity');
 const snapshot=JSON.parse(encodeLifeL1(cp));
 const body={
  format:'reflexbrain-life-record',schemaVersion:1,runtimeContract:CONTRACT,
  donorSha:DONOR_SHA,lifeId,controllerAuthority:'auto',paused:false,
  createdAt,recordedAt:new Date().toISOString(),physicsTicks:cp.world.tick,
  simulatedSeconds:cp.world.tick/120,sensorHz:30,simHz:120,snapshot,
 };
 const integritySha256=await hashBody(body);
 const output=JSON.stringify({...body,integritySha256})+'\n';
 if(new TextEncoder().encode(output).byteLength>maxBytes)throw Error('LIFE export too large');
 return output;
}
export async function importLifeL1(raw:string):Promise<ImportedLife>{
 if(new TextEncoder().encode(raw).byteLength>maxBytes)throw Error('LIFE file too large');
 const record:unknown=JSON.parse(raw);
 if(!isObject(record))throw Error('Invalid LIFE record');
 const {integritySha256,...body}=record;
 if(typeof integritySha256!=='string'||!/^[0-9a-f]{64}$/.test(integritySha256))
  throw Error('Invalid LIFE checksum');
 const actual=await hashBody(body);
 if(actual!==integritySha256)throw Error('LIFE checksum mismatch');
 if(body.format!=='reflexbrain-life-record'||body.schemaVersion!==1||
  body.runtimeContract!==CONTRACT||body.donorSha!==DONOR_SHA||
  body.controllerAuthority!=='auto'||body.paused!==false||
  body.simHz!==120||body.sensorHz!==30||
  typeof body.lifeId!=='string'||!/^[0-9a-f-]{36}$/i.test(body.lifeId)||
  typeof body.createdAt!=='string'||!Number.isFinite(Date.parse(body.createdAt))||
  typeof body.physicsTicks!=='number'||!Number.isSafeInteger(body.physicsTicks)||body.physicsTicks<0)
  throw Error('Incompatible LIFE identity/version/clock');
 const cp=decodeLifeL1(JSON.stringify(body.snapshot));
 if(cp.world.tick!==body.physicsTicks||body.simulatedSeconds!==cp.world.tick/120)
  throw Error('LIFE manifest and real physics time disagree');
 return {lifeId:body.lifeId,createdAt:body.createdAt,simulatedSeconds:body.simulatedSeconds as number,checkpoint:cp};
}
