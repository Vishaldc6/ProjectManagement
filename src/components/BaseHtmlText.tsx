import React, { memo } from 'react';
import RenderHTML, { MixedStyleDeclaration } from 'react-native-render-html';

const tagsStyles: Record<string, MixedStyleDeclaration> = {
  strong: {
    fontWeight: '700',
  },
  b: {
    fontWeight: 'bold',
  },
  i: {
    fontStyle: 'italic',
  },
  u: {
    textDecorationLine: 'underline',
  },
  strike: {
    textDecorationLine: 'line-through',
  },
  pre: {
    backgroundColor: '#f4f4f4',
    padding: 10,
    borderRadius: 6,
    fontFamily: 'monospace',
    fontSize: 14,
  },
  blockquote: {
    borderLeftWidth: 4,
    borderLeftColor: '#ccc',
    paddingLeft: 10,
    color: '#555',
    fontStyle: 'italic',
  },
  ol: {
    marginLeft: 16,
  },
  ul: {
    marginLeft: 16,
  },
  li: {
    fontSize: 16,
  },
};

interface BaseHtmlTextPropType {
  html: string;
}

const BaseHtmlText = ({html}: BaseHtmlTextPropType) => {
  return <RenderHTML source={{ html: html }} tagsStyles={tagsStyles} />;
};

export default memo(BaseHtmlText);
