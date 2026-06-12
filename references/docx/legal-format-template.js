/**
 * 法学论文格式模板（《中国法学》格式）
 * 
 * 使用 docx-js 生成符合《中国法学》排版规范的 Word 文档
 */

const { Document, Packer, Paragraph, TextRun, HeadingLevel,
        Header, Footer, PageNumber, PageBreak, FootnoteReferenceRun,
        AlignmentType, TabStopType, TabStopPosition } = require('docx');

// 《中国法学》格式常量
const FORMAT = {
  // 页边距（DXA单位，1440 = 1英寸）
  // 上3.7cm=5346, 下3.5cm=5040, 左2.8cm=4032, 右2.6cm=3744
  margins: { top: 5346, bottom: 5040, left: 4032, right: 3744 },
  
  // 页面尺寸（A4）
  pageSize: { width: 11906, height: 16838 },
  
  // 字体
  fonts: {
    song: "SimSun",      // 宋体
    hei: "SimHei"        // 黑体
  },
  
  // 字号（半磅为单位，21 = 10.5pt）
  sizes: {
    body: 21,            // 正文 10.5pt
    h1: 36,              // 章标题 18pt
    h2: 28,              // 节标题 14pt
    h3: 24,              // 小节标题 12pt
    h4: 21,              // 四级标题 10.5pt
    footnote: 18,        // 脚注 9pt
    footer: 18           // 页码 9pt
  },
  
  // 行距（固定值20pt = 400 DXA）
  lineSpacing: 400,
  
  // 首行缩进（2字符 ≈ 420 DXA）
  firstLineIndent: 420,
  
  // 段前段后间距
  spacing: {
    h1: { before: 345, after: 173 },   // 章标题
    h2: { before: 173, after: 87 },    // 节标题
    h3: { before: 87, after: 43 },     // 小节标题
    h4: { before: 43, after: 0 },      // 四级标题
    body: { before: 0, after: 0 }      // 正文
  }
};

/**
 * 创建法学论文文档
 * @param {Array} chapters - 章节内容数组
 * @param {Object} footnotes - 脚注对象 {id: text}
 * @param {Object} options - 配置选项
 * @returns {Document} docx Document对象
 */
function createLegalDocument(chapters, footnotes = {}, options = {}) {
  const {
    headerText = "论文标题",
    showPageNumber = true
  } = options;

  // 构建内容
  const children = [];
  
  chapters.forEach(chapter => {
    // 标题
    if (chapter.heading) {
      const level = chapter.level || 1;
      children.push(createHeading(chapter.heading, level));
    }
    
    // 正文段落
    if (chapter.paragraphs) {
      chapter.paragraphs.forEach(para => {
        if (typeof para === 'string') {
          children.push(createBodyParagraph(para));
        } else if (para.footnote) {
          // 带脚注的段落
          children.push(createFootnoteParagraph(para.text, para.footnote));
        }
      });
    }
  });

  // 创建文档
  const doc = new Document({
    styles: createStyles(),
    footnotes: createFootnoteDefinitions(footnotes),
    sections: [{
      properties: {
        page: {
          size: FORMAT.pageSize,
          margin: FORMAT.margins
        }
      },
      headers: {
        default: createHeader(headerText)
      },
      footers: {
        default: showPageNumber ? createFooter() : undefined
      },
      children: children
    }]
  });

  return doc;
}

/**
 * 创建样式配置
 */
function createStyles() {
  return {
    default: {
      document: {
        run: {
          font: FORMAT.fonts.song,
          size: FORMAT.sizes.body
        }
      }
    },
    paragraphStyles: [
      {
        id: "Heading1",
        name: "Heading 1",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: {
          size: FORMAT.sizes.h1,
          bold: true,
          font: FORMAT.fonts.hei
        },
        paragraph: {
          spacing: FORMAT.spacing.h1,
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
        run: {
          size: FORMAT.sizes.h2,
          bold: true,
          font: FORMAT.fonts.hei
        },
        paragraph: {
          spacing: FORMAT.spacing.h2,
          outlineLevel: 1
        }
      },
      {
        id: "Heading3",
        name: "Heading 3",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: {
          size: FORMAT.sizes.h3,
          bold: true,
          font: FORMAT.fonts.hei
        },
        paragraph: {
          spacing: FORMAT.spacing.h3,
          outlineLevel: 2
        }
      },
      {
        id: "Heading4",
        name: "Heading 4",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: {
          size: FORMAT.sizes.h4,
          bold: true,
          font: FORMAT.fonts.hei
        },
        paragraph: {
          spacing: FORMAT.spacing.h4,
          outlineLevel: 3
        }
      }
    ]
  };
}

/**
 * 创建标题段落
 */
function createHeading(text, level) {
  const headingLevel = {
    1: HeadingLevel.HEADING_1,
    2: HeadingLevel.HEADING_2,
    3: HeadingLevel.HEADING_3,
    4: HeadingLevel.HEADING_4
  }[level] || HeadingLevel.HEADING_1;

  return new Paragraph({
    heading: headingLevel,
    children: [new TextRun(text)]
  });
}

/**
 * 创建正文段落
 */
function createBodyParagraph(text, options = {}) {
  const { firstLineIndent = true } = options;
  
  return new Paragraph({
    spacing: {
      line: FORMAT.lineSpacing,
      ...FORMAT.spacing.body
    },
    indent: firstLineIndent ? { firstLine: FORMAT.firstLineIndent } : undefined,
    children: [new TextRun({
      text: text,
      font: FORMAT.fonts.song,
      size: FORMAT.sizes.body
    })]
  });
}

/**
 * 创建带脚注的段落
 */
function createFootnoteParagraph(text, footnoteId) {
  return new Paragraph({
    spacing: {
      line: FORMAT.lineSpacing,
      ...FORMAT.spacing.body
    },
    indent: { firstLine: FORMAT.firstLineIndent },
    children: [
      new TextRun({
        text: text,
        font: FORMAT.fonts.song,
        size: FORMAT.sizes.body
      }),
      new FootnoteReferenceRun(footnoteId)
    ]
  });
}

/**
 * 创建脚注定义
 */
function createFootnoteDefinitions(footnotes) {
  const result = {};
  
  Object.entries(footnotes).forEach(([id, text]) => {
    result[id] = {
      children: [new Paragraph({
        children: [new TextRun({
          text: text,
          font: FORMAT.fonts.song,
          size: FORMAT.sizes.footnote
        })]
      })]
    };
  });
  
  return result;
}

/**
 * 创建页眉
 */
function createHeader(text) {
  return new Header({
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({
        text: text,
        font: FORMAT.fonts.song,
        size: FORMAT.sizes.footer
      })]
    })]
  });
}

/**
 * 创建页脚（页码）
 */
function createFooter() {
  return new Footer({
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          font: FORMAT.fonts.song,
          size: FORMAT.sizes.footer,
          children: [PageNumber.CURRENT]
        })
      ]
    })]
  });
}

/**
 * 从Markdown解析为章节数组
 * @param {string} markdown - Markdown内容
 * @returns {Array} 章节数组
 */
function parseMarkdown(markdown) {
  const lines = markdown.split('\n');
  const chapters = [];
  let currentChapter = null;
  let currentParagraph = '';
  const footnoteDefs = {};

  // 第一遍：提取脚注定义
  lines.forEach(line => {
    const match = line.match(/^\[\^(\d+)\]:\s*(.*)/);
    if (match) {
      footnoteDefs[match[1]] = match[2].trim();
    }
  });

  // 第二遍：解析内容
  lines.forEach(line => {
    const trimmed = line.trim();
    
    // 跳过空行和脚注定义
    if (!trimmed || trimmed.match(/^\[\^/)) {
      if (currentParagraph) {
        if (currentChapter) {
          currentChapter.paragraphs.push(currentParagraph);
        }
        currentParagraph = '';
      }
      return;
    }

    // 标题检测
    if (trimmed.startsWith('# ')) {
      if (currentChapter) {
        chapters.push(currentChapter);
      }
      currentChapter = {
        heading: trimmed.slice(2).trim(),
        level: 1,
        paragraphs: []
      };
      currentParagraph = '';
    } else if (trimmed.startsWith('## ')) {
      if (currentChapter) {
        chapters.push(currentChapter);
      }
      currentChapter = {
        heading: trimmed.slice(3).trim(),
        level: 2,
        paragraphs: []
      };
      currentParagraph = '';
    } else if (trimmed.startsWith('### ')) {
      if (currentChapter) {
        chapters.push(currentChapter);
      }
      currentChapter = {
        heading: trimmed.slice(4).trim(),
        level: 3,
        paragraphs: []
      };
      currentParagraph = '';
    } else {
      // 正文
      if (currentParagraph) {
        currentParagraph += trimmed;
      } else {
        currentParagraph = trimmed;
      }
    }
  });

  // 处理最后一段
  if (currentParagraph && currentChapter) {
    currentChapter.paragraphs.push(currentParagraph);
  }
  if (currentChapter) {
    chapters.push(currentChapter);
  }

  // 处理脚注引用
  chapters.forEach(chapter => {
    chapter.paragraphs = chapter.paragraphs.map(para => {
      const footnoteMatch = para.match(/^(.*?)\[\^(\d+)\](.*)$/);
      if (footnoteMatch) {
        return {
          text: footnoteMatch[1] + footnoteMatch[3],
          footnote: parseInt(footnoteMatch[2])
        };
      }
      return para;
    });
  });

  return { chapters, footnotes: footnoteDefs };
}

module.exports = {
  FORMAT,
  createLegalDocument,
  parseMarkdown,
  createStyles,
  createHeading,
  createBodyParagraph,
  createFootnoteParagraph,
  createHeader,
  createFooter
};
