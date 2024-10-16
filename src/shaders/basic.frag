#version 300 es
precision highp float;

in vec2 v_uv;

out vec4 outRGBA;

void main(){
    outRGBA = vec4(v_uv, 0.0, 1.0);
}