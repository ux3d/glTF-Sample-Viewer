import { UserCamera } from '../gltf/user_camera.js';
import { AnimationTimer } from '../gltf/utils.js';

/**
 * GltfState containing a state for visualization in GltfView
 */
class GltfState
{
    /**
     * GltfState represents all state that can be visualized in a view. You could have
     * multiple GltfStates configured and switch between them on demand.
     * @param {*} view GltfView to which this state belongs
     */
    constructor(view)
    {
        /** loaded gltf data @see ResourceLoader.loadGltf */
        this.gltf = undefined;
        /** loaded environment data @see ResourceLoader.loadEnvironment */
        this.environment = undefined;
        /** user camera @see UserCamera, convenient camera controls */
        this.userCamera = new UserCamera();
        /** gltf scene that is visible in the view */
        this.sceneIndex = 0;
        /**
         * index of the camera that is used to render the view. a
         * value of 'undefined' enables the user camera
         */
        this.cameraIndex = undefined;
        /** indices of active animations */
        this.animationIndices = [];
        /** animation timer allows to control the animation time */
        this.animationTimer = new AnimationTimer();
        /** KHR_materials_variants */
        this.variant = undefined;

        /** parameters used to configure the rendering */
        this.renderingParameters = {
            /** morphing between vertices */
            morphing: true,
            /** skin / skeleton */
            skinning: true,
            /** KHR_materials_clearcoat */
            clearcoat: true,
            /** KHR_materials_specular */
            pbrSpecular: true,
            /** KHR_materials_sheen */
            sheen: true,
            /** KHR_materials_transmission */
            transmission: true,
            /** clear color expressed as list of ints in the range [0, 255] */
            clearColor: [58, 64, 74, 255],
            /** exposure factor */
            exposure: 1.0,
            /** KHR_lights_punctual */
            usePunctual: true,
            /** image based lighting */
            useIBL: true,
            /** render the environment map in the background */
            renderEnvironmentMap: true,
            /** apply blur to the background environment map */
            blurEnvironmentMap: true,
            /** which tonemap to use, use ACES for a filmic effect */
            toneMap: GltfState.ToneMaps.LINEAR,
            /** render some debug output channes, such as for example the normals */
            debugOutput: GltfState.DebugOutput.NONE,
            /**
             * By default the front face of the environment is +Z (90)
             * Front faces:
             * +X = 0 
             * +Z = 90 
             * -X = 180 
             * -Z = 270
             */
            environmentRotation: 90.0
        };

        // retain a reference to the view with which the state was created, so that it can be validated
        this._view = view;
    }
}

/** 
 * ToneMaps enum for the different tonemappings that are supported 
 * by gltf sample viewer
*/
GltfState.ToneMaps = {
    /** don't apply tone mapping */
    NONE: "None",
    /** fast implementation of the ACES sRGB RRT+ODT */
    ACES_FAST: "ACES fast",
    /** more accurate implementation of the ACES sRGB RRT+ODT */
    ACES: "ACES"
};

/**
 * DebugOutput enum for selecting debug output channels
 * such as "NORMAL"
 */
GltfState.DebugOutput = {
    /** standard rendering - debug output is disabled */
    NONE: "None",
    /** output the metallic value from pbr metallic roughness */
    METALLIC: "Metallic",
    /** output the roughness value from pbr metallic roughness */
    ROUGHNESS: "Roughness",
    /** output the normal map value in TBN space */
    NORMAL: "Normal",
    /** output the world space normals (i.e. with TBN applied) */
    WORLDSPACENORMAL: "Worldspace Normal",
    /** output the normal from the TBN*/
    GEOMETRYNORMAL: "Geometry Normal",
    /** output the tangent from the TBN*/
    TANGENT: "Tangent",
    /** output the bitangent from the TBN */
    BITANGENT: "Bitangent",
    /** output the base color value */
    BASECOLOR: "Base Color",
    /** output the occlusion value */
    OCCLUSION: "Occlusion",
    /** output the emissive value */
    EMISSIVE: "Emissive",
    /** output diffuse lighting */
    DIFFUSE: "Diffuse",
    /** output specular lighting */
    SPECULAR: "Specular",
    /** output clearcoat lighting */
    CLEARCOAT: "ClearCoat",
    /** output sheen lighting */
    SHEEN: "Sheen",
    /** output tranmission lighting */
    TRANSMISSION: "Transmission",
    /** output the alpha value */
    ALPHA: "Alpha",
    /** output computed F0 */
    F0: "F0"
};

export { GltfState };
