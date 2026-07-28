import React, { useRef, useEffect } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { python } from '@codemirror/lang-python';
import { oneDark } from '@codemirror/theme-one-dark';
import { keymap } from '@codemirror/view';
import { indentWithTab } from '@codemirror/commands';

const CodeEditor = ({ value, onChange, readOnly = false }) => {
  const editorRef = useRef(null);
  const viewRef = useRef(null);

  useEffect(() => {
    if (!editorRef.current) return;

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged && onChange) {
        onChange(update.state.doc.toString());
      }
    });

    const state = EditorState.create({
      doc: value || '',
      extensions: [
        basicSetup,
        python(),
        oneDark,
        keymap.of([indentWithTab]),
        updateListener,
        EditorView.theme({
          '&': {
            fontSize: '14px',
            maxHeight: '400px',
          },
          '.cm-scroller': {
            fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
            overflow: 'auto',
          },
          '.cm-content': {
            minHeight: '150px',
          },
          '.cm-focused': {
            outline: 'none',
          },
        }),
        readOnly ? EditorState.readOnly.of(true) : [],
      ].filter(Boolean),
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
    };
  }, []); // 只初始化一次

  // 当外部 value 变化时更新编辑器内容
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const currentValue = view.state.doc.toString();
    if (value !== undefined && value !== currentValue) {
      view.dispatch({
        changes: {
          from: 0,
          to: currentValue.length,
          insert: value,
        },
      });
    }
  }, [value]);

  return (
    <div
      className="code-editor-wrapper"
      style={{
        border: '1px solid #ddd',
        borderRadius: '6px',
        overflow: 'hidden',
        marginBottom: '16px',
      }}
    >
      <div
        style={{
          backgroundColor: '#282c34',
          padding: '8px 12px',
          borderBottom: '1px solid #3e4451',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ color: '#abb2bf', fontWeight: '500', fontSize: '14px' }}>
          Python 代码编辑器
        </span>
        <span style={{ color: '#636d83', fontSize: '12px' }}>
          支持语法高亮 · Tab 缩进
        </span>
      </div>
      <div ref={editorRef} />
    </div>
  );
};

export default CodeEditor;
