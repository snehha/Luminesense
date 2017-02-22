var val = "Fist pointing downwards";
var sel = document.getElementById('sel');
var opts = sel.options;
for(var opt, j = 0; opt = opts[j]; j++) {
    if(opt.value == val) {
        sel.selectedIndex = j;
        break;
    }
}