// Plugin set mirrors Cube Cobra's packages/client/src/markdown/parser.js so blog
// posts render the same way they do on the site.
import type { PluggableList } from 'unified';
import rehypeKatex from 'rehype-katex';
import breaks from 'remark-breaks';
import gfm from 'remark-gfm';
import math from 'remark-math';

import cardlink from './cardlink/index.js';
import cardrow from './cardrow/index.js';
import centering from './centering/index.js';
import symbols from './symbols/index.js';
import userlink from './userlink/index.js';

export const REMARK_PLUGINS: PluggableList = [
  cardrow,
  centering,
  math,
  cardlink,
  [gfm, { singleTilde: false }],
  symbols,
  userlink,
  breaks,
];

export const REHYPE_PLUGINS: PluggableList = [rehypeKatex];
