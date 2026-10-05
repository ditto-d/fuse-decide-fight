import assert from 'node:assert/strict';
import {createMission,act,observation,confidence,site,train,best,rng,MAX_SCANS} from '../dist/engine.mjs';
// Verify posterior semantics, not a snapshot of implementation internals.
assert.ok(Math.abs(confidence([[0,0,0]])-.3)<1e-12);
assert.ok(confidence([[1,1,1]])>.3);
assert.ok(confidence([[-1,-1,-1]])<.3);
assert.ok(confidence([[1,1,1],[1,1,1]])>confidence([[1,1,1]]));
// A rejected action must never spend resources or change mission state.
for(const [battery,action] of [[8,'drill'],[3,'scan'],[2,'move']]){
 const m=createMission();m.battery=battery;const before=structuredClone(m);
 assert.equal(act(m,action).ok,false);assert.deepEqual(m,before);
}
const m=createMission();for(let i=0;i<MAX_SCANS;i++)assert.equal(act(m,'scan').ok,true);
assert.equal(act(m,'scan').ok,false);assert.equal(act(m,'move').ok,true);assert.equal(m.rescans,0);assert.equal(act(m,'scan').ok,true);
// Mixed random play exercises interleaved scan/drill/move decisions and low battery.
for(let seed=800;seed<900;seed++){
 const m=createMission(seed),random=rng(seed);let attempts=0;
 while(!m.done&&attempts++<500){let a=['scan','drill','move'][Math.floor(random()*3)];if(!act(m,a).ok)act(m,'move');assert.ok(m.battery>=0);const p=observation(m).p;assert.ok(Number.isFinite(p)&&p>=0&&p<=1);}
 assert.ok(m.done);assert.equal(m.liters,m.history.reduce((sum,e)=>sum+(e.liters||0),0));
}
for(const price of [.1,.45,1.3]){
 const q=train(price);assert.ok(q.flat().every(Number.isFinite));
 for(let b=0;b<18;b++)assert.notEqual(best(q,(b+.5)/18,MAX_SCANS),0);
}
// The storm changes readings, while preserving each site's hidden water and volume.
for(let i=0;i<100;i++){const clear=site(2047,i),storm=site(2047,i,true);assert.equal(clear.wet,storm.wet);assert.equal(clear.liters,storm.liters);clear.scans.forEach((row,k)=>row.forEach((x,j)=>assert.ok(Math.abs(storm.scans[k][j]-x-2.6)<1e-12)));}
console.log('PASS: Bayesian estimate semantics; unaffordable actions; scan limit reset; 100 mixed-action missions; finite values at 3 prices; storm ground-truth preservation.');
