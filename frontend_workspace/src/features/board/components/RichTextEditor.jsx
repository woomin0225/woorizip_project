// src/features/board/components/RichTextEditor.jsx
import React, { useEffect, useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Image from '@tiptap/extension-image';

const Icon = {
  Bold: () => <span style={{ fontWeight: 800 }}>B</span>,
  Italic: () => <span style={{ fontStyle: 'italic' }}>I</span>,
  Underline: () => <span style={{ textDecoration: 'underline' }}>U</span>,
  AlignLeft: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 6h16v2H4zM4 11h12v2H4zM4 16h16v2H4z" fill="currentColor" />
    </svg>
  ),
  AlignCenter: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 6h16v2H4zM6 11h12v2H6zM4 16h16v2H4z" fill="currentColor" />
    </svg>
  ),
  AlignRight: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 6h16v2H4zM8 11h12v2H8zM4 16h16v2H4z" fill="currentColor" />
    </svg>
  ),
  Bullet: () => <span>•</span>,
  Ordered: () => <span>1.</span>,
  Link: () => <span>🔗</span>,
  Image: () => <span>🖼️</span>,
  Clean: () => <span>⟲</span>,
};

// 현재 블록 타입 표시/변경용
function getBlockValue(editor) {
  if (editor.isActive('heading', { level: 1 })) return 'h1';
  if (editor.isActive('heading', { level: 2 })) return 'h2';
  if (editor.isActive('heading', { level: 3 })) return 'h3';
  return 'p'; // 본문(=Div 느낌)
}

function Toolbar({ editor, disabled }) {
  if (!editor) return null;

  const blockValue = getBlockValue(editor);

  const run = (fn) => {
    if (disabled) return;
    fn();
  };

  const btn = (active = false) => ({
    height: 34,
    minWidth: 34,
    padding: '0 8px',
    border: '1px solid #e5e7eb',
    background: '#fff',
    borderRadius: 6,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...(active ? { background: '#f3f4f6' } : null),
  });

  const sep = () => (
    <div
      style={{
        width: 1,
        height: 22,
        background: '#e5e7eb',
        margin: '0 8px',
      }}
    />
  );

  const onBlockChange = (e) => {
    const v = e.target.value;
    run(() => {
      editor.chain().focus();
      if (v === 'p') editor.chain().setParagraph().run();
      if (v === 'h1') editor.chain().toggleHeading({ level: 1 }).run();
      if (v === 'h2') editor.chain().toggleHeading({ level: 2 }).run();
      if (v === 'h3') editor.chain().toggleHeading({ level: 3 }).run();
    });
  };

  const onLink = () => {
    run(() => {
      const prev = editor.getAttributes('link')?.href || '';
      const url = window.prompt('링크 URL을 입력하세요.', prev);
      if (url === null) return;
      if (url.trim() === '') {
        editor.chain().focus().unsetLink().run();
        return;
      }
      editor.chain().focus().setLink({ href: url.trim() }).run();
    });
  };

  const onImage = () => {
    run(() => {
      const url = window.prompt('이미지 URL을 입력하세요.');
      if (!url || !url.trim()) return;
      editor.chain().focus().setImage({ src: url.trim() }).run();
    });
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 10px',
        background: '#fff',
        borderBottom: '1px solid #e5e7eb',
      }}
    >
      {/* "Div" 느낌 드롭다운 */}
      <select
        value={blockValue}
        onChange={onBlockChange}
        disabled={disabled}
        style={{
          height: 34,
          border: '1px solid #e5e7eb',
          borderRadius: 6,
          padding: '0 10px',
          background: '#fff',
        }}
      >
        <option value="p">Div</option>
        <option value="h1">H1</option>
        <option value="h2">H2</option>
        <option value="h3">H3</option>
      </select>

      {sep()}

      <button
        type="button"
        style={btn(editor.isActive('bold'))}
        disabled={disabled}
        onClick={() => run(() => editor.chain().focus().toggleBold().run())}
      >
        <Icon.Bold />
      </button>

      <button
        type="button"
        style={btn(editor.isActive('italic'))}
        disabled={disabled}
        onClick={() => run(() => editor.chain().focus().toggleItalic().run())}
      >
        <Icon.Italic />
      </button>

      <button
        type="button"
        style={btn(editor.isActive('underline'))}
        disabled={disabled}
        onClick={() =>
          run(() => editor.chain().focus().toggleUnderline().run())
        }
      >
        <Icon.Underline />
      </button>

      {sep()}

      <button
        type="button"
        style={btn(editor.isActive('bulletList'))}
        disabled={disabled}
        onClick={() =>
          run(() => editor.chain().focus().toggleBulletList().run())
        }
      >
        <Icon.Bullet />
      </button>

      <button
        type="button"
        style={btn(editor.isActive('orderedList'))}
        disabled={disabled}
        onClick={() =>
          run(() => editor.chain().focus().toggleOrderedList().run())
        }
      >
        <Icon.Ordered />
      </button>

      {sep()}

      {/* 정렬 */}
      <button
        type="button"
        style={btn(editor.isActive({ textAlign: 'left' }))}
        disabled={disabled}
        onClick={() =>
          run(() => editor.chain().focus().setTextAlign('left').run())
        }
      >
        <Icon.AlignLeft />
      </button>

      <button
        type="button"
        style={btn(editor.isActive({ textAlign: 'center' }))}
        disabled={disabled}
        onClick={() =>
          run(() => editor.chain().focus().setTextAlign('center').run())
        }
      >
        <Icon.AlignCenter />
      </button>

      <button
        type="button"
        style={btn(editor.isActive({ textAlign: 'right' }))}
        disabled={disabled}
        onClick={() =>
          run(() => editor.chain().focus().setTextAlign('right').run())
        }
      >
        <Icon.AlignRight />
      </button>

      {sep()}

      <button
        type="button"
        style={btn(editor.isActive('link'))}
        disabled={disabled}
        onClick={onLink}
      >
        <Icon.Link />
      </button>

      <button
        type="button"
        style={btn(false)}
        disabled={disabled}
        onClick={onImage}
      >
        <Icon.Image />
      </button>

      <button
        type="button"
        style={btn(false)}
        disabled={disabled}
        onClick={() =>
          run(() => {
            editor.chain().focus().setContent('').run();
            // 커서도 맨 위로 보내고 싶으면
            editor.commands.focus('start');
          })
        }
      >
        <Icon.Clean />
      </button>
    </div>
  );
}

export default function RichTextEditor({
  value = '',
  onChange,
  readOnly = false,
  placeholder = '작성 내용',
  height = 420, // 스샷처럼 크게
}) {
  const extensions = useMemo(
    () => [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false, autolink: true, linkOnPaste: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Image.configure({ inline: false }),
    ],
    []
  );

  const editor = useEditor({
    extensions,
    content: value || '',
    editable: !readOnly,
    onUpdate: ({ editor }) => onChange?.(editor.getHTML()),
    editorProps: {
      attributes: {
        'data-placeholder': placeholder,
        style: `min-height:${height}px; padding:14px; outline:none;`,
      },
    },
  });

  // update 모드 등 외부 value 동기화
  useEffect(() => {
    if (!editor) return;
    const next = value || '';
    if (next !== editor.getHTML()) editor.commands.setContent(next);
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        overflow: 'hidden',
        background: '#fff',
      }}
    >
      <Toolbar editor={editor} disabled={readOnly} />
      <EditorContent editor={editor} />
      <style>{`
        .ProseMirror:empty:before {
          content: attr(data-placeholder);
          float: left;
          color: #9ca3af;
          pointer-events: none;
          height: 0;
        }
        .ProseMirror p { margin: 0; }
        .ProseMirror img { max-width: 100%; height: auto; }
      `}</style>
    </div>
  );
}
