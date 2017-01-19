layout(location = 0) out vec4 fragColor;
in vec4 currentColor;

void main(void)
{
    fragColor = currentColor;
}