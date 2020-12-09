/* {"title":"gets, puts","platform":"unix","tags":["unix"]} */
#include <stdio.h>
int main() {
    char str[16];
    gets(str);
    printf("[%s]\n", str);
    return 0;
}
