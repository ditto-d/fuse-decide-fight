import assert from 'node:assert/strict';
import {train,createMission,act,observation,site,runMission,evaluate} from '../dist/engine.mjs';
const q=train();assert.deepEqual(q,train(),'Training must be reproducible');
for(let seed=1;seed<=100;seed++){
 const a=createMission(seed),b=createMission(seed);act(a,'scan');act(a,'move');act(b,'move');assert.deepEqual(observation(a),observation(b),'Scanning must not change later sites');
 for(const policy of ['rove','always','fused','expert']){
  const m=runMission(seed,policy,q);assert.ok(m.done);assert.ok(m.battery>=0&&m.battery<3);assert.equal(m.liters,m.history.reduce((n,e)=>n+(e.liters||0),0));assert.equal(100-m.battery,m.history.reduce((n,e)=>n+({scan:1,drill:9,move:3}[e.action]),0));
 }
}
const m=createMission();for(let n=0;n<8;n++)assert.equal(act(m,'scan').ok,true);const before=JSON.stringify(m);assert.equal(act(m,'scan').ok,false);assert.equal(JSON.stringify(m),before);assert.throws(()=>act(m,'jump'));assert.equal(JSON.stringify(m),before);
const exhausted=createMission();while(!exhausted.done)act(exhausted,'move');const final=JSON.stringify(exhausted);assert.equal(act(exhausted,'scan').ok,false);assert.equal(JSON.stringify(exhausted),final);
for(let i=0;i<20;i++){assert.equal(site(2047,i).wet,site(2047,i,true).wet);assert.equal(site(2047,i).liters,site(2047,i,true).liters);}
const result=runMission(2047,'rove',q);assert.equal(result.liters,390);assert.equal(result.hits,5);assert.equal(result.dry,0);
const clear=evaluate(q)[0],storm=evaluate(q,true)[0],recovery=evaluate(train(.45,true),true)[0];assert.ok(storm.dry>clear.dry);assert.ok(recovery.liters>storm.liters);
console.log('PASS: deterministic training and fair missions; 400 complete policy runs; battery and water accounting; scan cap; rejected actions; paired storm data; measured recovery.');
console.log(JSON.stringify({sharedMission:{liters:result.liters,waterSites:result.hits,dryHoles:result.dry},clear,storm,recovery},null,2));
