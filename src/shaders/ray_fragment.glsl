precision mediump float;
in vec2 vUv;

uniform vec3 u_clearColor;

uniform float u_eps;
uniform float u_maxDis;
uniform int u_maxSteps;

uniform vec3 u_camPos;
uniform mat4 u_camToWorldMat;
uniform mat4 u_camInvProjMat;

uniform vec3 u_lightDir;
uniform vec3 u_lightColor;

uniform float u_diffIntensity;
uniform float u_specIntensity;
uniform float u_ambientIntensity;
uniform float u_shininess;

uniform float u_time;
uniform float u_musicDispl;
uniform float u_musicDispl2;

uniform vec3 u_outlineColor;
uniform vec3 u_color1;
uniform vec3 u_color2;

float smin(float a, float b, float k) {
    float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
    return mix(b, a, h) - k * h * (1.0 - h);
}

float smax(float a, float b, float k){
    float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
    return -smin(-b, -a, h);
}

mat2 rotate(float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return mat2(c, -s, s, c);
}

vec3 rotateX(vec3 p, float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return vec3(
        p.x,
        c * p.y - s * p.z,
        s * p.y + c * p.z
    );
}

// Rotate around Y axis
vec3 rotateY(vec3 p, float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return vec3(
        c * p.x + s * p.z,
        p.y,
        -s * p.x + c * p.z
    );
}

vec3 rotateZ(vec3 v, float angle) {
    float cosA = cos(angle);
    float sinA = sin(angle);
    
    mat3 rotationMatrix = mat3(
        cosA, -sinA, 0.0,
        sinA, cosA, 0.0,
        0.0, 0.0, 1.0
    );
    
    return rotationMatrix * v;
}


float mapRange(float value, float inputMin, float inputMax, float outputMin, float outputMax) {
    return outputMin + (value - inputMin) * (outputMax - outputMin) / (inputMax - inputMin);
}

float sdOctahedron( vec3 p, float s )
{
  p = abs(p);
  float m = p.x+p.y+p.z-s;
  vec3 q;
       if( 3.0*p.x < m ) q = p.xyz;
  else if( 3.0*p.y < m ) q = p.yzx;
  else if( 3.0*p.z < m ) q = p.zxy;
  else return m*0.57735027;
    
  float k = clamp(0.5*(q.z-q.y+s),0.0,s); 
  return length(vec3(q.x,q.y-s+k,q.z-k)); 
}

float sdSphere( vec3 p, float s )
{
  return length(p)-s;
}

float sdTorus( vec3 p, vec2 t )
{
  vec2 q = vec2(length(p.xz)-t.x,p.y);
  return length(q)-t.y;
}

float scene(vec3 p) {
    // vec3 rep = vec3(4.0);
    // // vec3 q = mod(p + 1.0 * rep, rep) - 0.4 * rep;
    // q = p;
    // float loopedY = mod(q.y, 4.0) - 1.0;
    // float normalized = 0.0;
    // if (u_musicDispl > 0.0) {
    //     normalized = mapRange(u_musicDispl, 220.0, 240.0, 0.2, 0.6);
    // }
    // vec3 p_rotation = vec3(q.x, q.y-normalized, q.z);
    // p_rotation.xz = rotate(u_musicDispl) * p.xz;

    // float dia1 = sdOctahedron(p_rotation, 1.0);

    // float spheremid = sdOctahedron(vec3(q.x, q.y, q.z), 0.5);
    // float dia2 = sdOctahedron(vec3(q.x, q.y+normalized, q.z), 1.0);
    // float sphere_mins = smin(dia1, dia2, 0.5);

    // float orb1 = sdSphere(vec3(q.x-4.0, q.y-normalized, q.z), 0.5);
    // float orb2 = sdSphere(vec3(q.x-4.0, q.y+normalized, q.z), 0.5);
    // float diamid = sdOctahedron(vec3(q.x-4.0, q.y, q.z), 0.5);
    // return sphere_mins;
    vec3 origin = p + vec3(0.0, 0.0, 3.0);
    origin = rotateX(origin, -0.5);
    vec3 origin_rotation1 = rotateY(origin, u_time*0.5);
    
    // vec3 origin_rotation1 = p;
    // origin_rotation1.xz = rotate(u_time) * p.xz;
    vec3 origin_rotation2 = rotateY(origin, u_time);
    vec3 origin_rotation3 = rotateY(origin, u_time*1.5);

    vec3 torus_rotation = rotateZ(origin, 0.35);
    vec3 torus_rotation2 = rotateZ(origin, -0.2);
    torus_rotation2 = rotateY(origin, u_time*0.2);

    float min_range_val = 60.0;
    float max_range_val = 100.0;

    float dia1 = sdOctahedron(origin_rotation1 + vec3(3, 0, 0), mapRange(u_musicDispl, 60.0, 100.0, 0.2, 0.6));
    
    float dia2 = sdOctahedron(origin_rotation2 + vec3(3.5, 0, 0), mapRange(u_musicDispl, 60.0, 100.0, 0.2, 0.6));
    
    float sphere1 = sdSphere(origin_rotation3 + vec3(3, 0, 0), mapRange(u_musicDispl, 60.0, 100.0, 0.4, 0.6));

    float sphereSmall1 = sdSphere(origin_rotation1 + vec3(3, 0, 3), 0.2);
    float sphereSmall2 = sdSphere(origin_rotation1 + vec3(3, 0, -3), 0.2);
    float sphereSmall3 = sdSphere(origin_rotation1 + vec3(0, 0, 3), 0.2);

    float taurus1 = sdTorus(torus_rotation, vec2(2, 0.05));
    float taurus2 = sdTorus(torus_rotation2, vec2(5, mapRange(u_musicDispl, 60.0, 100.0, 0.03, 0.1)));

    const int numValues = 8;
    float shapes[numValues] = float[numValues](dia1, dia2, sphere1, sphereSmall1, sphereSmall2, sphereSmall3, taurus1, taurus2);

    float min_val = 100000.0;
    for (int i=0;i<numValues;i++) {
        min_val = smin(min_val, shapes[i], 0.5);
    }
    return min_val;
}

vec3 sceneCol(vec3 p) {
    vec3 color1 = vec3(1.0, 1.0, 1.0);
    vec3 color2 = vec3(0.8, 0.8, 0.8);

    float radius = scene(p);
    if (radius < 0.1) {
        return u_color2;
    }
    return u_color1;

    // return mix(color1, color2, mapRange(u_musicDispl, 180.0, 255.0, 0.3, 1.0));
}

vec3 normal(vec3 p) 
{
    vec3 n = vec3(0,0,0);
    vec3 e;
    for (int i=0;i<4;i++) {
        e = 0.5773 * (2.0 * vec3((((i + 3) >> 1) & 1), ((i >> 1) & 1), (i & 1)) - 1.0);
        n += e * scene(p + e * u_eps);
    }
    return normalize(n);
}

float rayMarch(vec3 ro, vec3 rd) {

    float d = 0.0; // Total distance travelled
    float cd; // Current scene distance
    vec3 p; // Current position of ray

    for (int i=0;i<u_maxSteps; ++i) {
        p = ro + d * rd; // Calculate new position
        cd = scene(p); // Get closest distance to an object
        
        // If anything has been hit, or the distance is too far, break
        if (cd < u_eps || d >= u_maxDis) break;
        
        d += cd;
    }

    return d;
}

void main() {
    // UV from vertex shader
    vec2 uv = vUv.xy;

    // Ray Origin and Direction from camera uniform
    vec3 ro = u_camPos;
    vec3 rd = (u_camInvProjMat * vec4(uv*2.0-1.0, 0, 1)).xyz;
    rd = (u_camToWorldMat * vec4(rd, 0)).xyz;
    rd = normalize(rd);

    // // Ray march to find total distance travelled
    // float disTravelled = rayMarch(ro, rd);
    // if (disTravelled >= u_maxDis) {
    //     gl_FragColor = vec4(u_clearColor, 1);
    // } else {
    //     // If ray hits something
    //     // Get hit position and normal
    //     vec3 hp = ro + disTravelled * rd;
    //     vec3 n = normal(hp);

    //     // Diffuse Model ( I gotta learn how this works lmao)
    //     float dotNL = dot(n, u_lightDir);
    //     float diff = max(dotNL, 0.0) * u_diffIntensity;
    //     float spec = pow(diff, u_shininess) * u_specIntensity;
    //     float ambient = u_ambientIntensity;

    //     vec3 color = u_lightColor * (sceneCol(hp) * (spec + ambient + diff));
    //     gl_FragColor = vec4(color, 1.0);
    // }
    float glow_threshold = 0.05;

    float d = 0.0; // Total distance travelled
    float cd; // Current scene distance
    vec3 p; // Current position of ray

    float prev_cd = 100.0;
    float glow = 0.0;

    for (int i=0;i<u_maxSteps; ++i) {
        p = ro + d * rd; // Calculate new position
        cd = scene(p); // Get closest distance to an object
        
        // If anything has been hit, or the distance is too far, break
        if (cd < u_eps || d >= u_maxDis) break;

        // if (cd < glow_threshold && prev_cd < glow_threshold) {
        //     glow = mapRange(glow_threshold - cd, 0.0, glow_threshold, 0.0, 1.0);
        // }
        glow += exp(-abs(cd) * 15.0);
        
        d += cd;
        prev_cd = cd;
    }

    if (d >= u_maxDis) {
        if (glow > 0.0) {
            vec3 glow_color = u_clearColor + glow * u_outlineColor;
            float fog = exp(-d * 0.02); // tweak

            gl_FragColor = vec4(mix(u_clearColor, glow_color, fog), 1.0);
            
        } else {
            gl_FragColor = vec4(u_clearColor, 1);
        }
    } else {
        // If ray hits something
        // Get hit position and normal
        vec3 hp = ro + d * rd;
        vec3 n = normal(hp);

        float dotNL = dot(n, u_lightDir);
        float diff = max(dotNL, 0.0) * u_diffIntensity;
        float spec = pow(diff, u_shininess) * u_specIntensity;
        float ambient = u_ambientIntensity;

        vec3 color = u_lightColor * (sceneCol(hp) * (spec + ambient + diff));
        gl_FragColor = vec4(color, 1.0);
    }
}