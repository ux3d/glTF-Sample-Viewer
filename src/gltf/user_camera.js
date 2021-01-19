import { vec3 } from 'gl-matrix';
import { gltfCamera } from './camera.js';
import { jsToGl, clamp } from './utils.js';
import { getSceneExtents } from './gltf_utils.js';

const VecZero = vec3.create();
const PanSpeedDenominator = 1200;
const MaxNearFarRatio = 10000;

class UserCamera extends gltfCamera
{
    constructor(
        position = [0, 0, 0],
        target = [0, 0,0],
        up = [0, 1, 0],
        xRot = 0,
        yRot = 0,
        zRot = 0,
        zoom = 1)
    {
        super();

        this.position = jsToGl(position);
        this.target = jsToGl(target);
        this.up = jsToGl(up);
        this.xRot = xRot;
        this.yRot = yRot;
        this.zoom = zoom;
        this.zoomFactor = 1.04;
        this.rotateSpeed = 1 / 180;
        this.panSpeed = 1;
        this.sceneExtents = {
            min: vec3.create(),
            max: vec3.create()
        };
    }

    setPosition(position)
    {
        this.position = position;
        this.fitCameraPlanesToExtents(this.sceneExtents.min, this.sceneExtents.max);
    }

    rollPitchYaw(zRot, xRot, yRot)
    {
        const yMax = Math.PI / 2 - 0.01;
        this.xRot = xRot;
        this.yRot = yRot;
        this.zRot = zRot;
        this.yRot = clamp(this.yRot, -yMax, yMax);
    }

    updatePosition()
    {
        // calculate direction from focus to camera (assuming camera is at positive z)
        // yRot rotates *around* x-axis, xRot rotates *around* y-axis
        const direction = vec3.fromValues(0, 0, 1);
        this.toLocalRotation(direction);

        const position = vec3.create();
        vec3.scale(position, direction, this.zoom);
        vec3.add(position, position, this.target);

        this.position = position;

        this.fitCameraPlanesToExtents(this.sceneExtents.min, this.sceneExtents.max);
    }

    reset(gltf, sceneIndex)
    {
        this.xRot = 0;
        this.yRot = 0;
        this.zRot = 0;
        this.fitViewToScene(gltf, sceneIndex, true);
    }

    zoomIn(value)
    {
        if (value > 0)
        {
            this.zoom *= this.zoomFactor;
        }
        else
        {
            this.zoom /= this.zoomFactor;
        }
    }

    rotate(x, y)
    {
        const yMax = Math.PI / 2 - 0.01;
        this.xRot += (x * this.rotateSpeed);
        this.yRot += (y * this.rotateSpeed);
        this.yRot = clamp(this.yRot, -yMax, yMax);
    }

    pan(x, y)
    {
        const left = vec3.fromValues(-1, 0, 0);
        this.toLocalRotation(left);
        vec3.scale(left, left, x * this.panSpeed);

        const up = vec3.fromValues(0, 1, 0);
        this.toLocalRotation(up);
        vec3.scale(up, up, y * this.panSpeed);

        vec3.add(this.target, this.target, up);
        vec3.add(this.target, this.target, left);
    }

    fitPanSpeedToScene(min, max)
    {
        const longestDistance = vec3.distance(min, max);
        this.panSpeed = longestDistance / PanSpeedDenominator;
    }

    fitViewToScene(gltf, sceneIndex)
    {
        getSceneExtents(gltf, sceneIndex, this.sceneExtents.min, this.sceneExtents.max);
        this.fitCameraTargetToExtents(this.sceneExtents.min, this.sceneExtents.max);
        this.fitZoomToExtents(this.sceneExtents.min, this.sceneExtents.max);
        this.fitPanSpeedToScene(this.sceneExtents.min, this.sceneExtents.max);
        this.fitCameraPlanesToExtents(this.sceneExtents.min, this.sceneExtents.max);
    }

    toLocalRotation(vector)
    {
        vec3.rotateX(vector, vector, VecZero, -this.yRot);
        vec3.rotateY(vector, vector, VecZero, -this.xRot);
        vec3.rotateZ(vector, vector, VecZero, -this.zRot);
    }

    getLookAtTarget()
    {
        return this.target;
    }

    getPosition()
    {
        return this.position;
    }

    fitZoomToExtents(min, max)
    {
        const maxAxisLength = Math.max(max[0] - min[0], max[1] - min[1]);
        this.zoom = this.getFittingZoom(maxAxisLength);
    }

    fitCameraTargetToExtents(min, max)
    {
        for (const i of [0, 1, 2])
        {
            this.target[i] = (max[i] + min[i]) / 2;
        }
    }

    fitCameraPlanesToExtents(min, max)
    {
        // Manually increase scene extent just for the camera planes to avoid camera clipping in most situations.
        const longestDistance = 10 * vec3.distance(min, max);
        let zNear = this.zoom - (longestDistance * 0.6);
        let zFar = this.zoom + (longestDistance * 0.6);

        // minimum near plane value needs to depend on far plane value to avoid z fighting or too large near planes
        zNear = Math.max(zNear, zFar / MaxNearFarRatio);

        this.znear = zNear;
        this.zfar = zFar;
    }

    getFittingZoom(axisLength)
    {
        const yfov = this.yfov;
        const xfov = this.yfov * this.aspectRatio;

        const yZoom = axisLength / 2 / Math.tan(yfov / 2);
        const xZoom = axisLength / 2 / Math.tan(xfov / 2);

        return Math.max(xZoom, yZoom);
    }
}

export { UserCamera };
