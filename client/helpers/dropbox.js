var Dropbox = require('dropbox')

export default function saveToDropbox(filename, content, cb){
    var accessToken = localStorage.getItem("dbAccessToken")
           if(accessToken){
               upload(filename, content, accessToken, cb)
            } else {
                var dbx = new Dropbox({ clientId: "p470qv1bf5gpuot" });
                var authUrl = dbx.getAuthenticationUrl(process.env.NODE_ENV == "production" ? 'https://750w.surge.sh' : 'http://localhost:3000');
                oauthpopup({
                    path: authUrl,
                    callback: function(accessToken){   
                        localStorage.setItem("dbAccessToken",accessToken)
                        upload(filename, content, accessToken, cb)
                    }
                })
            } 
}

function upload(filename, content, accessToken, cb){
    var dbxx = new Dropbox({ accessToken });
    dbxx.filesUpload({contents : content, mute : false, autorename : true, mode : {'.tag':'overwrite'}, path:"/"+filename})
        .then(()=> cb && cb() )
        .catch((err)=>console.log(err))
}

// opening a oauth popup and setting up a window function to callback

function oauthpopup(options)
{
    options.windowName = options.windowName ||  'ConnectWithOAuth'; // should not include space for IE
    options.windowOptions = options.windowOptions || 'location=0,status=0,width=800,height=400';
    options.callback = options.callback || function(){ window.location.reload(); };
    var _oauthWindow = window.open(options.path, options.windowName, options.windowOptions);
    window.onAuth = function(args){
        options.callback(args.access_token)
    }
};

// Function to triger on loading if the page is a popup of another one for oauth flow

if(window.opener) {
    window.opener.onAuth(getUrlVars())
    window.close();
}

// parsing url vars sent by Dropbox

function getUrlVars()
{
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('#') + 1).split('&');
    for(var i = 0; i < hashes.length; i++)
    {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }
    return vars;
}