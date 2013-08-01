
var http = require("http")
  , https = require("https")
  , url = require("url")
  , path = require("path")
  , fs = require("fs")

  , port = process.argv[2]
  , proxyDomain = process.argv[3]

  ;

if(!port || !proxyDomain){
  // usage
  console.log('USAGE:');
  console.log('cd /my/single/app/root');
  console.log('node /path/to/simple/proxy/sp.js <PORT-TO-SERVE> <DOMAIN-TO-PROXY>');
  process.exit(0);
}

function makeNDigits(str, nb, separator, before){
  separator = separator || ' ';
  if(before) {
    str = ((new Array(nb)).join(separator) + str);
    return str.substr(str.length - nb);
  } else return (str + (new Array(nb)).join(separator)).substr(0,nb);
}

function  getTimeStamp(){
  var now = new Date();
  return (
      now.getUTCFullYear()
    + '-'
    + makeNDigits(now.getUTCMonth(), 2, '0', true)
    + '-'
    + makeNDigits(now.getUTCDate(), 2, '0', true)
    + ' '
    + makeNDigits(now.getUTCHours(), 2, '0', true)
    + '-'
    + makeNDigits(now.getUTCMinutes(), 2, '0', true)
    + '-'
    + makeNDigits(now.getUTCSeconds(), 2, '0', true)
    + '.'
    + makeNDigits(now.getUTCMilliseconds(), 4, '0', true)
  );
}

function logEntry(type, req, res){
  console.log(
      '['+getTimeStamp()+']'            // DATE
    + ' - '
    + makeNDigits(type, 6)              // TYPE
    + ' - '
    + makeNDigits(res.statusCode, 3)    // HTTP STATUS CODE
    + ' - '
    + req.connection.remoteAddress      // IP
    + ' - '
    + req.method+' '+req.url            // URL
  );
}


// static server 
function staticServer(request, response) {
  var uri = url.parse(request.url).pathname
    , filename = path.join(process.cwd(), uri);
  
  fs.exists(filename, function(exists) {
    if(!exists) {
      proxyServer(request, response);
      return;
    }
 
    if (fs.statSync(filename).isDirectory()) filename += '/index.html';
 
    fs.readFile(filename, "binary", function(err, file) {
      if(err) {
        response.writeHead(500, {"Content-Type": "text/plain"});
        response.write(err + "\n");
        response.end();
        logEntry('STATIC', request, response);
        return;
      }

      if(filename.substr(filename.length-4) === '.css'){
        response.writeHead(200, {"Content-Type": "text/css"});
      } else if(filename.substr(filename.length-3) === '.js'){
        response.writeHead(200, {"Content-Type": "text/javascript"});
      } else if(filename.substr(filename.length-5) === '.html'){
        response.writeHead(200, {"Content-Type": "text/html"});
      } else {
        response.writeHead(200);
      }
      response.write(file, "binary");
      response.end();
      logEntry('STATIC', request, response);
    });
  });
}

// static server 
function proxyServer(req,res) {
  var filename = url.parse(req.url).pathname;
  var portForwardedTo = proxyDomain.indexOf(':') === -1 ? '80' : proxyDomain.substr(proxyDomain.indexOf(':')+1);
  var domainForwardedTo = proxyDomain.indexOf(':') === -1 ? proxyDomain : proxyDomain.substr(0, proxyDomain.indexOf(':'));
  var options = {
    hostname: domainForwardedTo,
    port: portForwardedTo,
    path: req.url,
    method: req.method,
    headers: req.headers
  };
  options.headers.host = domainForwardedTo + ':' + portForwardedTo;

  var proxy = (portForwardedTo == '443' ? https : http).request(options, function(proxy_response){

    // parse cookies
    var headers = proxy_response.headers;
    if(headers && headers['set-cookie']){
      headers['set-cookie'].forEach(function(str, index, array){
        array[index] = str.replace(/domain=([^;]+);/, '');
      });
    }

    //send headers as received
    res.writeHead(proxy_response.statusCode, headers);

    //easy data forward
    proxy_response.addListener('data', function(chunk) {
      res.write(chunk, 'binary');
    });

    //response received
    proxy_response.addListener('end', function() {
      res.end();
      logEntry('PROXY', req, res);
    });
  });

  proxy.on('error', function(err) {
    res.writeHead(404, {"Content-Type": "text/plain"});
    res.write("404 Not Found\n");
    res.end();
    logEntry('PROXY', req, res);
    return;
  });
  
  //proxies to SEND request to real server
  req.addListener('data', function(chunk) {
    proxy.write(chunk, 'binary');
  });

  req.addListener('end', function() {
    proxy.end();
  });
}

http.createServer(staticServer).listen(port);

console.log("Static file server running at\n  => http://localhost:" + port + "/\nCTRL + C to shutdown");
