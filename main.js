
window.addEventListener("load", function()
{
	 init();
});

var renderer = undefined;

function init()
{
	// Init renderer	
	let canvas = document.getElementById("canvas");
	renderer = new Renderer();
	renderer.load(canvas);
	
	// Init uploader
	let objUploader = document.getElementById("file");
		
	objUploader.addEventListener("change", function(e)
	{
		let files = e.target.files;
		var objreader = new ObjReader();

		if(files.length > 0)
		{
			let file = files[0];		
			let reader = new FileReader();
			
			reader.onload = function(e)
			{
				let obj = objreader.readObjects(e.target.result);
				renderer.addObject(obj.vertices, obj.elements);
				// let str = e.target.result;
				// let lines  = str.split("\n");
				// for(let i = 0; i < lines.length; i++)
				// {
					// console.log(lines[i]);
				// }
			};
			
			reader.readAsText(file);
		}
		
	});
	
	
	let button = document.getElementById("animate_button");
	button.addEventListener("click", function()
	{
		renderer.animate();
	});
}
