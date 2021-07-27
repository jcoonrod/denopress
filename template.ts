export function template(site: string, menu: string, content: string){ 
    return `<!DOCTYPE html>
<html lang=en>
    <head>
        <title>${site}</title>
        <link rel=stylesheet type="text/css" href=/static/block-libary.css>
        <link rel=stylesheet type="text/css" href=/static/style.css>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, height=device-height, initial-scale=1.0, minimum-scale=1.0">
        <meta name="description" content="Re-creating WordPress in JavaScript and Deno.">
    </head>
    <body>
        <a href=/><h1>${site} </h1></a>
        <nav id="menu-primary" role="navigation"><ul>${menu}</ul></nav>
        ${content}
    </body>
</html>`;
}
