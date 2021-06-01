import { Drash } from "https://deno.land/x/drash@v1.4.4/mod.ts";
import { Client } from "https://deno.land/x/mysql/mod.ts";
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


export default class HomeResource extends Drash.Http.Resource {
  
  
  static paths = ["/"];
 
  public GET() {

    this.response.body = `<!DOCTYPE html>
      <html lang=en>
        <head>
            <link rel="icon" type="image/svg" href="/static/favicon.svg"/>
            <title>Drash</title>
            <link href="/static/style.css" rel="stylesheet">
            <meta name="Description" content="Testing a Drash Server - John Coonrod.">
        	<meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body>
          <h1>${sitename}</h1>
          <h2>${sitedescription}</h2>
        </body>
      </html>`;
 
    return this.response;
  }
}