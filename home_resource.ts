import { Drash } from "https://deno.land/x/drash@v1.4.4/mod.ts";
import { Client } from "https://deno.land/x/mysql@v2.9.0/mod.ts";

// Function to strip tags out of post content when listing latest posts
function removeTags(str:string) {
  if ((str===null) || (str===''))
  return '';
  else
  str = str.toString();
  return str.replace( /(<([^>]+)>)/ig, '');
}

// pull in the basics of the wordpress site

const db = await new Client().connect({
  hostname: "127.0.0.1",
    username: Deno.env.get('WPU'),
    db: "wordpress",
  password: Deno.env.get('WPP'),
});
let sitename='Drash';
let postsPerPage=0;
let pageForPosts=0;
var key:string;
const options = await db.query("select * from wp_options");
let i=0;
for (i=0; i<options.length; i++) {
  key=options[i].option_name;
  if(key=='blogname') sitename=options[i].option_value;
  else if(key=='posts_per_page') postsPerPage=options[i].option_value;
  else if(key=='page_for_posts') pageForPosts=options[i].option_value;
}

console.log(postsPerPage,pageForPosts);

// pull in the menu items and links
const query = `select a.ID as id,a.post_title as title,b.post_title as alt, b.post_name as plink, c.meta_value as link,d.meta_value as parent,a.menu_order as ord
 from wp_posts a, wp_posts b, wp_postmeta c, wp_postmeta d, wp_term_relationships e 
 where a.ID=e.object_id and term_taxonomy_id=895 and c.post_id=a.ID and a.post_type='nav_menu_item' and c.meta_key='_menu_item_object_id' and b.ID=c.meta_value and d.post_id=a.ID and d.meta_key='_menu_item_menu_item_parent' 
 order by ord`
const menus = await db.query(query);
console.log("pulled",menus.length);
var menu=""; // the html
var level=0; // how many levels are we in?
// var v="&#9660;";
// pull in everything we need for the menu

for(i=0;i<menus.length;i++) {
  if(menus[i].parent==0 && i>1) { menu+="</ul></li>\n"; level=0;}
  menu+="<li><a href=/"+menus[i].plink+">";  
  if(menus[i].title) {menu+=menus[i].title} else {menu+=menus[i].alt}
  menu+="</a>\n";
  if(menus[i].parent==0) { menu+="<ul class='dropdown'>\n"; level=1;} else {menu+="</li>\n";}
}
if(level==1) menu+="</ul></li>\n";

export default class HomeResource extends Drash.Http.Resource {
  
  static paths = ["/:p?/:q?"];
  public async GET() {
    var posts; // array of objects from query
    var post:string[]; // a single array of strings of the posts array of objects
    var content="";
    var contents=["Title","Body"];
    var feature='';
    var query="";

    // the first bit of the queries for one post or list of posts
    var postquery=`select a.post_title,a.post_content,c.guid, a.post_name, a.post_date,a.post_excerpt
    from wp_posts a right outer join wp_postmeta b on a.ID=b.post_id and b.meta_key='_thumbnail_id' 
    right outer join wp_posts c on c.ID=b.meta_value`

    const param = this.request.getPathParam("p");
    const param2 = this.request.getPathParam("q");
    console.log(param,param2)

// ROUTINE: We have gpit options for routing;
// With null path we list the categories as links
// With category we list the 10 recent posts
// With admin we fire up tinymce
// With anything else, we treat it as a singe post_name
// The second two pull in the same information

// First option - listing of all categories as links
if(!param) {
  query="select name, slug from wp_terms a, wp_term_taxonomy b where a.term_id=b.term_id and taxonomy='category' order by 1";
  posts=await db.query(query);
  contents[0]="Click on a category of posts";
  for(i=0;i<posts.length;i++) {
    post=Object.values(posts[i]);
    content+="<p><a href=/category/"+post[1]+">"+post[0]+"</a></p>\n";
  }
  contents[1]=content;
}else if (param=="category"){
  // Second option - list up to 10 recent posts in that category
  query=postquery+` join wp_term_relationships e on a.ID=e.object_id 
  join wp_terms f on e.term_taxonomy_id=f.term_id and f.name='${param2}' order by 3 desc limit 10`
  posts=await db.query(query);

  contents[0]=`Posts in category ${param2}`;
  for(i=0;i<posts.length;i++) {
    post=Object.values(posts[i]);
    feature=post[2].replace('localhost:8080','localhost:8000');
    const pdate=post[4];
    if(feature) feature='<img src='+feature+" height=150 width=auto align=left>\n";
    content+="<div>"+feature+"<h3><a href=/"+post[3]+">"+post[0]+"</a> - "+pdate+"</h3>\n"; // name, title, dat
    if(post[5]) {content+=`<p>${post[5]}</p>`;}
    else {content+="<p>"+removeTags(post[1]).substring(0,200)+"</p>"}
  }
  feature='';
  contents[1]=content+"</div>\n";
}else if(param=='admin') {
  feature="<p>Nothing to see here</p>\n";
  contents[0]="Create a new post";
  contents[1]="(Editor will appear here!)";
}else{
  // this is the one that displays a single page
    query=postquery+` where a.post_name="${param}"`;
    posts=await db.query(query);
    post=Object.values(posts[0]);
    content=post[1];
    content=content.replaceAll("https://mcld.org","");
    content=content.replaceAll("http://localhost:8080","");
    feature=post[2].replace('localhost:8080','localhost:8000');
    if(feature) feature='<img class=fit src='+feature+">\n";
    contents=[post[0],content]
  } 
    this.response.body = `<!DOCTYPE html>
      <html lang=en>
        <head>
          <meta charset="UTF-8">
          <link rel="icon" type="image/svg" href="/static/favicon.svg"/>
          <title>DenoPress</title>
          <link rel='stylesheet' href='/static/block-library.css' type='text/css' media='all' />
          <link rel='stylesheet' href='/static/style.css' type='text/css' media='all' />
          <meta name="Description" content="Testing a Drash Server - John Coonrod.">
        	<meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body><header class=site-header>
          <div><a href=/><h1>${sitename}</h1></a></div>
          <nav id="menu-primary" role="navigation">
          <ul>
          ${menu}
          </ul>
          </nav>
          <h1 id=hamburger onclick="javascript:document.getElementById('menu-primary').style.display='block'";>☰&nbsp;</h1>
          </header><section class=site-content>
          <hr><h1>${contents[0]}</h1>
          ${feature}
          <p>${contents[1]}</p>
          </section>
        </body>
      </html>`;
 
    return this.response;
  }
}