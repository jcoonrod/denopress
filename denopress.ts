// Complete refactoring for Medium article Part 3
import {template} from "./template.ts"; 
async function handle(conn: Deno.Conn) {
  const httpConn = Deno.serveHttp(conn);
  for await (const requestEvent of httpConn) {
    const url = new URL(requestEvent.request.url);
    const p=url.pathname;
    const mime=String(mimetypes[p.substr(p.lastIndexOf('.')+1)]);
    console.log(`path: ${p}`);
    // do we serve a file or generate a dynamic page?
    if(p=='/favicon.ico' || p=='/robots.txt' || p.substr(0,7)=='/static') {
      try {
        await Deno.stat("."+p);
        const buf=await Deno.readFile("."+p);
        await requestEvent.respondWith(
          new Response(buf,{status:200, headers:{"Content-type":mime}});
      } catch(error) {
        await requestEvent.respondWith({status:404});
      }
    }else{
      const hello=template(p);
      await requestEvent.respondWith(
        new Response(hello, {status: 200, headers:{"Content-type":"text/html" } })
      );  
    } 
  }
}
const mimetypes: Record<string,string>={'svg':'image/svg+xml','jpg':'image/jpeg','png':'image/png','txt':'text/plain','css':'text/css','jpeg':'image/jpeg'};
const server = Deno.listen({ port: 8080 });
for await (const conn of server) {handle(conn);}
