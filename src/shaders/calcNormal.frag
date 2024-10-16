#version 300 es
precision highp float;

in vec2 v_uv;

uniform sampler2D u_state;
uniform vec2 u_stateSize;

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

out vec4 outRGBA;

void main(){
    vec2 s = vec2(1.0) / u_stateSize;
    float h0 = getPackedData(texture(u_state, v_uv)).x;
    float h1 = getPackedData(texture(u_state, v_uv + vec2( 1.0, 0.0 ) * s)).x;
    float h2 = getPackedData(texture(u_state, v_uv + vec2( 0.0, 1.0 ) * s)).x;

    vec3 n = normalize(vec3(
        h1 - h0,
        h2 - h0,
        0.2
    ));

    outRGBA = packData(n.xy);
}