/* {"title":"blink","platform":"arduino","tags":["arduino"]} */
#define LED_PIN 0
void setup() {
    pinMode(LED_PIN, OUTPUT);
}
int level = LOW;
void loop() {
    digitalWrite(LED_PIN, level);
    level ^= HIGH;
    delay(1000);
}