import { Drash } from "https://deno.land/x/drash@v1.4.4/mod.ts";
import { Client } from "https://deno.land/x/mysql@v2.9.0/mod.ts";


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

// pull in the menu items and links - an initially overly simple menu
const query = `select a.ID as id,a.post_title as title,b.post_title as alt, b.post_name as plink, c.meta_value as link,d.meta_value as parent,a.menu_order as ord
 from wp_posts a, wp_posts b, wp_postmeta c, wp_postmeta d, wp_term_relationships e 
 where a.ID=e.object_id and term_taxonomy_id=895 and c.post_id=a.ID and a.post_type='nav_menu_item' and c.meta_key='_menu_item_object_id' and b.ID=c.meta_value and d.post_id=a.ID and d.meta_key='_menu_item_menu_item_parent'
 order by ord`;
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
    var post;
    var contents=["Title","Body"];
    var content=""; // page content;
    var feature='';
    const param = this.request.getPathParam("p");
    const param2 = this.request.getPathParam("q");
    console.log(param,param2)

    const select=`select a.post_title,a.post_content,c.guid
    from wp_posts a right outer join wp_postmeta b on a.ID=b.post_id and b.meta_key='_thumbnail_id' 
    right outer join wp_posts c on c.ID=b.meta_value`
// determine how to route it
    if(!param) param=pageForPosts;
    if(isNaN(param)) { 
      if(param=='category')}
       

    if(param) {
      const query=
      where a.post_name="${param}" and a.post_type='page'`;
      post=await db.query(query);
      contents=Object.values(post[0]);
      content=contents[1];
      content=content.replaceAll("https://mcld.org","");
      content=content.replaceAll("http://localhost:8080","");
      feature=contents[2].replace('localhost:8080','localhost:8000');
      if(feature) feature='<img class=fit src='+feature+">\n";
    }
   
    this.response.body = `<!DOCTYPE html>
      <html lang=en>
        <head>
          <meta charset="UTF-8">
          <link rel="icon" type="image/svg" href="/static/favicon.svg"/>
          <title>DenoPress</title>
          <link rel='stylesheet' id='wp-block-library-css'  href='https://149360489.v2.pressablecdn.com/wp-includes/css/dist/block-library/style.min.css?ver=5.7.2' type='text/css' media='all' />
          <link rel='stylesheet' href='/static/style.css' type='text/css' media='all' />
          <meta name="Description" content="Testing a Drash Server - John Coonrod.">
        	<meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body><header class=site-header>
          <div><h1>${sitename}</h1></div>
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