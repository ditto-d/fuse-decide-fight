import {mkdirSync,copyFileSync} from 'node:fs';
import {dirname} from 'node:path';
const root=new URL('../',import.meta.url);
const files=['build/three.module.js','build/three.core.js','examples/jsm/loaders/GLTFLoader.js','examples/jsm/loaders/DRACOLoader.js','examples/jsm/controls/OrbitControls.js','examples/jsm/utils/BufferGeometryUtils.js','examples/jsm/libs/draco/gltf/draco_wasm_wrapper.js','examples/jsm/libs/draco/gltf/draco_decoder.wasm','examples/jsm/libs/draco/gltf/draco_decoder.js','LICENSE'];
files.push('examples/jsm/utils/SkeletonUtils.js');
for(const file of files){const output=new URL('dist/vendor/three/'+file,root);mkdirSync(dirname(output.pathname),{recursive:true});copyFileSync(new URL('node_modules/three/'+file,root),output);}
console.log('Vendored Three.js and model decoder for same-origin loading.');
