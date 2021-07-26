// Complete refactoring for Medium article Part 3 based on DenoServer instead of Drash
import { Client } from "https://deno.land/x/mysql@v2.9.0/mod.ts";
import {template} from "./template.ts"; 
var content=""; // the heart of each page


// connect to the database
const db = await new Client().connect({hostname: "127.0.0.1",username: Deno.env.get('WPU'),
    db: "wordpress",password: Deno.env.get('WPP'),});
const sitename= await basics();
const menu = await makeMenu();

// I cannot figure out how to pass the database as a parameter
// so for now I'll put the functions here to deal with them as a global

// Function to strip tags out of post content when listing latest posts
function removeTags(str:string) {
  if ((str===null) || (str===''))
  return '';
  else
  str = str.toString();
  return str.replace( /(<([^>]+)>)/ig, '');
}

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

// Get the sitename (and eventually also the site logo)
async function basics() {
  const options = await db.query("select * from wp_options");
  let site="DenoPress"; // default responose
  let i=0; 
  let key="";
  for (i=0; i<options.length; i++) {
    key=options[i].option_name;
    if(key=='blogname') site=options[i].option_value;
  }
  return site;
}

// format a simple home page based on links to all the categories
async function home(){
  let s="<h1>Click on a category below to see posts.</h1>\n"; // string to build the html
  const query="select name, slug from wp_terms a, wp_term_taxonomy b where a.term_id=b.term_id and taxonomy='category' order by 1";
  const posts=await db.query(query);
  for(let i=0;i<posts.length;i++) {
    const post=Object.values(posts[i]);
    s+="<p><a href=/category/"+post[1]+">"+post[0]+"</a></p>\n";
  }
  return s;
}

async function category(param2:string){ 
  let s=`<h1>Recent Posts in Category ${param2}</h1>
  `;
  const query=`select a.post_title,a.post_content,c.guid, a.post_name, a.post_date,a.post_excerpt
  from wp_posts a right outer join wp_postmeta b on a.ID=b.post_id and b.meta_key='_thumbnail_id' 
  right outer join wp_posts c on c.ID=b.meta_value
  join wp_term_relationships e on a.ID=e.object_id
  join wp_terms f on e.term_taxonomy_id=f.term_id and f.name='${param2}' order by 3 desc limit 10`;
  const posts=await db.query(query);
  for(let i=0;i<posts.length;i++) {
    const post=Object.values(posts[i]);
    const feature=String(post[2]).replace('localhost:8080','localhost:8000');
    const pdate=post[4];
    if(feature) s+='<img src='+feature+" height=150 width=auto align=left>\n";
    s+="<div>"+feature+"<h3><a href=/"+post[3]+">"+post[0]+"</a> - "+pdate+"</h3>\n"; // name, title, dat
    if(post[5]) {s+=`<p>${post[5]}</p>`;}
    else {s+="<p>"+removeTags(String(post[1])).substring(0,200)+"</p>"}
  }
  return s+"</div>\n";
}
function edit(){ return "edit";}

async function page(param:string){
  let s="";
  // this is the one that displays a single page
  const query=`select a.post_title,a.post_content,c.guid, a.post_name, a.post_date,a.post_excerpt
  from wp_posts a right outer join wp_postmeta b on a.ID=b.post_id and b.meta_key='_thumbnail_id' 
  right outer join wp_posts c on c.ID=b.meta_value where a.post_name="${param}"`;
  console.log(query);
  const posts=await db.query(query);
  if(posts.length) {
    const post=Object.values(posts[0]);
    s=String(post[1]);
    s=s.replaceAll("https://mcld.org","");
    s=s.replaceAll("http://localhost:8080","");
    const feature=String(post[2]).replace('localhost:8080','localhost:8000');
    if(feature) s+='<img class=fit src='+feature+">\n";
  }
  return s;
}

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
      // OK! Here is the main router for four types of pages
      if(p=='/') {
        content=await home();
      }else if (p.substr(0,9)=='/category') {
        content=await category(p.substr(10)); // pass everything beyond category as param2
      }else if (p.substr(0,5)=='/edit') {
        content=edit();
      }else {
        content=await page(p.substr(1));
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
