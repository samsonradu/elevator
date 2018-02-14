var Consolify = {
  consolify: function(el){
    var oLog = console.log;
    var oWarn = console.warn;
    var oErr = console.error;

    console.log = console.info = function(message){
      if (oLog)
        oLog.call(console, message);
      write(message, el, "info");
    };
 
    console.warn = function(message){
      if (oWarn)
        oWarn.call(console, message);
      write(message, el, "warn");
    };

    console.error = function(message){
      if (oErr)
        oErr.call(console, message);
      write(message, el, "error");
    };

    var write = function (message, el, type){ 
      if (typeof message == 'object') {
        el.innerHTML += '<span class="console console-' + type + '">' + (JSON && JSON.stringify ? JSON.stringify(message) : message) + '</span><br />';
      } else {
        el.innerHTML += '<span class="console console-' + type + '">' + message + '</span><br />';
      }
    } 
  }
}
