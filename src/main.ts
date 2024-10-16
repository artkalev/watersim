import './style.css'

import basicVert from './shaders/basic.vert?raw'
import basicFrag from './shaders/basic.frag?raw'

import waterSimFrag from './shaders/waterSim.frag?raw'
import smoothFrag from './shaders/smooth.frag?raw'
import waterSurfaceVert from './shaders/waterSurface.vert?raw'
import waterSurfaceFrag from './shaders/waterSurface.frag?raw'
import calcNormalFrag from './shaders/calcNormal.frag?raw'

import cubeNegX from './cubemap/Stairs/negx.jpg'
import cubePosX from './cubemap/Stairs/posx.jpg'
import cubeNegY from './cubemap/Stairs/negy.jpg'
import cubePosY from './cubemap/Stairs/posy.jpg'
import cubeNegZ from './cubemap/Stairs/negz.jpg'
import cubePosZ from './cubemap/Stairs/posz.jpg'

import * as glMatrix from 'gl-matrix'

function intersectPlane(
  rayOrigin:glMatrix.vec3, 
  rayDir:glMatrix.vec3, 
  planeOrigin:glMatrix.vec3, 
  planeNormal:glMatrix.vec3
):number{
  const den = glMatrix.vec3.dot(planeNormal, rayDir);
  if(Math.abs(den) > 0.0001){
    const diff = new Float32Array(3);
    glMatrix.vec3.sub(diff, planeOrigin, rayOrigin);
    const t = glMatrix.vec3.dot(diff, planeNormal) / den;
    if( t > 0.0001 ){
      return t;
    }
  }
  return Infinity;
}

const canvas = document.createElement("canvas");
document.body.appendChild(canvas);
var gl = canvas.getContext("webgl2");

if(!gl){throw "no webgl2 context";}

function loadCubeMap(cubemap:WebGLTexture|null, negX:string, posX:string, negY:string, posY:string, negZ:string, posZ:string){
  if(!gl){throw "no gl"; }
  if(!cubemap){throw "invalid cubemap"; }

  const imgNegX = new Image();
  const imgPosX = new Image();
  const imgNegY = new Image();
  const imgPosY = new Image();
  const imgNegZ = new Image();
  const imgPosZ = new Image();

  let loadedCount = 0;

  imgNegX.onload = ()=>{
    if(!gl){throw "no gl"; }
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubemap);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imgNegX);
    loadedCount++;
    if(loadedCount == 6){gl.generateMipmap(gl.TEXTURE_CUBE_MAP);}
  };

  imgPosX.onload = ()=>{
    if(!gl){throw "no gl"; }
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubemap);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imgPosX);
    loadedCount++;
    if(loadedCount == 6){gl.generateMipmap(gl.TEXTURE_CUBE_MAP);}
  };

  imgNegY.onload = ()=>{
    if(!gl){throw "no gl"; }
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubemap);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imgNegY);
    loadedCount++;
    if(loadedCount == 6){gl.generateMipmap(gl.TEXTURE_CUBE_MAP);}
  };

  imgPosY.onload = ()=>{
    if(!gl){throw "no gl"; }
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubemap);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imgPosY);
    loadedCount++;
    if(loadedCount == 6){gl.generateMipmap(gl.TEXTURE_CUBE_MAP);}
  };

  imgNegZ.onload = ()=>{
    if(!gl){throw "no gl"; }
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubemap);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imgNegZ);
    loadedCount++;
    if(loadedCount == 6){gl.generateMipmap(gl.TEXTURE_CUBE_MAP);}
  };

  imgPosZ.onload = ()=>{
    if(!gl){throw "no gl"; }
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubemap);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imgPosZ);
    loadedCount++;
    if(loadedCount == 6){gl.generateMipmap(gl.TEXTURE_CUBE_MAP);}
  };

  imgNegX.src = negX;
  imgPosX.src = posX;
  imgNegY.src = negY;
  imgPosY.src = posY;
  imgNegZ.src = negZ;
  imgPosZ.src = posZ;
}

const cubemap = gl.createTexture();
gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubemap);
loadCubeMap(cubemap, cubeNegX, cubePosX, cubeNegY, cubePosY, cubeNegZ, cubePosZ);

function createShaderProgram(vss:string, fss:string){
  if(!gl){throw "no gl context";}
  const p = gl.createProgram();
  const vs = gl.createShader(gl.VERTEX_SHADER);
  const fs = gl.createShader(gl.FRAGMENT_SHADER);
  if(!p){ throw "failed to create shader program"; }
  if(!vs){throw "failed to create vertex shader"; }
  if(!fs){throw "failed to create fragment shader"; }

  gl.shaderSource(vs, vss);
  gl.compileShader(vs);
  if(!gl.getShaderParameter(vs, gl.COMPILE_STATUS)){
    throw "failed to compile shader:" + gl.getShaderInfoLog(vs);
  }

  gl.shaderSource(fs, fss);
  gl.compileShader(fs);
  if(!gl.getShaderParameter(fs, gl.COMPILE_STATUS)){
    throw "failed to compile shader:" + gl.getShaderInfoLog(fs);
  }

  gl.attachShader(p, vs);
  gl.attachShader(p, fs);
  gl.linkProgram(p);

  if(!gl.getProgramParameter(p, gl.LINK_STATUS)){
    throw "failed to link shader program:" + gl.getProgramInfoLog(p);
  }

  return p;
}

//let lastFrameTime = 0;
//let fps = 0;
//let deltaTime = 0;

let width = 512;
let height = 512;
let simWidth = 1024;
let simHeight = 1024;
let firstComputeframe = true;

let addHeightAtMouse = false;
let addHeightPosX = 0.0;
let addHeightPosY = 0.0;

const screenToWorldMatrix = new Float32Array(16);

const projectionMatrix = new Float32Array(16);
glMatrix.mat4.identity(projectionMatrix);
//glMatrix.mat4.perspective(projectionMatrix, 0.5, 1, 0.1, 100.0);
const viewPos  = new Float32Array([0,1,2]);
const viewTarget = new Float32Array([0,-0.05,0]);
const viewUp = new Float32Array([0,1,0]);
const viewMatrix = new Float32Array(16);
glMatrix.mat4.lookAt(viewMatrix, viewPos, viewTarget, viewUp);

const waterSurfaceMatrix = new Float32Array(16);
glMatrix.mat4.fromRotation(waterSurfaceMatrix, Math.PI/2.0, new Float32Array([1.0,0.0,0.0]));

const initialData = new Uint8Array(simWidth*simHeight*4);
let fbIndex = 0;
const fb0 = gl.createFramebuffer();
const fb0Tex = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, fb0Tex);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, simWidth, simHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, initialData);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

gl.bindFramebuffer(gl.FRAMEBUFFER, fb0);
gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fb0Tex, 0);

const fb1 = gl.createFramebuffer();
const fb1Tex = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, fb1Tex);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, simWidth, simHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, initialData);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

gl.bindFramebuffer(gl.FRAMEBUFFER, fb1);
gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fb1Tex, 0);

const fbNormal = gl.createFramebuffer();
const fbNormalTex = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, fbNormalTex);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, simWidth, simHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, initialData);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

gl.bindFramebuffer(gl.FRAMEBUFFER, fbNormal);
gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fbNormalTex, 0);

const g_quad = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, g_quad);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
  -1,-1,  0,0, 
   1,-1,  1,0,
   1, 1,  1,1,
  -1,-1,  0,0,
   1, 1,  1,1,
  -1, 1,  0,1
]), gl.STATIC_DRAW);

const g_denseGrid = gl.createBuffer();
const f_denseGrid = gl.createBuffer();
const s = 128;
const s1 = s+1;
const ss = s*s;
const ss1 = s1 * s1;
const d_denseGrid = new Float32Array(ss1*4);
const d_denseGridIndex = new Uint16Array(ss*6);

console.log("num verts", d_denseGrid.length / 4);

// dense grid vertex data
for(let iy = 0; iy <= s; iy++){
  for(let ix = 0; ix <= s; ix++){
    const index = (ix + iy * s1) * 4;
    d_denseGrid[index  ] = ix/s - 0.5; // vertex x
    d_denseGrid[index+1] = iy/s - 0.5; // vertex y
    d_denseGrid[index+2] = ix / s; // vertex u
    d_denseGrid[index+3] = iy / s; // vertex v
  }
}
gl.bindBuffer(gl.ARRAY_BUFFER, g_denseGrid);
gl.bufferData(gl.ARRAY_BUFFER, d_denseGrid, gl.STATIC_DRAW);

for(let iy = 0; iy < s; iy++){
  for(let ix = 0; ix < s; ix++){
    const vi0 = ix + iy * s1;
    const vi1 = (ix+1) + iy * s1;
    const vi2 = (ix+1) + (iy+1) * s1;
    const vi3 = ix + (iy+1) * s1;
    const fi = (ix + iy * s) * 6;
    d_denseGridIndex[fi] = vi0;
    d_denseGridIndex[fi+1] = vi1;
    d_denseGridIndex[fi+2] = vi2;
    d_denseGridIndex[fi+3] = vi0;
    d_denseGridIndex[fi+4] = vi2;
    d_denseGridIndex[fi+5] = vi3;
  }
}

gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, f_denseGrid);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, d_denseGridIndex, gl.STATIC_DRAW);

const p_basic:WebGLProgram = createShaderProgram(basicVert, basicFrag);

const p_sim:WebGLProgram = createShaderProgram(basicVert, waterSimFrag);
const p_sim_u_state = gl.getUniformLocation(p_sim, "u_state");
const p_sim_u_firstFrame = gl.getUniformLocation(p_sim, "u_firstFrame");
const p_sim_u_size = gl.getUniformLocation(p_sim, "u_size");
const p_sim_u_addHeight = gl.getUniformLocation(p_sim, "u_addHeight");
const p_sim_u_addHeightPos = gl.getUniformLocation(p_sim, "u_addHeightPos");

const p_blur:WebGLProgram = createShaderProgram(basicVert, smoothFrag);
const p_blur_u_state = gl.getUniformLocation(p_blur, "u_state");
const p_blur_u_stateSize = gl.getUniformLocation(p_blur, "u_stateSize");

const p_waterSurf:WebGLProgram = createShaderProgram(waterSurfaceVert, waterSurfaceFrag);
const p_waterSurf_u_modelMatrix = gl.getUniformLocation(p_waterSurf, "u_modelMatrix");
const p_waterSurf_u_viewMatrix = gl.getUniformLocation(p_waterSurf, "u_viewMatrix");
const p_waterSurf_u_projMatrix = gl.getUniformLocation(p_waterSurf, "u_projMatrix");
const p_waterSurf_u_state     = gl.getUniformLocation(p_waterSurf, "u_state");
const p_waterSurf_u_cubemap   = gl.getUniformLocation(p_waterSurf, "u_cubemap");
const p_waterSurf_u_viewPos   = gl.getUniformLocation(p_waterSurf, "u_viewPos");
const p_waterSurf_u_normal    = gl.getUniformLocation(p_waterSurf, "u_normal");

const p_calcNormal:WebGLProgram = createShaderProgram(basicVert, calcNormalFrag);
const p_calcNormal_u_state = gl.getUniformLocation(p_calcNormal, "u_state");
const p_calcNormal_u_stateSize = gl.getUniformLocation(p_calcNormal, "u_stateSize");

// clearing state
gl.bindFramebuffer(gl.FRAMEBUFFER, null);
gl.bindBuffer(gl.ARRAY_BUFFER, null);
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
gl.bindTexture(gl.TEXTURE_2D, null);

function drawQuad(){
  if(!gl){ throw "no webgl context"; }
  gl.bindBuffer(gl.ARRAY_BUFFER, g_quad);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 16, 8);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

function drawWaterSurface(){
  if(!gl){throw "no webgl context"; }

  gl.useProgram(p_waterSurf);
  gl.uniformMatrix4fv(p_waterSurf_u_modelMatrix, false, waterSurfaceMatrix);
  gl.uniformMatrix4fv(p_waterSurf_u_viewMatrix, false, viewMatrix);
  gl.uniformMatrix4fv(p_waterSurf_u_projMatrix, false, projectionMatrix);
  gl.uniform3fv(p_waterSurf_u_viewPos, viewPos);
  
  gl.activeTexture(gl.TEXTURE0);
  if(fbIndex == 0){
    gl.bindTexture(gl.TEXTURE_2D, fb0Tex);
  }else{
    gl.bindTexture(gl.TEXTURE_2D, fb1Tex);
  }

  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubemap);

  gl.uniform1i(p_waterSurf_u_state, 0);
  gl.uniform1i(p_waterSurf_u_cubemap, 1);

  gl.activeTexture(gl.TEXTURE2);
  gl.bindTexture(gl.TEXTURE_2D, fbNormalTex);
  gl.uniform1i(p_waterSurf_u_normal, 2);

  gl.bindBuffer(gl.ARRAY_BUFFER, g_denseGrid);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 16, 8);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, f_denseGrid);
  gl.drawElements(gl.TRIANGLES, d_denseGridIndex.length, gl.UNSIGNED_SHORT, 0);
}

function calcNormal(){
    if(!gl){ throw "no webgl context" }
    canvas.width = simWidth;
    canvas.height = simHeight;

    gl.bindFramebuffer(gl.FRAMEBUFFER, fbNormal);

    gl.useProgram(p_calcNormal);

    gl.activeTexture(gl.TEXTURE0);
    if(fbIndex == 0){
        gl.bindTexture(gl.TEXTURE_2D, fb0Tex);
    }else{
        gl.bindTexture(gl.TEXTURE_2D, fb1Tex);
    }

    gl.uniform2f(p_calcNormal_u_stateSize, simWidth, simHeight);
    gl.uniform1i(p_calcNormal_u_state, 0);

    gl.viewport(0,0,simWidth, simHeight);

    drawQuad();
}

function blur(){
    if(!gl){ throw "no webgl context" }
    canvas.width = simWidth;
    canvas.height = simHeight;

    gl.useProgram(p_blur);

    gl.activeTexture(gl.TEXTURE0);
    if(fbIndex == 0){
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb0);
        gl.bindTexture(gl.TEXTURE_2D, fb1Tex);
    }else{
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb1);
        gl.bindTexture(gl.TEXTURE_2D, fb0Tex);
    }

    gl.uniform2f(p_blur_u_stateSize, simWidth, simHeight);
    gl.uniform1i(p_blur_u_state, 0);

    gl.viewport(0,0,simWidth, simHeight);

    drawQuad();

    fbIndex = fbIndex == 0 ? 1 : 0;
}

function compute(){
    if(!gl){ throw "no webgl context" }
    canvas.width = simWidth;
    canvas.height = simHeight;

    gl.useProgram(p_sim);

    gl.activeTexture(gl.TEXTURE0);
    if(fbIndex == 0){
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb0);
        gl.bindTexture(gl.TEXTURE_2D, fb1Tex);
    }else{
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb1);
        gl.bindTexture(gl.TEXTURE_2D, fb0Tex);
    }

    gl.uniform2f(p_sim_u_size, simWidth, simHeight);
    gl.uniform1i(p_sim_u_firstFrame, firstComputeframe ? 1 : 0);
    gl.uniform1i(p_sim_u_state, 0);
    gl.uniform1i(p_sim_u_addHeight, addHeightAtMouse ? 1 : 0);
    gl.uniform2f(p_sim_u_addHeightPos, addHeightPosX, addHeightPosY);

    gl.viewport(0,0,simWidth, simHeight);

    drawQuad();

    fbIndex = fbIndex == 0 ? 1 : 0;
    if(firstComputeframe){firstComputeframe = false;}
}

canvas.addEventListener("mousedown", ()=>{
    addHeightAtMouse = true;
});

canvas.addEventListener("mouseup", ()=>{
    addHeightAtMouse = false;
});

function calcInteractionPos(screenX:number, screenY:number){
    const ndc = new Float32Array([screenX, screenY, 0]);
    const rayOrigin = new Float32Array(3);
    glMatrix.vec3.transformMat4(rayOrigin, ndc, screenToWorldMatrix);

    const rayDir = new Float32Array(3);
    glMatrix.vec3.sub(rayDir, rayOrigin, viewPos);
    glMatrix.vec3.normalize(rayDir, rayDir);
    const dist:number = intersectPlane(rayOrigin, rayDir, new Float32Array([0,0,0]), new Float32Array([0,1,0]));
    const worldIntersection = rayDir;
    glMatrix.vec3.scaleAndAdd(worldIntersection, rayOrigin, rayDir, dist);
    addHeightPosX = worldIntersection[0] + 0.5;
    addHeightPosY = worldIntersection[2] + 0.5;
}

canvas.addEventListener("mousemove", (e:MouseEvent)=>{
    calcInteractionPos(
      (e.clientX / canvas.clientWidth)*2.0-1.0,
      (1.0-(e.clientY / canvas.clientHeight))*2.0-1.0
    );
});

canvas.addEventListener("touchstart", (e:TouchEvent)=>{
    addHeightAtMouse = true;
    calcInteractionPos(
        (e.touches[0].clientX / canvas.clientWidth)*2.0-1.0,
        (1.0 - (e.touches[0].clientY / canvas.clientHeight))*2.0-1.0
    );
});

canvas.addEventListener("touchend", ()=>{
    addHeightAtMouse = false;
});

canvas.addEventListener("touchmove", (e:TouchEvent)=>{
    e.preventDefault();
    calcInteractionPos(
        (e.touches[0].clientX / canvas.clientWidth)*2.0-1.0,
        (1.0 - (e.touches[0].clientY / canvas.clientHeight))*2.0-1.0
    );
});

function mainloop(){
  if(!gl){return;}

  //const currentFrameTime = Date.now();
  //deltaTime = currentFrameTime - lastFrameTime;
  //lastFrameTime = currentFrameTime;

  // simulating water waves
  compute();
  blur();
  blur();
  calcNormal();

  // rendering into main renderbuffer now
  // ensuring native render resolution
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if(w != width || h != height){
    width = w;
    height = h;
    glMatrix.mat4.perspective(projectionMatrix, 0.3, width / height, 0.1, 100.0);
    glMatrix.mat4.multiply(screenToWorldMatrix, projectionMatrix, viewMatrix);
    glMatrix.mat4.invert(screenToWorldMatrix,screenToWorldMatrix);
  }

  canvas.width = width;
  canvas.height = height;
  
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  gl.viewport(0,0,width,height);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.useProgram(p_basic);

  drawWaterSurface();

  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.bindTexture(gl.TEXTURE_2D, null);

  requestAnimationFrame(mainloop);
}

mainloop();