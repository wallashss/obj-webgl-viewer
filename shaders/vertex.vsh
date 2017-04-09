attribute vec3 position;
attribute vec3 normal;
attribute vec2 texcoord;

uniform highp mat4 viewProjection;

uniform vec4 color;

varying vec4 currentColor;

varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vTexcoord;


void main (void)
{
    gl_Position =  viewProjection * vec4(position, 1.0);

    currentColor = color;
	
	vPosition = position;
	vNormal = normal;
	vTexcoord = texcoord;
}