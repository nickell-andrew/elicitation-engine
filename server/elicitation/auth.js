var request = require('request-promise');
var StatusCodeError = require('request-promise/errors').StatusCodeError;

var authPath = "/authenticate-access-to-elicitation/";

var AUTH_COOKIE = ".ASPXAUTH";

function authenticateAccessTo(elicitationID, req, res) {  
  var returnURL = req.originalUrl;

  
  var hostname = req.get('host');
  
  console.warn("FIXME: Hack to handle reverse proxy on nearzero.org hosting of elicitation engine");  
  if (hostname === "elicitation-gorilla.azurewebsites.net") {
    hostname = "www.nearzero.org";
  }
  
  var host = req.protocol + '://' + hostname;  
  var url = host + authPath + elicitationID 
    + "?ReturnURL=" + encodeURIComponent(returnURL) 
    + (req.query.login ? "&login=" + encodeURIComponent(req.query.login) : "");
  
  console.log("auth url is: ", url);
  
  // Pass along the auth cookie, the whole point of this excercise...
  var cookieJar = request.jar();
  if (req.cookies[AUTH_COOKIE]) {
    var cookie = request.cookie(AUTH_COOKIE + '=' + req.cookies[AUTH_COOKIE]);
    cookieJar.setCookie(cookie, url);    
  }
  
  return request({
    url: url,
    followRedirect: false,
    jar: cookieJar
  })
  .then(function (body) {
    var authResponse = JSON.parse(body);
    
    console.log("Auth succeeded: ", authResponse);
    
    var personID = parseInt(authResponse.personID)
    if (personID > 0) {
      return authResponse.personID;
    } else {
      throw "You don't have permission to access this elicitation";
    }
  })  
  .catch(StatusCodeError, function (error) {
    if (error.statusCode >= 300 && error.statusCode < 400) {
      console.log("Redirecting to ", error.response.headers.location);
      throw new RedirectToLoginError(error.response.headers.location)
    } else {
      throw error;
    }
  });
}

function RedirectToLoginError(url) {
  this.name = 'RedirectToLogin';
  this.message = 'redirect to login: ' + url;
  this.url = url;

  if (Error.captureStackTrace) {
      Error.captureStackTrace(this);
  }
}
RedirectToLoginError.prototype = Object.create(Error.prototype);
RedirectToLoginError.prototype.constructor = RedirectToLoginError;
authenticateAccessTo.RedirectToLoginError = RedirectToLoginError;

module.exports = authenticateAccessTo;