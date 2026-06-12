#!/usr/bin/env node

/**
 * Markdown 转 Docx 脚本
 * 
 * 用法：node md-to-docx.mjs --input ch01.md --output ch01.docx [--format 中国法学] [--header "页眉文本"]
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, basename, join } from 'path';
import { fileURLToPath } from 'url';

// docx 包的动态导入
let docx;
try {
  docx = await import('docx');
} catch (e) {
  console.error('错误：请先安装 docx 包');
  console.error('运行：npm install -g docx');
  process.exit(1);
}

const {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  Header, Footer, PageNumber, PageBreak, FootnoteReferenceRun,
  AlignmentType
} = docx;

// 格式常量
const FORMATS = {
  '中国法学': {
    margins: { top: 5346, bottom: 5040, left: 4032, right: 3744 },
    pageSize: { width: 11906, height: 16838 },
    fonts: { song: 'SimSun', hei: 'SimHei' },
    sizes: { body: 21, h1: 36, h2: 28, h3: 24, footnote: 18, footer: 18 },
    lineSpacing: 400,
    firstLineIndent: 420,
    spacing: {
      h1: { before: 345, after: 173 },
      h2: { before: 173, after: 87 },
      h3: { before: 87, after: 43 }
    }
  },
  'default': {
    margins: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
    pageSize: { width: 11906, height: 16838 },
    fonts: { song: 'SimSun', hei: 'SimHei' },
    sizes: { body: 24, h1: 36, h2: 28, h3: 24, footnote: 20, footer: 20 },
    lineSpacing: 360,
    firstLineIndent: 480,
    spacing: {
      h1: { before: 240, after: 120 },
      h2: { before: 120, after: 60 },
      h3: { before: 60, after: 30 }
    }
  }
};

// 解析命令行参数
function parseArgs() {
  const args = process.argv.slice(2);
  const params = {
    input: null,
    output: null,
    format: '中国法学',
    header: null
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--input':
      case '-i':
        params.input = args[++i];
        break;
      case '--output':
      case '-o':
        params.output = args[++i];
        break;
      case '--format':
      case '-f':
        params.format = args[++i];
        break;
      case '--header':
      case '-h':
        params.header = args[++i];
        break;
      case '--help':
        printHelp();
        process.exit(0);
    }
  }

  if (!params.input) {
    console.error('错误：请指定输入文件 --input <file.md>');
    process.exit(1);
  }

  if (!params.output) {
    // 自动生成输出文件名
    params.output = params.input.replace(/\.md$/, '.docx');
  }

  return params;
}

function printHelp() {
  console.log(`
Markdown 转 Docx 脚本

用法：node md-to-docx.mjs --input <input.md> [--output <output.docx>] [--format <格式>] [--header <页眉>]

参数：
  --input, -i    输入的 Markdown 文件（必需）
  --output, -o   输出的 Docx 文件（默认：与输入同名）
  --format, -f   排版格式（默认：中国法学）
  --header, -h   页眉文本（默认：使用文件名）
  --help         显示帮助信息

示例：
  node md-to-docx.mjs --input chapters/ch01.md --output output/ch01.docx
  node md-to-docx.mjs -i ch01.md -f 中国法学 -h "破产企业数据处置研究"
`);
}

// 解析 Markdown
function parseMarkdown(content) {
  const lines = content.split('\n');
  const chapters = [];
  const footnoteDefs = {};
  let currentChapter = null;
  let currentParagraph = '';

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

    // 跳过分隔线
    if (trimmed.match(/^-{3,}$/)) {
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
    } else if (trimmed.startsWith('#### ')) {
      if (currentChapter) {
        chapters.push(currentChapter);
      }
      currentChapter = {
        heading: trimmed.slice(5).trim(),
        level: 4,
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

// 创建文档
function createDocument(parsed, format, headerText) {
  const fmt = FORMATS[format] || FORMATS['default'];
  const { chapters, footnotes } = parsed;

  // 构建内容
  const children = [];

  chapters.forEach(chapter => {
    // 标题
    if (chapter.heading) {
      const level = chapter.level || 1;
      children.push(createHeading(chapter.heading, level, fmt));
    }

    // 正文段落
    if (chapter.paragraphs) {
      chapter.paragraphs.forEach(para => {
        if (typeof para === 'string') {
          children.push(createBodyParagraph(para, fmt));
        } else if (para.footnote !== undefined) {
          children.push(createFootnoteParagraph(para.text, para.footnote, fmt));
        }
      });
    }
  });

  // 创建脚注定义
  const footnoteDefinitions = {};
  Object.entries(footnotes).forEach(([id, text]) => {
    footnoteDefinitions[id] = {
      children: [new Paragraph({
        children: [new TextRun({
          text: text,
          font: fmt.fonts.song,
          size: fmt.sizes.footnote
        })]
      })]
    };
  });

  // 创建文档
  const doc = new Document({
    styles: createStyles(fmt),
    footnotes: footnoteDefinitions,
    sections: [{
      properties: {
        page: {
          size: fmt.pageSize,
          margin: fmt.margins
        }
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({
              text: headerText || '',
              font: fmt.fonts.song,
              size: fmt.sizes.footer
            })]
          })]
        })
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                font: fmt.fonts.song,
                size: fmt.sizes.footer,
                children: [PageNumber.CURRENT]
              })
            ]
          })]
        })
      },
      children: children
    }]
  });

  return doc;
}

// 创建样式
function createStyles(fmt) {
  return {
    default: {
      document: {
        run: {
          font: fmt.fonts.song,
          size: fmt.sizes.body
        }
      }
    },
    paragraphStyles: [
      {
        id: 'Heading1',
        name: 'Heading 1',
        basedOn: 'Normal',
        next: 'Normal',
        quickFormat: true,
        run: { size: fmt.sizes.h1, bold: true, font: fmt.fonts.hei },
        paragraph: {
          spacing: fmt.spacing.h1,
          alignment: AlignmentType.CENTER,
          outlineLevel: 0
        }
      },
      {
        id: 'Heading2',
        name: 'Heading 2',
        basedOn: 'Normal',
        next: 'Normal',
        quickFormat: true,
        run: { size: fmt.sizes.h2, bold: true, font: fmt.fonts.hei },
        paragraph: {
          spacing: fmt.spacing.h2,
          outlineLevel: 1
        }
      },
      {
        id: 'Heading3',
        name: 'Heading 3',
        basedOn: 'Normal',
        next: 'Normal',
        quickFormat: true,
        run: { size: fmt.sizes.h3, bold: true, font: fmt.fonts.hei },
        paragraph: {
          spacing: fmt.spacing.h3,
          outlineLevel: 2
        }
      }
    ]
  };
}

// 创建标题
function createHeading(text, level, fmt) {
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

// 创建正文段落
function createBodyParagraph(text, fmt) {
  return new Paragraph({
    spacing: {
      line: fmt.lineSpacing,
      before: 0,
      after: 0
    },
    indent: { firstLine: fmt.firstLineIndent },
    children: [new TextRun({
      text: text,
      font: fmt.fonts.song,
      size: fmt.sizes.body
    })]
  });
}

// 创建带脚注的段落
function createFootnoteParagraph(text, footnoteId, fmt) {
  return new Paragraph({
    spacing: {
      line: fmt.lineSpacing,
      before: 0,
      after: 0
    },
    indent: { firstLine: fmt.firstLineIndent },
    children: [
      new TextRun({
        text: text,
        font: fmt.fonts.song,
        size: fmt.sizes.body
      }),
      new FootnoteReferenceRun(footnoteId)
    ]
  });
}

// 主函数
async function main() {
  const params = parseArgs();

  // 读取输入文件
  let content;
  try {
    content = readFileSync(params.input, 'utf-8');
  } catch (e) {
    console.error(`错误：无法读取文件 ${params.input}`);
    process.exit(1);
  }

  // 解析 Markdown
  const parsed = parseMarkdown(content);

  // 创建文档
  const doc = createDocument(parsed, params.format, params.header);

  // 确保输出目录存在
  const outputDir = dirname(params.output);
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  // 保存文档
  const buffer = await Packer.toBuffer(doc);
  writeFileSync(params.output, buffer);

  console.log(`✓ 已生成：${params.output}`);
  console.log(`  格式：${params.format}`);
  console.log(`  章节：${parsed.chapters.length} 个`);
  console.log(`  脚注：${Object.keys(parsed.footnotes).length} 个`);
}

// 运行
main().catch(e => {
  console.error('错误：', e.message);
  process.exit(1);
});
