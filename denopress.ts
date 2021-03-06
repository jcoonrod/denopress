// deno-lint-ignore-file no-control-regex
// Complete refactoring for Medium article Part 3 based on DenoServer instead of Drash
import { Client } from "https://deno.land/x/mysql@v2.10.0/mod.ts";
import {template} from "./template.ts"; 
//const content_prefix=Deno.env.get('WPC'); // url prefix to wp-contents
var content=""; // the heart of each page
var post:FormData;

// connect to the database
const db = await new Client().connect({hostname: Deno.env.get('WPH'),username: Deno.env.get('WPU'),
    db: Deno.env.get('WPD'),password: Deno.env.get('WPP'),});
const sitename= await basics();
const menu = await makeMenu();


// Function to strip tags out of post content when listing latest posts

// The mysql package should really include this - I'll ping them about it
function sanitize(str:string) {
  return str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, function (char) {
      switch (char) {
          case "\0":
              return "\\0";
          case "\x08":
              return "\\b";
          case "\x09":
              return "\\t";
          case "\x1a":
              return "\\z";
          case "\n":
              return "\\n";
          case "\r":
              return "\\r";
          case "\"":
          case "'":
          case "\\":
          case "%":
              return "\\"+char; // prepends a backslash to backslash, percent,
                                // and double/single quotes
          default:
              return char;
      }
  });
}
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
// Note - I'm sure this can be made shorter!
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
    const feature=String(post[2]).replace('localhost:8080','mcld.org');
    const pdate=post[4];
    s+=`<div>`;
    if(feature) s+=`<img src=${feature} height=150 width=auto align=left>`;
    s+=`<h3><a href=/${post[3]}>${post[0]}</a> - ${pdate}</h3>
    `; // name, title, dat
    if(post[5]) {s+=`<p>${post[5]}</p>`;}
    else {s+="<p>"+removeTags(String(post[1])).substring(0,200)+"</p>"}
  }
  return s+"</div>\n";
}

function login(){
return `<html>
<body>
<main class=container>
<form class=loginform method=post>
<p><input name=user placeholder="User name"></p>
<p><input name=pwd type=password placeholder="Password"></p>
<p><input type=submit value=Login></p>
</form>
</main>
</body>
</html>`;
}

async function edit(param2:string){
  login();
  let action="/insert";
  let post=['','',''];
  if(param2.length){
    const query=`select a.id, a.post_title,a.post_content from wp_posts a where a.post_name="${param2}"`;
    const posts=await db.query(query);
    post=Object.values(posts[0]);
    action=`/save/${post[0]}`;
  }
  const s=`
  <script src='https://cdn.tiny.cloud/1/ryfpoyk6399p52296uee8on618wsda0sa5erai7ciotj5cl6/tinymce/5/tinymce.min.js' referrerpolicy="origin"></script>
  <script>
  tinymce.init({
    selector: '#mytextarea'
  });
  </script>
  <form method=post action=${action}>
  <h1>Title: <input name=mytitle value="${post[1]}"></h1> 
  <textarea id=mytextarea name=mytextarea>${post[2]}</textarea>
  <input type=submit>
  </form>`;
  return s;
}

async function save(param2:string,fd:FormData){
  const title=sanitize(String(fd.get('mytitle')));
  const pname=String(title).replace(' ','-').toLowerCase();
  const body=sanitize(String(fd.get('mytextarea')));
  const query=`update wp_posts set post_title="${title}", post_name="${pname}",post_content="${body}" where ID=${param2}`;
  const _result=await db.execute(query);
  return `Updated <a href=/${pname}>${pname}</a>`;

}
async function insert(fd:FormData){
  const title=sanitize(String(fd.get('mytitle')));
  const pname=String(title).replace(' ','-').toLowerCase();
  const body=sanitize(String(fd.get('mytextarea')));
  const query=`insert into wp_posts (post_title,post_name,post_excerpt,post_content_filtered,pinged,to_ping,post_content)`;
  const values=` values ("${title}","${pname}",'','','','',"${body}")`;
  const result=await db.execute(query+values);
  return `Inserted ${pname} as id ${result.lastInsertId}`;
}
// BUG: won't display page without a featured image
async function page(param:string){
  let s="";
  // this is the one that displays a single page
  const query=`select post_title,post_content,ID, post_name, post_date
  from wp_posts where post_name="${param}"`;
  const posts=await db.query(query);
  if(posts.length) {
    const post=Object.values(posts[0]);
    const id=post[2];
    console.log(`Page ${id} ${param}`);
    s=`<h1>${post[0]} <a href=/edit/${param}>&#9998;</a></h1>`; // Post title
    // second query for the featured image
    const fquery=`select c.guid from wp_postmeta b, wp_posts c 
    where b.post_id=${id} and b.meta_key='_thumbnail_id' and c.ID=b.meta_value`;
    const f=await db.query(fquery);
    if(f.length) {
      const feature=new URL(String(f[0].guid)).pathname;
      s+=`<img src="${feature}" class=fit alt="Featured image">`;
    }
    s+=String(post[1]);
    s=s.replaceAll("https://mcld.org","");
    s=s.replaceAll("http://localhost:8080","");
  }
  return s;
}

async function handle(conn: Deno.Conn) {
  const httpConn = Deno.serveHttp(conn);
  for await (const requestEvent of httpConn) {
    const method=requestEvent.request.method;
    if(method=='POST') {
      post=await requestEvent.request.formData(); 
      console.log("With POST "+post.get('mytitle'));
    }
    const url = new URL(requestEvent.request.url);
    const p=url.pathname;
    const mime=String(mimetypes[p.substr(p.lastIndexOf('.')+1)]);
    console.log(`${method} ${p}`);
    // do we serve a file or generate a dynamic page?
    if(p=='/favicon.ico' || p=='/robots.txt' || p.substr(0,7)=='/static' || p.substr(0,11)=='/wp-content') {
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
        content=await edit(p.substr(6));
      }else if (p.substr(0,5)=='/save') {
        content=await save(p.substr(6),post);
      }else if (p.substr(0,7)=='/insert') {
        content=await insert(post);
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
