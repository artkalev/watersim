#version 300 es
precision highp float;

uniform sampler2D u_state;
uniform sampler2D u_normal;
uniform samplerCube u_cubemap;

uniform vec3 viewPos;

in vec2 v_uv;
in vec3 v_viewDir;

out vec4 outRGBA;

vec2 getPackedData(vec4 packed){
    return vec2(
        packed.x + packed.y / 255.0,
        packed.z + packed.w / 255.0
    ) * 2.0 - 1.0;
}

void main(){
    vec3 n = normalize(vec3(getPackedData(texture(u_normal, v_uv)), 1.0));
    vec3 col = vec3(0.5);

    vec3 reflCube = texture(u_cubemap, reflect(v_viewDir,n)).rgb;
    vec3 refrCube = texture(u_cubemap, refract(-v_viewDir,n, 1.5)).rgb;
    vec3 shadeCube = texture(u_cubemap, n, 0.0).rgb;

    col = vec3(1.0, 0.75, 0.5) * pow(length(shadeCube), 2.0);

    outRGBA = vec4((reflCube + refrCube)/2.0+col, 1.0);
    //outRGBA.rgb = col;
}