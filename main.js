var gl = {};


function buildShader(source, type)
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

function loadShaders()
{
	
	ajax.get("shaders/vertex.vsh", {}, function(source)
	{
		var shader = buildShader(source, gl.VERTEX_SHADER);
		if(shader != undefined)
		{
			console.log("Vertex shader successfully build.");
		}
		else
		{
			console.log("Failed to build vertex shader.");
		}
	});
	
	ajax.get("shaders/fragment.fsh", {}, function(source)
	{
		var shader = buildShader(source, gl.FRAGMENT_SHADER);
		if(shader != undefined)
		{
			console.log("Fragment shader successfully build.");
		}
		else
		{
			console.log("Failed to build fragment shader.");
		}
	});
	
}

function init()
{
	console.log("Init");
	var e = document.getElementById("canvas");
	gl = e.getContext("webgl");
	
	loadShaders();
	gl.clearColor(0, 0, 0, 1);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

window.addEventListener("load", function()
{
	init();
});


