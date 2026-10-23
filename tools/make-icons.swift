// Draws the Dashboard icon (a 2x2 grid of tiles: clock, sun, battery, timeline)
// and writes the PNG sizes the extension needs. macOS only:
//
//   swift tools/make-icons.swift            # writes assets/icons/icon-{16,32,48,128}.png
//   swift tools/make-icons.swift 512 out/   # one size, custom folder (for previews)
import Cocoa
import ImageIO
import UniformTypeIdentifiers

func rgb(_ hex: UInt32, _ a: CGFloat = 1) -> CGColor {
  CGColor(red: CGFloat((hex >> 16) & 255) / 255, green: CGFloat((hex >> 8) & 255) / 255,
          blue: CGFloat(hex & 255) / 255, alpha: a)
}

func rrect(_ r: CGRect, _ radius: CGFloat) -> CGPath {
  CGPath(roundedRect: r, cornerWidth: radius, cornerHeight: radius, transform: nil)
}

func render(_ size: Int) -> CGImage {
  let s = CGFloat(size)
  let space = CGColorSpace(name: CGColorSpace.sRGB)!
  let ctx = CGContext(data: nil, width: size, height: size, bitsPerComponent: 8, bytesPerRow: 0,
                      space: space, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
  ctx.interpolationQuality = .high
  ctx.setAllowsAntialiasing(true)
  // Unit square, y down.
  ctx.translateBy(x: 0, y: s)
  ctx.scaleBy(x: s, y: -s)

  // Thin strokes vanish at small sizes, so fatten them there.
  let k: CGFloat = size <= 16 ? 1.9 : size <= 32 ? 1.5 : size <= 48 ? 1.2 : 1
  let rays = size > 16

  // Background tile.
  let bg = CGRect(x: 0, y: 0, width: 1, height: 1)
  ctx.saveGState()
  ctx.addPath(rrect(bg, 0.225))
  ctx.clip()
  let grad = CGGradient(colorsSpace: space, colors: [rgb(0x1a2638), rgb(0x0a0f17)] as CFArray,
                        locations: [0, 1])!
  ctx.drawLinearGradient(grad, start: CGPoint(x: 0.3, y: 0), end: CGPoint(x: 0.7, y: 1),
                         options: [.drawsBeforeStartLocation, .drawsAfterEndLocation])
  ctx.restoreGState()
  ctx.setStrokeColor(rgb(0xffffff, 0.14))
  ctx.setLineWidth(0.012 * k)
  ctx.addPath(rrect(bg.insetBy(dx: 0.006, dy: 0.006), 0.22))
  ctx.strokePath()

  // 2x2 tiles.
  let m: CGFloat = 0.15, g: CGFloat = 0.055
  let t = (1 - 2 * m - g) / 2
  func tile(_ col: Int, _ row: Int) -> CGRect {
    CGRect(x: m + CGFloat(col) * (t + g), y: m + CGFloat(row) * (t + g), width: t, height: t)
  }
  for (c, r) in [(0, 0), (1, 0), (0, 1), (1, 1)] {
    ctx.setFillColor(rgb(0x233046))
    ctx.addPath(rrect(tile(c, r), 0.065))
    ctx.fillPath()
  }

  ctx.setLineCap(.round)

  // Clock (top left).
  let a = tile(0, 0), ac = CGPoint(x: a.midX, y: a.midY)
  ctx.setStrokeColor(rgb(0x2dd4bf))
  ctx.setLineWidth(0.03 * k)
  ctx.strokeEllipse(in: CGRect(x: ac.x - 0.1, y: ac.y - 0.1, width: 0.2, height: 0.2))
  ctx.setStrokeColor(rgb(0xe8edf2))
  ctx.setLineWidth(0.028 * k)
  ctx.move(to: ac); ctx.addLine(to: CGPoint(x: ac.x, y: ac.y - 0.065))
  ctx.move(to: ac); ctx.addLine(to: CGPoint(x: ac.x + 0.048, y: ac.y + 0.02))
  ctx.strokePath()

  // Sun (top right).
  let b = tile(1, 0), bc = CGPoint(x: b.midX, y: b.midY)
  ctx.setFillColor(rgb(0xfbbf24))
  ctx.fillEllipse(in: CGRect(x: bc.x - 0.062, y: bc.y - 0.062, width: 0.124, height: 0.124))
  if rays {
    ctx.setStrokeColor(rgb(0xfbbf24))
    ctx.setLineWidth(0.026 * k)
    for i in 0..<8 {
      let ang = CGFloat(i) * .pi / 4
      ctx.move(to: CGPoint(x: bc.x + cos(ang) * 0.094, y: bc.y + sin(ang) * 0.094))
      ctx.addLine(to: CGPoint(x: bc.x + cos(ang) * 0.125, y: bc.y + sin(ang) * 0.125))
    }
    ctx.strokePath()
  }

  // Battery (bottom left).
  let c = tile(0, 1), cc = CGPoint(x: c.midX, y: c.midY)
  let bw: CGFloat = 0.2, bh: CGFloat = 0.115
  let body = CGRect(x: cc.x - bw / 2 - 0.008, y: cc.y - bh / 2, width: bw, height: bh)
  ctx.setStrokeColor(rgb(0xe8edf2, 0.9))
  ctx.setLineWidth(0.024 * k)
  ctx.addPath(rrect(body, 0.03)); ctx.strokePath()
  ctx.setFillColor(rgb(0xe8edf2, 0.9))
  ctx.addPath(rrect(CGRect(x: body.maxX + 0.012, y: cc.y - 0.026, width: 0.02, height: 0.052), 0.008))
  ctx.fillPath()
  ctx.setFillColor(rgb(0x30d158))
  let inset = 0.012 * k + 0.014
  ctx.addPath(rrect(CGRect(x: body.minX + inset, y: body.minY + inset,
                           width: (body.width - 2 * inset) * 0.8, height: body.height - 2 * inset), 0.012))
  ctx.fillPath()

  // Timeline (bottom right): night / dawn / work / dusk / night, with a marker.
  let d = tile(1, 1), dc = CGPoint(x: d.midX, y: d.midY)
  let tw: CGFloat = 0.21, th: CGFloat = 0.06
  let bar = CGRect(x: dc.x - tw / 2, y: dc.y - th / 2, width: tw, height: th)
  ctx.saveGState()
  ctx.addPath(rrect(bar, th / 2)); ctx.clip()
  let segs: [(CGFloat, CGFloat, UInt32)] = [
    (0, 0.22, 0x4a5870), (0.22, 0.36, 0xf59e0b), (0.36, 0.72, 0x2dd4bf),
    (0.72, 0.86, 0xf59e0b), (0.86, 1, 0x4a5870),
  ]
  for (x0, x1, col) in segs {
    ctx.setFillColor(rgb(col))
    ctx.fill(CGRect(x: bar.minX + x0 * tw, y: bar.minY, width: (x1 - x0) * tw, height: th))
  }
  ctx.restoreGState()
  ctx.setFillColor(rgb(0xffffff))
  ctx.fillEllipse(in: CGRect(x: bar.minX + 0.55 * tw - 0.022, y: dc.y - 0.022, width: 0.044, height: 0.044))

  return ctx.makeImage()!
}

func write(_ image: CGImage, to path: String) {
  let url = URL(fileURLWithPath: path)
  let dest = CGImageDestinationCreateWithURL(url as CFURL, UTType.png.identifier as CFString, 1, nil)!
  CGImageDestinationAddImage(dest, image, nil)
  guard CGImageDestinationFinalize(dest) else { fatalError("could not write \(path)") }
}

let args = CommandLine.arguments
if args.count >= 2, let size = Int(args[1]) {
  let dir = args.count >= 3 ? args[2] : "."
  write(render(size), to: "\(dir)/icon-\(size).png")
} else {
  for size in [16, 32, 48, 128] { write(render(size), to: "assets/icons/icon-\(size).png") }
}
