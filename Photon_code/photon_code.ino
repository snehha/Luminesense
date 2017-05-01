// demo RGB LED pins
int red_led = D2;
int green_led = D0;
int blue_led = D1;

// Actual Luminaire Pins
// Declare pins and frequency
int white = A5;
int red = A4;
int green = WKP;
int blue = TX;

// Unique Luminaire frequency
int freq = 9000;
// Luminaire states
String last_state = "";
String current_state = "off";
String last_rgbw_state = "";
String current_rgbw_state = "";


void setup()
{
    // RGB LED
    pinMode(red_led, OUTPUT);
    pinMode(green_led, OUTPUT);
    pinMode(blue_led, OUTPUT);
    digitalWrite(red_led, 0);
    digitalWrite(green_led, 0);
    digitalWrite(blue_led, 0);
    
    // Luminaire pin definitions
    pinMode(red, OUTPUT);
    pinMode(green, OUTPUT);
    pinMode(blue, OUTPUT);
    pinMode(white, OUTPUT);
    // Initialize to off
    digitalWrite(red, LOW);
    digitalWrite(green, LOW);
    digitalWrite(blue, LOW);
    digitalWrite(white, LOW);
    
    // Name of func on cloud
    Particle.function("toggleLights", toggleLights);
    Particle.function("session_str", session_str);
    Particle.function("session_end", session_end);
}

int toggleLights(String command)
{
    // Initialize vars
    String arg = command;
    
    // "ON"
    if(arg == "u")
    {
        current_state = "on";
        current_rgbw_state = "w";
        digitalWrite(red, LOW);
        digitalWrite(green, LOW);
        digitalWrite(blue, LOW);
        analogWrite(white, 128, freq);
        return 1;
    }
    // "OFF"
    else if(arg == "d")
    {
        current_state = "off";
        current_rgbw_state = "";
        digitalWrite(red, LOW);
        digitalWrite(green, LOW);
        digitalWrite(blue, LOW);
        digitalWrite(white, LOW);
        return 0;
    }
    // "RED"
    else if(arg == "r")
    {
        current_state = "on";
        current_rgbw_state = "r";
        digitalWrite(white, LOW);
        digitalWrite(green, LOW);
        digitalWrite(blue, LOW);
        analogWrite(red, 128, freq);
        return 2;
    }
    // "BLUE"
    else if(arg == "b")
    {
        current_state = "on";
        current_rgbw_state = "b";
        digitalWrite(white, LOW);
        digitalWrite(green, LOW);
        digitalWrite(red, LOW);
        analogWrite(blue, 128, freq);
        return 3;
    }
    // Incorrect command
    else
    {
        return -1;
    }
}

int session_str(String session)
{
    last_state = current_state;             // Save previous state
    last_rgbw_state = current_rgbw_state;   // Save previous pin state
    current_state = "change";               // Change present state
    current_rgbw_state = "change";          // Change present pin state
    analogWrite(red, LOW);                 // Luminaire "flux" state
    digitalWrite(blue, LOW);
    analogWrite(green, 55, freq);
    analogWrite(white, 73, freq);
    return 0;
}

int session_end(String session)
{
    // If any Luminaire components remain in "change" state at the end of session, revert to previous state
    if(current_state == "change" || current_rgbw_state == "change")
    {
        revert_state(last_state, last_rgbw_state);
    }
    return 0;
}


int revert_state(String ls, String lrgbws)
{
    if (ls == "off")        // If last state was off, shut off Luminiaire
    {
        current_state = "off";
        current_rgbw_state = "";
        digitalWrite(red, LOW);
        digitalWrite(green, LOW);
        digitalWrite(blue, LOW);
        digitalWrite(white, LOW);
        return 0;
    }
    else                // If the last state was on, then turn change Luminaire to appropriate color
    {
        if(lrgbws == "r")
        {
            current_state = "on";
            current_rgbw_state = "r";
            digitalWrite(white, LOW);
            digitalWrite(green, LOW);
            digitalWrite(blue, LOW);
            analogWrite(red, 128, freq); 
        }
        else if(lrgbws == "b")
        {
            current_state = "on";
            current_rgbw_state = "b";
            digitalWrite(white, LOW);
            digitalWrite(green, LOW);
            digitalWrite(red, LOW);
            analogWrite(blue, 128, freq); 
        }
        else if(lrgbws == "w")
        {
            current_state = "on";
            current_rgbw_state = "w";
            digitalWrite(red, LOW);
            digitalWrite(green, LOW);
            digitalWrite(blue, LOW);
            analogWrite(white, 128, freq);
        }
        return 0;
    }
}

void loop()
{
}