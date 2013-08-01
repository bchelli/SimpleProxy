Simple Proxy
============

Description
-----------
Simple Proxy is a tool that allows you to serve your SPA and proxy any 404 requests<br />
The application will proxy request and cookies for you.

Use cases
---------
- Single page application

        Serve your static content and proxy API call for AJAX calls
        no cross domain, no need to have a back end running on your local environment
        You can switch from staging to prod very easily.

- Debug

        Serve only the static file you want to debug
        create a empty folder and add only the file you want to edit 

Usage
-----
- To start the server on ```/my/single/app/root```

        $ cd /my/single/app/root
        $ node /path/to/simple/proxy/sp.js <PORT-TO-SERVE> <DOMAIN-TO-PROXY>

- You can specify a specific port to proxy: ```DOMAIN-TO-PROXY=www.mydomain.com:443``` by default it will be on port 80
