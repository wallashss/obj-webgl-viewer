function calculateNormals(vertices, elements)
{
	let verticeSize = 8 ; // 3 vertices, 3 normals, 2 texcoords
	let normalsMap = {};
	
	let dot = function(a, b)
	{
		
	}
	
	let cross = function(a, b)
	{
		return {x: (a.y*b.z - b.y*a.z), y: (a.z*b.x - b.z*a.x), z: (a.x*b.y - b.x*a.y)};
	}
	
	let length = function(a)
	{
		return Math.sqrt(a.x*a.x + a.y*a.y + a.z*a.z);
	}
	
	let normalize = function(a)
	{
		let mag = length(a);
		return {x: a.x/mag, y: a.y/mag, z: a.z/mag};
	}
	
	let elementCount = elements.length/3;
	
	for(let i = 0; i < elementCount; i++)
	{
		let e0 = elements[i*3+0];
		let e1 = elements[i*3+1];
		let e2 = elements[i*3+2];
		
		let v0 = {x : vertices[e0 * verticeSize + 0], y : vertices[e0 * verticeSize + 1], z : vertices[e0 * verticeSize + 2] };
		let v1 = {x : vertices[e1 * verticeSize + 0], y : vertices[e1 * verticeSize + 1], z : vertices[e1 * verticeSize + 2] };
		let v2 = {x : vertices[e2 * verticeSize + 0], y : vertices[e2 * verticeSize + 1], z : vertices[e2 * verticeSize + 2] };
		
		let v0v1 = {x: v0.x - v1.x, y: v0.y - v1.y, z: v0.z - v1.z};
		let v0v2 = {x: v0.x - v2.x, y: v0.y - v2.y, z: v0.z - v2.z};
				
		let normal = cross(v0v1, v0v2);
		normal = normalize(normal);
		
		let addNormal = function(ele)
		{
			if(normalsMap.hasOwnProperty(ele))
			{
				normalsMap[ele].push(normal);
			}
			else
			{
				normalsMap[ele] = [normal];
			}
		}
		addNormal(e0);
		addNormal(e1);
		addNormal(e2);
	}
	
	let verticeCount = vertices.length / 8;
	
	for(let i = 0; i < verticeCount; i++)
	{	
		let normals = normalsMap[i];
		let normalsCount = normals.length;
		let normal = {x: 0, y: 0, z: 0};
		for(let j =0; j < normals.length; j++)
		{
			normal.x += normals[j].x / normalsCount;
			normal.y += normals[j].y / normalsCount;
			normal.z += normals[j].z / normalsCount;
		}
		
		vertices[i*verticeSize+3] = normal.x;
		vertices[i*verticeSize+3+1] = normal.y;
		vertices[i*verticeSize+3+2] = normal.z;
	}	
}