(function() {

    // Declare constants and variables to help with minification
    // Some of these are inlined (with comments to the side with the actual equation)
    var doc = document;

    doc.c = doc.createElement;
    b.a = b.appendChild;

    var width = c.width = c.height = 320,
        label = b.a(doc.c("p")),
        input = b.a(doc.c("input")),
        imageData = a.createImageData(width, width),
        pixels = imageData.data,
        oneHundred = input.value = input.max = 100,
        circleOffset = 10,
        diameter = width-circleOffset*2;
        radius = diameter / 2;
        radiusPlusOffset = radius + circleOffset;
        radiusSquared = radius * radius,
        two55 = 255,
        currentY = oneHundred,
        currentX = -currentY,
        wheelPixel = circleOffset*4*width+circleOffset*4;

    // Math helpers
    var math = Math,
        PI = math.PI,
        PI2 = PI * 2,
        sqrt = math.sqrt,
        atan2 = math.atan2;

    // Setup DOM properties
    b.style.textAlign="center";
    label.style.font = "2em courier";
    label.id = 'rgbtext';
    label.style.padding = "0 0 15 0";
    input.type = "range";
    input.style.width = "400px";
    input.style.margin = "auto";
    input.style.display = "none";

    // Load color wheel data into memory.
    for (y = input.min = 0; y < width; y++) {
        for (x = 0; x < width; x++) {
            var rx = x - radius,
                ry = y - radius,
                d = rx * rx + ry * ry,
                rgb = hsvToRgb(
                    (atan2(ry, rx) + PI) / PI2,     // Hue
                    sqrt(d) / radius,               // Saturation
                    1                               // Value
                );

            // Print current color, but hide if outside the area of the circle
            pixels[wheelPixel++] = rgb[0];
            pixels[wheelPixel++] = rgb[1];
            pixels[wheelPixel++] = rgb[2];
            pixels[wheelPixel++] = d > radiusSquared ? 0 : two55;
        }
    }

    // Bind Event Handlers
    input.onmousemove = redrawLower;
    var socket = io();

    c.onmousedown = doc.onmouseup = function(e) {
        // Unbind mousemove if this is a mouseup event, or bind mousemove if this a mousedown event
        doc.onmousemove = /p/.test(e.type) ? 0 : (redraw(e), redraw);
    }
    c.ontouchup = c.onmouseup = function(){
        var bulblabel = document.getElementById('light-name-id');
        var bulbID = bulblabel.textContent.substring(5);
        var payload = label.textContent.substring(4,label.textContent.length-1).split(',');
        console.log('HTML to NODE >>>> ' + bulbID + ': ' + payload);
        socket.emit('toggle led', bulbID, payload[0], payload[1], payload[2]);
    }


    // Handle manual calls + mousemove event handler + input change event handler all in one place.
    function redraw(e) {

        // Only process an actual change if it is triggered by the mousemove or mousedown event.
        // Otherwise e.pageX will be undefined, which will cause the result to be NaN, so it will fallback to the current value
        currentX = e.pageX - c.offsetLeft - radiusPlusOffset || currentX;
        currentY = e.pageY - c.offsetTop - radiusPlusOffset  || currentY;

        // Scope these locally so the compiler will minify the names.  Will manually remove the 'var' keyword in the minified version.
        var theta = atan2(currentY, currentX),
            d = currentX * currentX + currentY * currentY;

        // If the x/y is not in the circle, find angle between center and mouse point:
        //   Draw a line at that angle from center with the distance of radius
        //   Use that point on the circumference as the draggable location
        if (d > radiusSquared) {
            currentX = radius * math.cos(theta);
            currentY = radius * math.sin(theta);
            theta = atan2(currentY, currentX);
            d = currentX * currentX + currentY * currentY;
        }

        label.textContent = b.style.background = hsvToRgb(
            (theta + PI) / PI2,         // Current hue (how many degrees along the circle)
            sqrt(d) / radius,           // Current saturation (how close to the middle)
            input.value / oneHundred    // Current value (input type="range" slider value)
        )[3];

        // Reset to color wheel and draw a spot on the current location.
        a.putImageData(imageData, 0, 0);
      //  document.getElementById(bulbClicked).setAttribute('style','fill: '+ label.textContent +';');
        
        button = document.getElementById('light-power');
        if (button.className != "btn btn-success"){
            button.className = "btn btn-success";
            button.innerHTML = "Turn Off";
        }

        // Draw the current spot.
        // I have tried a rectangle, circle, and heart shape.
        /*
        // Rectangle:
        a.fillStyle = '#000';
        a.fillRect(currentX+radiusPlusOffset,currentY+radiusPlusOffset, 6, 6);
        */
        
        // Circle:
        a.beginPath();
        a.strokeStyle = '#000';
        a.arc(~~currentX+radiusPlusOffset,~~currentY+radiusPlusOffset, 4, 0, PI2);
        a.stroke();
        

        // Heart:
        //a.font = "1em arial";
        //a.fillText("\u2B29", 0+radiusPlusOffset-4,0+radiusPlusOffset+4);
    }



    function redrawLower(e) {

        // Scope these locally so the compiler will minify the names.  Will manually remove the 'var' keyword in the minified version.
        var theta = atan2(currentY, currentX),
            d = currentX * currentX + currentY * currentY;

        // If the x/y is not in the circle, find angle between center and mouse point:
        //   Draw a line at that angle from center with the distance of radius
        //   Use that point on the circumference as the draggable location
        if (d > radiusSquared) {
            currentX = radius * math.cos(theta);
            currentY = radius * math.sin(theta);
            theta = atan2(currentY, currentX);
            d = currentX * currentX + currentY * currentY;
        }

        label.textContent = b.style.background = hsvToRgb(
            (theta + PI) / PI2,         // Current hue (how many degrees along the circle)
            sqrt(d) / radius,           // Current saturation (how close to the middle)
            input.value / oneHundred    // Current value (input type="range" slider value)
        )[3];

        // Reset to color wheel and draw a spot on the current location.
        a.putImageData(imageData, 0, 0);
        document.getElementById(bulbClicked).setAttribute('style','fill: '+ label.textContent +';');

        // Draw the current spot.
        // I have tried a rectangle, circle, and heart shape.
        /*
        // Rectangle:
        a.fillStyle = '#000';
        a.fillRect(currentX+radiusPlusOffset,currentY+radiusPlusOffset, 6, 6);
        */
        /*
        // Circle:
        a.beginPath();
        a.strokeStyle = '#000';
        a.arc(~~currentX+radiusPlusOffset,~~currentY+radiusPlusOffset, 4, 0, PI2);
        a.stroke();
        */

        // Heart:
        a.font = "1em arial";
        //a.fillText("\u2B29", currentX+radiusPlusOffset-4,currentY+radiusPlusOffset+4);
        //a.fillText("\u2B29", 0+radiusPlusOffset-4,0+radiusPlusOffset+4);
    }
    // Created a shorter version of the HSV to RGB conversion function in TinyColor
    // https://github.com/bgrins/TinyColor/blob/master/tinycolor.js
    function hsvToRgb(h, s, v) {
        h*=6;
        var i = ~~h,
            f = h - i,
            p = v * (1 - s),
            q = v * (1 - f * s),
            t = v * (1 - (1 - f) * s),
            mod = i % 6,
            r = [v, q, p, p, t, v][mod] * two55,
            g = [t, v, v, q, p, p][mod] * two55,
            b = [p, p, t, v, v, q][mod] * two55;

        return [r, g, b, "rgb("+ ~~r + "," + ~~g + "," + ~~b + ")"];
    }

    function rgb2hsv() {
      var rr, gg, bb,
          r = arguments[0] / 255,
          g = arguments[1] / 255,
          b = arguments[2] / 255,
          h, s,
          v = Math.max(r, g, b),
          diff = v - Math.min(r, g, b),
          diffc = function(c){
              return (v - c) / 6 / diff + 1 / 2;
          };

      if (diff == 0) {
          h = s = 0;
      } else {
          s = diff / v;
          rr = diffc(r);
          gg = diffc(g);
          bb = diffc(b);

          if (r === v) {
              h = bb - gg;
          }else if (g === v) {
              h = (1 / 3) + rr - bb;
          }else if (b === v) {
              h = (2 / 3) + gg - rr;
          }
          if (h < 0) {
              h += 1;
          }else if (h > 1) {
              h -= 1;
          }
      }
      return {
          h: Math.round(h * 360),
          s: Math.round(s * 100),
          v: Math.round(v * 100)
      };
    }


    function rgbHex(hex){
        var myVals = hex.replace(/[rgb()]+/g,'');
        return '#' + myVals.split(',').map(function strToHex(current,index,array){
            return parseInt(current).toString(16);
        }).join('');
    }

    window.addEventListener('load', function(){ // on page load

    c.addEventListener('touchmove', function(e){
        window.blockMenuHeaderScroll = true;
        e.preventDefault();
        redraw(e);
        //alert(e.changedTouches[0].pageX) // alert pageX coordinate of touch point
    }, false)

    }, false)

    window.addEventListener('load', function(){ // on page load

    c.addEventListener('touchup', function(e){
        window.blockMenuHeaderScroll = false;

        //redraw(e);
        //alert(e.changedTouches[0].pageX) // alert pageX coordinate of touch point
    }, false)

    }, false)



    // Kick everything off
    redraw(0);

    /*
    // Just an idea I had to kick everything off with some changing colors…
    // Probably no way to squeeze this into 1k, but it could probably be a lot smaller than this:
    currentX = currentY = 1;
    var interval = setInterval(function() {
        currentX--;
        currentY*=1.05;
        redraw(0)
    }, 7);

    setTimeout(function() {
        clearInterval(interval)
    }, 700)
    */

})();
