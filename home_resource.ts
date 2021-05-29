import { Drash } from "https://deno.land/x/drash@v1.4.4/mod.ts";
 
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
          <h1>Here is the san-serif title!</h1>
        </body>
      </html>`;
 
    return this.response;
  }
}