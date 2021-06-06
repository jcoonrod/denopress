import { Drash } from "https://deno.land/x/drash@v1.4.4/mod.ts";
 
import HomeResource from "./home_resource.ts";
 
const server = new Drash.Http.Server({
  directory: "/home/johncoonrod/denopress",
  resources: [HomeResource],
  response_output: "text/html",
  static_paths: ["/static","/wp-content"]
});
 
server.run({
  hostname: "localhost",
  port: 8000
});