#!/usr/bin/env python3
"""
Generate PWA app icons (pure Python, no dependencies).

Draws a "wheel of balance" — a segmented wheel with spokes and a hub — on a dark
rounded tile. Outputs icon-192.png, icon-512.png, icon-180.png (apple-touch).

    python3 generate_icons.py [out_dir]     # default: ./icons
"""
import os, sys, math, zlib, struct

OUT = sys.argv[1] if len(sys.argv) > 1 else "icons"
os.makedirs(OUT, exist_ok=True)

RADIUS = 0.16            # rounded-corner radius of the tile (normalized)
WHEEL_R = 0.40           # wheel radius (normalized, in ±0.5 space)
HUB_R = 0.075            # inner hub radius
RIM = 0.022             # outer white rim thickness
GAP = 0.055             # spoke gap (fraction of one segment)
N = 8                    # segments

# 8 harmonious life-area colours
PALETTE = [(6, 182, 212), (20, 184, 166), (34, 197, 94), (132, 204, 22),
           (245, 158, 11), (249, 115, 22), (168, 85, 247), (59, 130, 246)]
DARK = (15, 15, 19)


def _lerp(a, b, t):
    return int(round(a + (b - a) * t))


def pixel(nx, ny):
    # rounded-corner mask → transparent outside the squircle
    cx = min(nx, 1 - nx)
    cy = min(ny, 1 - ny)
    if cx < RADIUS and cy < RADIUS:
        dx, dy = RADIUS - cx, RADIUS - cy
        if dx * dx + dy * dy > RADIUS * RADIUS:
            return (0, 0, 0, 0)

    dx, dy = nx - 0.5, ny - 0.5
    rr = math.hypot(dx, dy)

    if rr <= WHEEL_R:
        if rr < HUB_R:
            return (255, 255, 255, 255)                       # white hub
        if rr > WHEEL_R - RIM:
            return (236, 236, 245, 255)                       # outer rim
        ang = (math.atan2(dy, dx) + math.pi) / (2 * math.pi)  # 0..1
        pos = ang * N
        frac = pos % 1
        if frac < GAP or frac > 1 - GAP:                      # spoke gap
            return (18, 18, 26, 255)
        seg = int(pos) % N
        c = PALETTE[seg]
        # subtle radial shade: brighter toward the rim
        t = (rr - HUB_R) / (WHEEL_R - HUB_R)
        return (_lerp(int(c[0] * 0.7), c[0], t),
                _lerp(int(c[1] * 0.7), c[1], t),
                _lerp(int(c[2] * 0.7), c[2], t), 255)

    # dark radial-gradient background
    g = min(rr / 0.72, 1.0)
    return (_lerp(26, DARK[0], g), _lerp(26, DARK[1], g), _lerp(38, DARK[2], g), 255)


def _chunk(typ, data):
    return (struct.pack(">I", len(data)) + typ + data
            + struct.pack(">I", zlib.crc32(typ + data) & 0xffffffff))


def write_png(path, size):
    raw = bytearray()
    for y in range(size):
        raw.append(0)
        ny = (y + 0.5) / size
        for x in range(size):
            raw += bytes(pixel((x + 0.5) / size, ny))
    sig = b"\x89PNG\r\n\x1a\n"
    ihdr = struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)
    idat = zlib.compress(bytes(raw), 9)
    with open(path, "wb") as f:
        f.write(sig + _chunk(b"IHDR", ihdr) + _chunk(b"IDAT", idat) + _chunk(b"IEND", b""))
    print("  wrote", path, f"({size}px, {os.path.getsize(path)} B)")


for name, size in (("icon-192.png", 192), ("icon-512.png", 512), ("icon-180.png", 180)):
    write_png(os.path.join(OUT, name), size)
print("Done.")
