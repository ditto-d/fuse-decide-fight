import assert from 'node:assert/strict';
import {ACTION_SECONDS,actionFrame} from '../dist/scene-timeline.mjs';
for(const action of ['scan','drill','move']){
  assert.equal(actionFrame(action,0).progress,0);
  const end=actionFrame(action,ACTION_SECONDS[action]+10);
  assert.equal(end.progress,1);
  assert.equal(end.arm,0,'Arm must be stowed before the scene releases the mission update');
  assert.equal(end.drill,0);
  assert.ok(Math.abs(end.scan)<1e-12);
  assert.equal(end.drive,action==='scan'?0:1);
}
for(let seconds=0;seconds<=6;seconds+=.02){
  const pose=actionFrame('drill',seconds);
  assert.ok(pose.arm>=0&&pose.arm<=1);
  if(pose.drill)assert.equal(pose.arm,1,'Drill only at the deployed pose');
  if(pose.drive>0)assert.equal(pose.arm,0,'Stow arm before traversing');
}
assert.equal(actionFrame('drill',3).phase,'Drilling at the target');
console.log('Scene timing passed: scan, sample, stow, traverse and completion boundaries.');
