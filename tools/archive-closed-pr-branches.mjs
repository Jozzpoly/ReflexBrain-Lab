import {readFileSync,appendFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
import process from 'node:process';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const manifest=JSON.parse(readFileSync(resolve(root,'archive/branch-inventory-2026-11-10.json'),'utf8'));
const repo='Jozzpoly/ReflexBrain-Lab';
if(manifest.repository!==repo||manifest.version!==1||manifest.branches.length!==115)throw Error('Frozen inventory contract changed');
const names=new Set();
for(const row of manifest.branches){
 if(names.has(row.name)||!/^([a-zA-Z0-9._-]+\/)*[a-zA-Z0-9._-]+$/.test(row.name)||!/^([a-f0-9]{40})$/.test(row.sha))
  throw Error('Invalid or duplicate frozen branch inventory: '+row.name);
 names.add(row.name);
}
const apply=process.argv.includes('--apply');
if(apply&&(process.env.GITHUB_REPOSITORY!==repo||process.env.CONFIRM_ARCHIVE_PRUNE!=='ARCHIVE_BEFORE_DELETE'||process.env.GITHUB_REF!=='refs/heads/main'))
 throw Error('Apply authorization mismatch');
const token=process.env.GITHUB_TOKEN;
if(!token)throw Error('GITHUB_TOKEN missing even for live safety audit');
const api='https://api.github.com/repos/'+repo;
async function gh(method,path,body,optional404=false){
 const response=await fetch(api+path,{method,headers:{Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28',Authorization:'Bearer '+token,'User-Agent':'ReflexBrain-archival-cleanup'},body:body===undefined?undefined:JSON.stringify(body)});
 if(optional404&&response.status===404)return null;
 if(!response.ok)throw Error(method+' '+path+': '+response.status+': '+(await response.text()).slice(0,450));
 if(response.status===204)return null;
 return response.json();
}
async function allItems(route){
 const all=[];
 for(let page=1;page<=6;page++){
  const batch=await gh('GET',route+(route.includes('?')?'&':'?')+'per_page=100&page='+page);
  if(!Array.isArray(batch))throw Error('Unexpected API list response: '+route);
  all.push(...batch);
  if(batch.length<100)return all;
 }
 throw Error('Pagination unexpectedly exceeded contract');
}
const [open,closed,branches]=await Promise.all([
 allItems('/pulls?state=open'),allItems('/pulls?state=closed'),allItems('/branches')
]);
const active=new Set(open.flatMap(p=>[p.head.ref,p.base.ref]));
const closedByHead=new Map(closed.map(p=>[p.head.ref,p]));
const branchesByName=new Map(branches.map(b=>[b.name,b]));
const candidates=[];
const alreadyGone=[];
for(const row of manifest.branches){
 if(row.role!=='closed-pr-head'&&row.role!=='open-pr-head')continue;
 if(row.name==='main'||row.protected||active.has(row.name))continue;
 const pr=closedByHead.get(row.name);
 if(!pr||pr.number!==row.pr||pr.merged_at)continue;
 const now=branchesByName.get(row.name);
 if(!now){alreadyGone.push(row);continue;}
 if(now.protected||now.commit.sha!==row.sha)throw Error('ABORT branch drift/protection: '+row.name);
 candidates.push(row);
}
if(candidates.length<1&&alreadyGone.length<1)throw Error('Unexpectedly empty archival plan');
const summary=[
 '# ReflexBrain 2026-11-10 branch cleanup',
 'mode: '+(apply?'APPLY':'DRY RUN'),
 'PRs: '+open.length+' open / '+closed.length+' closed',
 'remote branches: '+branches.length,
 'safe closed-PR branch candidates: '+candidates.length,
 'already missing from branch inventory: '+alreadyGone.length,
 'other branches intentionally untouched: '+(branches.length-candidates.length)
];
console.log(summary.join('\n'));
if(!apply){
 console.log('DRY RUN candidates: '+candidates.map(x=>x.name).join(', '));
 if(process.env.GITHUB_STEP_SUMMARY)appendFileSync(process.env.GITHUB_STEP_SUMMARY,summary.join('  \n')+'\n');
 process.exit(0);
}

// Phase 1: durable refs for EVERY candidate, before deleting ANY branch.
// All tags are lightweight and point directly at the original commit object.
const verified=new Set();
for(const row of candidates){
 const name=manifest.archiveTagPrefix+row.name;
 const path='/git/ref/tags/'+name;
 let tag=await gh('GET',path,undefined,true);
 if(!tag)tag=await gh('POST','/git/refs',{ref:'refs/tags/'+name,sha:row.sha});
 if(tag.object?.sha!==row.sha)throw Error('ABORT archive tag mismatch: '+name);
 const checked=await gh('GET',path);
 if(checked.object?.sha!==row.sha)throw Error('ABORT archive tag read-back mismatch: '+name);
 verified.add(row.name);
 console.log('ARCHIVED '+row.name+' @ '+row.sha);
}
if(verified.size!==candidates.length)throw Error('Archive coverage incomplete: refusing delete');

// Phase 2: repeat the SHA check immediately before each destructive operation.
let deleted=0;
for(const row of candidates){
 if(!verified.has(row.name))throw Error('ABORT missing archive tag: '+row.name);
 const refPath='/git/ref/heads/'+row.name;
 const current=await gh('GET',refPath,undefined,true);
 if(!current)throw Error('ABORT source branch disappeared unexpectedly: '+row.name);
 if(current.object?.sha!==row.sha)throw Error('ABORT concurrent source branch update: '+row.name);
 await gh('DELETE','/git/refs/heads/'+row.name);
 const after=await gh('GET',refPath,undefined,true);
 if(after)throw Error('ABORT branch still exists after delete: '+row.name);
 deleted++;
 console.log('PRUNED '+row.name);
}
const result=[...summary,'archive tags verified: '+verified.size,'branches deleted: '+deleted].join('\n');
console.log(result);
if(process.env.GITHUB_STEP_SUMMARY)appendFileSync(process.env.GITHUB_STEP_SUMMARY,result.replaceAll('\n','  \n')+'\n');
