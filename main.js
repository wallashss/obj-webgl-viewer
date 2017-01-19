var gl = {};


function loadShaders()
{
	ajax.get("shaders/fragment.fsh", {}, function(source)
	{
		console.log(source);
	});
	
	ajax.get("shaders/vertex.vsh", {}, function(source)
	{
		console.log(source);
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


