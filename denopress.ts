// Complete refactoring for Medium article Part 3 based on DenoServer instead of Drash
import { Client } from "https://deno.land/x/mysql@v2.9.0/mod.ts";
import {template} from "./template.ts"; 
var content=""; // the heart of each page

// I cannot figure out how to pass the database as a parameter
// so I'll put the functions here to deal with them as a global

// connect to the database
const db = await new Client().connect({hostname: "127.0.0.1",username: Deno.env.get('WPU'),
    db: "wordpress",password: Deno.env.get('WPP'),});
const sitename= await basics();
const menu = await makeMenu();

async function makeMenu() {
  const query = `select a.ID as id,a.post_title as title,b.post_title as alt, b.post_name as plink, c.meta_value as link,d.meta_value as parent,a.menu_order as ord
    from wp_posts a, wp_posts b, wp_postmeta c, wp_postmeta d, wp_term_relationships e 
    where a.ID=e.object_id and term_taxonomy_id=895 and c.post_id=a.ID and a.post_type='nav_menu_item' and c.meta_key='_menu_item_object_id' and b.ID=c.meta_value and d.post_id=a.ID and d.meta_key='_menu_item_menu_item_parent' 
    order by ord`;
  const menus = await db.query(query);
  let s=""; // this string is the actual html menu code
  let level=0; // how far are we in
  for(let i=0;i<menus.length;i++) {
    if(menus[i].parent==0 && i>1) { s+="</ul></li>\n"; level=0;}
    s+="<li><a href=/"+menus[i].plink+">";  
    if(menus[i].title) {s+=menus[i].title} else {s+=menus[i].alt}
    s+="</a>\n";
    if(menus[i].parent==0) { s+="<ul class='dropdown'>\n"; level=1;} else {s+="</li>\n";}
  }
  if(level==1) s+="</ul></li>\n";
  return s;
}

async function basics() {
  const options = await db.query("select * from wp_options");
  let site="DenoPress"; // default responose
  let i=0; 
  let key="";
  for (i=0; i<options.length; i++) {
    key=options[i].option_name;
    if(key=='blogname') site=options[i].option_value;
  }
  console.log(site)
  return site;
}
console.log(sitename);

function home(){ return "home";}
function category(){ return "category";}
function edit(){ return "edit";}
function page(){ return "page";}

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
          new Response(buf,{status:200, headers:{"Content-type":mime}}));
      } catch(_error) {
        await requestEvent.respondWith(
          new Response(page404, {status: 404, headers:{"Content-type":"text/html"}})
        );}
    }else{
      if(p=='/') {
        content=home();
      }else if (p.substr(0,9)=='/category') {
        content=category();
      }else if (p.substr(0,5)=='/edit') {
        content=edit();
      }else {
        content=page();
      }
      const hello=template(sitename, menu, content);
      await requestEvent.respondWith(
        new Response(hello, {status: 200, headers:{"Content-type":"text/html" } })
      );  
    } 
  }
}
const mimetypes: Record<string,string>={'svg':'image/svg+xml','jpg':'image/jpeg','png':'image/png','txt':'text/plain','css':'text/css','jpeg':'image/jpeg'};
const page404='<html><body><h1>Object not found</h1></body></html>';
const server = Deno.listen({ port: 8000 });
for await (const conn of server) {handle(conn);}
