// import webserver and mysql driver
//import { serve } from "https://deno.land/std@0.97.0/http/server.ts";
const server = Deno.listen({ port: 8000 });
import { Client } from "https://deno.land/x/mysql/mod.ts";
const db = await new Client().connect({
  hostname: "127.0.0.1",
    username: Deno.env.get('WPU'),
  db: "wordpress",
  password: Deno.env.get('WPP'),
});

// Get the basic name settings of this website
let sitename = "DenoPress";
let sitedescription="Just another DenoPress Site";
let postname='Hello World';
let content='Nothing here'; 

const options = await db.query("select * from wp_options");
let i=0;
for (i=0; i<options.length; i++) {
    let key=options[i].option_name;
    let value=options[i].option_value;
    if(key=="blogname") sitename=value;
    if(key=="blogdescription") sitedescription=value;
}

// Now format and output the home page
console.log("http://localhost:8000/");
const header=`<html lang='en'>
<head><title>${sitename}</title>
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name = "Description" content = "My first database app">
<title>${sitename}</title>
<style>* {font-family:sans-serif;}</style>
</head>
<body>
<h1>${sitename}</h1>
<h2>${sitedescription}</h2>`;
const footer=`<hr>Proudly served by DemoPress</body></html>`;

for await (const conn of server) {
  (async () => {
    const httpConn = Deno.serveHttp(conn);
    for await (const requestEvent of httpConn) {
      const url = new URL(requestEvent.request.url);
      await requestEvent.respondWith(new Response(header+url.path+footer));
      console.log(`path: ${url.path}`);
    }
  })();
}
