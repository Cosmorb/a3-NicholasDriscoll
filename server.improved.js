const http = require("http"),
    fs   = require("fs"),
    // IMPORTANT: you must run `npm install` in the directory for this assignment
    // to install the mime library if you're testing this on your local machine.
    // However, Glitch will install it automatically by looking in your package.json
    // file.
    path = require("path"),
    url  = require("url"),
    port = 3000;

// Use Render's port when deployed; 3000 locally.
const PORT = process.env.PORT || port;
// Absolute path to /public for safe static serving.
const PUB  = path.resolve(__dirname, "public");

let items = [];


// rewritten as it was too AI generated/assisted for my liking
// based off this: https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types
// and  this: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Type
// and this: https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Server-side/Node_server_without_framework 
const MIME_TYPES = {
    html: "text/html; charset=UTF-8",
    js: "application/javascript; charset=utf-8",
    css: "text/css; charset=utf-8",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    ico: "image/x-icon",
    svg: "image/svg+xml",
    json: "application/json; charset=utf-8",
    default: "text/plain; charset=utf-8"
};

// rewritten as it was too AI generated/assisted for my liking
function contentType(file) {
    const ext = file.split('.').pop().toLowerCase();
    return MIME_TYPES[ext] || MIME_TYPES.default;
}

// agian rewritten as it was too AI generated/assisted for my liking
// based off this tjis https://expressjs.com/en/4x/api.html#req.path
function cleaner(urlPath) {
    let file = urlPath === "/" ? "/index.html" : urlPath;
    file = path.normalize(file);
    const abs = path.join(PUB, file);
    if (!abs.startsWith(PUB)) return null;
    return abs;
}

// previous code was too AI generated/assisted for my liking, this was what was here previously
// based off this: https://stackoverflow.com/a/45130990
// function Blocker(urlPath) {
//     const p = urlPath === "/" ? "/index.html" : urlPath;
//     const abs = path.resolve(PUB, "." + p);
//     if (!abs.startsWith(PUB)) return null;
//     return abs;
// }



// based off this: https://stackoverflow.com/questions/19696240/proper-way-to-return-json-using-node-or-express
// as it was too AI generated for my liking
function sendJSON(res, code, obj) {
    res.writeHead(code, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify(obj));
}

// rewritten as it was too AI generated for my liking
async function readBody(req) {
    let data = "";
    for await (const incoming of req) {
        data += incoming;
    }
    return data;
}

// based off this: https://developer.mozilla.org/en-US/docs/Learn/Server-side/Node_server_without_framework
// and this: https://nodejs.org/api/http.html 
// and this: https://stackoverflow.com/a/12006679
// based off this: https://developer.mozilla.org/en-US/docs/Learn/Server-side/Node_server_without_framework
// and https://stackoverflow.com/a/12006679
// curentthe only thing that is AI generated/assisted is the overall structure of the server
// I rewrote most of the code as it was too AI generated/assisted for my liking
// I also added comments to explain what each part does
// I also used some code from previous assignments

//thhis establishes the server and listens on the specified port
const Server = http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url, "http://localhost"); 
  if (pathname === "/api/items" && req.method === "GET") {
    return sendJSON(res, 200, items);
  }
//this part handles the API requests
  if (pathname === "/api/items" && req.method === "POST") {
    const raw = await readBody(req);
    let data = {};
    try { data = JSON.parse(raw); } catch {}
    const { name = "", email = "", message = "", priority = "Low" } = data;

    if (!name || !email || !message)
      return sendJSON(res, 400, { error: "YOU FORGOT A FIELD, FILL IT OUT" });

    const slaDays = { High: 1, Mid: 3, Low: 7 };
    const createdAt = new Date();
    const responseBy = new Date(createdAt);
    responseBy.setDate(createdAt.getDate() + (slaDays[priority] || slaDays.Low));

    const row = {
      id: "id-" + Math.random().toString(36).slice(2, 9),
      name, email, message,
      priority,
      createdAt: createdAt.toISOString(),
      responseBy: responseBy.toISOString()
    };

    items.push(row);
    return sendJSON(res, 201, row);
  }
   
  if (pathname.startsWith("/api/items/") && req.method === "DELETE") {
    const rid = pathname.split("/").pop();
    const before = items.length;
    items = items.filter(r => r.id !== rid);
    return sendJSON(res, 200, { removed: before - items.length });
  }

  // this part serves static files
  const filePath = cleaner(pathname);
  if (!filePath) return send(res, 403, "Forbidden", { "Content-Type": "text/plain" });
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      return send(res, 404, "Not Found", { "Content-Type": "text/plain" });
    }

    //this streams the file to the response
    res.writeHead(200, { "Content-Type": contentType(filePath) });
    const stream = fs.createReadStream(filePath);
    stream.on("error", () => {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Server error");
    });
    stream.pipe(res);
  });
});


Server.listen(PORT);