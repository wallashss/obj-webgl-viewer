"use strict";

function CameraController()
{
	var self = this;
	let examineManipulator = new Examine();
	
	let manipulator = examineManipulator;
	
	
	let mouseState = {x: 0, y: 0,
						 mousePress: false};
	let state = {yawIntensity: 0.0,
				pitchIntensity: 0.0,
				pivot: vec3.fromValues(0.0, 0.0, 0.0),
				angularVelocity: 0.0,
				zoomIntensity: 0.0,
				maximumZoom: 0.0};
	let forceDraw = false;
	
	this.rotate = function(yawIntensity, pitchIntensity)
	{
		state.yawIntensity = yawIntensity;
		state.pitchIntensity = pitchIntensity;
	}
	
	this.zoom = function(intensity)
	{
		state.zoomIntensity = intensity;
	}
	
	this.setViewMatrix = function(viewMatrix)
	{
		forceDraw = true;
		manipulator.setViewMatrix(viewMatrix);
	}
	
	this.getViewMatrix = function()
	{
		return manipulator.getViewMatrix();
	}
	
	this.setCamera = function(eye, center, up)
	{
		let v = mat4.create();
		mat4.lookAt(v, eye, center, up);
		manipulator.setViewMatrix(v);
		
		state.pivot = vec3.clone(center);
		state.worldUp = vec3.clone(up);
		
		forceDraw = true;
	}
	
						 
	this.installCamera = function(element, drawcallback)
	{
		let timer = new Timer();
		
		if(element)
		{
			element.addEventListener("mousedown", function(e)
			{
				mouseState.mousePress = true;
				mouseState.x = e.clientX;
				mouseState.y = e.clientY;
			});
			
			element.addEventListener("mouseup", function(e)
			{
				mouseState.mousePress = false;
			});
			
			element.addEventListener("mousemove", function(e)
			{
				if(mouseState.mousePress)
				{
					self.rotate(-mouseState.x + e.clientX, -mouseState.y + e.clientY);
					mouseState.x = e.clientX;
					mouseState.y = e.clientY;
				}
			});
			
			element.addEventListener("wheel", function(e)
			{
				let delta = 0.0;
				if(e.deltaMode == WheelEvent.DOM_DELTA_PIXEL)
				{
					delta = e.deltaY;
				}
				else if(e.deltaMode == WheelEvent.DOM_DELTA_LINE)
				{
					delta = e.deltaY * 33;
				}
				else
				{
					if(e.deltaY > 0)
					{
						delta = 10;
					}
					else if(e.delta < 0)
					{
						delta = -10;
					}
				}
				self.zoom(delta * 0.001);
			});
		}
		
		let frameCallback = function()
		{
			let dt = timer.elapsedTime();
			if(drawcallback)
			{
				if(manipulator.update(dt, state) || forceDraw)
				{
					drawcallback(manipulator.getViewMatrix(), dt);
					forceDraw = false;
				}
			}
			window.requestAnimationFrame(frameCallback);
			timer.restart();
		};
		
		if(drawcallback)
		{
			drawcallback(manipulator.getViewMatrix(), 0);
		}
		
		frameCallback();
	}
	
	var init = function()
	{
		let eye = vec3.fromValues(0, 0, -5);
		let center = vec3.fromValues(0, 0, 0);
		let up = vec3.fromValues(0, 1, 0);
		
		state.pivot = vec3.clone(center);
		state.worldUp = vec3.clone(up);
		state.angularVelocity = 30.0;
		state.maximumZoom = 1.0;
		
		let v = mat4.create();
		mat4.lookAt(v, eye, center, up);
		manipulator.setViewMatrix(v);
	}();
}