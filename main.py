import os
import markdown
from fastapi import FastAPI, UploadFile, File, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from google import genai
from google.genai import types
from dotenv import load_dotenv
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from starlette.middleware.base import BaseHTTPMiddleware

load_dotenv()

templates = Jinja2Templates(directory="templates")

RIZZ_KEY = os.getenv("RIZZ_KEY") # dont ask
client = genai.Client(api_key=RIZZ_KEY) if RIZZ_KEY else print("WARNING: API Key missing")

limiter = Limiter(key_func=get_remote_address)
app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        return response

app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://nousint.app", "https://nousintstage.up.railway.app"],
    allow_methods=["*"],
    allow_headers=["*"],    
)

app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def read_index(): return FileResponse("index.html")

@app.get("/red")
async def read_index_red(): return FileResponse("index-red.html")

@app.get("/scan")
async def read_tool(): return FileResponse("templates/scan.html")

@app.get("/catalog")
async def read_catalog(): return FileResponse("templates/catalog.html")

@app.get("/redcatalog")
async def read_red_catalog(): return FileResponse("templates/redcatalog.html")

@app.get("/about")
async def read_about(): return FileResponse("templates/about.html")


def parse_markdown_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        metadata = {}
        md_content = content
        
        if content.startswith('---'):
            parts = content.split('---', 2)
            if len(parts) >= 3:
                for line in parts[1].strip().split('\n'): 
                    if ':' in line:
                        k, v = line.split(':', 1)
                        metadata[k.strip()] = v.strip()
                md_content = parts[2].strip()
        
        return {
            'metadata': metadata, 
            'html': markdown.markdown(md_content, extensions=['extra', 'codehilite'])
        }
    except Exception:
        return None

# cache articles in memory cus no db
def get_all_articles(): 
    articles = []
    if not os.path.exists("articles"): return articles
    
    for filename in os.listdir("articles"):
        if filename.endswith('.md'):
            parsed = parse_markdown_file(f"articles/{filename}")
            if parsed:
                m = parsed['metadata']
                articles.append({
                    'id': filename[:-3],
                    'title': m.get('title', filename[:-3]),
                    'description': m.get('description', ''),
                    'date': m.get('date', ''),
                    'author': m.get('author', 'bellobyte'),
                    'tags': [t.strip() for t in m.get('tags', '').split(',')] if m.get('tags') else []
                })
    return sorted(articles, key=lambda x: x.get('date', ''), reverse=True)

ARTICLE_CACHE = get_all_articles()

@app.get("/articles") 
async def list_articles(request: Request):
    return templates.TemplateResponse("articles.html", {"request": request, "articles": ARTICLE_CACHE})

@app.get("/articles/{article_id}")
async def read_article(request: Request, article_id: str):
    parsed = parse_markdown_file(f"articles/{article_id}.md")
    # if not parsed:
    #     return HTMLResponse("Article not found", status_code=404)
        
    m = parsed['metadata']
    article_data = {
        'id': article_id,
        'title': m.get('title', article_id),
        'description': m.get('description', ''),
        'date': m.get('date', ''),
        'author': m.get('author', 'bellobyte'),
        'tags': [t.strip() for t in m.get('tags', '').split(',')] if m.get('tags') else [],
        'html': parsed['html']
    }
    return templates.TemplateResponse("articleview.html", {"request": request, "article": article_data})


@app.post("/scan")
@limiter.limit("5/minute")
async def scan_post(request: Request, caption: str = Form(""), image: UploadFile = File(None), toggleThreat: bool = Form(False)):
    if image and image.filename:
        image_bytes = await image.read()
    else: None
    
    if toggleThreat:
        persona = "Act as an aggressive threat actor and OSINT expert by mapping out potential habits " \
        "from the user's behavior."  
    else: "Act as a helpful OSINT privacy expert."
    content_parts = [f"{persona} Analyze this caption: '{caption}'."]
    
    if image_bytes:
        content_parts.append(types.Part.from_bytes(data=image_bytes, mime_type=image.content_type))
        content_parts.append("Also analyze the attached image for landmarks, street signs, or PII. Check for metadata too. If you find any PII from the image's metadata or surroundings, include it to let the user know what is exposed.")
        
    content_parts.append("Identify privacy risks and suggest how to fix them: IMPORTANT--Do NOT use markdown, bolding, or headers. Use only plain text.")
    
    response = client.models.generate_content(model="gemini-2.0-flash", contents=content_parts)
    return {"analysis": response.text}

# FOR RAILWAY
if __name__ == "__main__": 
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 5000))) # maybe 8080 later