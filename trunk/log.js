var log = function(s) {
  var now = new Date();

  if (s[s.length-1] != '\n') {
    s = s + '\n';
  }

  var l = document.getElementById('log');
  if (! l) {
    l = document.createElement('pre');
    l.id = 'log';
    l.style.backgroundColor = '#ffc';
    l.style.border = 'thin solid black';
    document.body.appendChild(l);
  }
  l.appendChild(document.createTextNode('[@' + now.valueOf() + '] ' + s));
};
