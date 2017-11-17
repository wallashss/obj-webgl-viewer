"use strict"

// Global gl context... It is nice to debug.
let gl = null;

let TARGET_FPS = 60.0;
let dt = 1.0 / TARGET_FPS;			 

function Renderer()
{
	let self = this;
	let mainShader = null;
	let batches = [];
	let lines = [];
	let textureMap = {};
	let canvas = {width: 0, 
				  height: 0, 
				  element: undefined};
	
	this.translation = vec3.create();
	this.scale = vec3.fromValues(1.0, 1.0, 1.0);
	this.rotation = mat4.create();
	
	let isAnimating = false;

	let backgroundColor = {r: 0.5, g: 0.5, b: 0.5, a: 1.0};
	let dummyTexture = null;
	
	let _viewMatrix = mat4.create();
	
	this.buildShader = function(source, type)
	{
		let shader = gl.createShader(type);
		
		gl.shaderSource(shader, source);
		gl.compileShader(shader);
		
		if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
		{
			console.log(gl.getShaderInfoLog(shader));
			return undefined;
		}
		return shader;
	}

	this.loadShaders = function(vertexSource, fragmentSource)
	{
		let vertexShader = self.buildShader(vertexSource, gl.VERTEX_SHADER);
		let fragmentShader = self.buildShader(fragmentSource, gl.FRAGMENT_SHADER);
		if( vertexShader && fragmentShader )
		{
			let shaderProgram = gl.createProgram();
			gl.attachShader(shaderProgram, vertexShader);
			gl.attachShader(shaderProgram, fragmentShader);
			gl.linkProgram(shaderProgram);
			
			if(!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS))
			{
				window.alert("Error initing shader program");
			}
			gl.useProgram(shaderProgram);
			
			let positionVertex = gl.getAttribLocation(shaderProgram, "position");
			gl.enableVertexAttribArray(positionVertex);
			
			let normalVertex = gl.getAttribLocation(shaderProgram, "normal");
			gl.enableVertexAttribArray(normalVertex);
			
			let texcoord = gl.getAttribLocation(shaderProgram, "texcoord");
			gl.enableVertexAttribArray(texcoord);
			
			let modelViewProjection = gl.getUniformLocation(shaderProgram, "modelViewProjection");
			let modelViewUniform = gl.getUniformLocation(shaderProgram, "modelView");
			let normalMatrixUniform = gl.getUniformLocation(shaderProgram, "normalMatrix");
			let lightPositionUniform = gl.getUniformLocation(shaderProgram, "lightPosition");
			let colorUniform = gl.getUniformLocation(shaderProgram, "color");
			let useTextureUniform = gl.getUniformLocation(shaderProgram, "useTexture");
			let unlitUniform = gl.getUniformLocation(shaderProgram, "unlit");
			let texSamplerUniform = gl.getUniformLocation(shaderProgram, "texSampler");
			
			mainShader = {program: shaderProgram,
					positionVertex: positionVertex,
					normalVertex: normalVertex,
					texcoord: texcoord,
					modelViewProjectionUniform: modelViewProjection,
					modelViewUniform: modelViewUniform,
					normalMatrixUniform: normalMatrixUniform,
					lightPositionUniform: lightPositionUniform,
					colorUniform: colorUniform,
					useTextureUniform: useTextureUniform,
					unlitUniform: unlitUniform,
					texSamplerUniform : texSamplerUniform
					};
			console.log("succesfully loaded shaders");
		}
		else
		{
			console.log("Error loading shaders");
		}
		
	}

	this.uploadBuffer = function(vertices)
	{
		let newBufferId = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, newBufferId);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
		
		return newBufferId;
	}

	this.addObject = function(vertices, elements, color, transform, textureName)
	{
		let verticesBufferId = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, verticesBufferId);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

		let t = mat4.create();
		if(transform)
		{
			mat4.copy(t, transform);
		}
		
		let c = vec4.fromValues(0.8, 0.8, 0.8, 1.0);
		if(!color)
		{
			c = vec4.clone(color);
		}

		
		let elementsBufferId = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementsBufferId);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(elements), gl.STATIC_DRAW);	
		
		batches.push({verticesBufferId: verticesBufferId,
				elementsBufferId: elementsBufferId,
				transform: t,
				count: elements.length,
				color: color,
				textureName: textureName});
				
		// self.draw();
	}

	this.addObjectInstances = function(vertices, elements, colors, instances, textureName)
	{
		let verticesBufferId = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, verticesBufferId);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

		
		let elementsBufferId = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementsBufferId);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(elements), gl.STATIC_DRAW);	
		
		for(let i  =0 ; i < instances.length; i++)
		{
			let t = mat4.clone(instances[i]);
			let c = vec4.clone(colors[i]);

			batches.push({verticesBufferId: verticesBufferId,
				elementsBufferId: elementsBufferId,
				transform: t,
				count: elements.length,
				color: c,
				textureName: textureName});
		}
		
				
		// self.draw();
	}
	
	this.addLines = function(vertices, color)
	{
		let verticesBufferId = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, verticesBufferId);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);	
		
		if(!color)
		{
			color = vec4.fromValues(1.0, 1.0, 1.0, 1.0);
		}
		
		lines.push({verticesBufferId: verticesBufferId,
					count: vertices.length / 3,
					vertexSize: 3 * 4, // 3 components * 4 bytes per float
					color: color});
	}
	
	this.addTexture = function(textureName, texture, isNearest)
	{
		let textureId = gl.createTexture();

		gl.bindTexture(gl.TEXTURE_2D, textureId);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture);

		isNearest = (isNearest !== null && isNearest !== undefined) ? isNearest : false;

		if(isNearest)
		{
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		}
		else
		{
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		}
		
		gl.bindTexture(gl.TEXTURE_2D, null);
		
		textureMap[textureName] = textureId;
		
		self.draw();
	}

	this.clearBatches = function()
	{
		for(let i = 0; i < batches.length; i++)
		{
			let b = batches[i];
			gl.deleteBuffer(b.verticesBufferId);
			gl.deleteBuffer(b.elementsBufferId);
		}
		batches = [];
	}

	this.draw = function()
	{
		// Clear screen
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		
		
		if(batches.length == 0 && lines.length == 0)
		{
			return;
		}
	
		// Bind shader
		let shaderProgram = mainShader.program;
		gl.useProgram(shaderProgram);
		
		// Eye light position 
		let eyeLightPosition = vec3.fromValues(0.0, 0.0, 0.0);
		gl.uniform3fv(mainShader.lightPositionUniform, eyeLightPosition);
		
		gl.uniform1f(mainShader.unlitUniform, 0.0);
		
		let m = mat4.create();
		let v = _viewMatrix;
		let p = mat4.create();
		mat4.perspective(p, 45, canvas.width / canvas.height, 0.1, 100000.0);
		let mv = mat4.create();
		let mvp = mat4.create();
		
		let currentVertexBufferId = null;
		let currentElementBufferId = null;
		let currentTextureId = null;
		gl.activeTexture(gl.TEXTURE0);
		for(let i = 0; i < batches.length; i++)
		{
			let b = batches[i];
			// Matrices
			mat4.copy(m, b.transform);
			let normalMatrix = mat4.create();
			
			// Model view projection
			mat4.scale(m, m, self.scale);
			mat4.multiply(m, self.rotation, m);
			mat4.multiply(mv, v, m);
			mat4.multiply(mvp, p, mv);

			// Normal matrix
			mat4.invert(normalMatrix, mv);
			mat4.transpose(normalMatrix, normalMatrix);

			// Transforms
			gl.uniformMatrix4fv(mainShader.modelViewUniform, false, mv);
			gl.uniformMatrix4fv(mainShader.modelViewProjectionUniform, false, mvp);
			gl.uniformMatrix4fv(mainShader.normalMatrixUniform, false, normalMatrix);
			
			// Vertex Size = (2 * (vertex & normal) + 2 * nom) * 3 components (x, y, z) * 4 bytes (float)
			let vertexSize = (3 + 3 + 2) * 4;
			
			if(currentVertexBufferId !== b.verticesBufferId)
			{
				gl.bindBuffer(gl.ARRAY_BUFFER, b.verticesBufferId);
				gl.vertexAttribPointer(mainShader.positionVertex, 3, gl.FLOAT, false, vertexSize, 0);
				gl.vertexAttribPointer(mainShader.normalVertex, 3, gl.FLOAT, false, vertexSize, 3 * 4); // 3 components x 4 bytes per float		
				gl.vertexAttribPointer(mainShader.texcoord, 2, gl.FLOAT, false, vertexSize, 3 * 4 + 3 * 4);
				currentVertexBufferId = b.verticesBufferId;
			}
			
			if(currentElementBufferId !== b.elementsBufferId)
			{
				gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, b.elementsBufferId);
				currentElementBufferId = b.elementsBufferId;
			}
			
			if(b.textureName && textureMap.hasOwnProperty(b.textureName) )
			{
				let textureId = textureMap[b.textureName];
				if(currentTextureId !== textureId)
				{
					gl.uniform1i(shaderProgram.texSamplerUniform, 0);
					gl.bindTexture(gl.TEXTURE_2D, textureId);
					gl.uniform1f(mainShader.useTextureUniform, 1.0);
					textureId = textureId;
				}
			}			
			else 
			{
				if(currentTextureId !== dummyTexture)
				{
					gl.uniform1i(shaderProgram.texSamplerUniform, 0);
					gl.bindTexture(gl.TEXTURE_2D, dummyTexture);
					gl.uniform1f(mainShader.useTextureUniform, 0.0);
					gl.uniform4fv(mainShader.colorUniform, b.color);
					currentTextureId = dummyTexture;
				}
			}
			
			gl.drawElements(gl.TRIANGLES, b.count, gl.UNSIGNED_SHORT, 0);
			gl.bindTexture(gl.TEXTURE_2D, null);
		}

		gl.uniform1f(mainShader.unlitUniform, 1.0);		
		for(let i =0 ; i < lines.length; i++)
		{
			let l = lines[i];

			gl.uniform1i(shaderProgram.texSamplerUniform, 0);
			gl.bindTexture(gl.TEXTURE_2D, dummyTexture);
			gl.uniform1f(mainShader.useTextureUniform, 0.0);
			
			gl.bindBuffer(gl.ARRAY_BUFFER, l.verticesBufferId);
			gl.vertexAttribPointer(mainShader.positionVertex, 3, gl.FLOAT, false, l.vertexSize, 0);
			gl.vertexAttribPointer(mainShader.normalVertex, 3, gl.FLOAT, false, l.vertexSize, 0); // 3 components x 4 bytes per float		
			gl.vertexAttribPointer(mainShader.texcoord, 2, gl.FLOAT, false, l.vertexSize, 0);
			
			gl.drawArrays(gl.LINES, 0, l.count);
		}
	}

	this.bindShader = function(shaderProgram, object)
	{
		gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
	}

	this.updateViewBounds = function()
	{
		let bounds = canvas.element.getBoundingClientRect();
		
		canvas.width = bounds.width;
		canvas.height = bounds.height;
	}

	this.onResize = function()
	{
		if(canvas.element)
		{
			self.updateViewBounds();

			if(mainShader)
			{
				self.draw();
			}
		}
	}

	this.setBackgroundColor = function(r, g, b)
	{
		backgroundColor.r = r;
		backgroundColor.g = g;
		backgroundColor.b = b;

		if(gl)
		{
			gl.clearColor(r, g, b, 1);
		}
		
	}

	this.load = function(canvasElement, vertexSource, fragmentSource)
	{
		canvas.element = canvasElement;

		gl = canvasElement.getContext("webgl2");

		self.updateViewBounds();

		window.addEventListener("resize", (e)=>
		{
			self.onResize();
		});
		
		self.loadShaders(vertexSource, fragmentSource);
		
		gl.clearColor(backgroundColor.r, backgroundColor.g, backgroundColor.b, backgroundColor.a);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		
		// gl.viewport(0, 0, 500, 100);
		console.log("Init complete");
		
		// self.addObject( [
			 // 1.0,  0.0,  0.0, 	0.0, 0.0, -1.0,		0.0, 0.0,
			 // 0.0, 1.0,  0.0,	0.0, 0.0, -1.0,		0.0, 0.0,
			 // 0.0, 0.0,  0.0,	0.0, 0.0, -1.0,		0.0, 0.0
		// ], [0, 1, 2]);
		
		gl.enable(gl.DEPTH_TEST);

		dummyTexture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, dummyTexture);
		let dummyArray = [];
		let dummySize = 4;
		for(let i = 0; i < dummySize*dummySize; i++)
		{
			dummyArray.push(0);
		}
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 2, 2, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(dummyArray));
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.bindTexture(gl.TEXTURE_2D, null);
		
// 		self.draw();
		// window.setInterval(self.draw, dt)
	}
	
	
	this.setViewMatrix = function(viewMatrix)
	{
		_viewMatrix = mat4.clone(viewMatrix);
	}
	
	this.setScale = function(newScale)
	{
		self.scale = vec3.clone(newScale);
	}
}
