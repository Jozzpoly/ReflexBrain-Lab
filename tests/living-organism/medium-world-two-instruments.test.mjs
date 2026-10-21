/* Medium/W — two independently connected MessagePort instruments observing ONE
 * actual Rapier runtime; fork makes an independent runtime explicitly.
 * Research-only fixture: MessagePorts are NOT Jaskinia windows, a server,
 * a network transport, or a production capability contract.
 */
import {describe,it,expect} from 'vitest';
import {MessageChannel} from 'node:worker_threads';
import {initLivingWorld} from '../../src/living-organism/world';
import {DevRuntime} from '../../src/living-organism/dev-runtime';

describe('MEDIUM/W — two independent instrument channels over one real physical authority',()=>{
 it('both observe one mutation, one detaches without stopping world, explicit fork separates histories',async()=>{
  await initLivingWorld();
  const sessions=new Map([['source',new DevRuntime('adaptive','B0','yard',1183)]]);
  const clients=[];
  let nextFork=0;
  const openInstrument=(initial='source')=>{
   const {port1,port2}=new MessageChannel();
   let attached=initial,serial=0,closed=false;
   port2.on('message',({id,op,handle,x,y})=>{
    try{
     const runtime=sessions.get(attached);
     if(!runtime)throw Error('Missing run '+attached);
     let payload;
     if(op==='inspect'){
      payload={world:attached,observation:runtime.world.inspect()};
     }else if(op==='move'){
      runtime.world.moveObject(handle,x,y);
      payload={world:attached,observation:runtime.world.inspect()};
     }else if(op==='fork'){
      const cp=runtime.capture();
      const clone=new DevRuntime(cp.mode,cp.shape,cp.layout);
      try{clone.restore(cp);}catch(e){clone.free();throw e;}
      const id='fork-'+(++nextFork);
      sessions.set(id,clone);
      attached=id;
      payload={newWorld:id,observation:clone.world.inspect()};
     }else{throw Error('Invalid operation '+op);}
     port2.postMessage({id,ok:true,payload});
    }catch(e){port2.postMessage({id,ok:false,error:String(e)});}
   });
   const request=(op,params={})=>new Promise((resolve,reject)=>{
    if(closed){reject(Error('Instrument disconnected'));return;}
    const id=++serial;
    const onMessage=message=>{
     if(message.id!==id)return;
     port1.off('message',onMessage);
     if(message.ok)resolve(message.payload);
     else reject(Error(message.error));
    };
    port1.on('message',onMessage);
    port1.postMessage({id,op,...params});
   });
   const close=()=>{if(closed)return;closed=true;port1.close();port2.close();};
   const instrument={request,close};
   clients.push(instrument);
   return instrument;
  };
  try{
   const first=openInstrument(),second=openInstrument();
   const a0=await first.request('inspect');
   const b0=await second.request('inspect');
   expect(a0.world).toBe('source');
   expect(b0.world).toBe('source');
   expect(a0.observation).toEqual(b0.observation);
   const moving=a0.observation.objects.find(o=>o.kind==='object');
   expect(moving).toBeDefined();
   const changed=await first.request('move',{handle:moving.handle,x:moving.x+1.4,y:moving.y-.25});
   const fromOther=await second.request('inspect');
   expect(fromOther.observation).toEqual(changed.observation);
   expect(fromOther.observation.tick).toBe(a0.observation.tick);
   const fork=await second.request('fork');
   expect(fork.newWorld).toBe('fork-1');
   expect(fork.observation).toEqual(changed.observation);
   const fromFork=fork.observation.objects.find(o=>o.handle===moving.handle);
   const changedFork=await second.request('move',{
    handle:fromFork.handle,x:fromFork.x+2,y:fromFork.y
   });
   const unchangedSource=await first.request('inspect');
   const objA=unchangedSource.observation.objects.find(o=>o.handle===moving.handle);
   const objB=changedFork.observation.objects.find(o=>o.handle===moving.handle);
   expect(objA.x).toBeCloseTo(moving.x+1.4,5);
   expect(objB.x).toBeCloseTo(objA.x+2,5);
   expect(unchangedSource.world).toBe('source');
   expect(changedFork.world).toBe('fork-1');
   // Closing one instrument must not free the original world.
   first.close();
   const reconnected=openInstrument('source');
   const afterReturn=await reconnected.request('inspect');
   expect(afterReturn.observation).toEqual(unchangedSource.observation);
   sessions.get('source').step();
   const next=await reconnected.request('inspect');
   expect(next.observation.tick).toBe(afterReturn.observation.tick+1);
  }finally{
   for(const c of clients)c.close();
   for(const r of sessions.values())r.free();
  }
 },30000);
});