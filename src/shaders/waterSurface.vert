#version 300 es

precision highp float;

layout(location=0) in vec2 a_pos;
layout(location=1) in vec2 a_uv;

uniform mat4 u_projMatrix;
uniform mat4 u_viewMatrix;
uniform mat4 u_modelMatrix;
uniform vec3 u_viewPos;

uniform sampler2D u_state;

vec2 getPackedData(vec4 packed){
    return vec2(
        packed.x + packed.y / 255.0,
        packed.z + packed.w / 255.0
    ) * 2.0 - 1.0;
}

out vec2 v_uv;
out vec3 v_viewDir;

void main(){
    v_uv = a_uv;
    float height = getPackedData(texture(u_state, v_uv)).x;
    v_viewDir = normalize(u_viewPos - (u_modelMatrix * vec4(a_pos, -height*0.05, 1.0)).xyz);
    gl_Position = u_projMatrix * u_viewMatrix * u_modelMatrix * vec4(a_pos, -height*0.05, 1.0);
}