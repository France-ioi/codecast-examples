/* {"title":"struct et pointeur sur fonction","tags":["plain"]} */
struct serial_s {
    int (*available)(void);
};
int Serial_available(void) {
    return 42;
}
int main() {
    //! showMemory()
    struct serial_s Serial;
    Serial.available = Serial_available;
    Serial.available();
    return 0;
}