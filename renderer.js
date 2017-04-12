// Global gl context... It is nice to debug.
var gl = {};

var TARGET_FPS = 60.0;
var dt = 1.0 / TARGET_FPS;			 

function Renderer()
{
	var self = this;
	var mainShader = undefined;
	var camera = {eye: undefined, 
				  center: undefined, 
				  up: undefined};
	var batches = [];
	var canvas = {width: 0, 
				  height: 0, 
				  element: undefined};
	var model = mat4.create();
	
	var lightPosition = vec3.fromValues(0, 2, -10);
	
	this.buildShader = function(source, type)
	{
		var shader = gl.createShader(type);
		
		gl.shaderSource(shader, source);
		gl.compileShader(shader);
		
		if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
		{
			console.log(gl.getShaderInfoLog(shader));
			return undefined;
		}
		
		return shader;
	}

	this.loadShaders = function()
	{
		var vertexShader;
		var fragmentShader;
		
		ajax.get("shaders/vertex.vsh", {}, function(source)
		{
			vertexShader = self.buildShader(source, gl.VERTEX_SHADER);
			if(vertexShader != undefined)
			{
				console.log("Vertex shader successfully build.");
			}
			else
			{
				console.log("Failed to build vertex shader.");
			}
		}, false);
		
		ajax.get("shaders/fragment.fsh", {}, function(source)
		{
			fragmentShader = self.buildShader(source, gl.FRAGMENT_SHADER);
			if(fragmentShader != undefined)
			{
				console.log("Fragment shader successfully build.");
			}
			else
			{
				console.log("Failed to build fragment shader.");
			}
		}, false);
		if( vertexShader != undefined && fragmentShader != undefined)
		{
			var shaderProgram = gl.createProgram();
			gl.attachShader(shaderProgram, vertexShader);
			gl.attachShader(shaderProgram, fragmentShader);
			gl.linkProgram(shaderProgram);
			
			if(!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS))
			{
				window.alert("Error initing shader program");
			}
			gl.useProgram(shaderProgram);
			
			var positionVertex = gl.getAttribLocation(shaderProgram, "position");
			gl.enableVertexAttribArray(positionVertex);
			
			var normalVertex = gl.getAttribLocation(shaderProgram, "normal");
			gl.enableVertexAttribArray(normalVertex);
			
			var texcoord = gl.getAttribLocation(shaderProgram, "texcoord");
			gl.enableVertexAttribArray(texcoord);
			
			let viewProjectionUniform = gl.getUniformLocation(shaderProgram, "viewProjection");
			let normalMatrixUniform = gl.getUniformLocation(shaderProgram, "normalMatrix");
			let lightPositionUniform = gl.getUniformLocation(shaderProgram, "lightPosition");
			let modelViewUniform = gl.getUniformLocation(shaderProgram, "modelView");
			var colorUniform = gl.getUniformLocation(shaderProgram, "color");
			
			
			return {program: shaderProgram,
					positionVertex: positionVertex,
					normalVertex: normalVertex,
					texcoord: texcoord,
					viewProjectionUniform: viewProjectionUniform,
					modelViewUniform: modelViewUniform,
					normalMatrixUniform: normalMatrixUniform,
					lightPositionUniform: lightPositionUniform,
					colorUniform: colorUniform
					};
		}
		else
		{
			console.log("Error loading shaders");
		}
		return undefined;
	}

	this.uploadBuffer = function(vertices)
	{
		var newBufferId = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, newBufferId);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
		
		return newBufferId;
	}

	this.addObject = function(vertices, elements)
	{
		var verticesBufferId = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, verticesBufferId);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);	
		
		
		var elementsBufferId = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementsBufferId);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(elements), gl.STATIC_DRAW);	
		
		batches.push({verticesBufferId: verticesBufferId,
				elementsBufferId: elementsBufferId,
				count: elements.length});
				
		self.draw();
	}
	this.setInitialCamera = function()
	{
		camera.eye = vec3.fromValues(0, 2, -10);
		camera.center = vec3.fromValues(0, 0, 0);
		camera.up = vec3.fromValues(0, 1, 0);
	}

	this.draw = function()
	{
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		
		let v = mat4.create();
		let p = mat4.create();
		let mv = mat4.create();
		let mvp = mat4.create();
		let normalMatrix = mat4.create();
		
		let eyeLightPosition = vec3.create();
		
		self.setInitialCamera();
		
		// Model view projection
		mat4.lookAt(v, camera.eye, camera.center, camera.up);
		mat4.perspective(p, 45, canvas.width / canvas.height, 0.1, 100.0);
		
		mat4.rotateY(model, model, Math.PI * 0.01);
		mat4.multiply(mv, v, model);
		mat4.multiply(mvp, p, mv);

		// Normal matrix
		mat4.invert(normalMatrix, mv);
		mat4.transpose(normalMatrix, normalMatrix);
		
		// Light on eye space
		vec3.transformMat4(eyeLightPosition, lightPosition, v);
		
		// Bind shader
		var shaderProgram = mainShader.program;
		gl.useProgram(shaderProgram);
		gl.enableVertexAttribArray(shaderProgram.positionVertex);	
		
		for(var i = 0; i < batches.length; i++)
		{
			var b = batches[i];
			
			// Vertex Size = (2 * (vertex & normal) + 2 * nom) * 3 components (x, y, z) * 4 bytes (float)
			var vertexSize = (3 + 3 + 2) * 4;
			
			gl.bindBuffer(gl.ARRAY_BUFFER, b.verticesBufferId);
			gl.vertexAttribPointer(mainShader.positionVertex, 3, gl.FLOAT, false, vertexSize, 0);
			gl.vertexAttribPointer(mainShader.normalVertex, 3, gl.FLOAT, false, vertexSize, 3 * 4); // 3 components x 4 bytes per float		
			gl.vertexAttribPointer(mainShader.texcoord, 2, gl.FLOAT, false, vertexSize, 3 * 4 + 3 * 4);
			
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, b.elementsBufferId);
			
			gl.uniform4fv(mainShader.colorUniform, [0.8, 0.8, 0.8, 1]);
			gl.uniformMatrix4fv(mainShader.modelViewUniform, false, mv);
			gl.uniformMatrix4fv(mainShader.viewProjectionUniform, false, mvp);
			gl.uniformMatrix4fv(mainShader.normalMatrixUniform, false, normalMatrix);
			gl.uniform3fv(mainShader.lightPositionUniform, eyeLightPosition);
			
			gl.drawElements(gl.TRIANGLES, b.count, gl.UNSIGNED_SHORT, 0);
		}
	}

	this.bindShader = function(shaderProgram, object)
	{
		gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
	}

	this.load = function(canvasElement)
	{
		console.log(self);
		canvas.element = canvasElement;
		
		let bounds = canvasElement.getBoundingClientRect();
		
		console.log(bounds);
		
		canvasElement.width = bounds.width;
		canvasElement.height = bounds.height;
		
		canvas.width = canvasElement.width;
		canvas.height = canvasElement.height;

		gl = canvasElement.getContext("webgl");
		
		mainShader = self.loadShaders();
		
		gl.clearColor(0.5, 0.5, 0.5, 1);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		
		// gl.viewport(0, 0, 500, 100);
		console.log("Init complete");
		
		// self.addObject( [
			 // 1.0,  0.0,  0.0, 	1.0, 0.0, 0.0,		0.0, 0.0,
			 // 0.0, 1.0,  0.0,	0.0, 1.0, 0.0,		0.0, 0.0,
			 // 0.0, 0.0,  0.0,	0.0, 0.0, 1.0,		0.0, 0.0
		// ], [0, 1, 2]);
		
		gl.enable(gl.DEPTH_TEST);
		self.draw();
		// window.setInterval(self.draw, dt)
	}
	
	this.animate = function()
	{
		window.setInterval(self.draw, dt);
	}
	
}
