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
let sitedescription='Nothing yet';
const options = await db.query("select * from wp_options");
let i=0;
for (i=0; i<options.length; i++) {
    if(options[i].option_name=="blogname") sitename=options[i].option_value;
    if(options[i].option_name=="blogdescription") sitedescription=options[i].option_value;
}

// pull in the menu items and links - an initially overly simple menu
const query = `select a.ID as id,a.post_title as title,b.post_title as alt,c.meta_value as link,d.meta_value as parent,a.menu_order as ord
 from wp_posts a, wp_posts b, wp_postmeta c, wp_postmeta d, wp_term_relationships e 
 where a.ID=e.object_id and term_taxonomy_id=895 and c.post_id=a.ID and a.post_type='nav_menu_item' and c.meta_key='_menu_item_object_id' and b.ID=c.meta_value and d.post_id=a.ID and d.meta_key='_menu_item_menu_item_parent'
 order by ord`;
const menus = await db.query(query);
console.log("pulled",menus.length);
var menu=""; // the html
var level=0; // how many levels are we in?
// pull in everything we need for the menu

for(i=0;i<menus.length;i++) {
  if(menus[i].parent==0 && i>1) { menu+="</ul>\n"; level=0;}
  menu+="<li><a href="+menus[i].link+">";  
  if(menus[i].title) {menu+=menus[i].title} else {menu+=menus[i].alt}
  menu+="</a></li>\n";
  if(menus[i].parent==0) { menu+="<ul class='dropdown'>\n"; level=1;}
}
if(level==1) menu+="</ul>\n";

export default class HomeResource extends Drash.Http.Resource {
  
  static paths = ["/:p?"];
  public async GET() {
    var post;
    var contents=["Title","Body"];
    var feature='';
    const param = this.request.getPathParam("p");
    if(param) {
      const query=`select a.post_title,a.post_content,c.guid
      from wp_posts a right outer join wp_postmeta b on a.ID=b.post_id and b.meta_key='_thumbnail_id' 
      right outer join wp_posts c on c.ID=b.meta_value
      where a.ID=${param}`;
      post=await db.query(query);
      contents=Object.values(post[0]);
      feature=contents[2].replace('localhost:8080','localhost:8000');
      if(feature) feature='<img class=fit src='+feature+">\n";
      console.log(post);
      console.log(contents);
    }
   
    this.response.body = `<!DOCTYPE html>
      <html lang=en>
        <head>
          <meta charset="UTF-8">
          <link rel="icon" type="image/svg" href="/static/favicon.svg"/>
          <title>DenoPress</title>
          <link rel='stylesheet' href='/static/style.css' type='text/css' media='all' />
          <meta name="Description" content="Testing a Drash Server - John Coonrod.">
        	<meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body><header class=site-header>
          <div><h1>${sitename} ${sitedescription}</h1></div>
          <nav role="navigation">
          <ul>
          ${menu}
          </ul>
          </nav>
          <h1 id=hamburger>☰&nbsp;</h1>
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