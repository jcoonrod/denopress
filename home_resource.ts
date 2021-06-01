import { Drash } from "https://deno.land/x/drash@v1.4.4/mod.ts";
import { Client } from "https://deno.land/x/mysql/mod.ts";


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
var select = "select post_title,meta_value,menu_order from wp_posts a,wp_postmeta b ";
var where ="where post_id=ID and post_type='nav_menu_item' and meta_key='_menu_item_object_id'";
const menus = await db.query(select+where);
var menutable="";
var link="";
var contents="";
var post;
for(i=0;i<menus.length;i++) {
  link=menus[i].meta_value;
  menutable += "<tr><td>"+menus[i].post_title+"</td><td><a href="+link+">"+link+"</a></td><td>"+menus[i].menu_order+"</td></tr>\n";
}

export default class HomeResource extends Drash.Http.Resource {
  
  static paths = ["/:p?"];
 
  public async GET() {
    const param = this.request.getPathParam("p");
    if(param) {
      post=await db.query("select post_content from wp_posts where ID="+param);
      contents=post.post_content;
    }
   
    this.response.body = `<!DOCTYPE html>
      <html lang=en>
        <head>
            <link rel="icon" type="image/svg" href="/static/favicon.svg"/>
            <title>DenoPress</title>
            <link href="/static/style.css" rel="stylesheet">
            <meta name="Description" content="Testing a Drash Server - John Coonrod.">
        	<meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body>
          <h1>${sitename}</h1>
          <h2>${sitedescription}</h2>
          <p>Param: ${param}</p>
          <p>${select}${where} returned: ${menus.length}</p>
          <table border>${menutable}</table>
          <p>${post.post_content}</p>
        </body>
      </html>`;
 
    return this.response;
  }
}