#ifdef GL_ES
precision mediump float;
#endif

//--------------------------------------------------------------
// Uniforms
//--------------------------------------------------------------
uniform vec2 iResolution;  // Viewport resolution
uniform float iTime;       // Elapsed time in seconds

uniform vec3 blueSpherePos;
uniform vec3 redSpherePos;

uniform float blueSphereRadius;
uniform float redSphereRadius;

uniform vec3 blueSphereColor;
uniform vec3 redSphereColor;

uniform float blueSphereMetalness;
uniform float redSphereMetalness;

uniform float blueSphereRoughness;
uniform float redSphereRoughness;

uniform vec3 blueSphereEmissive;
uniform vec3 redSphereEmissive;

uniform float blueSphereAnisotropy;
uniform float redSphereAnisotropy;

uniform float blueSphereSubsurface;
uniform float redSphereSubsurface;
uniform vec3  blueSphereSubsurfaceColor;
uniform vec3  redSphereSubsurfaceColor;

// New uniforms for Sheen
uniform float blueSphereSheen;
uniform float redSphereSheen;
uniform vec3  blueSphereSheenColor;
uniform vec3  redSphereSheenColor;

uniform vec3 cameraPos;
uniform vec3 cameraRot;
uniform float cameraFov;

//--------------------------------------------------------------
// Global Parameters and Scene Configuration
//--------------------------------------------------------------

#define MAX_STEPS 300
#define MAX_DIST 100.0
#define SURF_DIST 0.01

float camFov = 40.0;

// We won’t need lighting arrays or ambient light anymore, but we’ll just leave them declared.
// However, we will not use them.
#define NUM_LIGHTS 3
vec3 lightDirs[NUM_LIGHTS];
vec3 lightColors[NUM_LIGHTS];

void initializeLights() {
    lightDirs[0] = normalize(vec3(-2.18, 1.28, -1.58));
    lightDirs[1] = normalize(vec3(2.0, 1.0, 1.0));
    lightDirs[2] = normalize(vec3(0.0, 1.0, -1.0));

    lightColors[0] = vec3(1.0, 1.0, 1.0) * 2.0;
    lightColors[1] = vec3(1.0, 0.5, 0.2);
    lightColors[2] = vec3(0.2, 0.5, 1.0);
}

vec3 backgroundColor = vec3(0.0);

//--------------------------------------------------------------
// Ray and Surface Structures
//--------------------------------------------------------------
struct Ray {
    vec3 origin;
    vec3 direction;
};

struct Surface {
    float signedDistance;
    vec3  baseColor;
    float metallic;
    float roughness;
    vec3  emissive;
    float anisotropy;
    float subsurface;
    vec3  subsurfaceColor;
    float sheen;
    vec3  sheenColor;
};

//--------------------------------------------------------------
// SDF Functions
//--------------------------------------------------------------
float sdSphere(vec3 p, float r) {
    return length(p) - r;
}

vec3 Translate(in vec3 p, in vec3 t) {
    return p - t;
}

//--------------------------------------------------------------
// Smooth Minimum
//--------------------------------------------------------------
Surface Smin(Surface a, Surface b, float k) {
    float h = clamp(0.5 + 0.5 * (b.signedDistance - a.signedDistance) / k, 0.0, 1.0);
    Surface res;
    res.signedDistance  = mix(b.signedDistance, a.signedDistance, h) - k * h * (1.0 - h);
    res.baseColor       = mix(a.baseColor, b.baseColor, clamp(0.5 + 0.5 * (b.signedDistance - a.signedDistance) / 0.0, 0.0, 1.0));
    res.metallic        = mix(a.metallic, b.metallic, h);
    res.roughness       = mix(a.roughness, b.roughness, h);
    res.emissive        = mix(a.emissive, b.emissive, h);
    res.anisotropy      = mix(a.anisotropy, b.anisotropy, h);
    res.subsurface      = mix(a.subsurface, b.subsurface, h);
    res.subsurfaceColor = mix(a.subsurfaceColor, b.subsurfaceColor, h);
    res.sheen           = mix(a.sheen, b.sheen, h);
    res.sheenColor      = mix(a.sheenColor, b.sheenColor, h);
    return res;
}

//--------------------------------------------------------------
// Scene Mapping
//--------------------------------------------------------------
Surface mapScene(in vec3 p) {
    // Sphere 1 (Blue)
    Surface sphere1;
    sphere1.signedDistance  = sdSphere(Translate(p, blueSpherePos), blueSphereRadius);
    sphere1.baseColor       = blueSphereColor;
    sphere1.metallic        = blueSphereMetalness;
    sphere1.roughness       = blueSphereRoughness;
    sphere1.emissive        = blueSphereEmissive;
    sphere1.anisotropy      = blueSphereAnisotropy;
    sphere1.subsurface      = blueSphereSubsurface;
    sphere1.subsurfaceColor = blueSphereSubsurfaceColor;
    sphere1.sheen           = blueSphereSheen;
    sphere1.sheenColor      = blueSphereSheenColor;

    // Sphere 2 (Red)
    Surface sphere2;
    sphere2.signedDistance  = sdSphere(Translate(p, redSpherePos), redSphereRadius);
    sphere2.baseColor       = redSphereColor;
    sphere2.metallic        = redSphereMetalness;
    sphere2.roughness       = redSphereRoughness;
    sphere2.emissive        = redSphereEmissive;
    sphere2.anisotropy      = redSphereAnisotropy;
    sphere2.subsurface      = redSphereSubsurface;
    sphere2.subsurfaceColor = redSphereSubsurfaceColor;
    sphere2.sheen           = redSphereSheen;
    sphere2.sheenColor      = redSphereSheenColor;

    Surface sceneSurface = Smin(sphere1, sphere2, 1.0);
    return sceneSurface;
}

//--------------------------------------------------------------
// Ray Marching
//--------------------------------------------------------------
vec4 rayMarch(in Ray ray) {
    float distanceTraveled = 0.0;
    for(int i = 0; i < MAX_STEPS; ++i) {
        vec3 p = ray.origin + ray.direction * distanceTraveled;
        Surface surface = mapScene(p);

        if(abs(surface.signedDistance) < SURF_DIST) {
            // Just return the baseColor, no shading:
            return vec4(surface.baseColor, 1.0);
        }

        if(distanceTraveled > MAX_DIST) {
            break;
        }

        distanceTraveled += surface.signedDistance;
    }
    
    return vec4(backgroundColor, 1.0);
}

//--------------------------------------------------------------
// Camera Rotation
//--------------------------------------------------------------
mat3 rotationX(float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return mat3(
        1.0, 0.0, 0.0,
        0.0, c,   -s,
        0.0, s,    c
    );
}

mat3 rotationY(float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return mat3(
        c,   0.0, s,
        0.0, 1.0, 0.0,
       -s,   0.0, c
    );
}

mat3 rotationZ(float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return mat3(
        c, -s, 0.0,
        s,  c, 0.0,
        0.0,0.0,1.0
    );
}

//--------------------------------------------------------------
// Main
//--------------------------------------------------------------
void main() {
    // Even though we define lights and camera, we are not using lighting anymore.
    initializeLights();
    
    const int AA_SAMPLES = 4;
    vec3 colAccum = vec3(0.0);

    float aspectRatio = iResolution.x / iResolution.y;
    float scale = tan(radians(camFov) * 0.5);

    vec2 offsets[4];
    offsets[0] = vec2(-0.25, -0.25);
    offsets[1] = vec2( 0.25, -0.25);
    offsets[2] = vec2(-0.25,  0.25);
    offsets[3] = vec2( 0.25,  0.25);

    for (int i = 0; i < AA_SAMPLES; i++) {
        vec2 pixel = gl_FragCoord.xy + offsets[i];
        vec2 uv = (pixel / iResolution.xy) * 2.0 - 1.0;
        uv.x *= aspectRatio;
        uv *= scale;

        vec3 rd = normalize(vec3(uv, 1.0));
        rd = rotationY(cameraRot.y) * rotationX(cameraRot.x) * rotationZ(cameraRot.z) * rd;

        Ray ray;
        ray.origin = cameraPos;
        ray.direction = rd;

        vec4 color = rayMarch(ray);
        colAccum += color.rgb;
    }

    vec3 finalColor = colAccum / float(AA_SAMPLES);

    gl_FragColor = vec4(finalColor, 1.0);
}