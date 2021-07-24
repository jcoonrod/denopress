import { Drash } from "https://deno.land/x/drash@v1.5.0/mod.ts";
import { Client } from "https://deno.land/x/mysql@v2.9.0/mod.ts";
// pages has all the functions for formatting the outputs
import { head, home, category, edit, page} from "./pages.ts";

// pull in the name of the wordpress site
const db = await new Client().connect({hostname: "127.0.0.1",username: Deno.env.get('WPU'),
    db: "wordpress",password: Deno.env.get('WPP'),});
let key="";
let sitename="";
const options = await db.query("select * from wp_options");
let i=0;
for (i=0; i<options.length; i++) {
  key=options[i].option_name;
  if(key=='blogname') sitename=options[i].option_value;
}

// pull in the menu items and links
// This just happens on initial server startup
let query = `select a.ID as id,a.post_title as title,b.post_title as alt, b.post_name as plink, c.meta_value as link,d.meta_value as parent,a.menu_order as ord
 from wp_posts a, wp_posts b, wp_postmeta c, wp_postmeta d, wp_term_relationships e 
 where a.ID=e.object_id and term_taxonomy_id=895 and c.post_id=a.ID and a.post_type='nav_menu_item' and c.meta_key='_menu_item_object_id' and b.ID=c.meta_value and d.post_id=a.ID and d.meta_key='_menu_item_menu_item_parent' 
 order by ord`
const menus = await db.query(query);
let menu=""; // this is the actual html menu code
let level=0; // how far are we in
for(i=0;i<menus.length;i++) {
  if(menus[i].parent==0 && i>1) { menu+="</ul></li>\n"; level=0;}
  menu+="<li><a href=/"+menus[i].plink+">";  
  if(menus[i].title) {menu+=menus[i].title} else {menu+=menus[i].alt}
  menu+="</a>\n";
  if(menus[i].parent==0) { menu+="<ul class='dropdown'>\n"; level=1;} else {menu+="</li>\n";}
}
if(level==1) menu+="</ul></li>\n";
const myhead=head();

let content="";

// Functions for the four kinds of outputs
// Home page simply lists the categories as links
  query="select name, slug from wp_terms a, wp_term_taxonomy b where a.term_id=b.term_id and taxonomy='category' order by 1";
  const posts=await db.query(query);
"";
  for(i=0;i<posts.length;i++) {
    const post=Object.values(posts[i]);
    content+="<p><a href=/category/"+post[1]+">"+post[0]+"</a></p>\n";
  }
  return head+`<header class=site-header>
    <div><a href=/><h1>${sitename}</h1></a></div>
    <nav id="menu-primary" role="navigation"><ul>${menu}</ul></nav>
    <h1 id=hamburger onclick="javascript:document.getElementById('menu-primary').style.display='block'";>☰&nbsp;</h1>
    </header>
    <section class=site-content><hr><h1>Click on a category of posts</h1><p>${content}</p>
    </section></body></html>`;

/*
// Function to strip tags out of post content when listing latest posts
function removeTags(str:string) {
  if ((str===null) || (str===''))
  return '';
  else
  str = str.toString();
  return str.replace( /(<([^>]+)>)/ig, '');
}
*/


export default class HomeResource extends Drash.Http.Resource {
  
  static paths = ["/:p?/:q?"];
  public async GET() {
    var posts; // array of objects from query
    var post:string[]; // a single array of strings of the posts array of objects
    var content="";
    var query="";

    // the first bit of the queries for one post or list of posts
    var postquery=`select a.post_title,a.post_content,c.guid, a.post_name, a.post_date,a.post_excerpt
    from wp_posts a right outer join wp_postmeta b on a.ID=b.post_id and b.meta_key='_thumbnail_id' 
    right outer join wp_posts c on c.ID=b.meta_value`

    const param = this.request.getPathParam("p");
    const param2 = this.request.getPathParam("q");
    console.log(param,param2)

// ROUTING: We have four options for routing;

// First option - listing of all categories as links
if(!param) {
  this.response.body=await home();
// Second - list all the posts in the category
}else if (param=="category"){
  this.response.body=await category();
}else if(param=='edit') {
  this.response.body = await edit();
}else{
    this.response.body = await page();
  } 
  }
}