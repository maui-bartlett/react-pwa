"""Generate the Avatar Legends balance-label font.

This is an authoring script, not an app build step. It expects fontTools
to be available in whatever one-off Python environment is used to run it,
for example:

    python3 -m venv /tmp/avatar-balance-fonttools
    /tmp/avatar-balance-fonttools/bin/python -m pip install fonttools brotli
    /tmp/avatar-balance-fonttools/bin/python scripts/create-avatar-balance-font.py

The repo commits only the source font, generated TTF/WOFF2 assets, and
this script. No font tooling is added to package.json or Vite.
"""

from pathlib import Path

from fontTools.ttLib.tables._g_l_y_f import GlyphCoordinates
from fontTools.ttLib import TTFont
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.ttGlyphPen import TTGlyphPen


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "src/pages/AvatarLegends/assets/fonts/BebasNeue-Regular.ttf"
TARGET_TTF = ROOT / "src/pages/AvatarLegends/assets/fonts/BebasNeueBalance-Regular.ttf"
TARGET_WOFF2 = ROOT / "src/pages/AvatarLegends/assets/fonts/BebasNeueBalance-Regular.woff2"


def adjust_glyph(font: TTFont, char: str, mutator) -> None:
    glyph_name = font.getBestCmap()[ord(char)]
    glyph = font["glyf"][glyph_name]
    coords, ends, flags = glyph.getCoordinates(font["glyf"])
    mutator(coords)
    glyph.coordinates = coords
    glyph.recalcBounds(font["glyf"])


def replace_simple_glyph(font: TTFont, char: str, points: list[tuple[int, int]]) -> None:
    glyph_name = font.getBestCmap()[ord(char)]
    glyph = font["glyf"][glyph_name]
    glyph.numberOfContours = 1
    glyph.coordinates = GlyphCoordinates(points)
    glyph.endPtsOfContours = [len(points) - 1]
    glyph.flags = bytearray([1] * len(points))
    glyph.program = font["glyf"].glyphs[glyph_name].program.__class__()
    glyph.recalcBounds(font["glyf"])


def replace_with_pen_glyph(font: TTFont, char: str, draw) -> None:
    glyph_name = font.getBestCmap()[ord(char)]
    pen = TTGlyphPen(font.getGlyphSet())
    draw(pen)
    font["glyf"][glyph_name] = pen.glyph()
    font["glyf"][glyph_name].recalcBounds(font["glyf"])


def thicken_glyph(font: TTFont, char: str, shifts: tuple[int, ...] = (-10, 0, 10)) -> None:
    glyph_name = font.getBestCmap()[ord(char)]
    glyph_set = font.getGlyphSet()
    source_glyph = glyph_set[glyph_name]
    pen = TTGlyphPen(glyph_set)
    for shift in shifts:
        source_glyph.draw(TransformPen(pen, (1, 0, 0, 1, shift, 0)))
    font["glyf"][glyph_name] = pen.glyph()
    font["glyf"][glyph_name].recalcBounds(font["glyf"])


def rounded_rect(pen: TTGlyphPen, x0: int, y0: int, x1: int, y1: int, radius: int) -> None:
    radius = min(radius, (x1 - x0) // 2, (y1 - y0) // 2)
    pen.moveTo((x0 + radius, y0))
    pen.lineTo((x1 - radius, y0))
    pen.qCurveTo((x1, y0), (x1, y0 + radius))
    pen.lineTo((x1, y1 - radius))
    pen.qCurveTo((x1, y1), (x1 - radius, y1))
    pen.lineTo((x0 + radius, y1))
    pen.qCurveTo((x0, y1), (x0, y1 - radius))
    pen.lineTo((x0, y0 + radius))
    pen.qCurveTo((x0, y0), (x0 + radius, y0))
    pen.closePath()


def rename_font(font: TTFont) -> None:
    family = "Bebas Neue Balance"
    full = "Bebas Neue Balance Regular"
    postscript = "BebasNeueBalance-Regular"
    replacements = {
        1: family,
        2: "Regular",
        3: f"{postscript};AvatarLegends",
        4: full,
        6: postscript,
        16: family,
        17: "Regular",
    }
    for record in font["name"].names:
        if record.nameID not in replacements:
            continue
        record.string = replacements[record.nameID].encode(
            "utf-16-be" if record.isUnicode() else "latin-1",
            errors="replace",
        )


def main() -> None:
    font = TTFont(SOURCE)
    rename_font(font)

    # The reference labels are condensed and heavy, but their corners are
    # softer and less geometric than stock Bebas Neue. These point edits
    # keep the Bebas rhythm while nudging the distinctive letters used in
    # TRADITION / PROGRESS and other AL principles.
    adjust_glyph(
        font,
        "R",
        lambda c: (
            # More pronounced bowl and angled leg, closer to the reference R.
            c.__setitem__(7, (c[7][0] + 10, c[7][1])),
            c.__setitem__(21, (c[21][0] + 10, c[21][1])),
            # Pull a visible notch where the diagonal leg leaves the bowl.
            c.__setitem__(22, (c[22][0] - 34, c[22][1] + 34)),
            c.__setitem__(23, (c[23][0] - 22, c[23][1] + 10)),
            c.__setitem__(24, (c[24][0] - 8, c[24][1])),
            c.__setitem__(27, (c[27][0] + 4, c[27][1])),
            c.__setitem__(36, (c[36][0] + 4, c[36][1])),
        ),
    )
    replace_with_pen_glyph(
        font,
        "N",
        lambda pen: (
            # Reference-style N: thick legs with a broad diagonal that rises
            # into the upper right leg, so the top notch is tiny and high.
            rounded_rect(pen, 38, 0, 142, 700, 8),
            rounded_rect(pen, 250, 0, 360, 700, 8),
            pen.moveTo((126, 0)),
            pen.lineTo((238, 0)),
            pen.lineTo((350, 700)),
            pen.lineTo((250, 700)),
            pen.closePath(),
        ),
    )
    replace_with_pen_glyph(
        font,
        "C",
        lambda pen: (
            # Reference-style C: heavy rounded left spine, hooked upper
            # terminal, and a blunt lower terminal without a matching hook.
            pen.moveTo((356, 602)),
            pen.qCurveTo((332, 710), (206, 710)),
            pen.lineTo((176, 710)),
            pen.qCurveTo((38, 710), (38, 555)),
            pen.lineTo((38, 145)),
            pen.qCurveTo((38, -10), (176, -10)),
            pen.lineTo((212, -10)),
            pen.qCurveTo((338, -10), (358, 105)),
            pen.lineTo((358, 238)),
            pen.lineTo((255, 238)),
            pen.lineTo((255, 132)),
            pen.qCurveTo((255, 80), (200, 80)),
            pen.qCurveTo((145, 80), (145, 132)),
            pen.lineTo((145, 568)),
            pen.qCurveTo((145, 620), (200, 620)),
            pen.qCurveTo((251, 620), (255, 575)),
            # Hook: top terminal bends inward with a squared inside corner.
            pen.lineTo((255, 505)),
            pen.lineTo((356, 505)),
            pen.closePath(),
        ),
    )
    replace_with_pen_glyph(
        font,
        "E",
        lambda pen: (
            # Reference-style E: a single tall smooth left arc with no
            # squared corners. The top curve eases in more gradually than
            # the bottom, like the brush-shaped E in the reference.
            pen.moveTo((164, 0)),
            pen.lineTo((164, 700)),
            pen.lineTo((124, 700)),
            pen.qCurveTo((70, 700), (44, 612)),
            pen.qCurveTo((24, 540), (24, 350)),
            pen.qCurveTo((24, 0), (116, 0)),
            pen.closePath(),
            rounded_rect(pen, 92, 584, 356, 700, 58),
            rounded_rect(pen, 92, 320, 292, 458, 58),
            rounded_rect(pen, 92, 0, 356, 120, 60),
        ),
    )

    for char in "ABCDEFGHIJKLMNOPQRSTUVWXYZ":
        if char not in "EN":
            thicken_glyph(font, char)

    font.save(TARGET_TTF)
    font.flavor = "woff2"
    font.save(TARGET_WOFF2)


if __name__ == "__main__":
    main()
