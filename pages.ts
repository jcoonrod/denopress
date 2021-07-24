// these are the basic routines for formatting each page type

// Standard header for all normal pages
function head() {

return `<!DOCTYPE html>
<html lang=en>
  <head>
    <meta charset="UTF-8">
    <link rel="icon" type="image/svg" href="/static/favicon.svg"/>
    <title>DenoPress</title>
    <link rel='stylesheet' href='/static/block-library.css' type='text/css' media='all' />
    <link rel='stylesheet' href='/static/style.css' type='text/css' media='all' />
    <meta name="Description" content="DenoPress - John Coonrod.">
    <meta name="viewport" content="width=device-width, initial-scale=1">
  </head>
  <body>
  `;
}

async function home() {
    return await "here is the home page!";
}

async function category() {
/*  // Second option - list up to 10 recent posts in that category
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
  this.response.body = 
*/
    return await "here are all the pages in a category";
}
async function edit() {
    return "here is the editor";
}
async function page() {
/*
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

*/


    return await "here is the specified page";
}
