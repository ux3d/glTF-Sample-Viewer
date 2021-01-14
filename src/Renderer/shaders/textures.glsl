in vec2 v_UVCoord1;
in vec2 v_UVCoord2;

// IBL
uniform int u_MipCount;
uniform samplerCube u_LambertianEnvSampler;
uniform samplerCube u_GGXEnvSampler;
uniform sampler2D u_GGXLUT;
uniform samplerCube u_CharlieEnvSampler;
uniform sampler2D u_CharlieLUT;
uniform sampler2D u_SheenELUT;
uniform mat3 u_envRotation;

// General Material
uniform sampler2D u_NormalSampler;
uniform float u_NormalScale;
uniform int u_NormalUVSet;
uniform mat3 u_NormalUVTransform;

uniform vec3 u_EmissiveFactor;
uniform sampler2D u_EmissiveSampler;
uniform int u_EmissiveUVSet;
uniform mat3 u_EmissiveUVTransform;

uniform sampler2D u_OcclusionSampler;
uniform int u_OcclusionUVSet;
uniform float u_OcclusionStrength;
uniform mat3 u_OcclusionUVTransform;

// Metallic Roughness Material
uniform sampler2D u_BaseColorSampler;
uniform int u_BaseColorUVSet;
uniform mat3 u_BaseColorUVTransform;

uniform sampler2D u_MetallicRoughnessSampler;
uniform int u_MetallicRoughnessUVSet;
uniform mat3 u_MetallicRoughnessUVTransform;

// Specular Glossiness Material
uniform sampler2D u_DiffuseSampler;
uniform int u_DiffuseUVSet;
uniform mat3 u_DiffuseUVTransform;

uniform sampler2D u_SpecularGlossinessSampler;
uniform int u_SpecularGlossinessUVSet;
uniform mat3 u_SpecularGlossinessUVTransform;

// Clearcoat Material
uniform sampler2D u_ClearcoatSampler;
uniform int u_ClearcoatUVSet;
uniform mat3 u_ClearcoatUVTransform;

uniform sampler2D u_ClearcoatRoughnessSampler;
uniform int u_ClearcoatRoughnessUVSet;
uniform mat3 u_ClearcoatRoughnessUVTransform;

uniform sampler2D u_ClearcoatNormalSampler;
uniform int u_ClearcoatNormalUVSet;
uniform mat3 u_ClearcoatNormalUVTransform;

// Sheen Material
uniform sampler2D u_SheenColorSampler;
uniform int u_SheenColorUVSet;
uniform mat3 u_SheenColorUVTransform;
uniform sampler2D u_SheenRoughnessSampler;
uniform int u_SheenRoughnessUVSet;
uniform mat3 u_SheenRoughnessUVTransform;

// Transmission Material
uniform sampler2D u_TransmissionSampler;
uniform int u_TransmissionUVSet;
uniform mat3 u_TransmissionUVTransform;

vec2 getNormalUV()
{
    vec3 uv = vec3(u_NormalUVSet < 1 ? v_UVCoord1 : v_UVCoord2, 1.0);

    #ifdef HAS_NORMAL_UV_TRANSFORM
    uv *= u_NormalUVTransform;
    #endif

    return uv.xy;
}

vec2 getEmissiveUV()
{
    vec3 uv = vec3(u_EmissiveUVSet < 1 ? v_UVCoord1 : v_UVCoord2, 1.0);

    #ifdef HAS_EMISSIVE_UV_TRANSFORM
    uv *= u_EmissiveUVTransform;
    #endif

    return uv.xy;
}

vec2 getOcclusionUV()
{
    vec3 uv = vec3(u_OcclusionUVSet < 1 ? v_UVCoord1 : v_UVCoord2, 1.0);

    #ifdef HAS_OCCLUSION_UV_TRANSFORM
    uv *= u_OcclusionUVTransform;
    #endif

    return uv.xy;
}

vec2 getBaseColorUV()
{
    vec3 uv = vec3(u_BaseColorUVSet < 1 ? v_UVCoord1 : v_UVCoord2, 1.0);

    #ifdef HAS_BASECOLOR_UV_TRANSFORM
    uv *= u_BaseColorUVTransform;
    #endif

    return uv.xy;
}

vec2 getMetallicRoughnessUV()
{
    vec3 uv = vec3(u_MetallicRoughnessUVSet < 1 ? v_UVCoord1 : v_UVCoord2, 1.0);

    #ifdef HAS_METALLICROUGHNESS_UV_TRANSFORM
    uv *= u_MetallicRoughnessUVTransform;
    #endif

    return uv.xy;
}

vec2 getSpecularGlossinessUV()
{
    vec3 uv = vec3(u_SpecularGlossinessUVSet < 1 ? v_UVCoord1 : v_UVCoord2, 1.0);

    #ifdef HAS_SPECULARGLOSSINESS_UV_TRANSFORM
    uv *= u_SpecularGlossinessUVTransform;
    #endif

    return uv.xy;
}

vec2 getDiffuseUV()
{
    vec3 uv = vec3(u_DiffuseUVSet < 1 ? v_UVCoord1 : v_UVCoord2, 1.0);

    #ifdef HAS_DIFFUSE_UV_TRANSFORM
    uv *= u_DiffuseUVTransform;
    #endif

    return uv.xy;
}

vec2 getClearcoatUV()
{
    vec3 uv = vec3(u_ClearcoatUVSet < 1 ? v_UVCoord1 : v_UVCoord2, 1.0);
    #ifdef HAS_CLEARCOAT_UV_TRANSFORM
    uv *= u_ClearcoatUVTransform;
    #endif
    return uv.xy;
}

vec2 getClearcoatRoughnessUV()
{
    vec3 uv = vec3(u_ClearcoatRoughnessUVSet < 1 ? v_UVCoord1 : v_UVCoord2, 1.0);
    #ifdef HAS_CLEARCOATROUGHNESS_UV_TRANSFORM
    uv *= u_ClearcoatRoughnessUVTransform;
    #endif
    return uv.xy;
}

vec2 getClearcoatNormalUV()
{
    vec3 uv = vec3(u_ClearcoatNormalUVSet < 1 ? v_UVCoord1 : v_UVCoord2, 1.0);
    #ifdef HAS_CLEARCOATNORMAL_UV_TRANSFORM
    uv *= u_ClearcoatNormalUVTransform;
    #endif
    return uv.xy;
}

vec2 getSheenColorUV()
{
    vec3 uv = vec3(u_SheenColorUVSet < 1 ? v_UVCoord1 : v_UVCoord2, 1.0);
    #ifdef HAS_SHEENCOLOR_UV_TRANSFORM
    uv *= u_SheenColorUVTransform;
    #endif
    return uv.xy;
}

vec2 getSheenRoughnessUV()
{
    vec3 uv = vec3(u_SheenRoughnessUVSet < 1 ? v_UVCoord1 : v_UVCoord2, 1.0);
    #ifdef HAS_SHEENROUGHNESS_UV_TRANSFORM
    uv *= u_SheenRoughnessUVTransform;
    #endif
    return uv.xy;
}

vec2 getTransmissionUV()
{
    vec3 uv = vec3(u_TransmissionUVSet < 1 ? v_UVCoord1 : v_UVCoord2, 1.0);
    #ifdef HAS_TRANSMISSION_UV_TRANSFORM
    uv *= u_TransmissionUVTransform;
    #endif
    return uv.xy;
}


vec4 getNormal()
{
    vec4 result = texture(u_NormalSampler, getNormalUV());
    #ifdef NORMAL_IS_SRGB
    result = sRGBToLinear(result);
    #endif
    return result;
}

vec4 getEmissive()
{
    vec4 result = texture(u_EmissiveSampler, getEmissiveUV());
    #ifdef EMISSIVE_IS_SRGB
    result = sRGBToLinear(result);
    #endif
    return result;
}

vec4 getOcclusion()
{
    vec4 result = texture(u_OcclusionSampler,  getOcclusionUV());
    #ifdef OCCLUSION_IS_SRGB
    result = sRGBToLinear(result);
    #endif
    return result;
}

vec4 getBaseColor()
{
    vec4 result = texture(u_BaseColorSampler, getBaseColorUV());
    #ifdef BASECOLOR_IS_SRGB
    result = sRGBToLinear(result);
    #endif
    return result;
}

vec4 getMetallicRoughness()
{
    vec4 result = texture(u_MetallicRoughnessSampler, getMetallicRoughnessUV());
    #ifdef METALLICROUGHNESS_IS_SRGB
    result = sRGBToLinear(result);
    #endif
    return result;
}

vec4 getSpecularGlossiness()
{
    vec4 result = texture(u_SpecularGlossinessSampler, getSpecularGlossinessUV());
    #ifdef SPECULARGLOSSINESS_IS_SRGB
    result = sRGBToLinear(result);
    #endif
    return result;
}

vec4 getDiffuse()
{
    vec4 result = texture(u_DiffuseSampler, getDiffuseUV());
    #ifdef DIFFUSE_IS_SRGB
    result = sRGBToLinear(result);
    #endif
    return result;
}

vec4 getClearcoat()
{
    vec4 result = texture(u_ClearcoatSampler, getClearcoatUV());
    #ifdef CLEARCOAT_IS_SRGB
    result = sRGBToLinear(result);
    #endif
    return result;
}

vec4 getClearcoatRoughness()
{
    vec4 result = texture(u_ClearcoatRoughnessSampler, getClearcoatRoughnessUV());
    #ifdef CLEARCOATROUGHNESS_IS_SRGB
    result = sRGBToLinear(result);
    #endif
    return result;
}

vec4 getClearcoatNormal()
{
    vec4 result = texture(u_ClearcoatNormalSampler, getClearcoatNormalUV());
    #ifdef CLEARCOATNORMAL_IS_SRGB
    result = sRGBToLinear(result);
    #endif
    return result;
}

vec4 getSheenColor()
{
    vec4 result = texture(u_SheenColorSampler, getSheenColorUV());
    #ifdef SHEENCOLOR_IS_SRGB
    result = sRGBToLinear(result);
    #endif
    return result;
}

vec4 getSheenRoughness()
{
    vec4 result = texture(u_SheenRoughnessSampler, getSheenRoughnessUV());
    #ifdef SHEENROUGHNESS_IS_SRGB
    result = sRGBToLinear(result);
    #endif
    return result;
}

vec4 getTransmission()
{
    vec4 result = texture(u_TransmissionSampler, getTransmissionUV());
    #ifdef TRANSMISSION_IS_SRGB
    result = sRGBToLinear(result);
    #endif
    return result;
}
