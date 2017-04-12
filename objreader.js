function ObjReader()
{
	let self = this;
	let vertexRegex = /v[n|t]?\s*(\-?\d+\.?\d*)\s*(\-?\d+\.?\d*)\s*(\-?\d+\.?\d*)/g;
	let trianglesRegex = /f\s*((\d*)(\/(\d*)?\/(\d*)?)?)\s*((\d*)(\/(\d*)?\/(\d*)?)?)\s*((\d*)(\/(\d*)?\/(\d*)?)?)\s*((\d*)(\/(\d*)?\/(\d*)?)?)?/g;
	
	let _tesselateObject = function(vertices, normals, texcoords, faces)
	{
		let needcalculateNormals = false;
		let hasTexcoords = true;
		
		let finalVertices = [];
		let elements = [];
		let verticeCount = 0;
		
		let indicesMap = {};
		for(let i = 0; i < faces.length; i++)
		{
			let face = faces[i];
			
			let firstIdx = undefined;
			let lastIdx = undefined;
			for(let j =0; j < face.length; j++)
			{
				let v = face[j].v;
				let n = face[j].n;
				let t = face[j].t;
				
				if(v == undefined && n == undefined && t == undefined)
				{
					continue;
				}
				
				let key = "";
				if(v != undefined)
				{
					key += v + "_";
				}
				else
				{
					key += "_";
				}
				
				if(n != undefined)
				{
					key += n + "_";
				}
				else
				{
					key += "_";
				}
				
				if(t != undefined)
				{
					key += t;
				}
				let index = undefined;
				
				if(!indicesMap.hasOwnProperty(key))
				{
					// Vertex
					if(v != undefined)
					{
						let vertex = vertices[v-1];
						finalVertices.push(vertex.x);
						finalVertices.push(vertex.y);
						finalVertices.push(vertex.z);
					}
					else
					{
						finalVertices.push(0.0);
						finalVertices.push(0.0);
						finalVertices.push(0.0);
					}
					
					// Normal
					if(n != undefined)
					{
						let normal = normals[n-1];
						finalVertices.push(normal.x);
						finalVertices.push(normal.y);
						finalVertices.push(normal.z);
					}
					else
					{
						needcalculateNormals = true;
						finalVertices.push(0.0);
						finalVertices.push(0.0);
						finalVertices.push(0.0);
					}
					
					// Texcoord
					if(t != undefined)
					{
						let tex = texcoords[t-1];
						finalVertices.push(tex.u);
						finalVertices.push(tex.v);
					}
					else
					{
						hasTexcoords = false
						finalVertices.push(0.0);
						finalVertices.push(0.0);
					}
					index = verticeCount;
					indicesMap[key] = index;
					verticeCount++;
				}
				else
				{
					index = indicesMap[key];
					// console.log("Existing key");
				}
				if(j == 0)
				{
					firstIdx = index;
				}
				
		
				if(j>2)
				{
					let v0 = firstIdx;
					let v1 = lastIdx;
					let v2 = index;
					elements.push(v0);
					elements.push(v1);
					elements.push(v2);
				}
				else
				{						
					elements.push(index);
				}
				lastIdx = index;
				
			}
		}
		
		return {vertices: finalVertices, 
				elements: elements, 
				needcalculateNormals: needcalculateNormals, 
				hasTexcoords: hasTexcoords};
	
	}
	this.readObjects = function(str)
	{
		// let match = regex.exec(test);
		// regex.lastIndex = 0;
		// console.log(match);
		
		// console.log(regex);
		
		// match = regex.exec("v 1 2 4");
		// console.log(match);
		
		let lines  = str.split("\n");
		let groups = [];
		let objects = [];
		let vertices = [];
		let texcoords = [];
		let normals = [];
		let faces = [];
		for(let i = 0; i < lines.length; i++)
		{
			let line = lines[i];
			if(line[0] == "v")
			{
				let match = vertexRegex.exec(line);
				vertexRegex.lastIndex = 0;
				
				if(match != null)
				{					
					let x = parseFloat(match[1]);
					let y = parseFloat(match[2]);
					let z = parseFloat(match[3]);
					
					if(line[1] == "n")
					{						
						normals.push({x: x,
									  y: y,
									  z: z});
					}
					else if(line[1] == "t")
					{
						texcoords.push({u: x,
										v: y});
					}
					else
					{
						vertices.push({x: x,
									   y: y,
									   z: z});
					}
				}
			}
			else if(line[0] == "f")
			{
				let match = trianglesRegex.exec(line);
				if(match != null)
				{
					trianglesRegex.lastIndex = 0;
					faces.push([{v: match[2], t: match[4], n: match[5]}, 
								{v: match[7], t: match[9], n: match[10]}, 
								{v: match[12], t: match[14], n: match[15]},
								{v: match[17], t: match[19], n: match[20]}]);
				}
				
			}
		}
		return _tesselateObject(vertices, normals, texcoords, faces);
	}
	
}


