import assert from 'node:assert/strict';
import {trainingSteps,train,updateValue,confidence,site,evaluate} from '../dist/engine.mjs';
import {fusionLab,learningLab,advanceLab,resetLab} from '../dist/learning.mjs';

// Step-through and batch training must return identical learned values.
const steps=trainingSteps();
let result=steps.next(), updates=0;
const first=result.value;
assert.equal(first.action,1);
assert.equal(first.reward,-4.05);
assert.equal(first.after,-.486);
while(!result.done){updates++;result=steps.next();}
const q=train();
assert.deepEqual(result.value,q);
assert.ok(updates>8000);

// Terminal updates ignore future values; scan updates bootstrap from next state.
const small=[[1,2,3],[4,5,6]];
const bootstrapped=updateValue(small,0,0,-.45,1,2);
assert.equal(bootstrapped.future,6);
assert.equal(bootstrapped.target,5.55);
assert.ok(Math.abs(bootstrapped.after-1.546)<1e-12);
assert.equal(updateValue(small,0,1,5.95,null,null).target,5.95);

// Known-bias correction restores beliefs and decisions, not just a displayed number.
for(let i=0;i<100;i++){
 const clear=site(8100+i,0), storm=site(8100+i,0,true);
 for(let k=1;k<=9;k++)assert.ok(Math.abs(confidence(clear.scans.slice(0,k))-confidence(storm.scans.slice(0,k),2.6))<1e-12);
}
assert.deepEqual(evaluate(q,true,300,2.6),evaluate(q,false,300));

// Display values come from the current observations and training events.
assert.match(fusionLab([site(3105,0).scans[0]]),/60\.7% wet/);
resetLab();advanceLab();
assert.match(learningLab(),/-0\.486/);
advanceLab();assert.match(learningLab(),/-0\.054/);
resetLab();assert.match(learningLab(),/0 UPDATES/);
console.log('PASS: step/batch Q equivalence; terminal and bootstrapped targets; bias correction across 300 missions; live lab values.');
