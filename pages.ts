
/*
export async function home(db) {
    return await "here is the home page!";
}

export async function category(db,p) {
  const param2=p.substr(11); // second parameter of path
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
    return await "here are all the pages in a category";
}
export async function edit(db,p) {
    return await  "here is the editor";
}
export async function page(db,p) {
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



    return await "here is the specified page";
}
*/
