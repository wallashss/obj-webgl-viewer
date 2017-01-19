layout(location = 0) in vec3 position;
layout(location = 1) in vec3 normal;

uniform highp mat4 viewProjection;

uniform vec4 color;

out vec4 currentColor;

smooth out vec3 vPosition;
smooth out vec3 vNormal;


void main (void)
{
    gl_Position = viewProjection * vec4(position, 1);

    currentColor = color;
	
	vPosition = position;
	vNormal = normal;
}