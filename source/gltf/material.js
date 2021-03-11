import { mat3, vec3, vec4 } from 'gl-matrix';
import { gltfTextureInfo } from './texture.js';
import { jsToGl, initGlForMembers } from './utils.js';
import { GltfObject } from './gltf_object.js';

class gltfMaterial extends GltfObject
{
    constructor()
    {
        super();
        this.name = undefined;
        this.pbrMetallicRoughness = undefined;
        this.normalTexture = undefined;
        this.occlusionTexture = undefined;
        this.emissiveTexture = undefined;
        this.emissiveFactor = vec3.fromValues(0, 0, 0);
        this.alphaMode = "OPAQUE";
        this.alphaCutoff = 0.5;
        this.doubleSided = false;

        // pbr next extension toggles
        this.hasClearcoat = false;
        this.hasPBRSpecular = false;
        this.hasSheen = false;
        this.hasTransmission = false;
        this.hasVolume = false;

        // non gltf properties
        this.type = "unlit";
        this.textures = [];
        this.properties = new Map();
        this.defines = [];
    }

    static createDefault()
    {
        const defaultMaterial = new gltfMaterial();
        defaultMaterial.type = "MR";
        defaultMaterial.name = "Default Material";
        defaultMaterial.defines.push("MATERIAL_METALLICROUGHNESS 1");
        const baseColorFactor = vec4.fromValues(1, 1, 1, 1);
        const metallicFactor = 1;
        const roughnessFactor = 1;
        defaultMaterial.properties.set("u_BaseColorFactor", baseColorFactor);
        defaultMaterial.properties.set("u_MetallicFactor", metallicFactor);
        defaultMaterial.properties.set("u_RoughnessFactor", roughnessFactor);

        return defaultMaterial;
    }

    getShaderIdentifier()
    {
        switch (this.type)
        {
        default:
        case "SG": // fall through till we sparate shaders
        case "MR": return "pbr.frag";
            //case "SG": return "specular-glossiness.frag" ;
        }
    }

    getDefines(renderingParameters)
    {
        const defines = Array.from(this.defines);

        if (this.hasClearcoat && renderingParameters.clearcoat)
        {
            defines.push("MATERIAL_CLEARCOAT 1");
        }
        if (this.hasPBRSpecular && renderingParameters.pbrSpecular)
        {
            defines.push("MATERIAL_PBRSPECULAR 1");
        }
        if (this.hasSheen && renderingParameters.sheen)
        {
            defines.push("MATERIAL_SHEEN 1");
        }
        if (this.hasTransmission && renderingParameters.transmission)
        {
            defines.push("MATERIAL_TRANSMISSION 1");
        }
        if (this.hasVolume && renderingParameters.transmission)
        {
            defines.push("MATERIAL_VOLUME 1");
        }

        return defines;
    }

    getProperties()
    {
        return this.properties;
    }

    getTextures()
    {
        return this.textures;
    }

    parseTextureInfoExtensions(textureInfo, textureKey)
    {
        if(textureInfo.extensions === undefined)
        {
            return;
        }

        if(textureInfo.extensions.KHR_texture_transform !== undefined)
        {
            const uvTransform = textureInfo.extensions.KHR_texture_transform;

            // override uvset
            if(uvTransform.texCoord !== undefined)
            {
                textureInfo.texCoord = uvTransform.texCoord;
            }

            let rotation = mat3.create();
            let scale = mat3.create();
            let translation = mat3.create();

            if(uvTransform.rotation !== undefined)
            {
                const s =  Math.sin(uvTransform.rotation);
                const c =  Math.cos(uvTransform.rotation);

                rotation = jsToGl([
                    c, s, 0.0,
                    -s, c, 0.0,
                    0.0, 0.0, 1.0]);
            }

            if(uvTransform.scale !== undefined)
            {
                scale = jsToGl([uvTransform.scale[0], 0, 0, 0, uvTransform.scale[1], 0, 0, 0, 1]);
            }

            if(uvTransform.offset !== undefined)
            {
                translation = jsToGl([1, 0, uvTransform.offset[0], 0, 1, uvTransform.offset[1], 0, 0, 1]);
            }

            let uvMatrix = mat3.create();
            mat3.multiply(uvMatrix, rotation, scale);
            mat3.multiply(uvMatrix, uvMatrix, translation);

            this.defines.push("HAS_" + textureKey.toUpperCase() + "_UV_TRANSFORM 1");
            this.properties.set("u_" + textureKey + "UVTransform", uvMatrix);
        }
    }

    initGl(gltf, webGlContext)
    {
        if (this.normalTexture !== undefined)
        {
            this.normalTexture.samplerName = "u_NormalSampler";
            this.parseTextureInfoExtensions(this.normalTexture, "Normal");
            this.textures.push(this.normalTexture);
            this.defines.push("HAS_NORMAL_MAP 1");
            this.properties.set("u_NormalScale", this.normalTexture.scale);
            this.properties.set("u_NormalUVSet", this.normalTexture.texCoord);
        }

        if (this.occlusionTexture !== undefined)
        {
            this.occlusionTexture.samplerName = "u_OcclusionSampler";
            this.parseTextureInfoExtensions(this.occlusionTexture, "Occlusion");
            this.textures.push(this.occlusionTexture);
            this.defines.push("HAS_OCCLUSION_MAP 1");
            this.properties.set("u_OcclusionStrength", this.occlusionTexture.strength);
            this.properties.set("u_OcclusionUVSet", this.occlusionTexture.texCoord);
        }

        this.properties.set("u_EmissiveFactor", this.emissiveFactor);
        if (this.emissiveTexture !== undefined)
        {
            this.emissiveTexture.samplerName = "u_EmissiveSampler";
            this.parseTextureInfoExtensions(this.emissiveTexture, "Emissive");
            this.textures.push(this.emissiveTexture);
            this.defines.push("HAS_EMISSIVE_MAP 1");
            this.properties.set("u_EmissiveUVSet", this.emissiveTexture.texCoord);
        }

        if (this.baseColorTexture !== undefined)
        {
            this.baseColorTexture.samplerName = "u_BaseColorSampler";
            this.parseTextureInfoExtensions(this.baseColorTexture, "BaseColor");
            this.textures.push(this.baseColorTexture);
            this.defines.push("HAS_BASE_COLOR_MAP 1");
            this.properties.set("u_BaseColorUVSet", this.baseColorTexture.texCoord);
        }

        if (this.metallicRoughnessTexture !== undefined)
        {
            this.metallicRoughnessTexture.samplerName = "u_MetallicRoughnessSampler";
            this.parseTextureInfoExtensions(this.metallicRoughnessTexture, "MetallicRoughness");
            this.textures.push(this.metallicRoughnessTexture);
            this.defines.push("HAS_METALLIC_ROUGHNESS_MAP 1");
            this.properties.set("u_MetallicRoughnessUVSet", this.metallicRoughnessTexture.texCoord);
        }

        if (this.diffuseTexture !== undefined)
        {
            this.diffuseTexture.samplerName = "u_DiffuseSampler";
            this.parseTextureInfoExtensions(this.diffuseTexture, "Diffuse");
            this.textures.push(this.diffuseTexture);
            this.defines.push("HAS_DIFFUSE_MAP 1");
            this.properties.set("u_DiffuseUVSet", this.diffuseTexture.texCoord);
        }

        if (this.specularGlossinessTexture !== undefined)
        {
            this.specularGlossinessTexture.samplerName = "u_SpecularGlossinessSampler";
            this.parseTextureInfoExtensions(this.specularGlossinessTexture, "SpecularGlossiness");
            this.textures.push(this.specularGlossinessTexture);
            this.defines.push("HAS_SPECULAR_GLOSSINESS_MAP 1");
            this.properties.set("u_SpecularGlossinessUVSet", this.specularGlossinessTexture.texCoord);
        }

        if(this.alphaMode === 'MASK') // only set cutoff value for mask material
        {
            this.defines.push("ALPHAMODE_MASK 1");
            this.properties.set("u_AlphaCutoff", this.alphaCutoff);
        }
        else if (this.alphaMode === 'OPAQUE')
        {
            this.defines.push("ALPHAMODE_OPAQUE 1");
        }

        if (this.pbrMetallicRoughness !== undefined && this.type !== "SG")
        {
            this.defines.push("MATERIAL_METALLICROUGHNESS 1");

            let baseColorFactor = vec4.fromValues(1, 1, 1, 1);
            let metallicFactor = 1;
            let roughnessFactor = 1;

            if (this.pbrMetallicRoughness.baseColorFactor !== undefined)
            {
                baseColorFactor = jsToGl(this.pbrMetallicRoughness.baseColorFactor);
            }

            if (this.pbrMetallicRoughness.metallicFactor !== undefined)
            {
                metallicFactor = this.pbrMetallicRoughness.metallicFactor;
            }

            if (this.pbrMetallicRoughness.roughnessFactor !== undefined)
            {
                roughnessFactor = this.pbrMetallicRoughness.roughnessFactor;
            }

            this.properties.set("u_BaseColorFactor", baseColorFactor);
            this.properties.set("u_MetallicFactor", metallicFactor);
            this.properties.set("u_RoughnessFactor", roughnessFactor);
        }

        if (this.extensions !== undefined)
        {
            if (this.extensions.KHR_materials_unlit !== undefined)
            {
                this.defines.push("MATERIAL_UNLIT 1");
            }

            if (this.extensions.KHR_materials_pbrSpecularGlossiness !== undefined)
            {
                this.defines.push("MATERIAL_SPECULARGLOSSINESS 1");

                let diffuseFactor = vec4.fromValues(1, 1, 1, 1);
                let specularFactor = vec3.fromValues(1, 1, 1);
                let glossinessFactor = 1;

                if (this.extensions.KHR_materials_pbrSpecularGlossiness.diffuseFactor !== undefined)
                {
                    diffuseFactor = jsToGl(this.extensions.KHR_materials_pbrSpecularGlossiness.diffuseFactor);
                }

                if (this.extensions.KHR_materials_pbrSpecularGlossiness.specularFactor !== undefined)
                {
                    specularFactor = jsToGl(this.extensions.KHR_materials_pbrSpecularGlossiness.specularFactor);
                }

                if (this.extensions.KHR_materials_pbrSpecularGlossiness.glossinessFactor !== undefined)
                {
                    glossinessFactor = this.extensions.KHR_materials_pbrSpecularGlossiness.glossinessFactor;
                }

                this.properties.set("u_DiffuseFactor", diffuseFactor);
                this.properties.set("u_SpecularFactor", specularFactor);
                this.properties.set("u_GlossinessFactor", glossinessFactor);
            }

            // Clearcoat is part of the default metallic-roughness shader
            if(this.extensions.KHR_materials_clearcoat !== undefined)
            {
                let clearcoatFactor = 0.0;
                let clearcoatRoughnessFactor = 0.0;

                this.hasClearcoat = true;

                if(this.extensions.KHR_materials_clearcoat.clearcoatFactor !== undefined)
                {
                    clearcoatFactor = this.extensions.KHR_materials_clearcoat.clearcoatFactor;
                }
                if(this.extensions.KHR_materials_clearcoat.clearcoatRoughnessFactor !== undefined)
                {
                    clearcoatRoughnessFactor = this.extensions.KHR_materials_clearcoat.clearcoatRoughnessFactor;
                }

                if (this.clearcoatTexture !== undefined)
                {
                    this.clearcoatTexture.samplerName = "u_ClearcoatSampler";
                    this.parseTextureInfoExtensions(this.clearcoatTexture, "Clearcoat");
                    this.textures.push(this.clearcoatTexture);
                    this.defines.push("HAS_CLEARCOAT_TEXTURE_MAP 1");
                    this.properties.set("u_ClearcoatUVSet", this.clearcoatTexture.texCoord);
                }
                if (this.clearcoatRoughnessTexture !== undefined)
                {
                    this.clearcoatRoughnessTexture.samplerName = "u_ClearcoatRoughnessSampler";
                    this.parseTextureInfoExtensions(this.clearcoatRoughnessTexture, "ClearcoatRoughness");
                    this.textures.push(this.clearcoatRoughnessTexture);
                    this.defines.push("HAS_CLEARCOAT_ROUGHNESS_MAP 1");
                    this.properties.set("u_ClearcoatRoughnessUVSet", this.clearcoatRoughnessTexture.texCoord);
                }
                if (this.clearcoatNormalTexture !== undefined)
                {
                    this.clearcoatNormalTexture.samplerName = "u_ClearcoatNormalSampler";
                    this.parseTextureInfoExtensions(this.clearcoatNormalTexture, "ClearcoatNormal");
                    this.textures.push(this.clearcoatNormalTexture);
                    this.defines.push("HAS_CLEARCOAT_NORMAL_MAP 1");
                    this.properties.set("u_ClearcoatNormalUVSet", this.clearcoatNormalTexture.texCoord);
                    this.properties.set("u_ClearcoatNormalScale", this.clearcoatNormalTexture.scale);

                }
                this.properties.set("u_ClearcoatFactor", clearcoatFactor);
                this.properties.set("u_ClearcoatRoughnessFactor", clearcoatRoughnessFactor);
            }

            // Specular material extension
            // https://github.com/KhronosGroup/glTF/pull/1719
            if(this.extensions.KHR_materials_specular !== undefined)
            {
                let specularFactor = 0.0;
                let specularColorFactor =  vec3.fromValues(1.0, 1.0, 1.0);

                this.hasPBRSpecular = true;

                if(this.extensions.KHR_materials_specular.specularFactor !== undefined)
                {
                    specularFactor = this.extensions.KHR_materials_specular.specularFactor;
                }
                if(this.extensions.KHR_materials_specular.specularColorFactor !== undefined)
                {
                    specularColorFactor = jsToGl(this.extensions.KHR_materials_specular.specularColorFactor);
                }
                if (this.pbrSpecularTexture !== undefined)
                {
                    this.pbrSpecularTexture.samplerName = "u_pbrNextSpecularSampler";
                    this.parseTextureInfoExtensions(this.pbrSpecularTexture, "pbrNextSpecular");
                    this.textures.push(this.pbrSpecularTexture);
                    this.defines.push("HAS_PBRNEXTSPECULAR_MAP 1");
                    this.properties.set("u_pbrNextSpecularUVTransform", this.pbrSpecularTexture.texCoord);
                }

                if (this.pbrSpecularColorTexture !== undefined)
                {
                    this.pbrSpecularColorTexture.samplerName = "u_pbrNextSpecularColorSampler";
                    this.parseTextureInfoExtensions(this.pbrSpecularColorTexture, "pbrNextSpecularColor");
                    this.textures.push(this.pbrSpecularColorTexture);
                    this.defines.push("HAS_PBRNEXTSPECULARCOLOR_MAP 1");
                    this.properties.set("u_pbrNextSpecularColorUVTransform", this.pbrSpecularColorTexture.texCoord);
                }

                this.properties.set("u_pbrNextSpecularFactor", specularFactor);
                this.properties.set("u_pbrNextSpecularColorFactor", specularColorFactor);
            }


            // Sheen material extension
            // https://github.com/sebavan/glTF/tree/KHR_materials_sheen/extensions/2.0/Khronos/KHR_materials_sheen
            if(this.extensions.KHR_materials_sheen !== undefined)
            {
                let sheenRoughnessFactor = 0.0;
                let sheenColorFactor =  vec3.fromValues(1.0, 1.0, 1.0);

                this.hasSheen = true;

                if(this.extensions.KHR_materials_sheen.sheenRoughnessFactor !== undefined)
                {
                    sheenRoughnessFactor = this.extensions.KHR_materials_sheen.sheenRoughnessFactor;
                }
                if(this.extensions.KHR_materials_sheen.sheenColorFactor !== undefined)
                {
                    sheenColorFactor = jsToGl(this.extensions.KHR_materials_sheen.sheenColorFactor);
                }
                if (this.sheenRoughnessTexture !== undefined)
                {
                    this.sheenRoughnessTexture.samplerName = "u_sheenRoughnessSampler";
                    this.parseTextureInfoExtensions(this.sheenRoughnessTexture, "SheenRoughness");
                    this.textures.push(this.sheenRoughnessTexture);
                    this.defines.push("HAS_SHEEN_ROUGHNESS_MAP 1");
                    this.properties.set("u_SheenRoughnessUVSet", this.sheenRoughnessTexture.texCoord);
                }
                if (this.sheenColorTexture !== undefined)
                {
                    this.sheenColorTexture.samplerName = "u_SheenColorSampler";
                    this.parseTextureInfoExtensions(this.sheenColorTexture, "SheenColor");
                    this.textures.push(this.sheenColorTexture);
                    this.defines.push("HAS_SHEEN_COLOR_MAP 1");
                    this.properties.set("u_SheenColorUVSet", this.sheenColorTexture.texCoord);
                }

                this.properties.set("u_SheenRoughnessFactor", sheenRoughnessFactor);
                this.properties.set("u_SheenColorFactor", sheenColorFactor);
            }

            // KHR Extension: Transmission
            if (this.extensions.KHR_materials_transmission !== undefined)
            {
                let transmissionFactor = 0.0;

                this.hasTransmission = true;

                if (transmissionFactor !== undefined)
                {
                    transmissionFactor = this.extensions.KHR_materials_transmission.transmissionFactor;
                }
                if (this.transmissionTexture !== undefined)
                {
                    this.transmissionTexture.samplerName = "u_TransmissionSampler";
                    this.parseTextureInfoExtensions(this.transmissionTexture, "Transmission");
                    this.textures.push(this.transmissionTexture);
                    this.defines.push("HAS_TRANSMISSION_MAP 1");
                    this.properties.set("u_TransmissionUVSet", this.transmissionTexture.texCoord);
                }

                this.properties.set("u_TransmissionFactor", transmissionFactor);
            }

            // KHR Extension: Volume
            if (this.extensions.KHR_materials_volume !== undefined)
            {
                this.hasVolume = true;

                if (this.thicknessTexture !== undefined)
                {
                    this.thicknessTexture.samplerName = "u_ThicknessSampler";
                    this.parseTextureInfoExtensions(this.thicknessTexture, "Thickness");
                    this.textures.push(this.thicknessTexture);
                    this.defines.push("HAS_THICKNESS_MAP 1");
                    this.properties.set("u_ThicknessUVSet", this.thicknessTexture.texCoord);
                }

                let attenuationColor = jsToGl(this.extensions.KHR_materials_volume.attenuationColor ?? [1.0, 1.0, 1.0]);
                let attenuationDistance = this.extensions.KHR_materials_volume.attenuationDistance ?? 0.0;
                let thicknessFactor = this.extensions.KHR_materials_volume.thicknessFactor ?? 0.0;

                this.properties.set("u_AttenuationColor", attenuationColor);
                this.properties.set("u_AttenuationDistance", attenuationDistance);
                this.properties.set("u_ThicknessFactor", thicknessFactor);
            }
        }

        initGlForMembers(this, gltf, webGlContext);
    }

    fromJson(jsonMaterial)
    {
        super.fromJson(jsonMaterial);

        if (jsonMaterial.emissiveFactor !== undefined)
        {
            this.emissiveFactor = jsToGl(jsonMaterial.emissiveFactor);
        }

        if (jsonMaterial.normalTexture !== undefined)
        {
            const normalTexture = new gltfTextureInfo();
            normalTexture.fromJson(jsonMaterial.normalTexture);
            this.normalTexture = normalTexture;
        }

        if (jsonMaterial.occlusionTexture !== undefined)
        {
            const occlusionTexture = new gltfTextureInfo();
            occlusionTexture.fromJson(jsonMaterial.occlusionTexture);
            this.occlusionTexture = occlusionTexture;
        }

        if (jsonMaterial.emissiveTexture !== undefined)
        {
            const emissiveTexture = new gltfTextureInfo(undefined, 0, false);
            emissiveTexture.fromJson(jsonMaterial.emissiveTexture);
            this.emissiveTexture = emissiveTexture;
        }

        if(jsonMaterial.extensions !== undefined)
        {
            this.fromJsonMaterialExtensions(jsonMaterial.extensions);
        }

        if (jsonMaterial.pbrMetallicRoughness !== undefined && this.type !== "SG")
        {
            this.type = "MR";
            this.fromJsonMetallicRoughness(jsonMaterial.pbrMetallicRoughness);
        }
    }

    fromJsonMaterialExtensions(jsonExtensions)
    {
        if (jsonExtensions.KHR_materials_pbrSpecularGlossiness !== undefined)
        {
            this.type = "SG";
            this.fromJsonSpecularGlossiness(jsonExtensions.KHR_materials_pbrSpecularGlossiness);
        }

        if(jsonExtensions.KHR_materials_unlit !== undefined)
        {
            this.type = "unlit";
        }

        if(jsonExtensions.KHR_materials_clearcoat !== undefined)
        {
            this.fromJsonClearcoat(jsonExtensions.KHR_materials_clearcoat);
        }

        if(jsonExtensions.KHR_materials_specular !== undefined)
        {
            this.fromJsonPBRSpecular(jsonExtensions.KHR_materials_specular);
        }

        if(jsonExtensions.KHR_materials_sheen !== undefined)
        {
            this.fromJsonSheen(jsonExtensions.KHR_materials_sheen);
        }

        if(jsonExtensions.KHR_materials_transmission !== undefined)
        {
            this.fromJsonTransmission(jsonExtensions.KHR_materials_transmission);
        }

        if(jsonExtensions.KHR_materials_volume !== undefined)
        {
            this.fromJsonVolume(jsonExtensions.KHR_materials_volume);
        }
    }

    fromJsonMetallicRoughness(jsonMetallicRoughness)
    {
        if (jsonMetallicRoughness.baseColorTexture !== undefined)
        {
            const baseColorTexture = new gltfTextureInfo(undefined, 0, false);
            baseColorTexture.fromJson(jsonMetallicRoughness.baseColorTexture);
            this.baseColorTexture = baseColorTexture;
        }

        if (jsonMetallicRoughness.metallicRoughnessTexture !== undefined)
        {
            const metallicRoughnessTexture = new gltfTextureInfo();
            metallicRoughnessTexture.fromJson(jsonMetallicRoughness.metallicRoughnessTexture);
            this.metallicRoughnessTexture = metallicRoughnessTexture;
        }
    }

    fromJsonSpecularGlossiness(jsonSpecularGlossiness)
    {
        if (jsonSpecularGlossiness.diffuseTexture !== undefined)
        {
            const diffuseTexture = new gltfTextureInfo(undefined, 0, false);
            diffuseTexture.fromJson(jsonSpecularGlossiness.diffuseTexture);
            this.diffuseTexture = diffuseTexture;
        }

        if (jsonSpecularGlossiness.specularGlossinessTexture !== undefined)
        {
            const specularGlossinessTexture = new gltfTextureInfo(undefined, 0, false);
            specularGlossinessTexture.fromJson(jsonSpecularGlossiness.specularGlossinessTexture);
            this.specularGlossinessTexture = specularGlossinessTexture;
        }
    }

    fromJsonClearcoat(jsonClearcoat)
    {
        if(jsonClearcoat.clearcoatTexture !== undefined)
        {
            const clearcoatTexture = new gltfTextureInfo();
            clearcoatTexture.fromJson(jsonClearcoat.clearcoatTexture);
            this.clearcoatTexture = clearcoatTexture;
        }

        if(jsonClearcoat.clearcoatRoughnessTexture !== undefined)
        {
            const clearcoatRoughnessTexture =  new gltfTextureInfo();
            clearcoatRoughnessTexture.fromJson(jsonClearcoat.clearcoatRoughnessTexture);
            this.clearcoatRoughnessTexture = clearcoatRoughnessTexture;
        }

        if(jsonClearcoat.clearcoatNormalTexture !== undefined)
        {
            const clearcoatNormalTexture =  new gltfTextureInfo();
            clearcoatNormalTexture.fromJson(jsonClearcoat.clearcoatNormalTexture);
            this.clearcoatNormalTexture = clearcoatNormalTexture;
        }
    }

    fromJsonPBRSpecular(pbrSpecular)
    {
        if(pbrSpecular.specularTexture !== undefined)
        {
            const specularTexture = new gltfTextureInfo();
            specularTexture.fromJson(pbrSpecular.specularTexture);
            this.pbrSpecularTexture = specularTexture;
        }

        if(pbrSpecular.specularColorTexture !== undefined)
        {
            const specularColorTexture = new gltfTextureInfo();
            specularColorTexture.fromJson(pbrSpecular.specularColorTexture);
            this.pbrSpecularColorTexture = specularColorTexture;
        }
    }

    fromJsonSheen(jsonSheen)
    {
        if(jsonSheen.sheenColorTexture !== undefined)
        {
            const sheenColorTexture = new gltfTextureInfo(undefined, 0, false);
            sheenColorTexture.fromJson(jsonSheen.sheenColorTexture);
            this.sheenColorTexture = sheenColorTexture;
        }
        if(jsonSheen.sheenRoughnessTexture !== undefined)
        {
            const sheenRoughnessTexture = new gltfTextureInfo();
            sheenRoughnessTexture.fromJson(jsonSheen.sheenRoughnessTexture);
            this.sheenRoughnessTexture = sheenRoughnessTexture;
        }
    }

    fromJsonTransmission(jsonTransmission)
    {
        if(jsonTransmission.transmissionTexture !== undefined)
        {
            const transmissionTexture = new gltfTextureInfo();
            transmissionTexture.fromJson(jsonTransmission.transmissionTexture);
            this.transmissionTexture = transmissionTexture;
        }
    }

    fromJsonVolume(jsonVolume)
    {
        if(jsonVolume.thicknessTexture !== undefined)
        {
            const thicknessTexture = new gltfTextureInfo();
            thicknessTexture.fromJson(jsonVolume.thicknessTexture);
            this.thicknessTexture = thicknessTexture;
        }
    }
}

export { gltfMaterial };
