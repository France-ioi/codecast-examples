/* {"title":"blink (2 LEDs)","mode":"arduino","tags":["arduino"]} */
#define RED_LED_PIN 0
#define GRN_LED_PIN 1
void setup() {
    pinMode(RED_LED_PIN, OUTPUT);
    pinMode(GRN_LED_PIN, OUTPUT);
}
int level = LOW;
void loop() {
    digitalWrite(GRN_LED_PIN, level);
    digitalWrite(RED_LED_PIN, level ^ HIGH);
    level ^= HIGH;
    delay(1000);
}