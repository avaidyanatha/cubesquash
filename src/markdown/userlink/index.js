import { visit } from 'unist-util-visit';

import { fromMarkdown } from './mdast-userlink';
import syntax from './micromark-userlink';
import { add } from '../utils';

function userlink(options = {}) {
  const data = this.data();
  add(data, 'micromarkExtensions', syntax);
  add(data, 'fromMarkdownExtensions', fromMarkdown);

  function visitor(node) {
    if (typeof options.callback === 'function') {
      options.callback(node.value);
    }
  }

  return (tree) => visit(tree, 'userlink', visitor);
}

export default userlink;
