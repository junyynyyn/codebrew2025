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

float smin(float a, float b, float k) {
    float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
    return mix(b, a, h) - k * h * (1.0 - h);
}

float smax(float a, float b, float k){
    float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
    return -smin(-b, -a, h);
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

float scene(vec3 p) {
    // Create Spheres in scene

    vec3 rep = vec3(3.0);
    vec3 q = mod(p + 0.5 * rep, rep) - 0.5 * rep;
    float loopedY = mod(q.y + u_time, 3.5) - 1.0;
    float octahedronDis;
    if (u_musicDispl != 0.0) {
        octahedronDis = sdOctahedron(vec3(q.x, loopedY, q.z), mapRange(u_musicDispl, 180.0, 255.0, 0.3, 1.0));
    } else {
        octahedronDis = sdOctahedron(vec3(q.x, loopedY, q.z), 0.3);
    }

    return octahedronDis;
}

vec3 sceneCol(vec3 p) {
    float sphere1Dis = distance(p, vec3(cos(u_time), sin(u_time), 0)) - 1.0;
    float sphere2Dis = distance(p, vec3(sin(u_time), cos(u_time), 0)) - 0.75;

    float k = 0.5;
    float h = clamp(0.5 + 0.5 * (sphere2Dis - sphere1Dis) / k, 0.0, 1.0);

    vec3 color1 = vec3(0,1,1);
    vec3 color2 = vec3(0.8, 0, 0.8);

    return mix(color1, color2, mapRange(u_musicDispl, 180.0, 255.0, 0.3, 1.0));
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

    // Ray march to find total distance travelled
    float disTravelled = rayMarch(ro, rd);
    if (disTravelled >= u_maxDis) {
        gl_FragColor = vec4(u_clearColor, 1);
    } else {
        // If ray hits something
        // Get hit position and normal
        vec3 hp = ro + disTravelled * rd;
        vec3 n = normal(hp);

        // Diffuse Model ( I gotta learn how this works lmao)
        float dotNL = dot(n, u_lightDir);
        float diff = max(dotNL, 0.0) * u_diffIntensity;
        float spec = pow(diff, u_shininess) * u_specIntensity;
        float ambient = u_ambientIntensity;

        vec3 color = u_lightColor * (sceneCol(hp) * (spec + ambient + diff));
        gl_FragColor = vec4(color, 1.0);
    }
}