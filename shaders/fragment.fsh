precision mediump float;
varying vec4 currentColor;
varying vec3 vNormal;

void main(void)
{
    // gl_FragColor = currentColor;
	gl_FragColor = vec4(vNormal, 1);
}