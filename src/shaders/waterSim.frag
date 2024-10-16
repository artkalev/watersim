#version 300 es
precision highp float;

in vec2 v_uv;

uniform int u_firstFrame;
uniform vec2 u_size;
uniform sampler2D u_state;
uniform vec2 u_addHeightPos;
uniform int u_addHeight;
uniform int u_addHeightFactor;

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

vec2[9] getInputArea(vec2 uv){
    vec2 res[9];
    vec2 offset = vec2(1.0, 1.0) / u_size;
    for(int iy = -1; iy <= 1; iy++){
        for(int ix = -1; ix <= 1; ix++){
            vec4 packed = texture(u_state, floor(uv * u_size + vec2(ix, iy)) / u_size);
            res[(ix+1) + (iy+1)*3] = getPackedData(packed);
        }
    }
    return res;
}

vec2 getDir(vec4[9] stateArea){
    vec2 res = vec2(0.0);
    for(int iy = -1; iy <= 1; iy++){
        for(int ix = -1; ix <= 1; ix++){
            if(ix == 0 && iy == 0){ continue; }
            int index = (ix+1) + (iy+1) * 3;
            vec2 dirVec = normalize(vec2(float(ix), float(iy)));
            float diff = abs(stateArea[4].r - stateArea[index].r);
            res += dirVec * diff;
        }
    }
    res /= 8.0;
    return res;
}

vec2 calcNewState(vec2[9] stateArea){
    vec2 s = stateArea[4];
    float h = (
        (
            stateArea[1].r + stateArea[7].r + 
            stateArea[3].r + stateArea[5].r
        ) * 0.5 - s.y
    ) * 0.990;
    vec2 o = vec2(h, s.x);
    return o;
}

out vec4 outRGBA;

void main(){
    if(u_firstFrame == 1){
        outRGBA = packData(vec2(0.0,0.0));
        if(v_uv.x >= 0.4 && v_uv.x <= 0.6 && v_uv.y >= 0.4 && v_uv.y <= 0.6){
            outRGBA = packData(vec2(1.0, 0.0));
        }
    }else{
        vec2 stateArea[9] = getInputArea(v_uv);
        vec2 newState = stateArea[4];
        if(u_addHeight == 1){
            stateArea[4].x += max(0.0, 0.01 - distance(v_uv, u_addHeightPos)) / 0.01;
        }
        newState = calcNewState(stateArea);
        newState.x *= 0.995;
        outRGBA = packData(newState);
    }
}