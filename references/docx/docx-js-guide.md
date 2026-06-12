# docx-js 使用指南

使用 JavaScript 的 docx 包生成 Word 文档。

---

## 安装

```bash
npm install -g docx
```

## 基本用法

```javascript
const { Document, Packer, Paragraph, TextRun, HeadingLevel,
        Header, Footer, PageNumber, PageBreak, FootnoteReferenceRun } = require('docx');
const fs = require('fs');

// 创建文档
const doc = new Document({
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 }, // A4
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    children: [
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("标题")]
      }),
      new Paragraph({
        children: [new TextRun("正文内容")]
      })
    ]
  }]
});

// 保存文档
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("output.docx", buffer);
});
```

---

## 标题层级

```javascript
// 章标题（黑体18pt，居中）
new Paragraph({
  heading: HeadingLevel.HEADING_1,
  alignment: AlignmentType.CENTER,
  children: [new TextRun("第一章 标题")]
})

// 节标题（黑体14pt）
new Paragraph({
  heading: HeadingLevel.HEADING_2,
  children: [new TextRun("1.1 节标题")]
})

// 小节标题（黑体12pt）
new Paragraph({
  heading: HeadingLevel.HEADING_3,
  children: [new TextRun("1.1.1 小节标题")]
})
```

---

## 脚注

```javascript
const doc = new Document({
  footnotes: {
    1: { children: [new Paragraph("参见王利明：《数据权益论》，载《中国法学》2022年第3期。")] },
    2: { children: [new Paragraph("参见彭诚信：《数据利用的根本矛盾何以消除》，载《法学》2023年第3期。")] },
  },
  sections: [{
    children: [new Paragraph({
      children: [
        new TextRun("数据是信息在数字化环境中的基本表现形式"),
        new FootnoteReferenceRun(1),
        new TextRun("，其本质是对客观事实的记录和符号化表达"),
        new FootnoteReferenceRun(2),
        new TextRun("。")
      ],
    })]
  }]
});
```

---

## 页眉页脚

```javascript
sections: [{
  properties: {
    page: { margin: { top: 5346, bottom: 5040, left: 4032, right: 3744 } }
  },
  headers: {
    default: new Header({
      children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "破产企业数据处置研究", font: "SimSun", size: 18 })]
      })]
    })
  },
  footers: {
    default: new Footer({
      children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ children: [PageNumber.CURRENT], font: "SimSun", size: 18 })]
      })]
    })
  },
  children: [/* 内容 */]
}]
```

---

## 页面尺寸（DXA单位）

| 纸张 | 宽度 | 高度 | 内容宽度（1英寸边距） |
|------|------|------|---------------------|
| A4（默认） | 11,906 | 16,838 | 9,026 |
| US Letter | 12,240 | 15,840 | 9,360 |

**换算**：1440 DXA = 1英寸 = 2.54cm

---

## 字号（半磅为单位）

| 磅值 | 半磅值 | 用途 |
|------|--------|------|
| 9pt | 18 | 脚注 |
| 10.5pt | 21 | 正文 |
| 12pt | 24 | 小节标题 |
| 14pt | 28 | 节标题 |
| 18pt | 36 | 章标题 |

---

## 样式覆盖

```javascript
const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: "SimSun", size: 21 } // 宋体10.5pt
      }
    },
    paragraphStyles: [
      {
        id: "Heading1",
        name: "Heading 1",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 36, bold: true, font: "SimHei" }, // 黑体18pt
        paragraph: {
          spacing: { before: 240, after: 120 },
          alignment: AlignmentType.CENTER,
          outlineLevel: 0
        }
      },
      {
        id: "Heading2",
        name: "Heading 2",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 28, bold: true, font: "SimHei" }, // 黑体14pt
        paragraph: {
          spacing: { before: 120, after: 60 },
          outlineLevel: 1
        }
      },
      {
        id: "Heading3",
        name: "Heading 3",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 24, bold: true, font: "SimHei" }, // 黑体12pt
        paragraph: {
          spacing: { before: 60, after: 30 },
          outlineLevel: 2
        }
      }
    ]
  }
});
```

---

## 段落格式

```javascript
new Paragraph({
  spacing: {
    before: 0,      // 段前间距（DXA）
    after: 0,       // 段后间距（DXA）
    line: 400       // 行距（固定值20pt = 400）
  },
  indent: {
    firstLine: 420  // 首行缩进（2字符 ≈ 420 DXA）
  },
  children: [new TextRun("正文内容")]
})
```

---

## 验证

生成后验证文档：

```bash
# 使用Python验证
python scripts/office/validate.py output.docx
```

---

## Critical Rules

- **Set page size explicitly** - docx-js defaults to A4
- **Never use `\n`** - use separate Paragraph elements
- **Never use unicode bullets** - use `LevelFormat.BULLET` with numbering config
- **PageBreak must be in Paragraph** - standalone creates invalid XML
- **ImageRun requires `type`** - always specify png/jpg/etc
- **Always set table `width` with DXA** - never use `WidthType.PERCENTAGE`
- **Tables need dual widths** - `columnWidths` array AND cell `width`, both must match
- **TOC requires HeadingLevel only** - no custom styles on heading paragraphs
- **Override built-in styles** - use exact IDs: "Heading1", "Heading2", etc.
- **Include `outlineLevel`** - required for TOC (0 for H1, 1 for H2, etc.)
