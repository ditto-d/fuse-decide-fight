import * as THREE from 'three';
import {GLTFLoader} from './vendor/three/examples/jsm/loaders/GLTFLoader.js';
import {DRACOLoader} from './vendor/three/examples/jsm/loaders/DRACOLoader.js';
import {OrbitControls} from './vendor/three/examples/jsm/controls/OrbitControls.js';
import {ACTION_SECONDS,actionFrame} from './scene-timeline.mjs';

export function createRoverScene(){
  const element=document.createElement('div');element.className='rover-webgl';
  const canvas=document.createElement('canvas');canvas.setAttribute('aria-label','Interactive 3D Perseverance rover on simulated Mars terrain. Drag to orbit; use the view buttons for preset cameras.');canvas.tabIndex=0;element.append(canvas);
  const mobile=matchMedia('(max-width:760px)').matches;
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1.3:1.6));
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.35;
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  const world=new THREE.Scene();world.background=new THREE.Color('#bda38a');world.fog=new THREE.FogExp2('#bda38a',.013);
  const camera=new THREE.PerspectiveCamera(40,1,.1,220);
  const controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.dampingFactor=.09;controls.enablePan=false;controls.minDistance=3.5;controls.maxDistance=12;controls.maxPolarAngle=Math.PI*.48;controls.minPolarAngle=.15;
  controls.target.set(0,.85,.25);
  const hemisphere=new THREE.HemisphereLight('#ffe8ca','#6d3d23',2.6);world.add(hemisphere);
  const sun=new THREE.DirectionalLight('#fff0d8',3.4);sun.position.set(-6,10,7);sun.castShadow=true;sun.shadow.mapSize.set(mobile?1024:2048,mobile?1024:2048);Object.assign(sun.shadow.camera,{left:-7,right:7,top:7,bottom:-7,near:.1,far:40});sun.shadow.normalBias=.02;sun.shadow.bias=-.00015;world.add(sun);
  const terrain=new THREE.Group();world.add(terrain);
  const groundHeight=(x,z)=>Math.max(0,Math.min(1,(Math.abs(x)-5)/28))*(2.6+2.2*Math.sin(x*.075+z*.041)+1.3*Math.sin(z*.12-x*.06));
  const groundGeometry=new THREE.PlaneGeometry(180,180,160,160);groundGeometry.rotateX(-Math.PI/2);
  const position=groundGeometry.attributes.position;
  for(let i=0;i<position.count;i++){
    const x=position.getX(i),z=position.getZ(i);
    position.setY(i,groundHeight(x,z));
  }
  groundGeometry.computeVertexNormals();
  const groundMaterial=new THREE.MeshStandardMaterial({color:'#aa7650',roughness:1,metalness:0});
  const loader=new THREE.TextureLoader();
  loader.load('./assets/mars-soil.png',texture=>{texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(65,65);texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());groundMaterial.map=texture;groundMaterial.bumpMap=texture;groundMaterial.bumpScale=.025;groundMaterial.color.set('#d8bc9e');groundMaterial.needsUpdate=true;});
  const ground=new THREE.Mesh(groundGeometry,groundMaterial);ground.receiveShadow=true;terrain.add(ground);
  // Deterministic terrain decoration, kept independent from the learning engine.
  let randomState=47;const random=()=>{randomState=(1664525*randomState+1013904223)>>>0;return randomState/4294967296;};
  const rockGeometry=new THREE.IcosahedronGeometry(1,2);
  const rp=rockGeometry.attributes.position;for(let i=0;i<rp.count;i++){const scale=.86+.12*Math.sin(rp.getX(i)*12+rp.getY(i)*7+rp.getZ(i)*19);rp.setXYZ(i,rp.getX(i)*scale,rp.getY(i)*scale*.7,rp.getZ(i)*scale);}rockGeometry.computeVertexNormals();
  const rockMaterial=new THREE.MeshStandardMaterial({color:'#735643',roughness:1});
  const rocks=new THREE.InstancedMesh(rockGeometry,rockMaterial,340);const transform=new THREE.Object3D();
  for(let i=0;i<340;i++){let x=(random()-.5)*75,z=(random()-.5)*75;if(Math.abs(x)<2.3&&Math.abs(z)<9)x+=x<0?-4:4;const size=.07+Math.pow(random(),4)*.8;transform.position.set(x,groundHeight(x,z)+size*.2,z);transform.rotation.set(random(),random()*6,random());transform.scale.setScalar(size);transform.updateMatrix();rocks.setMatrixAt(i,transform.matrix);rocks.setColorAt(i,new THREE.Color().setHSL(.063+random()*.025,.18+random()*.18,.16+random()*.12));}rocks.castShadow=true;rocks.receiveShadow=true;terrain.add(rocks);

  const trackGeometry=new THREE.PlaneGeometry(.31,.17);trackGeometry.rotateX(-Math.PI/2);
  const tracks=new THREE.InstancedMesh(trackGeometry,new THREE.MeshStandardMaterial({color:'#53382c',transparent:true,opacity:.28,depthWrite:false,roughness:1}),120);
  for(let i=0;i<60;i++)for(let side=0;side<2;side++){transform.position.set(side?1.06:-1.06,.007,-1.4-i*.18);transform.rotation.set(0,0,0);transform.scale.set(1,1,1);transform.updateMatrix();tracks.setMatrixAt(i*2+side,transform.matrix);}terrain.add(tracks);
  const reticle=new THREE.Mesh(new THREE.RingGeometry(.35,.39,64),new THREE.MeshBasicMaterial({color:'#edc392',transparent:true,opacity:.55,side:THREE.DoubleSide,depthWrite:false}));reticle.rotation.x=-Math.PI/2;reticle.position.set(0,.018,2.1);world.add(reticle);
  const sweep=new THREE.Mesh(new THREE.RingGeometry(.96,1,80,1,0,Math.PI*1.25),new THREE.MeshBasicMaterial({color:'#a9e5df',transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false}));sweep.rotation.x=-Math.PI/2;sweep.position.y=.035;world.add(sweep);

  const dustCount=100,dustPositions=new Float32Array(dustCount*3);const dustGeometry=new THREE.BufferGeometry();dustGeometry.setAttribute('position',new THREE.BufferAttribute(dustPositions,3));
  const dustMaterial=new THREE.PointsMaterial({color:'#bd9672',size:.11,transparent:true,opacity:0,depthWrite:false});
  dustMaterial.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>','diffuseColor.a *= 1.0 - smoothstep(0.05,0.5,length(gl_PointCoord-vec2(0.5)));\n#include <opaque_fragment>');};
  const dust=new THREE.Points(dustGeometry,dustMaterial);world.add(dust);
  const roverGroup=new THREE.Group();world.add(roverGroup);
  let rover=null,mixer=null,armActions=[],mast=null,mastHome=null,turret=null,shoulder=null,drillBit=null,ready=false,failed=false;
  let distance=0;const wheelPivots=[],armJoints=[];let drillHome=null;
  const sampleRock=new THREE.Mesh(rockGeometry,new THREE.MeshStandardMaterial({color:'#867361',roughness:.95}));sampleRock.scale.set(.38,.29,.4);sampleRock.position.set(.275,.04,2.59);sampleRock.castShadow=true;sampleRock.receiveShadow=true;world.add(sampleRock);reticle.position.set(.275,.023,2.59);
  let animation=null,host=null,storm=false,motion=!matchMedia('(prefers-reduced-motion:reduce)').matches,lastTime=0;
  let currentCamera='orbit';
  function setCamera(view='orbit'){
    currentCamera=view;
    const views={orbit:[4.4,2.6,5.8],front:[0,2.5,7.5],top:[.01,8,.1],tool:[3,1.9,4.8]};
    camera.position.set(...(views[view]||views.orbit));controls.target.set(0,view==='tool'?.8:.85,view==='tool'?1.1:.25);controls.update();
  }
  setCamera();
  function status(text,progress=null){if(!host)return;const caption=host.querySelector('[data-scene-status]');if(caption&&caption.textContent!==text)caption.textContent=text;const bar=host.querySelector('[data-scene-progress]');if(bar)bar.style.width=(progress===null?0:progress*100)+'%';}
  const draco=new DRACOLoader();draco.setDecoderPath('./vendor/three/examples/jsm/libs/draco/gltf/');draco.setWorkerLimit(1);
  const gltfLoader=new GLTFLoader();gltfLoader.setDRACOLoader(draco);
  gltfLoader.load('./assets/perseverance.glb',gltf=>{
    rover=gltf.scene;roverGroup.add(rover);rover.traverse(node=>{if(node.isMesh){node.castShadow=true;node.receiveShadow=true;}});
    const node=name=>rover.getObjectByName(name)||rover.getObjectByName(name.replace(/[.]/g,''));
    node('Cylinder')?.quaternion.fromArray([.2389447093,-.4280070066,-.6655114293,.5628587008]);node('top')?.quaternion.identity();
    mast=node('head');if(mast)mastHome=mast.quaternion.clone();turret=node('turret_obj');shoulder=node('arm.002');drillBit=node('corring_drill');
    // NASA combines the wheels. Partition their existing triangles into six axles.
    rover.updateMatrixWorld(true);
    const wheelRoot=node('Wheels_objs');const parts=[];wheelRoot?.traverse(part=>{if(part.isMesh)parts.push(part);});
    const buckets=Array.from({length:6},()=>({box:new THREE.Box3(),parts:[]}));const vertex=new THREE.Vector3();
    for(const part of parts){const geometry=part.geometry,position=geometry.attributes.position,index=geometry.index;const indices=Array.from({length:6},()=>[]);const count=index?index.count:position.count;
      for(let i=0;i<count;i+=3){let x=0,z=0;const triangle=[];for(let j=0;j<3;j++){const idx=index?index.getX(i+j):i+j;triangle.push(idx);vertex.fromBufferAttribute(position,idx).applyMatrix4(part.matrixWorld);x+=vertex.x;z+=vertex.z;}z/=3;const bucket=(x>=0?3:0)+(z<-.55?0:z>.55?2:1);indices[bucket].push(...triangle);for(const idx of triangle){vertex.fromBufferAttribute(position,idx).applyMatrix4(part.matrixWorld);buckets[bucket].box.expandByPoint(vertex);}}
      indices.forEach((list,i)=>{if(list.length)buckets[i].parts.push({part,list});});part.visible=false;
    }
    for(const bucket of buckets){if(bucket.box.isEmpty())continue;const center=bucket.box.getCenter(new THREE.Vector3());center.y=.263746;const pivot=new THREE.Group();pivot.position.copy(center);roverGroup.add(pivot);wheelPivots.push(pivot);for(const {part,list} of bucket.parts){const geometry=part.geometry.clone();geometry.setIndex(list);geometry.applyMatrix4(part.matrixWorld);geometry.translate(-center.x,-center.y,-center.z);const mesh=new THREE.Mesh(geometry,part.material);mesh.castShadow=true;mesh.receiveShadow=true;pivot.add(mesh);}}
    mixer=new THREE.AnimationMixer(rover);
    for(const clip of gltf.animations){if(/^(arm[._]|armAction|turret_objAction|ArmatureAction)/.test(clip.name)){const action=mixer.clipAction(clip);action.play();armActions.push(action);}}
    mixer.setTime(0);
    const samplePose={'arm.003':[-.707106769,0,.707106769,.0000000618],'arm.002':[.0000002136,.0000001111,-.7286128697,.6849257492],'arm':[-.00000001197,-.0000003489,-.5875443816,.8091919422],'arm.004':[.0000003548,.0000004054,.6959514022,.7180889249],'turret_obj':[-.7607883811,.0000006528,.6489998102,.0005560349]};
    for(const [name,quaternion] of Object.entries(samplePose)){const joint=node(name);if(joint)armJoints.push({joint,home:joint.quaternion.clone(),target:new THREE.Quaternion().fromArray(quaternion).normalize()});}
    if(drillBit)drillHome=drillBit.quaternion.clone();
    ready=true;host?.classList.add('scene-ready');status('Ready for your command');
    draco.dispose();
  },event=>{if(!ready&&!animation)status(event.total?'Loading rover · '+Math.round(event.loaded/event.total*100)+'%':'Loading the rover model');},()=>{failed=true;host?.classList.add('scene-unavailable');status('3D unavailable on this device · mission controls still work');});

  function updatePose(frame,elapsed){
    for(const {joint,home,target} of armJoints)joint.quaternion.slerpQuaternions(home,target,frame.arm);
    if(drillBit&&drillHome){drillBit.quaternion.copy(drillHome);if(frame.drill)drillBit.rotateY(elapsed*24);}
    if(mast&&mastHome){mast.quaternion.copy(mastHome);mast.rotateY(frame.scan*Math.sin(elapsed*3)*.45);}
    roverGroup.position.y=frame.drive>0?Math.sin(elapsed*18)*.018:0;
    terrain.position.z=-((distance+frame.drive*6)%30);
    for(const wheel of wheelPivots)wheel.rotation.x=(distance+frame.drive*6)/.263;
    sweep.material.opacity=frame.scan*.55;sweep.scale.setScalar(.6+(elapsed%1.1)*3);sweep.rotation.z=elapsed*.8;
    reticle.material.opacity=frame.drill?.8:.4;
    const toolPosition=new THREE.Vector3(.275,.2,2.59);if(drillBit){rover.updateMatrixWorld(true);drillBit.getWorldPosition(toolPosition);}
    dust.material.opacity=frame.drill?.55:frame.drive>0&&frame.drive<1?.3:storm?.24:0;
    for(let i=0;i<dustCount;i++){
      const a=i*2.399,age=(elapsed*.8+i*.037)%1;
      const source=frame.drill?toolPosition:{x:(i%2?1:-1)*1.1,y:.08,z:-.8};
      dustPositions[i*3]=source.x+Math.cos(a)*age*(storm?6:.65);
      dustPositions[i*3+1]=source.y+age*(storm?3:.65);
      dustPositions[i*3+2]=source.z+Math.sin(a)*age+age*(frame.drive?2:0);
    }
    dustGeometry.attributes.position.needsUpdate=true;
  }
  const idle={scan:0,arm:0,drill:0,drive:0};
  function resize(){if(!host||!host.isConnected)return;const width=host.clientWidth,height=host.clientHeight;renderer.setSize(width,height,false);camera.aspect=width/Math.max(1,height);camera.updateProjectionMatrix();}
  const observer=new ResizeObserver(resize);
  function frame(time){requestAnimationFrame(frame);if(!element.isConnected||document.hidden)return;if(time-lastTime<1000/30)return;lastTime=time;
    if(animation){const seconds=(time-animation.start)/1000;const pose=actionFrame(animation.action,seconds);updatePose(pose,seconds);status(pose.phase,pose.progress);if(pose.progress>=1){const done=animation.resolve;if(animation.action!=='scan')distance+=6;animation=null;updatePose(idle,0);status('Command complete');done();}}
    else if(storm)updatePose(idle,time/1000);
    controls.update();renderer.render(world,camera);
  }
  requestAnimationFrame(frame);
  return {
    mount(container){host=container;if(!container)return;container.querySelector('.scene-canvas')?.append(element);container.classList.toggle('scene-ready',ready);container.classList.toggle('scene-unavailable',failed);observer.disconnect();observer.observe(container);resize();if(!animation)status(ready?'Ready for your command':failed?'3D unavailable on this device · mission controls still work':'Loading the rover model');},
    view:setCamera,
    setStorm(value){storm=value;world.fog.density=value?.065:.013;world.background.set(value?'#a78667':'#bda38a');world.fog.color.copy(world.background);sun.intensity=value?1.6:3.4;},
    setMotion(value){motion=value;if(!value&&animation)this.finish();},
    get motion(){return motion;},
    perform(action){if(!ready||!motion||failed)return Promise.resolve();if(animation)this.finish();return new Promise(resolve=>{animation={action,start:performance.now(),resolve};});},
    finish(){if(!animation)return;const resolve=animation.resolve;if(animation.action!=='scan')distance+=6;animation=null;updatePose(idle,0);status('Command complete');resolve();},
    get ready(){return ready;}
  };
}
