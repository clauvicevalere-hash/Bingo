from PIL import Image, ImageChops

SRC = "public/brand/logo-source.png"
OUT = "public/brand"

img = Image.open(SRC).convert("RGB")

# retirer la bordure blanche autour du logo
bg = Image.new("RGB", img.size, (255, 255, 255))
diff = ImageChops.difference(img, bg)
bbox = diff.getbbox()
if bbox:
    pad = 12
    bbox = (
        max(0, bbox[0] - pad),
        max(0, bbox[1] - pad),
        min(img.width, bbox[2] + pad),
        min(img.height, bbox[3] + pad),
    )
    img = img.crop(bbox)

img.save(f"{OUT}/logo.png")
print("logo:", img.size)


def square(size, ratio, name, background=(255, 255, 255)):
    canvas = Image.new("RGB", (size, size), background)
    inner = int(size * ratio)
    logo = img.copy()
    logo.thumbnail((inner, inner), Image.LANCZOS)
    canvas.paste(logo, ((size - logo.width) // 2, (size - logo.height) // 2))
    canvas.save(f"{OUT}/{name}")
    print(name, size)


square(192, 0.78, "icon-192.png")
square(512, 0.78, "icon-512.png")
square(512, 0.62, "maskable-512.png")
square(180, 0.80, "apple-icon.png")
square(256, 0.80, "icon.png")
square(64, 0.82, "favicon-64.png")

# favicon ico multi-taille
ico = Image.new("RGB", (64, 64), (255, 255, 255))
logo = img.copy()
logo.thumbnail((54, 54), Image.LANCZOS)
ico.paste(logo, ((64 - logo.width) // 2, (64 - logo.height) // 2))
ico.save(f"{OUT}/favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
print("favicon.ico")
