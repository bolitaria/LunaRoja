/**
 * Sanitizacion de HTML server-side para emails.
 *
 * Usado en el endpoint publico /api/email-templates/:id/preview, donde
 * los query params del usuario fluyen al HTML final servido con res.send().
 *
 * Whitelist generosa para permitir HTML de email (tablas, estilos inline, SVG),
 * pero bloquea <script>, event handlers (on*), URLs con esquemas peligrosos
 * (javascript:, vbscript:).
 */

const sanitizeHtml = require('sanitize-html');

const ALLOWED_STYLES = {
  '*': {
    'color': [/^#[0-9a-fA-F]{3,8}$/, /^rgb/, /^rgba/, /^[a-z]+$/i],
    'background-color': [/^#[0-9a-fA-F]{3,8}$/, /^rgb/, /^rgba/, /^[a-z]+$/i],
    'background-image': [/^url\(['"]?(https?:|data:image\/)/i, /^none$/i],
    'font-size': [/^\d+(\.\d+)?(px|em|rem|%|pt)$/],
    'font-family': [/^[\w\s,'"-]+$/],
    'font-weight': [/^(normal|bold|[1-9]00)$/i],
    'text-align': [/^(left|right|center|justify)$/i],
    'text-decoration': [/^(none|underline|line-through)$/i],
    'line-height': [/^\d+(\.\d+)?(px|em|rem|%)?$/],
    'padding': [/^[\d\s]+(px|em|rem|%)?$/],
    'padding-top': [/^[\d\s]+(px|em|rem|%)?$/],
    'padding-bottom': [/^[\d\s]+(px|em|rem|%)?$/],
    'padding-left': [/^[\d\s]+(px|em|rem|%)?$/],
    'padding-right': [/^[\d\s]+(px|em|rem|%)?$/],
    'margin': [/^[\d\s]+(px|em|rem|%)?$/],
    'margin-top': [/^[\d\s]+(px|em|rem|%)?$/],
    'margin-bottom': [/^[\d\s]+(px|em|rem|%)?$/],
    'margin-left': [/^[\d\s]+(px|em|rem|%)?$/],
    'margin-right': [/^[\d\s]+(px|em|rem|%)?$/],
    'border': [/^[\w\s#(),.%\-]+$/],
    'border-top': [/^[\w\s#(),.%\-]+$/],
    'border-bottom': [/^[\w\s#(),.%\-]+$/],
    'border-left': [/^[\w\s#(),.%\-]+$/],
    'border-right': [/^[\w\s#(),.%\-]+$/],
    'border-radius': [/^[\d\s]+(px|em|rem|%)?$/],
    'border-collapse': [/^(collapse|separate)$/i],
    'width': [/^[\d\s]+(px|em|rem|%)?$/],
    'max-width': [/^[\d\s]+(px|em|rem|%)?$/],
    'min-width': [/^[\d\s]+(px|em|rem|%)?$/],
    'height': [/^[\d\s]+(px|em|rem|%)?$/],
    'display': [/^(block|inline|inline-block|flex|grid|none|table|table-cell)$/i],
    'vertical-align': [/^(top|middle|bottom|baseline)$/i],
    'text-transform': [/^(none|uppercase|lowercase|capitalize)$/i],
    'letter-spacing': [/^[\d.]+(px|em|rem)$/],
    'overflow': [/^(hidden|auto|visible|scroll)$/i],
    'box-shadow': [/^[\w\s#(),.%\-]+$/],
    'box-sizing': [/^(border-box|content-box)$/i],
    'position': [/^(static|relative|absolute|fixed)$/i],
  },
};

const ALLOWED_TAGS = [
  'html', 'head', 'body', 'style', 'meta', 'title', 'link',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption',
  'img', 'a', 'div', 'span', 'p', 'br', 'hr',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li',
  'strong', 'em', 'b', 'i', 'u', 's', 'small', 'sub', 'sup',
  'blockquote', 'pre', 'code',
  'svg', 'path', 'g', 'circle', 'rect', 'line', 'polyline', 'polygon',
];

const ALLOWED_ATTRS = {
  '*': [
    'style', 'class', 'id', 'align', 'valign', 'width', 'height',
    'bgcolor', 'dir', 'lang', 'role', 'cellpadding', 'cellspacing',
    'viewbox', 'xmlns', 'fill', 'stroke', 'stroke-width', 'stroke-linecap',
    'stroke-linejoin', 'd', 'cx', 'cy', 'r', 'rx', 'ry', 'x', 'y',
    'x1', 'y1', 'x2', 'y2', 'points', 'transform',
  ],
  'a': ['href', 'target', 'rel', 'title'],
  'img': ['src', 'alt', 'width', 'height', 'title'],
  'meta': ['charset', 'name', 'content', 'http-equiv'],
  'link': ['rel', 'href', 'type'],
  'td': ['colspan', 'rowspan'],
  'th': ['colspan', 'rowspan', 'scope'],
};

function sanitizeEmailHtml(html) {
  if (typeof html !== 'string') return '';
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRS,
    allowedStyles: ALLOWED_STYLES,
    allowedSchemes: ['http', 'https', 'mailto', 'data'],
    allowedSchemesByTag: {
      img: ['http', 'https', 'data'],
    },
    disallowedTagsMode: 'discard',
    parser: {
      lowerCaseTags: true,
    },
    transformTags: {
      'a': (tagName, attribs) => {
        const href = attribs.href || '';
        const isExternal = /^https?:\/\//i.test(href);
        return {
          tagName: 'a',
          attribs: isExternal
            ? Object.assign({}, attribs, { rel: 'noopener noreferrer', target: '_blank' })
            : attribs,
        };
      },
    },
  });
}

module.exports = { sanitizeEmailHtml };
