"use strict";

function Examine()
{
	var _isPanning = false;
	var _viewMatrix = mat4.create();
	var _initViewMatrix = mat4.create();
		
	var EPSILON = 1e-5;
	
	this.setViewMatrix = function(viewMatrix)
	{
		_isPanning = false;
		_viewMatrix = mat4.clone(viewMatrix);
		_initViewMatrix = mat4.clone(viewMatrix);
	}
	
	this.getViewMatrix = function()
	{
		return _viewMatrix;
	}
	
	this.update = function(dt, state)
	{
		if(!epsilonEqual(state.yawIntensity, 0.0, EPSILON) || 
			!epsilonEqual(state.pitchIntensity, 0.0, EPSILON) || 
			!epsilonEqual(state.zoomIntensity, 0.0, EPSILON) || _isPanning)
		{
            let viewMatrix = mat4.clone(_viewMatrix);

			if(_isPanning)
			{
                viewMatrix = mat4.clone(_initViewMatrix);
			}

            if(!epsilonEqual(state.yawIntensity, 0.0, EPSILON) || 
              !epsilonEqual(state.pitchIntensity, 0.0, EPSILON))
			{
                // glm::dvec3 pivot (_state->pivot[0], _state->pivot[1], _state->pivot[2]);
//                 pivot = viewMatrix * glm::vec4(pivot.x, pivot.y, pivot.z, 1.0);
//                 auto tPivot = glm::translate(glm::dmat4(), pivot);
//                 auto tInvPivot = glm::translate(glm::dmat4(), -pivot);
				let pivot = vec3.fromValues(state.pivot[0], state.pivot[0], state.pivot[0]);
                vec3.transformMat4(pivot, pivot, viewMatrix);
                let tPivot = mat4.create();
                mat4.translate(tPivot, tPivot, pivot);
                let tInvPivot = mat4.create();
                let minusPivot = vec3.fromValues(-pivot[0], -pivot[1], -pivot[2]);
                mat4.translate(tInvPivot, tInvPivot, minusPivot);

				if(!state.lockUpRotation)
				{
					let yaw = radians(state.yawIntensity * state.angularVelocity * dt);
					
					let up4 = vec4.fromValues(state.worldUp[0], state.worldUp[1], state.worldUp[2], 0.0);
					
					vec4.transformMat4(up4, up4,viewMatrix);
					let up = vec3.fromValues(up4[0], up4[1], up4[2]);
					vec3.normalize(up, up);
					
					let yawRot = mat4.create();
					mat4.rotate(yawRot, yawRot, yaw, up);
					
					mat4.multiply(viewMatrix, tInvPivot, viewMatrix);
					mat4.multiply(viewMatrix, yawRot, viewMatrix);
					mat4.multiply(viewMatrix, tPivot, viewMatrix);
				}

				if(!state.lockRightRotation)
				{
					let invViewMatrix = mat4.create();
					mat4.invert(invViewMatrix, viewMatrix);
					
					let front = vec3.fromValues(-invViewMatrix[2*4+0], -invViewMatrix[2*4+1], -invViewMatrix[2*4+2]);
					vec3.normalize(front, front);
					let absPitch = degrees(Math.acos(vec3.dot(state.worldUp, front)));
					
					let deltaPitch = state.pitchIntensity * state.angularVelocity * dt;
					let auxAbsPitch = absPitch + deltaPitch;
					
					if(auxAbsPitch < 180.0 && auxAbsPitch > 0.0)
					{
						let pitchRot = mat4.create();
						
                        mat4.rotate(pitchRot, pitchRot, radians(deltaPitch), vec3.fromValues(1.0, 0.0, 0.0));
                        
                        mat4.multiply(viewMatrix, tInvPivot, viewMatrix);
                        mat4.multiply(viewMatrix, pitchRot, viewMatrix);
                        mat4.multiply(viewMatrix, tPivot, viewMatrix);
					}
					
				}

				state.yawIntensity = 0.0;
				state.pitchIntensity = 0.0;
// 				_state->yawIntensity   = 0.0;
// 				_state->pitchIntensity = 0.0;
			}

            if(!epsilonEqual(state.zoomIntensity, 0.0, EPSILON))
			{
//                 glm::dmat4 invViewMatrix = glm::inverse(viewMatrix);
// 
//                 glm::dvec3 eye   = glm::dvec3(invViewMatrix[3][0], invViewMatrix[3][1], invViewMatrix[3][2]);
//                 glm::dvec3 pivot = glm::dvec3(_state->pivot[0], _state->pivot[1], _state->pivot[2]);
// 
//                 if(!(glm::epsilonEqual(eye.x, pivot.x, EPSILON) && glm::epsilonEqual(eye.y, pivot.y, EPSILON) && glm::epsilonEqual(eye.z, pivot.z, EPSILON)))
// 				{
//                     glm::dvec3 t = glm::normalize(pivot - eye);
// 
//                     auto focusDistance = glm::distance(pivot, eye);
//                     auto zoomTrans = focusDistance * _state->zoomIntensity;
// 
// 					if(focusDistance + zoomTrans > _state->maximumZoom)
// 					{
//                         glm::dmat4 translation = glm::translate(glm::dmat4(), t * zoomTrans);
//                         viewMatrix = viewMatrix * translation;
// 					}
// 				}

                let invViewMatrix = mat4.create(); 
                mat4.invert(invViewMatrix, viewMatrix);

                let eye = vec3.fromValues(invViewMatrix[3*4+0], invViewMatrix[3*4+1], invViewMatrix[3*4+2]);
                let pivot = vec3.fromValues(state.pivot[0], state.pivot[1], state.pivot[2]);

                if(!(epsilonEqual(eye[0], pivot[0], EPSILON) && epsilonEqual(eye[1], pivot[1], EPSILON) && epsilonEqual(eye[2], pivot[2], EPSILON)))
				{
					let t = vec3.create();
					vec3.normalize(t, vec3.fromValues(pivot[0] - eye[0], pivot[1]- eye[1], pivot[2] - eye[2]));

                    let focusDistance = vec3.distance(pivot, eye);
                    let zoomTrans = focusDistance * state.zoomIntensity;

					if(focusDistance + zoomTrans > state.maximumZoom)
					{
						let translation = mat4.create();
						mat4.translate(translation, translation, vec3.fromValues(t[0] * zoomTrans, t[1] * zoomTrans, t[2] * zoomTrans));
                        mat4.multiply(viewMatrix, viewMatrix, translation);
					}
				}

				state.zoomIntensity = 0.0;
			}

			if(_isPanning)
			{

                // glm::dmat4 projectionMatrix = glm::make_mat4(_state->projectionMatrix);
//                 glm::dmat4 worldToScreenMatrix = projectionMatrix * viewMatrix;
// 
//                 glm::dvec4 pickedPoint = glm::dvec4(_pickedPoint[0], _pickedPoint[1], _pickedPoint[2], 1.0);
//                 glm::dvec4 projectedPoint = worldToScreenMatrix * pickedPoint;
// 
// 				projectedPoint.x = projectedPoint.x / projectedPoint.w;
// 				projectedPoint.y = projectedPoint.y / projectedPoint.w;
// 
// 				projectedPoint.x = ((projectedPoint.x + 1.0) / 2.0) * _state->viewport[2] + _state->viewport[0];
// 				projectedPoint.y = ((projectedPoint.y + 1.0) / 2.0) * _state->viewport[3] + _state->viewport[1];
// 
// 				projectedPoint.x = projectedPoint.x + _dx;
// 				projectedPoint.y = projectedPoint.y + _dy;
// 
// 				projectedPoint.x = (projectedPoint.x - _state->viewport[0]) * 2.0 / _state->viewport[2] - 1.0;
// 				projectedPoint.y = (projectedPoint.y - _state->viewport[1]) * 2.0 / _state->viewport[3] - 1.0;
// 
// 				projectedPoint.x = projectedPoint.x * projectedPoint.w;
// 				projectedPoint.y = projectedPoint.y * projectedPoint.w;
// 
// 
//                 glm::dmat4 screenToWorldMatrix = glm::inverse(worldToScreenMatrix);
//                 glm::dvec4 unprojectedPoint = screenToWorldMatrix * projectedPoint;
// 
//                 glm::dvec4 panTranslation = unprojectedPoint - pickedPoint;
// 
//                 glm::dmat4 translation = glm::translate(glm::dmat4(), glm::dvec3(panTranslation));
// 
// 				viewMatrix = viewMatrix * translation;
// 
//                 glm::dvec4 pivot = glm::dvec4(_initPivot[0], _initPivot[1], _initPivot[2], 1.0);
//                 glm::dvec4 projectedPivot = worldToScreenMatrix * pivot;
//                 worldToScreenMatrix = projectionMatrix * viewMatrix;
//                 screenToWorldMatrix = glm::inverse(worldToScreenMatrix);
//                 glm::dvec4 newPivot = screenToWorldMatrix * projectedPivot;
// 
// 				_state->pivot[0] = newPivot[0];
// 				_state->pivot[1] = newPivot[1];
// 				_state->pivot[2] = newPivot[2];
			}

//             std::memcpy(_viewMatrix, glm::value_ptr(viewMatrix), 16 * sizeof(double));
			_viewMatrix = mat4.clone(viewMatrix);

			return true;
		}
		else
		{
			return false;
		}
	}

}