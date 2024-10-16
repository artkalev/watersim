#version 300 es
precision highp float;

in vec2 v_uv;

uniform sampler2D u_state;
uniform vec2 u_stateSize;

out vec4 outRGBA;

vec2 getPackedData(vec4 packed){
    return vec2(
        packed.x + packed.y / 255.0,
        packed.z + packed.w / 255.0
    ) * 2.0 - 1.0;
}

vec4 packData(vec2 unpacked){
    vec2 d = unpacked;
    d = (d + 1.0) / 2.0;
    vec4 o = vec4(0.0);
    o.x = floor(d.x * 255.0) / 255.0;
    o.y = fract(d.x * 255.0);
    o.z = floor(d.y * 255.0) / 255.0;
    o.w = fract(d.y * 255.0);
    return o;
}

void main(){
    vec2 o = getPackedData(texture(u_state, v_uv));

    o.x += getPackedData(texture(u_state, v_uv + vec2(-1,0) / u_stateSize)).x;
    o.x += getPackedData(texture(u_state, v_uv + vec2( 1,0) / u_stateSize)).x;
    o.x += getPackedData(texture(u_state, v_uv + vec2( 0,-1) / u_stateSize)).x;
    o.x += getPackedData(texture(u_state, v_uv + vec2( 0,1) / u_stateSize)).x;

    o.x += getPackedData(texture(u_state, v_uv + vec2( -1,-1) / u_stateSize)).x*0.5;
    o.x += getPackedData(texture(u_state, v_uv + vec2(  1, 1) / u_stateSize)).x*0.5;
    o.x += getPackedData(texture(u_state, v_uv + vec2( -1, 1) / u_stateSize)).x*0.5;
    o.x += getPackedData(texture(u_state, v_uv + vec2(  1,-1) / u_stateSize)).x*0.5;

    o.x /= 7.0;

    outRGBA = packData(o);
}