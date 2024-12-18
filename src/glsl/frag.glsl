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

// Lighting: define multiple lights
#define NUM_LIGHTS 3
vec3 lightDirs[NUM_LIGHTS];
vec3 lightColors[NUM_LIGHTS];

void initializeLights() {
    lightDirs[0] = normalize(vec3(-2.18, 1.28, -1.58)); // Light 1
    lightDirs[1] = normalize(vec3(2.0, 1.0, 1.0));      // Light 2
    lightDirs[2] = normalize(vec3(0.0, 1.0, -1.0));     // Light 3

    lightColors[0] = vec3(1.0, 1.0, 1.0) * 2.0; // White bright light
    lightColors[1] = vec3(1.0, 0.5, 0.2);       // Warm light
    lightColors[2] = vec3(0.2, 0.5, 1.0);       // Cooler, bluish light
}

// Simple ambient term
vec3 ambientLightColor = vec3(0.07);

// Background color
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

float sdPlane(vec3 p, vec3 n, float h) {
    return dot(p, n) + h;
} 

// rounded box
float sdRoundedBox(vec3 p, vec3 b, float r) {
    vec3 q = abs(p) - b;
    return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - r;
}

//--------------------------------------------------------------
// Transform Utilities
//--------------------------------------------------------------
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
    res.baseColor       = mix(a.baseColor, b.baseColor, h);
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
    // sphere2.signedDistance  = sdPlane(p, vec3(0.0, 1.0, 0.0), 0.0);
    // sphere2.signedDistance  = sdRoundedBox(Translate(p, redSpherePos), vec3(0.6), 0.0);
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
// Normal Calculation
//--------------------------------------------------------------
vec3 calculateNormal(in vec3 p) {
    vec2 eps = vec2(0.01, 0.0);
    float dx = mapScene(p + eps.xyy).signedDistance - mapScene(p - eps.xyy).signedDistance;
    float dy = mapScene(p + eps.yxy).signedDistance - mapScene(p - eps.yxy).signedDistance;
    float dz = mapScene(p + eps.yyx).signedDistance - mapScene(p - eps.yyx).signedDistance;
    return normalize(vec3(dx, dy, dz));
}

//--------------------------------------------------------------
// Fresnel
//--------------------------------------------------------------
vec3 fresnelSchlick(float cosTheta, vec3 F0) {
    return F0 + (1.0 - F0)*pow(clamp(1.0 - cosTheta,0.0,1.0),5.0);
}

//--------------------------------------------------------------
// Geometry Terms (GGX)
//--------------------------------------------------------------
float GeometrySchlickGGX(float NdotV, float roughness) {
    float r = (roughness + 1.0);
    float k = (r*r) / 8.0; 
    float denom = NdotV * (1.0 - k) + k;
    return NdotV / denom;
}

float GeometrySmith(vec3 N, vec3 V, vec3 L, float roughness) {
    float NdotV = max(dot(N,V), 0.0);
    float NdotL = max(dot(N,L), 0.0);
    float ggx1 = GeometrySchlickGGX(NdotV, roughness);
    float ggx2 = GeometrySchlickGGX(NdotL, roughness);
    return ggx1 * ggx2;
}

//--------------------------------------------------------------
// Anisotropic GGX Distribution
//--------------------------------------------------------------
float DistributionAnisotropicGGX(vec3 N, vec3 Vh, float roughness, float anisotropy, vec3 T, vec3 B) {
    float baseAlpha = roughness * roughness; 
    float ax = baseAlpha / (1.0 + anisotropy);
    float ay = baseAlpha * (1.0 + anisotropy);

    float Nx = dot(Vh, T);
    float Ny = dot(Vh, B);
    float Nz = dot(Vh, N);

    float denom = (Nx*Nx/(ax*ax) + Ny*Ny/(ay*ay) + Nz*Nz);
    denom = denom * denom;
    float D = 1.0/(3.14159265359 * ax * ay * denom);
    return D;
}

//--------------------------------------------------------------
// Tangent and Bitangent Computation
//--------------------------------------------------------------
void computeTangentSpace(vec3 N, out vec3 T, out vec3 B) {
    vec3 up = abs(N.y) < 0.999 ? vec3(0.0,1.0,0.0) : vec3(1.0,0.0,0.0);
    T = normalize(cross(up, N));
    B = cross(N, T);
}

//--------------------------------------------------------------
// Subsurface Scattering Approximation
//--------------------------------------------------------------
vec3 subsurfaceScattering(vec3 N, vec3 L, vec3 subsurfaceColor, float subsurface, vec3 lightCol) {
    float NdotL = dot(N,L);
    if (NdotL >= 0.0 || subsurface <= 0.0) {
        return vec3(0.0);
    }
    float intensity = -NdotL * subsurface;
    return subsurfaceColor * lightCol * intensity * 0.5; 
}

//--------------------------------------------------------------
// Sheen BRDF
//--------------------------------------------------------------
// Inspired by the Disney BRDF model: Sheen is a retroreflective lobe at grazing angles.
// Sheen intensity and color affect how "fuzzy" the surface looks.
vec3 sheenBRDF(vec3 N, vec3 V, vec3 L, vec3 sheenColor, float sheen) {
    if (sheen <= 0.0) return vec3(0.0);
    vec3 H = normalize(V + L);
    float NdotL = max(dot(N,L),0.0);
    // A simple power term to create a soft highlight near grazing angles:
    float HdotL = max(dot(H,L), 0.0);
    float factor = pow((1.0 - HdotL), 5.0);
    return sheenColor * sheen * factor * NdotL;
}

//--------------------------------------------------------------
// Cook-Torrance BRDF with Anisotropy + Sheen Integration
//--------------------------------------------------------------
vec3 cookTorranceBRDF(vec3 N, vec3 V, vec3 L, vec3 albedo, float metallic, float roughness, float anisotropy, float sheen, vec3 sheenColor, vec3 lightCol) {
    float NdotL = max(dot(N,L), 0.0);
    if (NdotL <= 0.0) return vec3(0.0);

    vec3 T, B;
    computeTangentSpace(N, T, B);

    vec3 H = normalize(V + L);  
    float NdotV = max(dot(N,V), 0.0);

    vec3 F0 = mix(vec3(0.04), albedo, metallic);

    // Anisotropic D
    float D = DistributionAnisotropicGGX(N, H, roughness, anisotropy, T, B);
    float G = GeometrySmith(N, V, L, roughness);
    vec3  F = fresnelSchlick(max(dot(H,V),0.0), F0);

    vec3 numerator    = D * F * G;
    float denominator = 4.0 * NdotV * NdotL + 0.001;
    vec3 specular     = numerator / denominator;

    vec3 kd = vec3(1.0) - F;
    kd *= (1.0 - metallic);
    vec3 diffuse = kd * albedo / 3.14159265359;

    // Add Sheen
    vec3 sheenTerm = sheenBRDF(N, V, L, sheenColor, sheen);

    // Final light contribution: diffuse + specular + sheen
    return (diffuse + specular + sheenTerm) * lightCol * NdotL;
}

//--------------------------------------------------------------
// Shading: Add contributions from multiple lights
//--------------------------------------------------------------
vec3 shadeSurface(in Surface surface, in Ray ray, in vec3 normal) {
    vec3 V = normalize(-ray.direction); // View direction
    vec3 baseColor = surface.baseColor;
    vec3 emissive  = surface.emissive;

    // Start with ambient and emissive
    vec3 result = ambientLightColor * baseColor * (1.0 - surface.metallic) + emissive;

    // Add direct lighting from multiple lights (front-lit + SSS + Sheen integrated in BRDF)
    for (int i = 0; i < NUM_LIGHTS; i++) {
        vec3 L = lightDirs[i];

        // Cook-Torrance + Sheen
        vec3 directLight = cookTorranceBRDF(normal, V, L, 
                                            baseColor, 
                                            surface.metallic, 
                                            surface.roughness, 
                                            surface.anisotropy,
                                            surface.sheen, 
                                            surface.sheenColor,
                                            lightColors[i]);
        result += directLight;

        // Subsurface contribution
        vec3 sssContrib = subsurfaceScattering(normal, L, surface.subsurfaceColor, surface.subsurface, lightColors[i]);
        result += sssContrib;
    }
    
    return result;
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
            vec3 normal = calculateNormal(p);
            vec3 color = shadeSurface(surface, ray, normal);
            return vec4(color, 1.0);
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
    initializeLights();
    
    // Number of AA samples (2x2 grid)
    const int AA_SAMPLES = 4;
    vec3 colAccum = vec3(0.0);

    float aspectRatio = iResolution.x / iResolution.y;
    float scale = tan(radians(camFov) * 0.5);

    // 2x2 MSAA offsets
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

    // Gamma correction
    finalColor = pow(finalColor, vec3(1.0/2.2));
    gl_FragColor = vec4(finalColor, 1.0);
}
