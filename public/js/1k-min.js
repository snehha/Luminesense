function m(d){
    f = d.pageX-c.offsetLeft-n||f;
    e = d.pageY-c.offsetTop-n||e;
    d = s(e,f),t = f * f + e * e;
    t>w&&(f=g*l.cos(d),e=g*l.sin(d),d=s(e,f),t=f*f+e*e);
    //z.textContent=b.style.background=A((d+u)/B,C(t)/g,j.value/D)[3];
    a.putImageData(E,0,0);
    a.font="1em arial";
    a.fillText("\uFFFF",f+n-4,e+n+4);
}
function A(d,e,h){
    var d=6*d,f=~~d,g=d-f,d=h*(1-e),i=h*(1-g*e),e=h*(1-(1-g)*e),j=f%6,f=[h,i,d,d,e,h][j]*o,g=[e,h,h,i,d,d][j]*o,h=[d,d,e,h,h,i][j]*o;
    return[f,g,h,"rgb("+~~f+","+~~g+","+~~h+")"]
}
k = document;
k.c = k.createElement;
b.a = b.appendChild;

   // var width = c.width = c.height = 320,
   //      label = b.a(doc.c("p")),
   //      input = b.a(doc.c("input")),
   //      imageData = a.createImageData(width, width),
   //      pixels = imageData.data,
   //      oneHundred = input.value = input.max = 100,
   //      circleOffset = 10,
   //      diameter = width-circleOffset*2;
   //      radius = diameter / 2;
   //      radiusPlusOffset = radius + circleOffset;
   //      radiusSquared = radius * radius,
   //      two55 = 255,
   //      currentY = oneHundred,
   //      currentX = -currentY,
   //      wheelPixel = circleOffset*4*width+circleOffset*4;



p = c.width = c.height = 400,
    z = b.a(k.c("p")), 
    j = b.a(k.c("input")),
    E = a.createImageData(p,p),
    q = E.data,
    D = j.value = j.max = 100,
    g = 190, 
    n = 200,
    w = g*g,
    o = 255,
    e = D, 
    f = -e,
    r = 16040,
    l = Math,
    u = l.PI,
    B = 2*u,
    C = l.sqrt,
    s = l.atan2;
//b.style.textAlign="center";z.style.font="2em courier";
j.type="range";
for(y=j.min=0;y<p;y++)for(x=0;x<p;x++){
    i=x-g,v=y-g,F=i*i+v*v,i=A((s(v,i)+u)/B,C(F)/g,1);
    q[r++]=i[0];
    q[r++]=i[1];
    q[r++]=i[2];
    q[r++]=F>w?0:o
}
j.onchange=m;
c.onmousedown=k.onmouseup=function(d){
    k.onmousemove=/p/.test(d.type)?0:(m(d),m)
};
m(0)